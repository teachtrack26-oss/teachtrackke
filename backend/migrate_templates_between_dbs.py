"""Copy curriculum template data from one MySQL database to another.

This is designed for the "prod DB is empty" situation after a migration.
It copies the three template tables used by the app:
- curriculum_templates
- template_strands
- template_substrands

It supports:
- upsert mode (default): insert rows; update on primary-key conflict
- overwrite mode: delete existing target rows first, then insert
- optional grade filter: only copy templates for a given grade string

Usage examples:
  SOURCE_DATABASE_URL='mysql+pymysql://user:pass@host:3306/old_db'
  TARGET_DATABASE_URL='mysql+pymysql://user:pass@host:3306/new_db'
  python migrate_templates_between_dbs.py --mode upsert

  python migrate_templates_between_dbs.py --mode overwrite --grade "G8"

Notes:
- This script expects MySQL/MariaDB and uses ON DUPLICATE KEY UPDATE.
- It does not copy user-owned curriculum instances (subjects/lessons/etc).
"""

from __future__ import annotations

import argparse
import os
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from sqlalchemy import MetaData, Table, create_engine, delete, select
from sqlalchemy.engine import Engine

try:
    # SQLAlchemy 2.x
    from sqlalchemy.dialects.mysql import insert as mysql_insert
except Exception as exc:  # pragma: no cover
    raise RuntimeError("This script requires SQLAlchemy with MySQL dialect support") from exc


TEMPLATE_TABLES = [
    "curriculum_templates",
    "template_strands",
    "template_substrands",
]


def _get_required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"Missing required env var: {name}")
    return value


def _make_engine(url: str) -> Engine:
    # Keep this conservative: this script is for a one-off migration.
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        echo=False,
    )


def _reflect_tables(engine: Engine, table_names: Sequence[str]) -> Dict[str, Table]:
    md = MetaData()
    md.reflect(bind=engine, only=list(table_names))
    missing = [t for t in table_names if t not in md.tables]
    if missing:
        raise SystemExit(
            "Target/source DB is missing expected tables: " + ", ".join(missing)
        )
    return {name: md.tables[name] for name in table_names}


def _chunked(items: Sequence[Dict[str, Any]], chunk_size: int) -> Iterable[List[Dict[str, Any]]]:
    for i in range(0, len(items), chunk_size):
        yield items[i : i + chunk_size]


def _rows_to_dicts(rows: Iterable[Any]) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    for row in rows:
        # RowMapping (SQLAlchemy 1.4/2.x)
        result.append(dict(row._mapping))
    return result


def _fetch_source_sets(
    source_tables: Dict[str, Table],
    source_engine: Engine,
    grade: Optional[str],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    templates_t = source_tables["curriculum_templates"]
    strands_t = source_tables["template_strands"]
    substrands_t = source_tables["template_substrands"]

    with source_engine.connect() as conn:
        if grade:
            templates = _rows_to_dicts(
                conn.execute(select(templates_t).where(templates_t.c.grade == grade)).fetchall()
            )
            template_ids = {r["id"] for r in templates}
            if not template_ids:
                return [], [], []

            strands = _rows_to_dicts(
                conn.execute(
                    select(strands_t).where(strands_t.c.curriculum_template_id.in_(template_ids))
                ).fetchall()
            )
            strand_ids = {r["id"] for r in strands}
            if not strand_ids:
                return templates, strands, []

            substrands = _rows_to_dicts(
                conn.execute(select(substrands_t).where(substrands_t.c.strand_id.in_(strand_ids))).fetchall()
            )
            return templates, strands, substrands

        templates = _rows_to_dicts(conn.execute(select(templates_t)).fetchall())
        strands = _rows_to_dicts(conn.execute(select(strands_t)).fetchall())
        substrands = _rows_to_dicts(conn.execute(select(substrands_t)).fetchall())
        return templates, strands, substrands


def _upsert_rows(
    target_engine: Engine,
    table: Table,
    rows: Sequence[Dict[str, Any]],
    chunk_size: int = 1000,
) -> int:
    if not rows:
        return 0

    pk_cols = [c.name for c in table.primary_key.columns]
    if not pk_cols:
        raise SystemExit(f"Table {table.name} has no primary key; cannot upsert safely")

    # For ON DUPLICATE KEY UPDATE, update everything except PK columns.
    update_cols = [c.name for c in table.columns if c.name not in pk_cols]

    total = 0
    with target_engine.begin() as conn:
        for batch in _chunked(list(rows), chunk_size):
            stmt = mysql_insert(table).values(batch)
            if update_cols:
                stmt = stmt.on_duplicate_key_update(
                    **{col: getattr(stmt.inserted, col) for col in update_cols}
                )
            conn.execute(stmt)
            total += len(batch)

    return total


def _overwrite_then_insert(
    target_tables: Dict[str, Table],
    target_engine: Engine,
    templates: Sequence[Dict[str, Any]],
    strands: Sequence[Dict[str, Any]],
    substrands: Sequence[Dict[str, Any]],
    grade: Optional[str],
) -> None:
    templates_t = target_tables["curriculum_templates"]
    strands_t = target_tables["template_strands"]
    substrands_t = target_tables["template_substrands"]

    # Delete children first.
    with target_engine.begin() as conn:
        if grade:
            # Delete only the subset for that grade (by walking FK relationships).
            template_ids = [r["id"] for r in templates]
            strand_ids = [r["id"] for r in strands]
            if strand_ids:
                conn.execute(delete(substrands_t).where(substrands_t.c.strand_id.in_(strand_ids)))
            if template_ids:
                conn.execute(delete(strands_t).where(strands_t.c.curriculum_template_id.in_(template_ids)))
                conn.execute(delete(templates_t).where(templates_t.c.id.in_(template_ids)))
        else:
            conn.execute(delete(substrands_t))
            conn.execute(delete(strands_t))
            conn.execute(delete(templates_t))

    # Then insert (use upsert helper but no existing rows should remain).
    _upsert_rows(target_engine, templates_t, templates)
    _upsert_rows(target_engine, strands_t, strands)
    _upsert_rows(target_engine, substrands_t, substrands)


def _print_counts_by_grade(target_engine: Engine, target_tables: Dict[str, Table]) -> None:
    templates_t = target_tables["curriculum_templates"]
    # lightweight summary (no pandas)
    from sqlalchemy import func

    with target_engine.connect() as conn:
        rows = conn.execute(
            select(templates_t.c.grade, func.count(templates_t.c.id)).group_by(templates_t.c.grade)
        ).fetchall()

    print("\nTarget curriculum_templates by grade:")
    for grade, count in rows:
        print(f"- {grade}: {count}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Copy curriculum template tables between DBs")
    parser.add_argument(
        "--mode",
        choices=["upsert", "overwrite"],
        default="upsert",
        help="upsert=merge into target; overwrite=delete then insert",
    )
    parser.add_argument(
        "--grade",
        default=None,
        help="Optional grade filter (must match curriculum_templates.grade exactly, e.g. 'G8' or 'Grade 8')",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=1000,
        help="Batch size for inserts/updates",
    )

    args = parser.parse_args()

    source_url = _get_required_env("SOURCE_DATABASE_URL")
    target_url = _get_required_env("TARGET_DATABASE_URL")

    source_engine = _make_engine(source_url)
    target_engine = _make_engine(target_url)

    source_tables = _reflect_tables(source_engine, TEMPLATE_TABLES)
    target_tables = _reflect_tables(target_engine, TEMPLATE_TABLES)

    templates, strands, substrands = _fetch_source_sets(source_tables, source_engine, args.grade)

    print(
        "Source rows selected: "
        f"curriculum_templates={len(templates)}, "
        f"template_strands={len(strands)}, "
        f"template_substrands={len(substrands)}"
    )

    if args.mode == "overwrite":
        _overwrite_then_insert(target_tables, target_engine, templates, strands, substrands, args.grade)
        print("\nOverwrite mode complete.")
    else:
        _upsert_rows(target_engine, target_tables["curriculum_templates"], templates, chunk_size=args.chunk_size)
        _upsert_rows(target_engine, target_tables["template_strands"], strands, chunk_size=args.chunk_size)
        _upsert_rows(target_engine, target_tables["template_substrands"], substrands, chunk_size=args.chunk_size)
        print("\nUpsert mode complete.")

    _print_counts_by_grade(target_engine, target_tables)


if __name__ == "__main__":
    main()
