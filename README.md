# 🍽️ Family Meal Planner

A private, real‑time meal planning app for families. Plan weekly meals, manage your recipe collection, and generate a consolidated shopping list – all in one place.

## ✨ Features

- 🔐 **Private & secure** – Only approved users can sign in (admin creates accounts).
- 👥 **Family sync** – Invite one family member to share the same meal plan and shopping list in real time.
- 📚 **Full meal management** – Add, edit, delete meals with image, portions, calories, prep time.
- 🗓️ **Auto‑weekly planner** – Randomly generates breakfast, lunch & dinner for the week (admin only).
- 🛒 **Smart shopping list** – Automatically combines ingredients from the week’s meals. Check off items as you shop.
- 📱 **Mobile friendly & installable** – Works like a native app on your phone (PWA).
- 🎨 **Beautiful design** – Warm, culinary‑inspired theme with responsive layout.

## 🛠️ Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS, custom Stitch design system
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Hosting**: Vercel
- **PWA**: Next.js PWA plugin – installable on Android/iOS

## 🚀 Getting Started (for local development)

### Prerequisites
- Node.js (v18+)
- Git
- Supabase account (free tier)

### Installation

1. Clone the repo  
   ```bash
   git clone https://github.com/Emma-TE/family-meals.git
   cd family-meals
Install dependencies

bash
npm install
Set up environment variables
Create a .env.local file in the root:

env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
Run the development server

bash
# 🍽️ Family Meal Planner

A private, real‑time meal planning app for families. Plan weekly meals, manage your recipe collection, and generate a consolidated shopping list – all in one place.

## ✨ Features

- 🔐 **Private & secure** – Only approved users can sign in (admin creates accounts).
- 👥 **Family sync** – Invite one family member to share the same meal plan and shopping list in real time.
- 📚 **Full meal management** – Add, edit, delete meals with image, portions, calories, prep time.
- 🗓️ **Auto‑weekly planner** – Randomly generates breakfast, lunch & dinner for the week (admin only).
- 🛒 **Smart shopping list** – Automatically combines ingredients from the week’s meals. Check off items as you shop.
- 📱 **Mobile friendly & installable** – Works like a native app on your phone (PWA).
- 🎨 **Beautiful design** – Warm, culinary‑inspired theme with responsive layout.

## 🛠️ Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS, custom Stitch design system
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Hosting**: Vercel
- **PWA**: Next.js PWA plugin – installable on Android/iOS

## 🚀 Getting Started (for local development)

### Prerequisites
- Node.js (v18+)
- Git
- Supabase account (free tier)

### Installation

1. Clone the repo  
   ```bash
   git clone https://github.com/Emma-TE/family-meals.git
   cd family-meals
Install dependencies

bash
npm install
Set up environment variables
Create a .env.local file in the root:

env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
Run the development server

bash
npm run dev
Open http://localhost:3000

📦 Deployment
The project is configured for Vercel. Push to GitHub → Vercel auto‑deploys.

Environment variables must be set in Vercel Dashboard under Settings → Environment Variables (mark the ANON_KEY as Sensitive).

📄 License
Private project – for personal family use.