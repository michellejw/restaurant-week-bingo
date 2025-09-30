# Supabase Database Files

This folder contains the essential database schema and configuration files for the Restaurant Week Bingo project.

## 📁 Files Overview

### **Core Schema & Data**
- **`updated_schema.sql`** - **Main database schema** with all tables, policies, and functions
- **`dev_data_import.sql`** - **Sample data** for development testing (restaurants & sponsors)
- **`dev_config.sql`** - **Development-specific settings** (disables RLS for easier testing)

### **Archive**
- **`db_cluster-27-05-2025@09-24-48.backup`** - **Original production backup** (451KB - keep for reference)

## 🚀 Database Setup Instructions

### **For New Development Database:**
```sql
1. Run: updated_schema.sql      -- Creates all tables and policies
2. Run: dev_data_import.sql     -- Adds sample restaurant data  
3. Run: dev_config.sql          -- Makes testing easier (disables RLS)
```

### **For Production Database:**
```sql
1. Run: updated_schema.sql      -- Creates all tables and policies
2. Import real data as needed   -- Skip dev_data_import.sql
3. DO NOT run dev_config.sql    -- Keep RLS enabled for security
```

## 🔄 File Relationships

- **`updated_schema.sql`** is the complete base schema that works for both environments
- **`dev_data_import.sql`** provides realistic test data for development
- **`dev_config.sql`** modifies the base schema for easier development (optional)
- **`db_cluster-*.backup`** is the original data source (archived)

## 🧹 Recently Cleaned Up

The following redundant files were removed during the 2025-09-30 cleanup:
- Various outdated schema versions (init.sql, supabase_schema.sql, etc.)
- Individual table creation files (add_users_table.sql, etc.)
- Temporary RLS fix files (fix_rls_policies.sql, etc.)
- Outdated data files (seed_data.sql, etc.)

All functionality from these files has been consolidated into the core files above.