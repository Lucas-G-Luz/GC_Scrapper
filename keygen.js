const crypto = require('crypto');
const fs = require('fs');

// Generate a random 32-byte key
const key = crypto.randomBytes(32).toString('base64');

// Create the manifest key
const manifestKey = {
  "key": key
};

// Write to a temporary file
fs.writeFileSync('key.json', JSON.stringify(manifestKey, null, 2));

console.log('Generated key:', key); 