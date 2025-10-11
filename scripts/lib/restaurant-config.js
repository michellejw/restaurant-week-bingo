// Restaurant-specific configuration for SmartImporter

function normalizeRestaurantName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

function getAbbreviationBonus(newNameNormalized, existingNameNormalized) {
  // Check for common restaurant abbreviations
  if ((newNameNormalized.includes('co') && existingNameNormalized.includes('company')) ||
      (existingNameNormalized.includes('co') && newNameNormalized.includes('company'))) {
    return 0.1;
  }
  return 0;
}

function parseDataRows(rawData) {
  const items = [];
  const errors = [];
  
  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.some(cell => 
      typeof cell === 'string' && cell.toUpperCase() === 'NAME'
    )) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    throw new Error('Could not find header row with NAME column');
  }
  
  // Map column names to indexes (flexible matching like map editor)
  const headers = rawData[headerRowIndex];
  const columnMap = {};
  headers.forEach((header, index) => {
    const h = header.toString().toLowerCase().trim();
    if (h === 'name') {
      columnMap.name = index;
    } else if (h.includes('address')) {
      columnMap.address = index;
    } else if (h.includes('url') || h.includes('website')) {
      columnMap.url = index;
    } else if (h === 'code' || h.includes('code')) {
      columnMap.code = index;
    } else if (h === 'latitude' || h.includes('lat')) {
      columnMap.latitude = index;
    } else if (h === 'longitude' || h.includes('long') || h.includes('lng')) {
      columnMap.longitude = index;
    } else if (h.includes('desc')) {
      columnMap.description = index;
    } else if (h === 'phone' || h.includes('phone')) {
      columnMap.phone = index;
    } else if (h === 'promotions' || h.includes('promotion')) {
      columnMap.promotions = index;
    } else if (h.includes('special')) {
      columnMap.specials = index;
    }
  });
  
  console.log('Found headers:', headers);
  console.log('Column mapping:', columnMap);
  
  // Parse restaurant data using column mapping
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[columnMap.name]) continue;
    
    const rowNum = i + 1;
    
    try {
      const restaurant = {
        name: row[columnMap.name]?.toString()?.trim(),
        address: row[columnMap.address]?.toString()?.trim(),
        url: row[columnMap.url]?.toString()?.trim() || null,
        code: row[columnMap.code]?.toString()?.trim(),
        latitude: parseFloat(row[columnMap.latitude]),
        longitude: parseFloat(row[columnMap.longitude]),
        description: row[columnMap.description]?.toString()?.trim() || null,
        phone: row[columnMap.phone]?.toString()?.trim() || null,
        specials: row[columnMap.specials]?.toString()?.trim() || null,
        promotions: row[columnMap.promotions]?.toString()?.trim() || null,
        _rowNumber: rowNum
      };
      
      // Validate required fields (same as original)
      if (!restaurant.name || !restaurant.code || 
          isNaN(restaurant.latitude) || isNaN(restaurant.longitude)) {
        errors.push(`Row ${rowNum}: missing required data (name, code, or coordinates)`);
        continue;
      }
      
      items.push(restaurant);
      
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error.message}`);
    }
  }
  
  return { items, errors };
}

function displayItemDetails(restaurant, indent = '   ') {
  console.log(`${indent}Address: ${restaurant.address}`);
  console.log(`${indent}Code: ${restaurant.code}`);
  if (restaurant.phone) {
    console.log(`${indent}Phone: ${restaurant.phone}`);
  }
  if (restaurant.specials) {
    console.log(`${indent}Specials: ${restaurant.specials}`);
  }
  if (restaurant.promotions) {
    console.log(`${indent}Promotions: ${restaurant.promotions}`);
  }
}

function getDuplicateKey(restaurant) {
  return `${restaurant.name.toLowerCase()}-${restaurant.code.toLowerCase()}`;
}

function prepareUpdateData(restaurantData) {
  const { _rowNumber, ...updateData } = restaurantData;
  return {
    name: updateData.name,
    address: updateData.address,
    url: updateData.url,
    code: updateData.code,
    latitude: updateData.latitude,
    longitude: updateData.longitude,
    description: updateData.description,
    phone: updateData.phone,
    specials: updateData.specials,
    promotions: updateData.promotions
  };
}

async function handleCascadingDeletes(supabase, removeIds) {
  // Remove associated visits first (same as original)
  await supabase.from('visits').delete().in('restaurant_id', removeIds);
}

async function postImportTasks(supabase) {
  // Recalculate user stats (same as original)
  console.log('🔢 Recalculating user stats...');
  
  const { data: visits } = await supabase.from('visits').select('user_id, restaurant_id');
  const { data: restaurants } = await supabase.from('restaurants').select('id');
  const { data: userStats } = await supabase.from('user_stats').select('user_id, visit_count, raffle_entries');
  
  const restaurantIds = new Set(restaurants.map(r => r.id));
  const validVisits = visits.filter(v => restaurantIds.has(v.restaurant_id));
  
  const userVisitCounts = {};
  validVisits.forEach(visit => {
    userVisitCounts[visit.user_id] = (userVisitCounts[visit.user_id] || 0) + 1;
  });
  
  for (const stat of userStats) {
    const actualVisits = userVisitCounts[stat.user_id] || 0;
    const correctRaffleEntries = Math.floor(actualVisits / 5);
    
    if (actualVisits !== stat.visit_count || correctRaffleEntries !== stat.raffle_entries) {
      await supabase
        .from('user_stats')
        .update({
          visit_count: actualVisits,
          raffle_entries: correctRaffleEntries
        })
        .eq('user_id', stat.user_id);
    }
  }
  
  console.log('   ✅ Stats updated\n');
}

const restaurantConfig = {
  // Basic info
  displayName: 'Restaurant',
  tableName: 'restaurants',
  filePrefix: 'restaurant',
  emoji: '🍴',
  newItemEmoji: '📍',
  
  // Additional backup tables
  additionalBackupTables: ['visits', 'user_stats'],
  
  // Functions
  normalizeName: normalizeRestaurantName,
  getAbbreviationBonus,
  parseDataRows,
  displayItemDetails,
  getDuplicateKey,
  prepareUpdateData,
  handleCascadingDeletes,
  postImportTasks
};

module.exports = restaurantConfig;