const mysql = require('mysql2/promise');

async function testConnection(host) {
  try {
    console.log(`Trying to connect to ${host}...`);
    const connection = await mysql.createConnection({
      host: host,
      user: 'root',
      password: '1TRiliun0326',
      database: 'db_compro_mgi',
      port: 3306,
      connectTimeout: 5000
    });
    
    console.log(`✅ Successfully connected to ${host}!`);
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables in database:');
    rows.forEach(row => console.log('-', Object.values(row)[0]));
    
    await connection.end();
    return true;
  } catch (error) {
    console.log(`❌ Failed to connect to ${host}:`, error.message);
    return false;
  }
}

async function main() {
  const hostsToTest = ['127.0.0.1', 'localhost', 'mysql-nest'];
  
  for (const host of hostsToTest) {
    const success = await testConnection(host);
    if (success) {
      console.log(`\n🎉 We have database access using host: ${host}`);
      return;
    }
  }
  
  console.log('\n❌ Could not connect to the database using any host.');
}

main();
