import argparse
import json
import os
import sys
from typing import Iterable, Optional

# Allow running from repo root (adds backend/ to sys.path)
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy.orm import Session

from database import SessionLocal
from models import CurriculumTemplate
from curriculum_importer import import_curriculum_from_json


def _default_base_dir() -> str:
    # backend/scripts/import_curriculum_dir.py -> repo root/data/curriculum
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.join(repo_root, "data", "curriculum")


def _iter_json_files(base_dir: str) -> Iterable[str]:
    for root, _, files in os.walk(base_dir):
        for filename in files:
            if filename.lower().endswith(".json"):
                yield os.path.join(root, filename)


def _normalize_grade_filter(grade: Optional[str]) -> Optional[str]:
    if not grade:
        return None
    grade = str(grade).strip()
    if grade.isdigit():
        return f"Grade {grade}"
    return grade


def _should_process_file(payload: dict, grade_filter: Optional[str]) -> bool:
    if not grade_filter:
        return True

    grade = payload.get("grade")
    if isinstance(grade, int):
        grade = f"Grade {grade}"

    return str(grade).strip().lower() == grade_filter.lower()


def import_curriculum_dir(
    base_dir: str,
    *,
    grade_filter: Optional[str] = None,
    reimport: bool = False,
) -> int:
    base_dir = os.path.abspath(base_dir)
    if not os.path.isdir(base_dir):
        raise SystemExit(f"Base dir not found: {base_dir}")

    grade_filter = _normalize_grade_filter(grade_filter)

    processed = 0
    imported = 0
    skipped = 0
    failed = 0

    db: Session = SessionLocal()
    try:
        for file_path in sorted(_iter_json_files(base_dir)):
            processed += 1
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    payload = json.load(f)

                if not _should_process_file(payload, grade_filter):
                    skipped += 1
                    continue

                subject = payload.get("subject") or payload.get("subjectName")
                grade = payload.get("grade")
                if isinstance(grade, int):
                    grade = f"Grade {grade}"

                if not subject or not grade:
                    skipped += 1
                    print(f"SKIP (missing subject/grade): {file_path}")
                    continue

                existing = (
                    db.query(CurriculumTemplate)
                    .filter(CurriculumTemplate.subject == subject, CurriculumTemplate.grade == grade)
                    .first()
                )

                if existing and reimport:
                    db.delete(existing)
                    db.commit()
                    existing = None

                if existing:
                    skipped += 1
                    print(f"SKIP (exists): {subject} {grade} ({file_path})")
                    continue

                result = import_curriculum_from_json(payload, db)
                if result.get("success"):
                    imported += 1
                    stats = result.get("stats") or {}
                    print(
                        f"OK: {subject} {grade} | strands={stats.get('strands')} substrands={stats.get('substrands')} lessons={stats.get('lessons')}"
                    )
                else:
                    failed += 1
                    print(f"FAIL: {subject} {grade} | {result.get('message')} | {file_path}")

            except Exception as e:
                failed += 1
                print(f"ERROR: {file_path} | {e}")

        print(
            f"\nDone. processed={processed} imported={imported} skipped={skipped} failed={failed} base_dir={base_dir} grade_filter={grade_filter!r} reimport={reimport}"
        )
        return 0 if failed == 0 else 2

    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Import curriculum JSON files into curriculum_templates")
    parser.add_argument(
        "--base-dir",
        default=_default_base_dir(),
        help="Directory containing curriculum JSONs (default: repo-root/data/curriculum)",
    )
    parser.add_argument(
        "--grade",
        default=None,
        help='Optional grade filter. Examples: "Grade 8" or "8"',
    )
    parser.add_argument(
        "--reimport",
        action="store_true",
        help="Delete existing templates for matching subject+grade before importing",
    )

    args = parser.parse_args()
    return import_curriculum_dir(args.base_dir, grade_filter=args.grade, reimport=args.reimport)


if __name__ == "__main__":
    raise SystemExit(main())
