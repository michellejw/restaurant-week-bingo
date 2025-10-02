const XLSX = require('xlsx');
const path = require('path');

function checkAllColumns() {
  try {
    const filePath = path.join(__dirname, '../supabase/data/Rest Tour Database Oct 2025.xlsx');
    const workbook = XLSX.readFile(filePath);
    const restaurantSheet = workbook.Sheets['MARCH RW 2025'];
    
    const jsonData = XLSX.utils.sheet_to_json(restaurantSheet, { header: 1 });
    const headerRow = jsonData[3]; // Headers are at row 4 (index 3)
    
    console.log('🔍 ALL COLUMNS (including empty headers):');
    console.log('=====================================\n');
    
    // Check all columns up to O (15 columns)
    for (let colIndex = 0; colIndex < 15; colIndex++) {
      const colLetter = String.fromCharCode(65 + colIndex);
      const header = headerRow[colIndex] || '(empty)';
      
      console.log(`Column ${colLetter}: "${header}"`);
      
      // Show sample data from this column
      const sampleData = [];
      for (let rowIndex = 4; rowIndex < Math.min(10, jsonData.length); rowIndex++) {
        const cell = jsonData[rowIndex][colIndex];
        if (cell !== undefined && cell !== null && cell !== '') {
          sampleData.push(cell);
        }
      }
      
      if (sampleData.length > 0) {
        console.log(`   Sample data: ${sampleData.slice(0, 3).join(' | ')}`);
      } else {
        console.log('   (no data)');
      }
      console.log();
    }
    
    // Look for the promotion data specifically
    console.log('🎁 LOOKING FOR PROMOTION-LIKE DATA:');
    console.log('===================================\n');
    
    const dataRows = jsonData.slice(4); // Data starts from row 5 (index 4)
    
    // Check each column for potential promotion content
    for (let colIndex = 0; colIndex < 15; colIndex++) {
      const colLetter = String.fromCharCode(65 + colIndex);
      const header = headerRow[colIndex] || '(empty)';
      
      const columnData = dataRows.map(row => row[colIndex]).filter(cell => 
        cell !== undefined && cell !== null && cell !== '' && typeof cell === 'string'
      );
      
      if (columnData.length > 0) {
        // Check if this looks like promotion data (longer text, mentions deals, etc.)
        const avgLength = columnData.reduce((sum, text) => sum + String(text).length, 0) / columnData.length;
        const hasPromoKeywords = columnData.some(text => 
          String(text).toLowerCase().includes('off') ||
          String(text).toLowerCase().includes('%') ||
          String(text).toLowerCase().includes('free') ||
          String(text).toLowerCase().includes('deal') ||
          String(text).toLowerCase().includes('special') ||
          String(text).toLowerCase().includes('discount') ||
          String(text).toLowerCase().includes('$')
        );
        
        if (avgLength > 20 || hasPromoKeywords) {
          console.log(`${colLetter} (${header}) - POTENTIAL PROMOTION DATA:`);
          console.log(`   Average length: ${Math.round(avgLength)} chars`);
          console.log(`   Has promo keywords: ${hasPromoKeywords}`);
          console.log(`   Samples:`);
          columnData.slice(0, 3).forEach(text => {
            console.log(`     "${String(text).substring(0, 100)}${String(text).length > 100 ? '...' : ''}"`);
          });
          console.log();
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllColumns();