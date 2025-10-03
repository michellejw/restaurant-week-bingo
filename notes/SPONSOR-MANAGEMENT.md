# 🎯 Sponsor Management System

**Complete guide for managing sponsors across development and production**

---

## 🚀 Quick Start Commands

```bash
# Generate sponsor template
npm run sponsor:template

# Import sponsor data  
npm run sponsor:import

# Backup sponsors (dev)
npm run sponsor:backup

# Backup sponsors (production)
npm run sponsor:backup:prod
```

---

## 📊 System Overview

### **Database Schema**
**Table:** `sponsors` in Supabase

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `name` | TEXT | ✅ | Sponsor business name |
| `address` | TEXT | ✅ | Full address |
| `latitude` | FLOAT8 | ✅ | Map coordinates |
| `longitude` | FLOAT8 | ✅ | Map coordinates |
| `phone` | TEXT | ❌ | Phone number |
| `url` | TEXT | ❌ | Website URL |
| `description` | TEXT | ❌ | Business description |
| `promo_offer` | TEXT | ❌ | Special offers |
| `is_retail` | BOOLEAN | ❌ | Retail vs non-retail (for map icons) |
| `logo_file` | TEXT | ❌ | Logo filename in `/public/logos/` |
| `created_at` | TIMESTAMP | Auto | Creation time |

### **Logo Storage**
- **Location:** `/public/logos/` directory
- **Formats:** PNG, JPG (PNG preferred for transparency)
- **Naming:** kebab-case (`sponsor-name.png`)
- **Size:** Keep under 500KB for performance
- **Display:** Auto-scales to max 12rem height

---

## 📋 Workflow: Managing Sponsors

### **1. Generate Template**
```bash
npm run sponsor:template
```

**Options:**
- **Environment:** Development (safe) or Production (live data)
- **Type:** Empty template or pre-filled with current sponsors
- **Event Name:** For filename (e.g., "Fall-2025")

**Output:** 
- Excel file in `supabase/data/`
- Multiple sheets: Data, Instructions, Examples
- Professional format ready to share

### **2. Data Collection**
1. Share template with chamber/data provider
2. They fill in sponsor information
3. Return completed Excel file
4. Place file in `supabase/data/` directory

### **3. Import Data**
```bash
npm run sponsor:import
```

**Features:**
- **Environment Selection:** Dev or production
- **Automatic Backup:** Safety first
- **Fuzzy Matching:** Finds similar sponsor names
- **Conflict Resolution:** Interactive choices for duplicates
- **Data Validation:** Checks required fields and coordinates

**Import Process:**
1. Choose environment (dev/prod)
2. Select Excel file to import
3. Create backup (recommended)
4. System validates data and finds conflicts
5. Resolve conflicts interactively
6. Execute import with summary

### **4. Backup Data**
```bash
# Development database
npm run sponsor:backup

# Production database  
npm run sponsor:backup:prod
```

**Features:**
- JSON format with metadata
- Automatic cleanup (keeps last 10 backups)
- Environment-specific backups
- Stored in `backups/` directory

---

## 🗂️ File Management

### **Template Files**
- **Location:** `supabase/data/`
- **Format:** `sponsor-template-{event}-{date}.xlsx`
- **Gitignored:** Templates contain real data
- **Retention:** Manual cleanup as needed

### **Logo Files**
- **Location:** `/public/logos/`  
- **Tracked in Git:** Logo files are committed
- **Naming Convention:** `sponsor-name.png`
- **URL Pattern:** `/logos/sponsor-name.png`

### **Backup Files**
- **Location:** `backups/`
- **Format:** `sponsor-backup-{env}-{date}.json`
- **Gitignored:** Contains real data
- **Retention:** Automatic (keeps last 10)

---

## 🎨 Logo Management

### **Adding New Logos:**
1. **Get logo file** from sponsor (PNG/JPG)
2. **Optimize for web** (< 500KB, reasonable dimensions) 
3. **Name consistently** (kebab-case: `sea-creature-supplies.png`)
4. **Save to** `/public/logos/`
5. **Update database** `logo_file` field with filename
6. **Commit to git** (logos are version controlled)

### **Logo Display:**
```typescript
// In sponsor display code
{sponsor.logo_file && (
  <img 
    src={`/logos/${sponsor.logo_file}`} 
    alt={`${sponsor.name} logo`}
    className="max-h-48 w-auto object-contain"
  />
)}
```

### **Logo Best Practices:**
- ✅ PNG format with transparent background
- ✅ Optimize file size (aim for < 500KB)  
- ✅ Good resolution but web-optimized
- ✅ Consistent naming: `kebab-case.png`
- ✅ Test display on both light/dark backgrounds

---

## 🗺️ Map Integration

Sponsors appear on the main restaurant map with different icons:

### **Retail Sponsors** (`is_retail: true`)
- **Icon:** Shopping bag
- **Examples:** Stores, shops, retail businesses
- **Purpose:** Show shopping opportunities

### **Non-Retail Sponsors** (`is_retail: false`) 
- **Icon:** Standard marker
- **Examples:** Restaurants, services, organizations
- **Purpose:** Show other business supporters

### **Popup Content:**
- Sponsor name
- Address
- Website link (if provided)
- Description (if provided)  
- Promo offer highlight (if provided)

---

## 🔧 Development vs Production

### **Development Environment**
- **Safe for testing** - won't affect live sponsors
- **Easy to reset** - can clear and reimport data
- **Template generation** - pull current dev data
- **Logo testing** - test logo display and sizing

### **Production Environment**
- **Live sponsor data** - affects public website
- **Backup required** - always backup before changes
- **Careful import** - double-check before executing
- **Logo updates** - affects live site immediately

---

## ⚠️ Common Issues & Solutions

### **Logo Not Displaying**
- ✅ Check filename matches database exactly
- ✅ Ensure file is in `/public/logos/` directory
- ✅ Verify file format (PNG/JPG)
- ✅ Check file permissions

### **Import Conflicts**
- ✅ Use fuzzy matching to find similar names
- ✅ Choose "Update" for same business, "Add" for similar names
- ✅ Skip entries you don't want to import

### **Invalid Coordinates**
- ✅ Use Google Maps to get decimal coordinates
- ✅ Right-click location → copy coordinates
- ✅ Format: `34.0335, -77.8925` (no extra text)

### **Missing Required Fields**
- ✅ Name and address are always required
- ✅ Latitude and longitude are required for map display
- ✅ Other fields are optional but recommended

---

## 🎯 Best Practices

### **Before Each Restaurant Week:**
1. **Generate fresh template** from production
2. **Share with chamber** for sponsor updates
3. **Test import process** in development first
4. **Backup production** before live import
5. **Update logos** as needed
6. **Test map display** after import

### **Logo Management:**
- Keep a local folder of sponsor logos for easy updates
- Maintain consistent naming conventions
- Optimize images before adding to project
- Test display on various screen sizes

### **Data Quality:**
- Always validate coordinates with Google Maps
- Ensure website URLs include `https://`
- Keep descriptions concise but informative
- Update promo offers each event

---

## 📞 Emergency Procedures

### **If Import Goes Wrong:**
1. **Check backup files** in `backups/` directory
2. **Restore from backup** using Supabase dashboard
3. **Import backup JSON** to restore previous state
4. **Verify restoration** by checking sponsor count/data

### **If Logos Disappear:**
1. **Check git history** for `/public/logos/` changes
2. **Restore from git** if files were accidentally deleted
3. **Re-add missing files** from your local logo folder
4. **Commit and deploy** to restore

---

## 🚀 Future Improvements

- **Automated logo optimization** during import
- **Batch logo upload** interface
- **Sponsor self-service portal** for updates
- **Enhanced map clustering** for many sponsors
- **Analytics integration** for sponsor visibility metrics

---

**💡 Remember: Sponsors are key partners! Keep their information accurate and presentation professional.**