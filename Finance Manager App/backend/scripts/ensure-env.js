const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..');
const envPath = path.join(backendDir, '.env');
const envExamplePath = path.join(backendDir, '.env.example');

function ensureEnv() {
  if (fs.existsSync(envPath)) {
    return { created: false, path: envPath };
  }

  if (!fs.existsSync(envExamplePath)) {
    throw new Error('.env.example not found');
  }

  fs.copyFileSync(envExamplePath, envPath);
  return { created: true, path: envPath };
}

module.exports = { ensureEnv };

if (require.main === module) {
  try {
    const result = ensureEnv();
    if (result.created) {
      console.log('Created .env from .env.example');
    } else {
      console.log('.env already exists');
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
