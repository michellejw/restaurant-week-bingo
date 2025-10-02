const XLSX = require('xlsx');
const path = require('path');

function examineRestaurantData() {
  try {
    const filePath = path.join(__dirname, '../supabase/data/Rest Tour Database Oct 2025.xlsx');
    const workbook = XLSX.readFile(filePath);
    
    // Focus on the "MARCH RW 2025" sheet which seems to have the restaurant data
    const restaurantSheet = workbook.Sheets['MARCH RW 2025'];
    
    if (!restaurantSheet) {
      console.error('❌ "MARCH RW 2025" sheet not found');
      return;
    }
    
    console.log('🍴 Examining "MARCH RW 2025" sheet for restaurant data:\n');
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(restaurantSheet, { header: 1 });
    
    console.log(`📊 Total rows: ${jsonData.length}`);
    console.log(`📊 Range: ${restaurantSheet['!ref']}\n`);
    
    // Find the actual header row (might not be row 1)
    let headerRowIndex = -1;
    let headerRow = null;
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (row && row.some(cell => 
        typeof cell === 'string' && 
        (cell.toLowerCase().includes('name') || 
         cell.toLowerCase().includes('address') || 
         cell.toLowerCase().includes('code'))
      )) {
        headerRowIndex = i;
        headerRow = row;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      console.log('🔍 First 10 rows to find headers manually:');
      jsonData.slice(0, 10).forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
      });
      return;
    }
    
    console.log(`📝 Found headers at row ${headerRowIndex + 1}:`);
    headerRow.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index);
      console.log(`   ${colLetter}: ${header || '(empty)'}`);
    });
    
    console.log('\\n📋 Sample restaurant data:');
    
    // Show a few data rows after the header
    const dataRows = jsonData.slice(headerRowIndex + 1);
    dataRows.slice(0, 3).forEach((row, index) => {
      console.log(`\\nRestaurant ${index + 1}:`);
      row.forEach((cell, colIndex) => {
        const header = headerRow[colIndex] || `Col${colIndex + 1}`;
        const colLetter = String.fromCharCode(65 + colIndex);
        if (cell !== undefined && cell !== null && cell !== '') {
          console.log(`   ${colLetter} (${header}): ${cell}`);
        }
      });
    });
    
    console.log(`\\n📊 Total restaurant records: ${dataRows.length}`);
    
    // Look for promotion/special related columns
    console.log('\\n🎁 Columns that might contain promotions/specials:');
    headerRow.forEach((header, index) => {
      if (header && (
        header.toLowerCase().includes('promo') || 
        header.toLowerCase().includes('special') || 
        header.toLowerCase().includes('offer') ||
        header.toLowerCase().includes('deal') ||
        header.toLowerCase().includes('discount')
      )) {
        console.log(`   ${String.fromCharCode(65 + index)}: ${header}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

examineRestaurantData();