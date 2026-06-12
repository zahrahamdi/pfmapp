require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { initDatabase } = require('../database');
const { MESSAGES } = require('../utils/messages');
const { ensureEnv } = require('./ensure-env');

async function setup() {
  try {
    const envResult = ensureEnv();
    if (envResult.created) {
      console.log('Created .env from .env.example');
    }

    await initDatabase();
    console.log('Database initialized successfully.');
    console.log('Run the server: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  }
}

setup();
