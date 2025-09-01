# 📚 Colorado School Data Dashboard - GitHub Deployment Guide

## 🚀 One-Time Setup (5 minutes total)

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** button (top-right) → **"New repository"**
3. Repository name: `colorado-school-data-dashboard` (or your preferred name)
4. Make sure it's **Public** (required for free GitHub Pages)
5. ✅ **Do NOT** initialize with README, .gitignore, or license
6. Click **"Create repository"**

### Step 2: Upload Your Files
**Option A: Drag & Drop (Easiest)**
1. On your new repository page, click **"uploading an existing file"**
2. **Drag your entire project folder** into the browser window
3. GitHub will upload all files automatically
4. Scroll down and click **"Commit changes"**

**Option B: GitHub Desktop (Recommended for updates)**
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Clone your repository locally
3. Copy all your project files into the cloned folder
4. Commit and push changes

### Step 3: Enable GitHub Pages
1. In your repository, go to **Settings** (top tab)
2. Scroll down to **"Pages"** in left sidebar
3. Under **"Source"**, select **"GitHub Actions"**
4. That's it! No other settings needed.

### Step 4: Update Repository Name (Important!)
**If you named your repository something different than `colorado-school-data-dashboard`:**
1. Edit the file `vite.config.js`
2. Change line 9: `base: '/YOUR-REPOSITORY-NAME/',`
3. Save and upload the updated file

---

## 🎉 Your Site Will Be Live At:
```
https://YOUR-GITHUB-USERNAME.github.io/colorado-school-data-dashboard/
```
*(Replace with your actual GitHub username and repository name)*

**First deployment takes 2-5 minutes. Check the "Actions" tab to see progress.**

---

## 🔄 Making Updates (30 seconds each time)

### Super Simple Updates:
1. **Edit files locally** on your computer
2. **Upload changed files** to GitHub:
   - Drag & drop: Go to repository → click file → "Edit" → paste new content
   - GitHub Desktop: Commit → Push
3. **Automatic deployment happens** - no additional steps!
4. **Check your live site** in 2-3 minutes

### Bulk Updates:
- Use GitHub Desktop for multiple file changes
- Or zip your entire updated project and upload via web interface

---

## 🛠️ Testing Before Deployment

Run this command in your project folder to test locally:
```bash
npm run test-build
```
This builds and previews your site exactly as it will appear on GitHub Pages.

---

## 📋 Troubleshooting

### ❌ "Page Not Found" Error
- Check that your repository name matches the `base` setting in `vite.config.js`
- Ensure GitHub Pages is set to "GitHub Actions" not "Deploy from branch"

### ❌ "Build Failed" in Actions Tab
- Usually means a file is missing or there's a syntax error
- Check the Actions tab → click the failed run → see error details
- Most common: forgot to run `npm install` locally before uploading

### ❌ Data Files Not Loading
- Ensure all files in the `public/` folder are uploaded
- Check that file paths start with `/` (e.g., `/district_data_complete.json`)

### ❌ Site Looks Broken
- Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
- Check the browser console for errors (F12)

---

## 🔧 Advanced Options

### Custom Domain
1. In repository Settings → Pages
2. Add your custom domain
3. GitHub will generate SSL certificate automatically

### Private Repository
- Requires GitHub Pro ($4/month)
- Same process, but repository can be private

### Download Versions
- Users can download specific versions from "Releases" tab
- Create releases for major updates

---

## 📞 Need Help?

If anything goes wrong:
1. **Check the "Actions" tab** in your repository for build errors
2. **Compare file structure** - make sure all folders uploaded correctly
3. **Test locally first** using `npm run dev` to ensure it works
4. **Repository name must match** the base path in vite.config.js

---

## 🎯 What Happens Automatically

Every time you upload changes:
1. ✅ **GitHub Actions detects** the changes
2. ✅ **Installs dependencies** (npm packages)
3. ✅ **Builds optimized version** of your app
4. ✅ **Deploys to GitHub Pages** automatically
5. ✅ **Your live site updates** within 2-5 minutes

**You never need to manually build, deploy, or manage servers!**