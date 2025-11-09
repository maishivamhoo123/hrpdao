# 🌐 Social Platform — React + Vite + Supabase + Web3

A modern, full-featured **social network** with posts, communities, real-time chat, events, donations, services marketplace, and **Web3 crypto wallet integration** — all powered by **React + Vite + Supabase**.

---

## 🚀 Tech Stack

| Category | Technology |
|-----------|-------------|
| Frontend | React 18 + Vite |
| Backend | Supabase (Auth, DB, Realtime, Storage) |
| Styling | Tailwind CSS |
| Localization | i18next (multi-language support) |
| Web3 | MetaMask / WalletConnect |
| Security | RLS (Row-Level Security) |
| Hosting | Vercel / Netlify |

---

## 🧭 Features

- 🔐 **Supabase Auth** (email, OAuth, wallet login)
- 💬 **Realtime chat** & notifications
- 🌍 **Multi-language support** (EN, UA, etc.)
- 💸 **Crypto donations** via MetaMask / WalletConnect
- ⚙️ **User privacy** with Row-Level Security (RLS)
- 🧩 **Communities, posts, services, and events**
- 📱 **Responsive UI** built with Tailwind CSS
- 🧠 **Modular structure** for scalability

---

## 📁 Project Structure

<details>
<summary>Click to view full structure</summary>

/hrpdao
├── node_modules/
├── public/
│ └── favicon.ico
├── src/
│ ├── assets/ # Images, fonts, static assets
│ ├── components/ # Reusable UI components
│ │ ├── Feed.jsx
│ │ ├── Signup.jsx
│ │ ├── PostForm.jsx
│ │ ├── Chat.jsx
│ │ ├── Community.jsx
│ │ ├── Country.jsx
│ │ ├── Notifications.jsx
│ │ ├── Profile.jsx
│ │ ├── Services.jsx
│ │ ├── Settings.jsx
│ │ ├── CountryDetail.jsx
│ │ ├── Sidebar.jsx
│ │ ├── Navbar.jsx
│ │ ├── WalletConnect.jsx
│ │ ├── DonationSection.jsx
│ │ ├── Events.jsx
│ │ ├── ComplaintForm.jsx
│ │ ├── AddService.jsx
│ │ └── Message.jsx
│ ├── pages/
│ │ ├── Terms.jsx
│ │ └── CommunityDetail.jsx
│ ├── utils/
│ │ ├── supabase.js
│ │ ├── web3.js
│ │ └── countries.js
│ ├── App.jsx
│ ├── i18n.js
│ ├── main.jsx
│ └── index.css
├── supabase/
│ ├── migrations/
│ │ └── 001_init_tables.sql
│ └── seed.sql
├── .env.example
├── .gitignore
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── index.html

yaml
Copy code

</details>

---

## ⚡ Quick Start

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/social-platform.git
cd social-platform
2️⃣ Install Dependencies
bash
Copy code
npm install
3️⃣ Setup Environment Variables
bash
Copy code
cp .env.example .env
Edit .env:

ini
Copy code
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key-here
⚠️ Never commit .env — .env.example is safe to share.

🧩 Supabase Setup
Step 1: Create a Supabase Project
Go to https://app.supabase.com

Click New Project

Add:

Project name: social-platform-dev

Database password

Choose region

Wait 2–3 minutes for setup

Step 2: Get Keys
Go to Settings → API and copy:

Project URL → VITE_SUPABASE_URL

anon public key → VITE_SUPABASE_KEY

🚫 Never use service_role key in frontend

🧱 Database Setup
Option 1: Automatic (Recommended)
bash
Copy code
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db reset
Option 2: Manual
Open Supabase → SQL Editor

Paste supabase/migrations/001_init_tables.sql

Run → ✅ Schema setup complete!

🧠 Developer Scripts
Command	Description
npm run dev	Start dev server
npm run build	Build for production
npm run preview	Preview production build
npm run db:reset	Reset DB + seed data

🚀 Deployment
Recommended:
Vercel

Netlify

Add in Environment Variables:

nginx
Copy code
VITE_SUPABASE_URL
VITE_SUPABASE_KEY
🔐 Security
.env is gitignored

Only anon key used client-side

RLS (Row Level Security) protects user data

Each developer has isolated DB project

🤝 Contributing
We welcome contributions from everyone 💙

Steps to Contribute
Fork the repo

Create a new branch:

bash
Copy code
git checkout -b feature/your-feature-name
Commit your changes:

bash
Copy code
git commit -m "Add your feature"
Push to your fork:

bash
Copy code
git push origin feature/your-feature-name
Open a Pull Request 🎉

Guidelines
Use clear commit messages

Keep PRs small & focused

Follow existing code style

Test before submitting

🧑‍💻 For Developers
Run supabase db reset for fresh schema + seed data

Migrations are versioned for collaboration

Test data includes: users, posts, chats, and events

Wallet: MetaMask only (no private keys)

📚 Resources
Supabase Docs

Vite Docs

Tailwind CSS Docs

i18next Docs

Ethers.js Docs