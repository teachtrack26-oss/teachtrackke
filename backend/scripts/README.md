# Backend Scripts

This directory contains various utility scripts for the backend.

## Structure

- `migrations/`: Database migration scripts (apply schema changes).
- `fixes/`: Scripts to fix data inconsistencies or bugs.
- `checks/`: Scripts to verify data integrity or debug issues.
- `imports/`: Scripts to import curriculum data or other resources.
- `tests/`: Standalone test scripts.

## How to Run

Run these scripts from the `backend/` directory using the `-m` flag to ensure imports work correctly.

**Example:**

```bash
# Run a migration
python -m scripts.migrations.apply_archive_migration

# Run a check
python -m scripts.checks.check_user

# Run an import
python -m scripts.imports.import_curriculum_json
```

**Note:** Do not run the scripts directly (e.g., `python scripts/migrations/script.py`) as this will cause import errors.
