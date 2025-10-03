#!/usr/bin/env node

const { SmartImporter } = require('./lib/smart-importer');
const restaurantConfig = require('./lib/restaurant-config');

const importer = new SmartImporter(restaurantConfig);
importer.run();