"""One-off migration: update SchemeOfWork.status from 'draft' -> 'active'.

Usage (from the backend folder):
  python migrate_scheme_statuses.py --dry-run
  python migrate_scheme_statuses.py --commit

Optional:
  python migrate_scheme_statuses.py --commit --user-id 123

Notes:
- This updates rows in-place in the DB so API responses reflect the change.
- Bulk updates don't automatically trigger SQLAlchemy's onupdate hooks, so we
  explicitly set updated_at.
"""

from __future__ import annotations

import argparse

from sqlalchemy.sql import func

from database import SessionLocal
from models import SchemeOfWork


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate schemes_of_work.status from 'draft' to 'active'."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print how many rows would be updated (default behavior).",
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Apply the update in the database.",
    )
    parser.add_argument(
        "--user-id",
        type=int,
        default=None,
        help="Only update schemes for a specific user_id.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    # Safety: if neither specified, behave like dry-run.
    do_commit = bool(args.commit)
    if args.dry_run and args.commit:
        raise SystemExit("Choose only one: --dry-run or --commit")

    db = SessionLocal()
    try:
        query = db.query(SchemeOfWork).filter(SchemeOfWork.status == "draft")
        if args.user_id is not None:
            query = query.filter(SchemeOfWork.user_id == args.user_id)

        to_update = query.count()
        scope = f"user_id={args.user_id}" if args.user_id is not None else "ALL users"

        if not do_commit:
            print(f"[DRY-RUN] Would update {to_update} schemes ({scope}) from draft -> active")
            return 0

        updated = query.update(
            {
                SchemeOfWork.status: "active",
                SchemeOfWork.updated_at: func.now(),
            },
            synchronize_session=False,
        )
        db.commit()
        print(f"[OK] Updated {updated} schemes ({scope}) from draft -> active")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
