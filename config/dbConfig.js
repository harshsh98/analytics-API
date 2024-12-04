require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres.xtmeckjiniaqlbchjmnx',
  password: process.env.DB_PASSWORD || '#Harsh1572000123',
  database: process.env.DB_NAME || 'postgres'
};

module.exports = dbConfig;