#!/usr/bin/env node

// Suppress deprecation warnings that interfere with interactive prompts
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return; // Ignore punycode deprecation warnings
  }
  console.warn(warning.message);
});

const { SmartImporter } = require('./lib/smart-importer');
const sponsorConfig = require('./lib/sponsor-config');

const importer = new SmartImporter(sponsorConfig);
importer.run();
