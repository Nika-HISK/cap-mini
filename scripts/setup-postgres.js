const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function setupPostgreSQL() {
  console.log('Setting up PostgreSQL database for CAP Bookshop...\n');
  

  const superClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres', 
    user: 'postgres',
    password: process.env.POSTGRES_ADMIN_PASSWORD || 'postgres'
  });

  try {
    await superClient.connect();
    console.log('Connected to PostgreSQL as superuser');


    try {
      await superClient.query(`
        CREATE USER bookshop_user WITH PASSWORD 'your_password';
      `);
      console.log('✓ Created user: bookshop_user');
    } catch (error) {
      if (error.code === '42710') {
        console.log('✓ User bookshop_user already exists');
      } else {
        throw error;
      }
    }


    try {
      await superClient.query(`
        CREATE DATABASE bookshop OWNER bookshop_user;
      `);
      console.log('✓ Created database: bookshop');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✓ Database bookshop already exists');
      } else {
        throw error;
      }
    }


    try {
      await superClient.query(`
        CREATE DATABASE bookshop_dev OWNER bookshop_user;
      `);
      console.log('✓ Created database: bookshop_dev');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✓ Database bookshop_dev already exists');
      } else {
        throw error;
      }
    }


    await superClient.query(`
      GRANT ALL PRIVILEGES ON DATABASE bookshop TO bookshop_user;
      GRANT ALL PRIVILEGES ON DATABASE bookshop_dev TO bookshop_user;
    `);
    console.log('✓ Granted privileges to bookshop_user');

    await superClient.end();

    const testClient = new Client({
      host: 'localhost',
      port: 5432,
      database: 'bookshop_dev',
      user: 'bookshop_user',
      password: 'your_password'
    });

    await testClient.connect();
    console.log('✓ Successfully connected with bookshop_user');
    

    try {
      await testClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('✓ Enabled uuid-ossp extension');
    } catch (error) {
      console.log('⚠ Could not enable uuid-ossp extension:', error.message);
    }

    await testClient.end();

    console.log('\n🎉 PostgreSQL setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with database credentials');
    console.log('2. Run: npm run deploy:postgres');
    console.log('3. Run: npm run seed (to populate with sample data)');
    console.log('4. Run: npm run watch');

  } catch (error) {
    console.error('Setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check if you can connect as postgres user');
    console.error('3. Verify your POSTGRES_ADMIN_PASSWORD environment variable');
    process.exit(1);
  }
}

if (require.main === module) {
  setupPostgreSQL();
}

module.exports = { setupPostgreSQL };
