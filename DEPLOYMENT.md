# Deployment Guide for Expression Master

This project is a **Vite + React** application. You can deploy it for free using **Vercel** or **Netlify**.

## Prerequisites

**Important**: Your current folder name contains special characters (`&`, `,`) which break the build commands on Windows.
1. Close your code editor.
2. Rename the folder `expression-master_-infix,-prefix-&-postfix-lab` to something simple like `expression-master`.
3. Re-open the project.

---

## Option 1: Deploy with Vercel (Recommended)

Vercel is optimized for frontend frameworks like Vite.

### Method A: Via GitHub (Best)
1. Push this code to a GitHub repository.
2. Go to [Vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** -> **"Project"** and import your GitHub repo.

5. Click **Deploy**.

### Method B: Via CLI
1. Open a terminal in your project folder.
2. Run: `npx vercel`
3. Follow the prompts (Login, confirm settings).
4. When asked about environment variables, say **No**.

---

## Option 2: Deploy with Netlify

### Method A: Drag & Drop (Requires Local Build)
1. Run `npm run build` in your terminal (make sure you renamed the folder first!).
2. This creates a `dist` folder.
3. Go to [Netlify Drop](https://app.netlify.com/drop).
4. Drag the `dist` folder onto the page.
5. (Optional) Go to **Site Settings** -> **Environment Variables** if you have other secrets.

### Method B: Via GitHub
1. Push code to GitHub.
2. Log in to Netlify and click **"Add new site"** -> **"Import an existing project"**.
3. Select GitHub and choose your repo.
4. Under **"Build settings"**, usually:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

6. Click **Deploy**.
