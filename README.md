# 🍽️ Family Meal Planner

A private, real‑time meal planning app for families. Plan weekly meals, manage your recipe collection, and generate a consolidated shopping list – all in one place.

## ✨ Features

- 🔐 **Private & secure** – Only approved users can sign in; access is split into admin and viewer roles, enforced by Postgres Row‑Level Security.
- 👥 **Family sync** – One shared meal plan and shopping list, updated in real time.
- 📚 **Full meal management** – Add, edit, delete meals with photo, portions, calories, and prep time (admin only).
- 🗓️ **Auto‑weekly planner** – Randomly generates breakfast, lunch & dinner for the week (admin only).
- 🛒 **Smart shopping list** – Combines ingredients from the week's meals; check items off as you shop.
- 📱 **Installable PWA** – Add to your home screen on Android/iOS, with offline support for the app shell.
- 🎨 **Beautiful design** – Warm, culinary‑inspired "Stitch" theme with a responsive layout.

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router, Server Components), React, CSS Modules with the custom Stitch design system
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Toasts**: Sonner
- **PWA**: Hand‑rolled service worker + manifest (no plugin)
- **Hosting**: Vercel

## 🚀 Getting Started (local development)

### Prerequisites

- Node.js (v18+)
- A Supabase account (free tier) with the schema below

### Installation

```bash
git clone https://github.com/Emma-TE/family-meals.git
cd family-meals
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
```

`.env.local` is gitignored – never commit real credentials.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🗄️ Supabase Setup

Create the following in your Supabase project:

- **Tables**: `meals` (name, category, calories, portion, prep_time, image_url, ingredients), `weekly_plans` (week_start with a unique constraint, plus `<day>_<meal_time>` meal id columns), `user_roles` (user_id, role).
- **Storage bucket**: `meal-images` for uploaded meal photos (public).
- **Row‑Level Security** (the real authorization boundary – client‑side checks are only UI niceties):
  - `user_roles`: readable by any authenticated user.
  - `meals` & `weekly_plans`: readable by any authenticated user; inserts/updates/deletes limited to admins (`role = 'admin'` in `user_roles`).
- **Auth**: sign‑ups should be closed or invite‑only so only your family can create accounts.

## 📦 Deployment

The project is configured for Vercel. Push to GitHub and Vercel auto‑deploys. Set both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in **Vercel → Settings → Environment Variables** (mark the ANON_KEY as Sensitive).

## 🖼️ PWA Icons

The icons in `public/icons/` are generated placeholders. To regenerate them (or rebuild after replacing the artwork):

```bash
npm run icons
```

## 📄 License

Private project – for personal family use.
