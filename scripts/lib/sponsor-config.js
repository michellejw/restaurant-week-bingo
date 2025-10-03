// Sponsor-specific configuration for SmartImporter

function normalizeSponsorName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

function getAbbreviationBonus(newNameNormalized, existingNameNormalized) {
  // Check for common business name patterns
  let bonus = 0;
  if ((newNameNormalized.includes('llc') && existingNameNormalized.includes('limited liability company')) ||
      (existingNameNormalized.includes('llc') && newNameNormalized.includes('limited liability company')) ||
      (newNameNormalized.includes('co') && existingNameNormalized.includes('company')) ||
      (existingNameNormalized.includes('co') && newNameNormalized.includes('company'))) {
    bonus = 0.1;
  }
  return bonus;
}

function parseDataRows(rawData) {
  const items = [];
  const errors = [];
  
  // Headers are in row 0, data starts in row 1
  const headers = rawData[0];
  const dataRows = rawData.slice(1);
  
  // Map column names to indexes (flexible matching like the working sponsor script)
  const columnMap = {};
  headers.forEach((header, index) => {
    const h = header.toString().toLowerCase().trim();
    // Be very specific with matching to avoid conflicts
    if (h === 'name*' || h === 'name') {
      columnMap.name = index;
    } else if (h.includes('logo filename') || h.includes('logo') || h.includes('filename')) {
      columnMap.logo_file = index;
    } else if (h.includes('address')) {
      columnMap.address = index;
    } else if (h.includes('lat')) {
      columnMap.latitude = index;
    } else if (h.includes('long') || h.includes('lng')) {
      columnMap.longitude = index;
    } else if (h.includes('phone')) {
      columnMap.phone = index;
    } else if (h.includes('url') || h.includes('website')) {
      columnMap.url = index;
    } else if (h.includes('desc')) {
      columnMap.description = index;
    } else if (h.includes('promo') || h.includes('offer')) {
      columnMap.promo_offer = index;
    } else if (h.includes('retail')) {
      columnMap.is_retail = index;
    }
  });
  
  // Validate required columns
  const required = ['name', 'address'];
  const missing = required.filter(col => columnMap[col] === undefined);
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }
  
  // Parse data rows
  dataRows.forEach((row, index) => {
    const rowNum = index + 2; // Account for header + 0-based indexing
    
    // Skip empty rows
    if (!row[columnMap.name] || row[columnMap.name].toString().trim() === '') {
      return;
    }
    
    try {
      const sponsor = {
        name: row[columnMap.name]?.toString().trim(),
        address: row[columnMap.address]?.toString().trim(),
        latitude: columnMap.latitude !== undefined ? parseFloat(row[columnMap.latitude]) || 0 : 0,
        longitude: columnMap.longitude !== undefined ? parseFloat(row[columnMap.longitude]) || 0 : 0,
        phone: row[columnMap.phone]?.toString().trim() || null,
        url: row[columnMap.url]?.toString().trim() || null,
        description: row[columnMap.description]?.toString().trim() || null,
        promo_offer: row[columnMap.promo_offer]?.toString().trim() || null,
        is_retail: row[columnMap.is_retail]?.toString().toLowerCase().includes('true') || false,
        logo_file: row[columnMap.logo_file]?.toString().trim() || null,
        _rowNumber: rowNum
      };
      
      // Validate required fields
      if (!sponsor.name || !sponsor.address) {
        errors.push(`Row ${rowNum}: Missing name or address`);
        return;
      }
      
      // Clean up URL
      if (sponsor.url && !sponsor.url.startsWith('http')) {
        sponsor.url = 'https://' + sponsor.url;
      }
      
      items.push(sponsor);
      
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error.message}`);
    }
  });
  
  return { items, errors };
}

function displayItemDetails(sponsor, indent = '   ') {
  console.log(`${indent}Address: ${sponsor.address}`);
  if (sponsor.description) {
    console.log(`${indent}Description: ${sponsor.description}`);
  }
  if (sponsor.logo_file) {
    console.log(`${indent}Logo: ${sponsor.logo_file}`);
  }
}

// Sponsors don't have a unique code like restaurants, so we'll use name + address
function getDuplicateKey(sponsor) {
  return `${sponsor.name.toLowerCase()}-${sponsor.address.toLowerCase()}`;
}

function prepareUpdateData(sponsorData) {
  const { _rowNumber, ...updateData } = sponsorData;
  return updateData; // All sponsor fields can be updated directly
}

const sponsorConfig = {
  // Basic info
  displayName: 'Sponsor',
  tableName: 'sponsors',
  filePrefix: 'sponsor',
  emoji: '🎯',
  newItemEmoji: '🏢',
  
  // Functions
  normalizeName: normalizeSponsorName,
  getAbbreviationBonus,
  parseDataRows,
  displayItemDetails,
  getDuplicateKey,
  prepareUpdateData
  
  // No additional backup tables, cascading deletes, or post-import tasks for sponsors
};

module.exports = sponsorConfig;