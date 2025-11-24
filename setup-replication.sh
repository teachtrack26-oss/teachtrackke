#!/bin/bash
# MySQL Replication Setup Script
# Sets up master-slave replication between MySQL master and replicas

echo "========================================="
echo "MySQL Replication Setup for TeachTrack"
echo "========================================="
echo ""

# Wait for all MySQL instances to be ready
echo "[1/5] Waiting for MySQL services to start..."
sleep 15

# Get master status
echo "[2/5] Configuring MySQL master..."
MASTER_STATUS=$(docker exec teachtrack-mysql-master mysql -u root -p'2078@lk//K.' -e "SHOW MASTER STATUS\G")
MASTER_LOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
MASTER_LOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "Master Log File: $MASTER_LOG_FILE"
echo "Master Log Position: $MASTER_LOG_POS"

# Configure Replica 1
echo ""
echo "[3/5] Configuring Replica 1..."
docker exec teachtrack-mysql-replica1 mysql -u root -p'2078@lk//K.' <<EOF
STOP SLAVE;
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='root',
  MASTER_PASSWORD='2078@lk//K.',
  MASTER_LOG_FILE='$MASTER_LOG_FILE',
  MASTER_LOG_POS=$MASTER_LOG_POS;
START SLAVE;
EOF

# Check Replica 1 status
REPLICA1_STATUS=$(docker exec teachtrack-mysql-replica1 mysql -u root -p'2078@lk//K.' -e "SHOW SLAVE STATUS\G" | grep "Seconds_Behind_Master")
echo "Replica 1 Status: $REPLICA1_STATUS"

# Configure Replica 2
echo ""
echo "[4/5] Configuring Replica 2..."
docker exec teachtrack-mysql-replica2 mysql -u root -p'2078@lk//K.' <<EOF
STOP SLAVE;
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='root',
  MASTER_PASSWORD='2078@lk//K.',
  MASTER_LOG_FILE='$MASTER_LOG_FILE',
  MASTER_LOG_POS=$MASTER_LOG_POS;
START SLAVE;
EOF

# Check Replica 2 status
REPLICA2_STATUS=$(docker exec teachtrack-mysql-replica2 mysql -u root -p'2078@lk//K.' -e "SHOW SLAVE STATUS\G" | grep "Seconds_Behind_Master")
echo "Replica 2 Status: $REPLICA2_STATUS"

# Final verification
echo ""
echo "[5/5] Verifying replication..."
docker exec teachtrack-mysql-replica1 mysql -u root -p'2078@lk//K.' -e "SHOW SLAVE STATUS\G" | grep -E "(Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master)"
docker exec teachtrack-mysql-replica2 mysql -u root -p'2078@lk//K.' -e "SHOW SLAVE STATUS\G" | grep -E "(Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master)"

echo ""
echo "========================================="
echo "✅ Replication Setup Complete!"
echo "========================================="
echo ""
echo "What to check:"
echo "- Slave_IO_Running: Yes"
echo "- Slave_SQL_Running: Yes"
echo "- Seconds_Behind_Master: 0 or low number"
echo ""
echo "Monitor replication health:"
echo "  docker exec mysql-replica1 mysql -u root -p -e 'SHOW SLAVE STATUS\\G'"
echo ""
