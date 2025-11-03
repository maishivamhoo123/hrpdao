# Social Platform – React + Vite + Supabase + Web3

A modern social network with posts, communities, real-time chat, services marketplace, events, donations, crypto wallet integration, and multi-language support.

---

## Features
- **React 18** + **Vite** (fast HMR)
- **Supabase**: Auth, Realtime DB, Storage
- **Tailwind CSS** (responsive, utility-first)
- **i18next** (multi-language: EN, UA, etc.)
- **MetaMask / WalletConnect** (Web3 login & donations)
- **Row Level Security (RLS)** for data privacy
- **Realtime**: chat, notifications, typing indicators

---

## Project Structure

/hrpdao
├── node_modules/               # Project dependencies
├── public/                     # Static assets (optional)
│   └── favicon.ico             # Site icon (if available)
├── src/                        # Source code
│   ├── assets/                 # Static resources (images, fonts)
│   ├── components/             # React components
│   │   ├── Feed.jsx            # News feed component
│   │   ├── Signup.jsx          # Registration/login page component
│   │   ├── PostForm.jsx        # Post creation component
│   │   ├── Chat.jsx            # Chat component
│   │   ├── Community.jsx       # Community creation component
│   │   ├── Country.jsx         # All countries list component
│   │   ├── Notifications.jsx   # Notifications component ?
│   │   ├── Profile.jsx         # User profile component
│   │   ├── Services.jsx        # Services component
│   │   ├── Settings.jsx        # Settings component
│   │   ├── CountryDetail.jsx   # Individual country component
│   │   ├── Sidebar.jsx         # Menu component
│   │   ├── LanguageSelector.jsx# Language selection component
│   │   ├── WalletConnect.jsx   # Crypto wallet connection component
│   │   ├── ComplaintForm.jsx   # Complaint/suggestion component
│   │   ├── DonationSection.jsx # Donations component
│   │   ├── SocialFeed.jsx      # Social network feed component
│   │   ├── ServiceDetails.jsx  # Services details component
│   │   ├── AddService.jsx      # Services adding component
│   │   ├── Message.jsx         # Messages component
│   │   ├── Events.jsx          # Community events component
│   │   ├── Navbar.jsx          # Navigation panel component
│   ├── pages/                  # Pages
│   │   ├── Terms.jsx           # Terms and policy page
│   │   ├── CommunityDetail.jsx # Community page
│   │
│   ├── utils/                  # Utilities
│   │   ├── supabase.js         # Supabase configuration
│   │   ├── web3.js             # Web3 configuration (MetaMask)
│   │   └── countries.js        # Complete list of all world countries
│   ├── App.jsx                 # Main component with routing
│   ├── index.css               # Tailwind CSS styles
│   ├── main.jsx                # React entry point
│   └── i18n.js                 # Localization setup (i18next)
├── .env                        # Environment variables (Supabase URL and key)
├── .gitignore                  # Git ignored files
├── package.json                # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.js              # Vite configuration
└── index.html                  # Home page


Quick Start (For New Developers)

Clone the repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
Install dependencies
npm install
Set up environment variables
cp .env.example .env

Open .env and replace with your Supabase project values:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key-here
Setting Up Supabase (Required)
Each developer must create their own Supabase project
→ Same schema, different data → no conflicts
Step 1: Create Supabase Project

Go to https://app.supabase.com
Click "New Project"
Fill:

Project name (e.g., social-app-dev)
Database password
Region


Wait ~2 minutes

Step 2: Get Keys

Go to Settings → API
Copy:

Project URL → VITE_SUPABASE_URL
anon public key → VITE_SUPABASE_KEY



Never use service_role key in frontend
Database Setup (Same Schema for All)
Option 1: Automatic (Recommended)
Install Supabase CLI
npm install -g supabase
Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF
Reset DB with full schema + test data
supabase db reset
Option 2: Manual

Open Supabase → SQL Editor
Paste content from:
supabase/migrations/001_init_tables.sql
Run

Run the App
npm run dev
Open: http://localhost:5173
Environment Variables (.env.example)
.env.example — Copy to .env and fill YOUR values
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key-here
Never commit .env
.env.example is safe to share
Database Schema

Full schema in: supabase/migrations/001_init_tables.sql
Test data in: supabase/seed.sql
Tables: users, posts, chats, communities, services, events, etc.
RLS policies for privacy
Indexes for performance

Scripts
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview build
npm run db:reset   # Reset DB + seed data
Deployment

Vercel (recommended)
Netlify

Add in project settings:

VITE_SUPABASE_URL
VITE_SUPABASE_KEY

Security

.env is in .gitignore
Only anon key used in frontend
Isolated DB per developer
RLS protects user data

For Developers

Use supabase db reset to get fresh DB with test data
All migrations are versioned
Seed includes: users, posts, chats, events
Wallet: MetaMask only (no private keys)

Need Help?

Open an issue
Supabase Docs: https://supabase.com/docs
Vite Docs: https://vitejs.dev