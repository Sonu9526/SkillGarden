# Deployment Guide - SkillGarden

This guide details the steps to deploy the **SkillGarden** Next.js application to production (Vercel) using a serverless PostgreSQL database (Neon.tech).

---

## 1. Prerequisites
- A [GitHub](https://github.com) account.
- A [Vercel](https://vercel.com) account.
- A [Neon](https://neon.tech) account (or any other PostgreSQL database provider like Supabase/Aiven).

---

## 2. Setting Up the Production Database (Neon.tech)
SQLite files are not suitable for serverless platforms like Vercel because they are read-only and ephemeral. We use a cloud PostgreSQL database instead:

1. Sign up/Log in to [Neon](https://neon.tech).
2. Create a new project named `skillgarden`.
3. Choose **PostgreSQL** as the database version and select your preferred region.
4. Copy the connection string provided in your Neon dashboard (it should look like `postgresql://<user>:<password>@<host>/neondb?sslmode=require`).
5. Save this connection string; it will be your `DATABASE_URL` environment variable.

---

## 3. Deploying to Vercel
Vercel is the recommended hosting platform for Next.js applications:

1. Push your local project to a repository on **GitHub**.
2. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Import your GitHub repository.
4. Expand the **Environment Variables** section and add the following keys:
   - `DATABASE_URL`: Your connection string from Neon.
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `YOUTUBE_API_KEY`: Your YouTube API v3 Key.
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Client ID (if using Google Login).
5. Leave the Build Command and Install Command as default. (Next.js will automatically detect the custom postinstall and build scripts in `package.json` to generate the database client).
6. Click **Deploy**.

---

## 4. Setting Up the Database Schema (Prisma Migration)
Once your Vercel project is deployed, you must push the schema to your cloud database:

1. Install the Prisma CLI globally or run it via npx:
   ```bash
   npx prisma db push
   ```
   *(Note: Ensure your local `.env` has the `DATABASE_URL` pointing to your Neon connection string, or set the variable in your terminal before running this command).*

2. This will construct all the required tables (`User`, `Skill`, `Hive`, `Comment`, `Reaction`, `Notification`, etc.) in your remote database.

---

## 5. Security & Maintenance
- **Environment Variables**: Never commit `.env` files containing raw API keys to public repositories. Set them inside the Vercel dashboard.
- **YouTube API & Gemini Fallbacks**: If API keys are not supplied or fail to connect, the application will automatically fall back to direct YouTube search queries and responsive mock AI mentor text to maintain a functional experience.
