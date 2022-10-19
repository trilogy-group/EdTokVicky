sudo apt -y update
sudo apt -y install mysql-server
sudo service mysql start
sudo mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Vicky1234';"
sudo mysql_secure_installation -u root --password="Vicky1234" --use-default
sudo mysql -u root -pVicky1234 -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH auth_socket;"
sudo mysql -u root -pVicky1234 -e "CREATE DATABASE EdTok;"
sudo mysql -u root -pVicky1234 -e "CREATE USER 'vicky'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Vicky1234%';"
sudo mysql -u root -pVicky1234 -e "GRANT ALL PRIVILEGES ON *.* TO 'vicky'@'localhost' WITH GRANT OPTION;"
sudo mysql -u root -pVicky1234 -e "FLUSH PRIVILEGES;"
npx prisma generate
npx prisma migrate dev
npm run build
npm run dev