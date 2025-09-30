# Restaurant Week Bingo 🎲🍴

A modern web application that gamifies restaurant week participation through a digital bingo card system. Perfect for chambers of commerce, downtown associations, and communities looking to boost local restaurant engagement.

**[Live Demo](https://picc-rest-week.waveformanalytics.com)** • **[Hosted Service Available](#-hosted-service)**

## ✨ Features

- 🔐 **Secure Authentication** - Clerk-based user management
- 🗺️ **Interactive Map** - OpenStreetMap with restaurant locations
- 🎯 **Digital Bingo Card** - Updates in real-time as users visit restaurants  
- 📱 **QR Code Check-ins** - Unique codes for each restaurant
- 🎟️ **Automatic Raffle Entries** - 1 entry per 4 restaurants visited
- 📊 **Real-time Statistics** - Visit tracking and progress display
- 🎨 **Responsive Design** - Works perfectly on mobile and desktop
- 👤 **User Profiles** - Contact information for prize fulfillment
- 🏪 **Sponsor Integration** - Showcase local business sponsors

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
- ✅ **Restaurant data import and QR code generation**
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

- **`restaurants`** - Restaurant information and unique codes
- **`visits`** - User check-in tracking  
- **`user_stats`** - Cached visit counts and raffle entries
- **`users`** - Contact information for prize fulfillment
- **`sponsors`** - Local business sponsors

Complete schema available in [`supabase/updated_schema.sql`](supabase/updated_schema.sql).

## 🏗️ Architecture

- **Authentication**: Clerk handles user management
- **Database**: Supabase provides PostgreSQL with real-time features
- **Frontend**: Next.js with server-side rendering
- **Deployment**: Vercel with environment-based configuration
- **Development**: Separate dev/prod environments for safe testing

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
