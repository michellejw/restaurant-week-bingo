# Business Location Map Editor

A standalone interactive tool for editing business locations and details with visual map interface and Excel import/export capabilities. Automatically detects and handles both restaurant and sponsor data formats.

## 🚀 Quick Start

1. Open `index.html` in your web browser
2. Upload your existing Excel file (`.xlsx` or `.xls`) - restaurants or sponsors
3. Edit business locations by dragging markers or using the form
4. Export your changes back to Excel

## ✨ Features

### 📂 Excel Integration  
- **Auto-Detection**: Automatically detects restaurant vs sponsor data formats
- **Import**: Supports both restaurant and sponsor Excel files with their respective structures
- **Export**: Generates Excel files compatible with your smart import system
- **Error Handling**: Shows parsing errors and warnings for invalid data
- **Type Indicator**: Shows detected data type (Restaurants/Sponsors) in the interface

### 🗺️ Interactive Map
- **Drag & Drop**: Move business markers by dragging them to new locations
- **Visual Validation**: Immediately see where businesses are located  
- **Auto-Centering**: Map automatically fits to show all business locations
- **Click to Add**: Toggle add mode and click map to place new businesses

### ✏️ Full Editing
- **All Fields**: Edit name, address, coordinates, code, phone, URL, description, and type-specific fields
- **Smart Forms**: Shows relevant fields based on detected data type (restaurants vs sponsors)
- **Real-time Updates**: Changes reflect immediately on map and in business list
- **Form Validation**: Ensures required fields are filled with valid data

### 🛠️ Business Management
- **Add New**: Click map or use sidebar button to add businesses
- **Delete**: Remove businesses you no longer need
- **Type-Aware**: Automatically creates the right fields for restaurants or sponsors

## 📋 Excel File Structure

The tool uses the same column structure as your existing system:

| Column | Field | Required | Notes |
|--------|-------|----------|-------|
| A | NAME | ✅ | Restaurant name |
| B | ADDRESS | ✅ | Full address |
| C | URL | | Website URL |
| D | CODE | ✅ | Unique restaurant code |
| E | LATITUDE | ✅ | Decimal degrees |
| F | LONGITUDE | ✅ | Decimal degrees |
| G | DESCRIPTION | | Restaurant description |
| H | (empty) | | Reserved column |
| I | PHONE | | Phone number |
| J-M | (empty) | | Reserved columns |
| N | SPECIALS | | Special offers/deals |

### Sheet Structure
- **Sheet 1**: Instructions (can be ignored)
- **Sheet 2**: Restaurant data (this is what gets imported)

## 🎯 How to Use

### 1. Import Your Data
- Click the upload area or drag & drop your Excel file
- The tool automatically finds the header row and parses restaurant data
- Any errors will be shown in the status bar and console

### 2. Edit Locations
**Method 1: Drag Markers**
- Simply drag any restaurant marker to a new location
- Coordinates update automatically in real-time

**Method 2: Use the Form**
- Click a restaurant in the list or click its marker
- Click "Edit" to open the detailed form
- Modify any field including precise lat/long coordinates
- Save your changes

### 3. Add New Restaurants
- Click "Add Restaurant" in the sidebar
- Click anywhere on the map to place the new restaurant
- Fill in the details in the editing form
- Save to confirm

### 4. Export Your Changes
- Click "Export Excel" to download your modified data
- **Filename Format**: `restaurant-data-edited-YYYY-MM-DD-HH-MM.xlsx`
- **Duplicate Handling**: If you export multiple times in the same minute, files get numbered: `(2)`, `(3)`, etc.
- **Example**: `restaurant-data-edited-2025-10-09-14-30.xlsx`
- File includes proper formatting for your smart import system
- Maintains all existing column structure and validation

## 🔧 Technical Details

### Browser Compatibility
- Modern browsers with JavaScript enabled
- Chrome, Firefox, Safari, Edge (recent versions)
- No server required - runs entirely in the browser

### External Dependencies
- **Leaflet**: Interactive maps (loaded from CDN)
- **SheetJS**: Excel file processing (loaded from CDN)
- **OpenStreetMap**: Map tiles (free, no API key needed)

### Data Processing
The tool uses the same parsing logic as your existing `restaurant-config.js`:
- Finds header row by looking for "NAME" column
- Uses hardcoded column positions for reliability
- Validates required fields (name, code, coordinates)
- Preserves all original data structure

## 🚨 Important Notes

### Data Safety
- **Always backup** your original Excel files before making changes
- The tool doesn't modify your original files - it creates new export files
- Test with a small dataset first to ensure everything works as expected

### Coordinate Precision
- Coordinates are stored with full decimal precision
- Map displays rounded values for readability
- Export maintains full precision for accuracy

### File Limitations
- Maximum file size depends on browser memory
- Large files (>1000 restaurants) may load slowly
- Excel files must have at least 2 sheets (instructions + data)

## 🐛 Troubleshooting

### Common Issues

**"Could not find data sheet" error**
- Ensure your Excel file has at least 2 sheets
- Data should be in Sheet 2 (Sheet 1 is for instructions)

**"Could not find header row" error**
- Make sure there's a column header named "NAME" in your data sheet
- Header should be in one of the first 10 rows

**Restaurants appear in wrong locations**
- Check that latitude/longitude columns contain valid decimal numbers
- Ensure coordinates are in the correct format (not degrees/minutes/seconds)
- Verify that lat/long aren't swapped (latitude should be ~34 for Carolina Beach area)

**Missing restaurant fields**
- Check that your Excel columns match the expected structure
- Some fields are optional and will show as empty if not provided

### Performance Tips
- For files with 100+ restaurants, allow extra time for initial loading
- Close unused browser tabs to free up memory
- Use the restaurant list to quickly navigate to specific items

## 🔮 Future Enhancements

This tool is designed as a quick solution for restaurant week. Potential improvements:
- Integration with geocoding APIs for address-to-coordinate conversion
- Bulk coordinate validation and correction
- Integration with your main admin system
- Support for sponsor/retail location editing
- Undo/redo functionality
- Map layer options and customization

## 🆘 Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your Excel file structure matches the expected format
3. Test with a simple 2-3 restaurant file first
4. Ensure you're using a modern browser with JavaScript enabled

## 📁 Project Structure

```
tools/map-editor/
├── index.html          # Main interface
├── script.js           # Core functionality
└── README.md          # This documentation
```

The tool is completely standalone and doesn't depend on your main application code, making it safe to use without affecting your production system.