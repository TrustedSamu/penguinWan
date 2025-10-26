# 🚀 Deployment Guide - Penguin Video Studio

## ⚠️ Important Vercel Limitations

This project has **critical limitations** on Vercel:

### ❌ Not Suitable for Vercel (Current Setup)

1. **File Storage**: Vercel doesn't support persistent file storage
   - `uploads/` and `outputs/` directories won't work
   - Files are deleted after each serverless function execution
   
2. **Long-running Tasks**: Video generation can take 1-5 minutes
   - Vercel functions timeout after 10 seconds (Hobby) or 60 seconds (Pro)
   - This will cause failures

3. **Serverless Architecture**: Express apps need special configuration

---

## ✅ Better Deployment Options

### Option 1: **Railway** (Recommended) 🚂
- **Free tier available**
- Supports persistent file storage
- Can run Node.js apps directly
- Environment variables easy to configure
- **Perfect for this project!**

### Option 2: **Render** 🌐
- **Free tier available**
- Persistent file storage
- Easy environment variable setup
- Good for Node.js apps

### Option 3: **Heroku** 💜
- **Paid only now** (no free tier)
- Supports persistent file storage
- Easy deployment

### Option 4: **Vercel + External Storage** (Advanced)
- Use Vercel for hosting the frontend
- Connect to external storage (AWS S3, Cloudinary, etc.)
- More complex setup

---

## 🚀 Quick Deploy to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Deploy**:
   ```bash
   railway init
   railway up
   ```

4. **Set Environment Variables** in Railway dashboard:
   - `DASHSCOPE_API_KEY` (your API key)
   - `DASHSCOPE_REGION` (singapore or beijing)
   - `PORT` (Railway will set this automatically)
   - `NODE_ENV=production`
   - `CORS_ORIGIN` (your Railway app URL)

5. **Done!** Your app will be live

---

## 🌐 Quick Deploy to Render

1. **Push to GitHub** (already done!)
2. **Go to** https://render.com
3. **Create New Web Service**
4. **Connect your GitHub repo** (penguinWan)
5. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
6. **Add Environment Variables**:
   - `DASHSCOPE_API_KEY`
   - `DASHSCOPE_REGION`
   - `CORS_ORIGIN`
7. **Deploy!**

---

## 📝 Required Changes for Vercel (If You Still Want to Try)

To make this work on Vercel, you would need to:

1. **Remove file uploads** - Don't save files locally
2. **Use external storage** (AWS S3, Cloudinary, etc.)
3. **Modify the server** to use serverless functions
4. **Handle async video generation** differently

This would require significant code changes.

---

## 🎯 Recommendation

**Use Railway or Render** - they're perfect for this type of application and much easier to set up!

Both have free tiers and will handle your file uploads and long-running video generation tasks without any issues.

---

## 🔧 Local Testing

For local testing:
```bash
npm install
# Create .env file with your API key
npm start
# Visit http://localhost:3000
```

