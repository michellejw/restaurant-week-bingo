# 🧪 Restaurant Week Testing Overrides

**Quick reference for enabling check-ins before Restaurant Week starts**

## 🎯 Use Cases

- **Development/Preview Testing**: Test the full check-in flow before launch
- **Production Testing**: Enable check-ins early for final testing on live site
- **Emergency Activation**: Activate early if Restaurant Week dates change

---

## ⚡ Quick Actions

### 1. **Development Testing (Safe)**
**Already enabled by default!** 

Check-ins work automatically on:
- `localhost:3000`  
- Vercel preview deployments (`*.vercel.app`)

### 2. **Production Testing (Use Carefully)**
Edit: `src/config/restaurant-week.ts`

```typescript
forceEnableInProduction: true  // ⚠️ Enables check-ins on live site!
```

**⚠️ REMEMBER TO SET BACK TO `false` BEFORE RESTAURANT WEEK!**

---

## 🔧 Configuration File

**File:** `src/config/restaurant-week.ts`

```typescript
testing: {
  // ✅ Safe - always enabled for localhost/previews
  allowInDevelopment: true,
  
  // ⚠️ Careful - affects live site!
  forceEnableInProduction: false  // Change to true for prod testing
}
```

---

## 🚨 Safety Features

### **Visual Indicators**
When overrides are active, users see a yellow banner:
- 🧪 Development: "Testing Mode Active"
- 🚨 Production: "Production Override Active"

### **Audit Warnings**
```bash
npm run audit  # Shows override status
```

Sample output:
```
🧪 Development override enabled (check-ins work in dev before start date)
🚨 WARNING: Production override is ENABLED!
```

### **Pre-commit Checks**
```bash
npm run precommit  # Catches issues before committing
```

---

## 📋 Testing Workflow

### **Standard Development Testing:**
1. No changes needed - just develop locally
2. Check-ins work immediately on `localhost:3000`
3. Preview deployments also work for colleague testing

### **Production Testing:**
1. **Enable production override:**
   ```typescript
   forceEnableInProduction: true
   ```

2. **Deploy and test:**
   ```bash
   git add .
   git commit -m "Enable production testing"
   # Deploy to production branch
   ```

3. **Test thoroughly** on live site

4. **DISABLE before Restaurant Week:**
   ```typescript
   forceEnableInProduction: false
   ```

5. **Deploy the disable:**
   ```bash
   git add .
   git commit -m "Disable production override - ready for Restaurant Week"
   ```

---

## ✅ Best Practices

### **DO:**
- ✅ Test in development first (always safe)
- ✅ Use production override for final testing only
- ✅ Set production override back to `false` before going live
- ✅ Run `npm run audit` to check override status
- ✅ Commit override changes with clear messages

### **DON'T:**
- ❌ Leave production override enabled during Restaurant Week
- ❌ Forget to test the countdown UI (when overrides are disabled)
- ❌ Skip testing the actual Restaurant Week start date

---

## 🗓️ Timeline Example

**8 days before Restaurant Week (now):**
- Development testing ✅ (always enabled)
- Production testing ❌ (disabled, shows countdown)

**2-3 days before:**
- Enable production override for final testing
- Test full flow on live site
- Disable production override

**Restaurant Week Day (Oct 11):**
- All overrides OFF
- Check-ins enabled by actual date
- Users see normal check-in flow

---

## 🔍 Debugging

### **Check Current Status:**
```bash
npm run audit
```

### **In Browser Console:**
```javascript
// Check what the system thinks about Restaurant Week status
import { RestaurantWeekUtils } from '@/config/restaurant-week';
console.log(RestaurantWeekUtils.getStatusInfo());
```

---

**💡 Remember: The goal is safe, controlled testing without breaking the live experience!**