@echo off
REM MySQL Replication Setup Script for Windows
REM Sets up master-slave replication between MySQL master and replicas

echo =========================================
echo MySQL Replication Setup for TeachTrack
echo =========================================
echo.

REM Wait for all MySQL instances to be ready
echo [1/5] Waiting for MySQL services to start...
timeout /t 15 /nobreak >nul

REM Get master status and configure replicas
echo [2/5] Configuring MySQL master...
docker exec teachtrack-mysql-master mysql -u root -p"2078@lk//K." -e "SHOW MASTER STATUS" > master_status.txt

echo.
echo [3/5] Configuring Replica 1...
docker exec teachtrack-mysql-replica1 mysql -u root -p"2078@lk//K." -e "STOP SLAVE; CHANGE MASTER TO MASTER_HOST='mysql-master', MASTER_USER='root', MASTER_PASSWORD='2078@lk//K.', MASTER_AUTO_POSITION=1; START SLAVE;"

echo.
echo [4/5] Configuring Replica 2...
docker exec teachtrack-mysql-replica2 mysql -u root -p"2078@lk//K." -e "STOP SLAVE; CHANGE MASTER TO MASTER_HOST='mysql-master', MASTER_USER='root', MASTER_PASSWORD='2078@lk//K.', MASTER_AUTO_POSITION=1; START SLAVE;"

REM Final verification
echo.
echo [5/5] Verifying replication...
docker exec teachtrack-mysql-replica1 mysql -u root -p"2078@lk//K." -e "SHOW SLAVE STATUS\G" | findstr /C:"Slave_IO_Running" /C:"Slave_SQL_Running" /C:"Seconds_Behind_Master"

echo.
echo =========================================
echo Replication Setup Complete!
echo =========================================
echo.
echo What to check:
echo - Slave_IO_Running: Yes
echo - Slave_SQL_Running: Yes
echo - Seconds_Behind_Master: 0 or low number
echo.
echo Monitor replication health:
echo   docker exec mysql-replica1 mysql -u root -p -e "SHOW SLAVE STATUS\G"
echo.
pause
