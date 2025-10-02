const XLSX = require('xlsx');
const path = require('path');

function examineXLSX() {
  try {
    const filePath = path.join(__dirname, '../supabase/data/Rest Tour Database Oct 2025.xlsx');
    console.log('📊 Examining:', filePath);
    
    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    
    console.log('\n📋 Sheet Names:');
    workbook.SheetNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    
    // Examine the first sheet (most likely contains the data)
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    console.log(`\n🔍 Examining sheet: "${firstSheetName}"`);
    
    // Get the range of the sheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    console.log(`   Range: ${worksheet['!ref'] || 'Empty'}`);
    console.log(`   Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}`);
    
    // Convert to JSON to see the structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length > 0) {
      console.log('\n📝 Column Headers (Row 1):');
      jsonData[0].forEach((header, index) => {
        console.log(`   ${String.fromCharCode(65 + index)}: ${header}`);
      });
      
      console.log('\n📋 Sample Data (First 3 rows):');
      jsonData.slice(0, Math.min(4, jsonData.length)).forEach((row, index) => {
        console.log(`\nRow ${index + 1}:`);
        row.forEach((cell, colIndex) => {
          const colLetter = String.fromCharCode(65 + colIndex);
          const header = jsonData[0][colIndex] || `Col${colIndex + 1}`;
          console.log(`   ${colLetter} (${header}): ${cell}`);
        });
      });
      
      console.log(`\n📊 Total Records: ${jsonData.length - 1} (excluding header)`);
    }
    
    // Check for additional sheets that might have different data
    if (workbook.SheetNames.length > 1) {
      console.log('\n📚 Additional Sheets Preview:');
      workbook.SheetNames.slice(1).forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`\n   Sheet: "${sheetName}"`);
        console.log(`   Range: ${sheet['!ref'] || 'Empty'}`);
        console.log(`   Rows: ${data.length}`);
        if (data.length > 0) {
          console.log(`   Headers: ${data[0]?.slice(0, 5).join(', ')}${data[0]?.length > 5 ? '...' : ''}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error reading XLSX file:', error.message);
  }
}

examineXLSX();