#!/bin/bash
# Apply School Settings Migration

echo "🏫 Applying School Settings Migration..."
echo ""

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found. Please install MySQL client."
    exit 1
fi

# Prompt for database credentials
read -p "Enter MySQL username [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Enter MySQL password: " DB_PASS
echo ""

read -p "Enter database name [teachtrack_db]: " DB_NAME
DB_NAME=${DB_NAME:-teachtrack_db}

read -p "Enter MySQL host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

# Apply migration
echo ""
echo "📊 Applying migration to $DB_NAME..."

mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" "$DB_NAME" < database/add_school_settings.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your backend server"
    echo "2. Login as admin"
    echo "3. Navigate to Admin Dashboard > School Settings"
    echo "4. Configure your school details"
else
    echo ""
    echo "❌ Migration failed. Please check your database credentials and try again."
    exit 1
fi
