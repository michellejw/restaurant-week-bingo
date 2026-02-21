# Restaurant Week Bingo

A web application that gamifies restaurant week participation through a digital bingo card system.

## Quick Start

```bash
git clone https://github.com/michellejw/restaurant-week-bingo.git
cd restaurant-week-bingo
npm install
# Configure .env.local (see docs/ENVIRONMENT_SETUP.md)
npm run dev
```

Open http://localhost:3000

## Documentation

| Guide | Description |
|-------|-------------|
| [Environment Setup](docs/ENVIRONMENT_SETUP.md) | Full setup guide, architecture overview, troubleshooting |
| [Operations Runbook](docs/OPERATIONS.md) | Seasonal operations (pre-event, during, post-event) |
| [Development Roadmap](docs/ROADMAP.md) | Feature development progress |

---

## Features

- **Secure Authentication** - Clerk-based user management
- **Interactive Map** - OpenStreetMap with restaurant locations
- **Digital Bingo Card** - Updates in real-time as users visit restaurants
- **QR Code Check-ins** - Unique codes for each restaurant
- **Automatic Raffle Entries** - 1 entry per 4 restaurants visited
- **Real-time Statistics** - Visit tracking and progress display
- **Responsive Design** - Works on mobile and desktop
- **User Profiles** - Contact information for prize fulfillment
- **Sponsor Integration** - Showcase local business sponsors
- **Promotions Display** - Restaurant specials shown in map popups

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet with OpenStreetMap
- **Deployment**: Vercel

---

## Hosted Service

**Need this running for your community without the technical setup?**

I offer a fully hosted service that includes:
- Complete setup and configuration
- Custom branding and domain
- Restaurant data import
- Ongoing support and maintenance
- Analytics and reporting
- Automatic backups and security updates

Perfect for chambers of commerce and downtown associations who want "it just works" without managing servers.

**[Contact me for pricing and setup →](mailto:michelle@waveformanalytics.com)**

---

## Self-Hosting Details

### Prerequisites
- Node.js 18+
- Supabase account
- Clerk account
- Vercel account (for deployment)

For full setup instructions including database schema and API keys, see **[docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)**.

### Database Schema

The application uses PostgreSQL via Supabase with these main tables:

- **`restaurants`** - Restaurant information, unique codes, and promotions
- **`visits`** - User check-in tracking
- **`user_stats`** - Cached visit counts and raffle entries
- **`users`** - Contact information for prize fulfillment
- **`sponsors`** - Local business sponsors

Canonical schema history: `supabase/migrations/`

---

## Data Management

### Core Commands

```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run audit                  # Production readiness audit
```

### Restaurant & Sponsor Import

```bash
npm run template               # Generate restaurant Excel template
npm run import                 # Import restaurant data with smart matching
npm run sponsor:template       # Generate sponsor template
npm run sponsor:import         # Import sponsor data
```

### Database Maintenance

```bash
npm run backup                 # Backup dev database
npm run backup:prod            # Backup production database
npm run db:check-consistency   # Check for data inconsistencies
npm run db:fix-user-stats      # Recalculate user statistics

# Schema migrations (recommended)
supabase link --project-ref <dev-project-ref> --password '<db-password>'
supabase migration list
supabase db push
```

### Import Workflow

1. Generate template: `npm run template`
2. Send XLSX to chamber for updates
3. Import with smart matching: `npm run import`
4. Deploy using git workflow

The smart import includes automatic backups, fuzzy matching, conflict resolution, and visit preservation.

---

## Deployment

### Environment Setup

- **Development**: `.env.local` (gitignored)
- **Production**: `.env.production` (gitignored)

### Git Workflow

```bash
# Develop locally
npm run dev

# Push to dev branch
git push origin dev

# Test on Vercel preview, then merge to production
git checkout main && git merge dev && git push origin main
```

Apply and verify database migrations on `dev` first, then repeat on `main`/production.

### Vercel Configuration

- `main` branch → Production deployment
- `dev` branch → Preview deployments
- Feature branches → Preview deployments

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Self-hosting questions**: Open a GitHub issue
- **Hosted service**: michelle@waveformanalytics.com
- **Feature requests**: GitHub issues

---

**Built with ❤️ for local communities** by [Michelle Weirathmueller](https://waveformanalytics.com)
