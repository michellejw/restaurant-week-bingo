# 🛡️ Production Security & Integration Audit Checklists

**Use this when you're ready to go to production - check each item in the web dashboards**

---

## 🔧 VERCEL DASHBOARD AUDIT

**Go to:** [vercel.com](https://vercel.com) → Your Project → Settings

### ✅ Git Configuration
- [ ] **Production Branch** is set to: `new-v07` (current) or `main` (preferred future)
- [ ] **Preview deployments** enabled for other branches
- [ ] **Automatic deployments** from GitHub enabled

### ✅ Environment Variables - Production
Navigate to: **Settings** → **Environment Variables** → **Production**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://ncezsildjpkioofgsmkj.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_sXMV...` (production key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_QCay...` (production secret)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_Y2xl...` (production key)
- [ ] `CLERK_SECRET_KEY` = `sk_live_7jRC...` (production secret)

### ✅ Environment Variables - Preview
Navigate to: **Settings** → **Environment Variables** → **Preview**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://lhynosiqalkouyotibwt.supabase.co` (dev)
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_tmK6...` (dev key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_AZs2...` (dev secret)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_test_cmVs...` (dev key)
- [ ] `CLERK_SECRET_KEY` = `sk_test_7NAX...` (dev secret)

### ✅ Domain Configuration
Navigate to: **Settings** → **Domains**
- [ ] `picc-rest-week.waveformanalytics.com` is configured
- [ ] SSL certificate is active
- [ ] Domain redirects properly to production

---

## 🔑 CLERK DASHBOARD AUDIT

**Go to:** [clerk.com](https://clerk.com) → Dashboard

### ✅ Production Application Settings
Navigate to: **Production App** (the one with `pk_live_` keys)

#### **Allowed Origins/URLs**
Navigate to: **Settings** → **Domains**
- [ ] `https://picc-rest-week.waveformanalytics.com` is listed
- [ ] `https://restaurant-week-bingo-*.vercel.app` patterns allowed (if needed)

#### **JWT Templates** 
Navigate to: **JWT Templates**
- [ ] Default template exists (Clerk usually handles this automatically)
- [ ] No custom modifications needed (unless you've made specific changes)

#### **Webhooks** (Critical for Supabase sync)
Navigate to: **Webhooks**
- [ ] **User created** webhook exists (if you use it)
- [ ] **User updated** webhook exists (if you use it)  
- [ ] Webhook endpoints point to your production domain
- [ ] **OR**: Verify you're NOT using webhooks (using UserInitializer instead)

### ✅ Development Application Settings  
Navigate to: **Development App** (the one with `pk_test_` keys)

#### **Allowed Origins/URLs**
Navigate to: **Settings** → **Domains**
- [ ] `http://localhost:3000` is listed
- [ ] `https://localhost:3000` is listed
- [ ] `https://restaurant-week-bingo-git-dev-*.vercel.app` patterns allowed
- [ ] Any other preview URL patterns needed

---

## 🗄️ SUPABASE DASHBOARD AUDIT

**Go to:** [supabase.com](https://supabase.com) → Your Projects

### ✅ Production Project Security (`pi-resto-week-fall2025`)
Navigate to: **Production Project** → **Authentication** → **Policies**

#### **Row Level Security (RLS) Status**
- [ ] **restaurants** table: RLS **ENABLED** with public read policy
- [ ] **sponsors** table: RLS **ENABLED** with public read policy  
- [ ] **visits** table: RLS **ENABLED** with user-specific read/write policies
- [ ] **users** table: RLS **ENABLED** with user-specific policies
- [ ] **user_stats** table: RLS **ENABLED** with user-specific read policies

#### **Critical Security Check**
Navigate to: **Authentication** → **Settings**
- [ ] **Row Level Security** is **ENABLED** for all tables
- [ ] **Service Role Key** is only used in server-side scripts (not client-side)
- [ ] **Anonymous Key** is safe for public client use

### ✅ Development Project Security (`pi-resto-week-fall2025-dev`)
Navigate to: **Development Project**
- [ ] Same security policies as production (or RLS disabled for easier testing)
- [ ] Contains test data, not production user data
- [ ] Service role key is different from production

### ✅ Database Schema Consistency
- [ ] Both dev and prod have same table structure
- [ ] Both have necessary triggers for `user_stats` updates
- [ ] Both have proper indexes for performance

---

## 🔄 CLERK-SUPABASE INTEGRATION TEST

### ✅ Production Sync Test (Do this CAREFULLY)
**IMPORTANT:** Only do this with a test account, not your main account

1. **Create Test User in Production:**
   - [ ] Go to your live site: `https://picc-rest-week.waveformanalytics.com`
   - [ ] Sign up with a test email (like `test+prod@youremail.com`)
   - [ ] Complete signup process

2. **Verify User in Supabase:**
   - [ ] Go to Supabase production dashboard
   - [ ] Navigate to: **Table Editor** → **users** table
   - [ ] Verify the test user appears with correct `id` and `email`
   - [ ] Check **user_stats** table for corresponding entry

3. **Test User Updates:**
   - [ ] Update the test user's name/phone in `/my-info` page
   - [ ] Verify changes appear in Supabase `users` table

### ✅ Development Sync Test
- [ ] Same test process as above, but using localhost:3000
- [ ] Verify user appears in **development** Supabase project

---

## 🚀 FINAL PRE-DEPLOYMENT CHECKLIST

### ✅ Code Readiness
- [ ] All colleague feedback implemented
- [ ] Restaurant Week date restriction tested
- [ ] Build passes: `npm run build`
- [ ] No console errors in browser
- [ ] All links and navigation working

### ✅ Data Readiness
- [ ] Production database backup created: `npm run backup:prod`
- [ ] Restaurant data is current and complete
- [ ] Sponsor data is current and complete

### ✅ Branch Strategy
- [ ] Decision made: Deploy from `new-v07` (current) or switch to `main`
- [ ] If switching to `main`: plan for merging `dev` → `main` → update Vercel

### ✅ Monitoring Plan
- [ ] Know how to check Vercel deployment logs
- [ ] Know how to check Supabase logs
- [ ] Have plan for rolling back if needed (revert git commit + Vercel redeploy)

---

## 🆘 EMERGENCY ROLLBACK PLAN

If something goes wrong after deployment:

1. **Quick Fix:** Revert environment variables in Vercel to previous working values
2. **Code Rollback:** `git revert <commit-hash>` and push to trigger redeploy
3. **Database Rollback:** Restore from backup using `npm run backup:prod` files
4. **DNS Issues:** Check domain configuration in Vercel dashboard

---

**✍️ When you've checked all the boxes above, you'll be ready for production deployment!**