const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  password: '1',
  host: 'localhost',
  port: 5433,
  database: 'postgres'
});

client.connect()
  .then(() => client.query('CREATE DATABASE hrm_db'))
  .then(() => {
    console.log('Database hrm_db created successfully');
    process.exit(0);
  })
  .catch(err => {
    if (err.code === '42P04') {
      console.log('Database hrm_db already exists');
      process.exit(0);
    }
    console.error('Failed to create database:', err);
    process.exit(1);
  });
