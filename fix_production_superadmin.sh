#!/bin/bash
# Fix Production Database - Upgrade User to Super Admin
# Run this script on the VPS at /opt/teachtrack/

echo "================================================"
echo "TeachTrack Production Database - User Upgrade"
echo "================================================"

# Email to upgrade
USER_EMAIL="kevinmugo359@gmail.com"

# NOTE: Do not hardcode DB passwords in scripts.
read -s -p "Enter MySQL password for user 'teachtrack_user': " MYSQL_PASSWORD
echo ""

echo ""
echo "Step 1: Checking if user exists..."
docker exec -i $(docker ps -qf name=mysql) mysql -u teachtrack_user -p"$MYSQL_PASSWORD" teachtrack -e "
SELECT id, email, full_name, role, is_admin, subscription_type 
FROM users 
WHERE email='$USER_EMAIL';
"

echo ""
echo "Step 2: Upgrading user to SUPER_ADMIN..."
docker exec -i $(docker ps -qf name=mysql) mysql -u teachtrack_user -p"$MYSQL_PASSWORD" teachtrack -e "
UPDATE users 
SET 
  role = 'SUPER_ADMIN',
  is_admin = 1,
  subscription_type = 'INDIVIDUAL_PREMIUM',
  subscription_status = 'ACTIVE'
WHERE email='$USER_EMAIL';
"

echo ""
echo "Step 3: Verifying the update..."
docker exec -i $(docker ps -qf name=mysql) mysql -u teachtrack_user -p"$MYSQL_PASSWORD" teachtrack -e "
SELECT id, email, full_name, role, is_admin, subscription_type, subscription_status
FROM users 
WHERE email='$USER_EMAIL';
"

echo ""
echo "================================================"
echo "✅ User upgrade complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Log out from https://teachtrackke.vercel.app/"
echo "2. Log back in"
echo "3. You should now have Super Admin access"
echo ""
