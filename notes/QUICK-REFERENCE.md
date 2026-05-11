# 🚀 Quick Reference - Restaurant Week Bingo

**Essential commands and workflows for managing your Restaurant Week app**

> ⚠️ **Picking this up after a long break?** Supabase projects were
> paused 2026-05-11 and may be deleted after ~2026-08-09. If the
> dashboard says the project is gone or pause won't unpause, read
> [`ops/RESTORE-FROM-PAUSED.md`](../ops/RESTORE-FROM-PAUSED.md) first.

---

## 📋 Command Overview

### **🏃‍♂️ Most Common Commands**
```bash
# Development
npm run dev                    # Start development server

# Restaurant management (most used)
npm run template               # Generate restaurant Excel template
npm run import                 # Import restaurant data

# Sponsor management  
npm run sponsor:template       # Generate sponsor Excel template
npm run sponsor:import         # Import sponsor data

# Safety
npm run backup                 # Backup development database
npm run backup:prod            # Backup production database
npm run precommit              # Check before committing
```

---

## 🍽️ Restaurant Week Workflow

### **Before Each Event (6 months)**
1. **Generate template** from current production:
   ```bash
   npm run template
   # → Choose production → pre-filled template
   ```

2. **Share Excel file** with chamber for updates

3. **Test import** in development first:
   ```bash
   npm run import  
   # → Choose development → select file → resolve conflicts
   ```

4. **Backup production** and import live:
   ```bash
   npm run backup:prod
   npm run import
   # → Choose production → select file → resolve conflicts  
   ```

### **Adding New Sponsors**
1. **Generate sponsor template:**
   ```bash
   npm run sponsor:template
   # → Choose environment → template type
   ```

2. **Collect sponsor data** via Excel template

3. **Import sponsors:**
   ```bash
   npm run sponsor:import
   # → Choose environment → resolve conflicts
   ```

---

## 📁 File Locations

```
restaurant-week-bingo/
├── supabase/data/           # Excel templates (gitignored)
│   ├── *.xlsx              # Templates for chamber
│   └── *.json              # Data files
├── backups/                 # Database backups (gitignored)
│   ├── database-backup-*    # Full database backups
│   └── sponsor-backup-*     # Sponsor-only backups  
├── public/logos/            # Logo files (tracked in git)
│   ├── *.png               # Sponsor logos
│   └── *.jpg               # Logo files
└── notes/                   # Documentation
    ├── SPONSOR-MANAGEMENT.md
    ├── TESTING-OVERRIDES.md
    └── PRODUCTION-AUDIT-CHECKLISTS.md
```

---

## 🔧 All Available Commands

### **Development & Build**
```bash
npm run dev                    # Start development server
npm run build                  # Build for production  
npm start                     # Start production server
npm run lint                  # Run ESLint
```

### **Safety & Auditing**
```bash
npm run audit                  # Production readiness audit
npm run precommit              # Pre-commit safety checks
```

### **Database Backups**
```bash
npm run backup                 # Backup dev database (full)
npm run backup:prod            # Backup production database (full)
npm run sponsor:backup         # Backup dev sponsors only
npm run sponsor:backup:prod    # Backup production sponsors only
```

### **Restaurant Management**
```bash
npm run restaurant:template    # Generate restaurant Excel template
npm run restaurant:import      # Import restaurant data
npm run template               # Alias: restaurant:template
npm run import                 # Alias: restaurant:import
```

### **Sponsor Management**
```bash
npm run sponsor:template       # Generate sponsor Excel template
npm run sponsor:import         # Import sponsor data
```

### **Database Maintenance** 
```bash
npm run db:check-consistency   # Check for data inconsistencies
npm run db:fix-user-stats      # Recalculate user visit stats
npm run db:reset-dev           # Reset development database
```

---

## 🚨 Emergency Procedures

### **Something Went Wrong with Import**
1. **Check recent backup:**
   ```bash
   ls -la backups/
   # Look for latest backup before your import
   ```

2. **Restore from Supabase dashboard:**
   - Go to Supabase → Table Editor
   - Import the backup JSON file
   - Verify data restoration

### **Production Issues**
1. **Quick rollback via git:**
   ```bash
   git log --oneline -n 10      # Find last good commit
   git revert <commit-hash>     # Revert problematic commit
   git push origin main         # Deploy rollback
   ```

2. **Environment variable issues:**
   - Check Vercel dashboard → Environment Variables
   - Verify production vs preview settings

### **Database Connection Issues**
1. **Check environment files:**
   ```bash
   npm run audit                # Shows environment status
   ```

2. **Verify credentials** in `.env.local` and `.env.production`

---

## 🎯 Restaurant Week Testing

### **Enable Check-ins Early (for testing)**
```bash
# Edit src/config/restaurant-week.ts
forceEnableInProduction: true  # CAREFUL: affects live site!

# Deploy and test, then disable:
forceEnableInProduction: false  
```

### **Development Testing** 
✅ **Always enabled** - check-ins work immediately on:
- `localhost:3000`
- Vercel preview deployments  

---

## 💡 Pro Tips

### **Before Major Changes**
```bash
npm run precommit              # Catch issues early
npm run backup:prod            # Safety first
```

### **Template Best Practices**
- **Restaurants:** Generate from production for accuracy
- **Sponsors:** Use pre-filled templates to update existing data
- **Always include examples** for new data collectors

### **Import Best Practices**  
- **Test in dev first** - always safer
- **Use fuzzy matching** - catches "Joe's Cafe" vs "Joes cafe"
- **Interactive resolution** - choose update vs add carefully

### **File Management**
- **Templates/backups** are gitignored (contain real data)
- **Logo files** are tracked in git (public assets)
- **Scripts** are tracked (version controlled tools)

---

## 🔗 Related Documentation

- **[SPONSOR-MANAGEMENT.md](SPONSOR-MANAGEMENT.md)** - Complete sponsor workflow guide
- **[TESTING-OVERRIDES.md](TESTING-OVERRIDES.md)** - Restaurant Week date testing
- **[PRODUCTION-AUDIT-CHECKLISTS.md](PRODUCTION-AUDIT-CHECKLISTS.md)** - Pre-deployment checks

---

**💡 Keep this file handy for quick reference during Restaurant Week preparation!**