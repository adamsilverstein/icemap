const fs = require('fs');
const path = require('path');

async function globalSetup() {
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Global setup completed');
}

module.exports = globalSetup;
