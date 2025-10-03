#!/usr/bin/env node

const { SmartImporter } = require('./lib/smart-importer');
const sponsorConfig = require('./lib/sponsor-config');

const importer = new SmartImporter(sponsorConfig);
importer.run();