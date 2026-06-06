# Hisab — Personal & Family Money Tracker

Track **expenses**, **income**, **cash**, **bank**, and **investments** in INR. Each family member has a **separate login**. Split bills with friends by name (no login for them) and **mark paid** with cash or bank.

## Features

- Separate accounts per family member (email sign-up)
- Cash, bank, and investment accounts
- Expense, income, and transfers (ATM, bank deposit, investment moves)
- **Split expense** — add names and amounts owed to you
- **Paid — owed** — paid by bank, they return later; mark paid when received
- Dashboard: net worth, cash, bank, investments, pending from others
- Mobile-friendly PWA (Add to Home Screen on phone)

## Setup (one time)

### 1. Supabase (free database + auth)

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → paste and run the full contents of `supabase/schema.sql`
3. Go to **Authentication → Providers** → enable **Email**
4. Under **Authentication → URL Configuration**, set:
   - Site URL: your Vercel URL (or `http://localhost:3000` for local)
   - Redirect URLs: same URL + `http://localhost:3000/**`
5. Copy **Project URL** and **anon public key** from **Settings → API**

### 2. Local run

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up each family member with a **unique username** (no email needed).

In Supabase **Authentication → Sign In / Providers → Email**, turn **off** “Confirm email” so usernames work without a real inbox.

### 3. Deploy free on Vercel

1. Push this folder to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your `https://your-app.vercel.app`
4. Deploy, then update Supabase **Site URL** and **Redirect URLs** to your Vercel URL

### 4. Install on phone

Open your deployed URL in Chrome/Safari → **Add to Home Screen**.

## How to use

1. **Accounts** — Add cash (wallet), bank, and investment accounts with opening balances.
2. **Add → Expense** — Record spending. Enable **Split** to list who owes you and your share.
3. **Add → Paid — owed** — You paid someone; they will return money later.
4. **Owed** tab — When paid, **Mark paid** and choose **Cash** or **Bank**.
5. **Add → Transfer** — ATM withdrawal (bank → cash), or move money to investment.
6. **Investments** — Update invested amount and current value when prices change.

## Tech stack

- Next.js 15, TypeScript, Tailwind CSS
- Supabase (PostgreSQL + Auth + Row Level Security)
- Deploy: Vercel (free tier)
