# VoxBridge AI — Next.js 15 Web Application (Frontend)

This is the Next.js 15 Web Application frontend for **VoxBridge AI**, styled with the **Bright Luxury Theme** (Cream canvas, Pure White cards, Deep Maroon CTAs, and Champagne Gold highlights).

---

## 🛠️ Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System, Framer Motion
- **Authentication**: Clerk Auth
- **Database**: MongoDB Atlas (via Mongoose)
- **Media Uploads**: Cloudinary

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env` into `frontend/.env` with your Clerk, MongoDB, and Cloudinary keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 3. Run Dev Server
```bash
npm run dev
```

App will be live at `http://localhost:3000`.

---

## ☁️ Cloud Deployment (Vercel)

1. Import the repository into **Vercel**.
2. Set the Root Directory to `frontend`.
3. Add your environment variables (`CLERK_*`, `MONGODB_URI`, `CLOUDINARY_*`).
4. Click **Deploy**!
