# Restaurant Week Bingo 🎲🍴

A modern web application that gamifies restaurant week participation through a digital bingo card system. Perfect for chambers of commerce, downtown associations, and communities looking to boost local restaurant engagement.

**[Live Demo](https://picc-rest-week.waveformanalytics.com)** • **[Hosted Service Available](#-hosted-service)**

## ✨ Features

- 🔐 **Secure Authentication** - Clerk-based user management
- 🗺️ **Interactive Map** - OpenStreetMap with restaurant locations
- 🎯 **Digital Bingo Card** - Updates in real-time as users visit restaurants  
- 📱 **QR Code Check-ins** - Unique codes for each restaurant
- 🎟️ **Automatic Raffle Entries** - 1 entry per 4 restaurants visited
- 📄 **Real-time Statistics** - Visit tracking and progress display
- 🎨 **Responsive Design** - Works perfectly on mobile and desktop
- 👤 **User Profiles** - Contact information for prize fulfillment
- 🏦 **Sponsor Integration** - Showcase local business sponsors
- 🎁 **Promotions Display** - Restaurant specials shown in map popups

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet with OpenStreetMap
- **Deployment**: Vercel
- **Environment Management**: Dev/staging/production separation

## 🚀 Hosted Service

**Need this running for your community without the technical setup?** 

I offer a fully hosted service that includes:
- ✅ **Complete setup and configuration**
- ✅ **Custom branding and domain**
- ✅ **Restaurant data import
- ✅ **Ongoing support and maintenance**
- ✅ **Analytics and reporting**
- ✅ **Automatic backups and security updates**

Perfect for chambers of commerce and downtown associations who want "it just works" without managing servers.

**[Contact me for pricing and setup →](mailto:michelle@waveformanalytics.com)**

---

## 🛠️ Self-Hosting Setup

Want to run this yourself? Here's how:

### Prerequisites
- Node.js 18+
- A Supabase account
- A Clerk account
- A Vercel account (for deployment)

### 1. Clone and Install
```bash
git clone https://github.com/michellejw/restaurant-week-bingo.git
cd restaurant-week-bingo
npm install
```

### 2. Database Setup
```bash
# Create a new Supabase project at https://supabase.com
# Run these SQL files in order:
1. supabase/updated_schema.sql     # Creates all tables and functions
2. supabase/dev_data_import.sql    # Optional: adds sample data
```

### 3. Authentication Setup
```bash
# Create a Clerk application at https://clerk.com
# Configure allowed domains for your deployment
```

### 4. Environment Variables
Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 5. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

### 6. Deploy to Production
- Push to GitHub
- Connect to Vercel
- Set environment variables in Vercel dashboard
- Configure Clerk and Supabase for your production domain

For detailed setup instructions, see [`notes/DEV_SETUP_PLAN_2025-09-30.md`](notes/DEV_SETUP_PLAN_2025-09-30.md).

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── lib/                # Utilities and database services
│   └── types/              # TypeScript definitions
├── supabase/               # Database schema and utilities
├── public/                 # Static assets
├── notes/                  # Project documentation
└── dev/                    # Development utilities
```

## 🗄️ Database Schema

The application uses PostgreSQL via Supabase with these main tables:

- **`restaurants`** - Restaurant information, unique codes, and promotions
- **`visits`** - User check-in tracking  
- **`user_stats`** - Cached visit counts and raffle entries
- **`users`** - Contact information for prize fulfillment
- **`sponsors`** - Local business sponsors

Complete schema available in [`supabase/updated_schema.sql`](supabase/updated_schema.sql).

## 🍽️ Restaurant Data Management

This system provides professional tools for managing restaurant data safely across development and production environments.

### 📋 Generate Restaurant Template (for Chamber/Data Provider)

Generate professional XLSX templates for collecting restaurant data:

```bash
# Generate interactive template (choose environment and options)
npm run template                    # Interactive template generator

# Database backups
npm run backup                      # Backup dev database
npm run backup:prod                 # Backup production database

# Database maintenance
npm run check-consistency           # Check for data inconsistencies
npm run fix-user-stats             # Fix user stats if needed
```

**Template Features:**
- 📝 **Instructions Sheet** - Clear guidance for data entry
- 📊 **Restaurant Data Sheet** - Properly formatted columns
- ✅ **Example Data** - Shows correct format (empty template only)
- 🎁 **Promotions Column** - For Restaurant Week specials
- 🔒 **Professional Format** - Ready to send to chamber/partners

### 📥 Smart Restaurant Import

Safely import updated restaurant data with intelligent fuzzy matching:

```bash
# Smart import with automatic backups and conflict resolution
npm run import
```

**Smart Import Features:**
- ✅ **Automatic backups** before any changes
- 🎯 **Fuzzy matching** for similar restaurant names
- 👤 **Interactive conflict resolution** with checkbox selection
- 🔒 **Visit preservation** - user check-ins never lost
- 🔍 **Duplicate detection** in input files
- 🔄 **Environment selection** (dev vs production)

**Import Process:**
1. **Choose environment** - Development or production database
2. **Select XLSX file** - From available files in `supabase/data/`
3. **Automatic backup** - Safety first, always created
4. **Fuzzy matching** - Finds similar restaurants ("Joe's Cafe" vs "Joes cafe")
5. **Conflict resolution** - Choose which restaurants to keep with checkboxes
6. **Safe execution** - Preserves user visits, updates data seamlessly

### 🔄 Recommended Workflow

**For Restaurant Week Updates:**

1. **Generate current template:**
   ```bash
   npm run template
   ```

2. **Send XLSX to chamber** with current restaurants pre-filled

3. **Chamber updates:**
   - Adds new restaurants
   - Updates existing restaurant info  
   - Fills in promotional offers
   - Returns completed XLSX

4. **Import safely with smart matching:**
   ```bash
   npm run import           # One command handles everything
   ```
   - Choose dev or production environment
   - Resolve any name conflicts interactively
   - User visits automatically preserved

5. **Deploy to production** using standard git workflow

### 🗂️ File Management

- **Templates:** Generated in `supabase/data/` (gitignored)
- **Backups:** Stored in `backups/` (gitignored) 
- **Retention:** Last 10 backups kept automatically
- **Security:** All restaurant/user data excluded from git

## 🏗️ Architecture

- **Authentication**: Clerk handles user management
- **Database**: Supabase provides PostgreSQL with real-time features
- **Frontend**: Next.js with server-side rendering
- **Deployment**: Vercel with environment-based configuration
- **Development**: Separate dev/prod environments for safe testing

## 🚀 Production Deployment

### Environment Setup

This project uses separate development and production environments:

- **Development**: `.env.local` (gitignored)
- **Production**: `.env.production` (gitignored)

### Deployment Process

**Standard Git Workflow:**

1. **Develop and test locally:**
   ```bash
   npm run dev                 # Local development server
   npm run backup              # Backup before changes
   npm run template            # Generate data templates
   npm run import              # Import restaurant data safely
   ```

2. **Commit to dev branch:**
   ```bash
   git add .
   git commit -m "Add new restaurants and promotions"
   git push origin dev
   ```

3. **Test on Vercel preview:**
   - Preview deployment automatically created
   - Test with development database first
   - Verify all functionality works

4. **Deploy to production:**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

5. **Production data sync:**
   ```bash
   # Import data to production (includes backup and environment selection)
   npm run import              # Choose production environment
   
   # Generate template from production data if needed
   npm run template            # Choose production in interactive mode
   ```

### Vercel Configuration

**Environment Variables:**
- **Production**: Set in Vercel dashboard for `main` branch
- **Preview**: Set in Vercel dashboard for preview deployments
- **Development**: Use `.env.local` for local development

**Branch Setup:**
- `main` → Production deployment
- `dev` → Preview deployments
- Feature branches → Preview deployments

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Self-hosting questions**: Open an issue on GitHub
- **Hosted service**: Contact michelle@waveformanalytics.com
- **Feature requests**: Submit via GitHub issues

---

**Built with ❤️ for local communities** by [Michelle Weirathmueller](https://waveformanalytics.com)
