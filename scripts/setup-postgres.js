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
    try {
      await superClient.query(`
        CREATE USER bookshop_user WITH PASSWORD 'your_password';
      `);
    } catch (error) {
      if (error.code === '42710') {
      } else {
        throw error;
      }
    }


    try {
      await superClient.query(`
        CREATE DATABASE bookshop OWNER bookshop_user;
      `);
    } catch (error) {
      if (error.code === '42P04') {
      } else {
        throw error;
      }
    }


    try {
      await superClient.query(`
        CREATE DATABASE bookshop_dev OWNER bookshop_user;
      `);
    } catch (error) {
      if (error.code === '42P04') {
      } else {
        throw error;
      }
    }


    await superClient.query(`
      GRANT ALL PRIVILEGES ON DATABASE bookshop TO bookshop_user;
      GRANT ALL PRIVILEGES ON DATABASE bookshop_dev TO bookshop_user;
    `);

    await superClient.end();

    const testClient = new Client({
      host: 'localhost',
      port: 5432,
      database: 'bookshop_dev',
      user: 'bookshop_user',
      password: 'your_password'
    });

    await testClient.connect();
    

    try {
      await testClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    } catch (error) {
    }

    await testClient.end();

  } catch (error) {
    console.error('Setup failed:', error.message);
  }
}

if (require.main === module) {
  setupPostgreSQL();
}

module.exports = { setupPostgreSQL };
