# Development Environment Setup Plan
**Date:** January 30, 2025  
**Project:** Restaurant Week Bingo  
**Goal:** Set up safe dev/staging environment separate from production

## 🔍 Current State Analysis

### **Git Branch Situation** 
- **`main` branch**: Outdated (last commit: "Enhance app with live restaurant data")
- **`new-v07` branch**: **ACTIVE** - Contains recent updates including fall 2025 changes  
- **Live site**: Currently deploying from `new-v07` branch (not `main`)
- **Recent commits on new-v07**: Logo updates, fall 2025 updates, various fixes

### **Current Services Configuration**
- **Supabase Production**: `pi-resto-week-fall2025` 
- **Clerk**: Already has dev (`pk_test_`) and prod (`pk_live_`) keys configured
- **Vercel**: Connected to GitHub, currently deploying `new-v07` → production
- **Domain**: `picc-rest-week.waveformanalytics.com`

## 🎯 Recommended Setup Strategy

### **Branch Strategy Decision**
**Option A (Recommended):** Keep current setup, formalize it
- **`new-v07`** → Production (current reality)
- **`dev`** → New development branch (create from new-v07)
- **`main`** → Update to match new-v07, then use as stable release branch

**Option B:** Clean up and standardize
- Merge `new-v07` into `main` 
- Set Vercel to deploy from `main`
- Create `dev` branch for development

### **Service Configuration Plan**

#### **Supabase Projects**
- **Production**: `pi-resto-week-fall2025` (existing)
- **Development**: `pi-resto-week-fall2025-dev` (new)

#### **Clerk Applications**
- **Production**: Already configured with `pk_live_` keys
- **Development**: Already configured with `pk_test_` keys
- **Need to verify**: URL approvals for localhost and preview deployments

#### **Vercel Environment Variables**
- **Production**: Use live Supabase + live Clerk keys
- **Preview/Development**: Use dev Supabase + dev Clerk keys

### **URL Approval Checklist**
All these domains need to be approved in Clerk development instance:

#### **Local Development**
- ✅ `http://localhost:3000`
- ✅ `https://localhost:3000` 
- ✅ `http://127.0.0.1:3000`

#### **Vercel Preview Deployments** 
- 🔄 `https://restaurant-week-bingo-*.vercel.app`
- 🔄 `https://restaurant-week-bingo-git-dev-*.vercel.app`
- 🔄 `https://restaurant-week-bingo-git-*-michellejw.vercel.app`

#### **Production Domain**
- ✅ `https://picc-rest-week.waveformanalytics.com` (already configured)

## 📋 Implementation Steps

### **Phase 1: Branch Organization** ⏱️ 5 minutes
1. [ ] **Decision**: Choose Option A or B above
2. [ ] Create `dev` branch from current `new-v07`
3. [ ] Verify which branch Vercel is actually deploying
4. [ ] Update `main` to match current production state

### **Phase 2: Development Supabase Setup** ⏱️ 10 minutes
1. [ ] Create new Supabase project: `pi-resto-week-fall2025-dev`
2. [ ] Choose same region as production project
3. [ ] Apply existing schema from `supabase/updated_schema.sql`
4. [ ] Copy seed data if needed (restaurants, sponsors)
5. [ ] Save new dev database URL and anon key

### **Phase 3: Environment Configuration** ⏱️ 5 minutes
1. [ ] Update `.env.local` to use dev Supabase + dev Clerk
2. [ ] Verify Clerk dev instance has all necessary URLs approved
3. [ ] Configure Vercel environment variables:
   - Production environment: prod Supabase + prod Clerk
   - Preview environment: dev Supabase + dev Clerk

### **Phase 4: Testing & Validation** ⏱️ 15 minutes
1. [ ] Test local development with dev environment
2. [ ] Create test branch and verify preview deployment works
3. [ ] Test authentication flow in both environments
4. [ ] Verify database operations work in dev environment
5. [ ] Confirm production is unaffected

### **Phase 5: Documentation** ⏱️ 5 minutes
1. [ ] Document the new development workflow
2. [ ] Create quick reference for switching environments
3. [ ] Update any deployment documentation

## ⚠️ Important Notes

### **Branch Status Mystery Solved**
- The live site shows recent changes because Vercel is deploying `new-v07`
- This is likely set in Vercel dashboard under Project Settings → Git
- We need to verify this and decide whether to keep it or standardize

### **Safety Measures**
- All testing will happen in dev environment
- Production database and users remain completely separate
- Can roll back at any point by switching environment variables

### **Naming Convention**
- Following existing pattern: `pi-resto-week-fall2025-dev` for development Supabase

## ✅ SETUP COMPLETED SUCCESSFULLY!

**Total time taken:** ~2.5 hours  
**Risk level:** Low (existing production setup remains untouched)  
**Status:** ✅ Full dev/prod environment separation working

### **What Was Accomplished:**
- ✅ Development Supabase database created with production data
- ✅ Modern Supabase API keys (sb_publishable_/sb_secret_) implemented  
- ✅ Vercel environment variables configured for dev/prod separation
- ✅ RLS policies adjusted for development testing
- ✅ Users table added for contact information
- ✅ Environment-based check-in enablement for testing
- ✅ Complete workflow tested and working

### **Database Recreation Instructions:**

**For New Development Database:**
1. Apply main schema: `supabase/updated_schema.sql`
2. Import data: `supabase/dev_data_import.sql`  
3. Apply dev config: `supabase/dev_config.sql`

**For Production Database:**
1. Apply main schema: `supabase/updated_schema.sql`
2. Import data as needed
3. Keep RLS enabled (do NOT run dev_config.sql)

---

**🎉 Ready for Restaurant Week 2025 development!**
