# grantly - AI-Powered Scholarship Finder

A modern, sleek web application that uses AI to match college students with scholarships tailored to their unique profiles.

## 🚀 Features

- 🎨 Modern, minimalist UI with interactive dot shader background
- 🔐 Auth0 authentication integration
- 📱 Fully responsive design (mobile-friendly)
- 🎯 AI-powered scholarship matching
- 👤 User profile management
- 📊 Application tracking dashboard
- 🔍 Search and filter functionality
- ⚡ Real-time updates

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Auth0** - Authentication
- **React Three Fiber** - 3D graphics (dot shader background)
- **Lucide React** - Icons

### Backend (To be integrated)
- **MongoDB Atlas** - Database (to be added)
- **Gumloop** - Workflow automation (to be added)

## 📁 Project Structure

```
.
├── frontend/              # Next.js application
│   ├── app/              # App router pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Auth0 account
- MongoDB Atlas account (for database)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ishaanbahl6200/scholarship-scraper.git
   cd scholarship-scraper
   ```

2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the `frontend` directory:
   ```env
   # Auth0 Configuration
   AUTH0_SECRET='your-generated-secret'
   AUTH0_BASE_URL='http://localhost:3000'
   AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
   AUTH0_CLIENT_ID='your-client-id'
   AUTH0_CLIENT_SECRET='your-client-secret'
   
   # MongoDB (to be added)
   MONGODB_URI='your-mongodb-connection-string'
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Auth0 Setup

#### Initial Setup (Local Development)

1. **Create an Auth0 account** at [auth0.com](https://auth0.com)
2. **Create a new application:**
   - Go to Applications → Create Application
   - Choose "Regular Web Application"
   - Click "Create"
3. **Get your credentials:**
   - **Domain**: Found in the "Settings" tab (e.g., `dev-vxvtfq5nmj6gloyn.us.auth0.com`)
   - **Client ID**: Found in the "Settings" tab
   - **Client Secret**: Click "Show" to reveal (save this securely!)
4. **Configure callback URLs** (we'll add Vercel URLs after deployment):
   - Go to "Settings" → "Application URIs"
   - **Allowed Callback URLs**: 
     ```
     http://localhost:3000/api/auth/callback
     ```
   - **Allowed Logout URLs**: 
     ```
     http://localhost:3000
     ```
   - **Allowed Web Origins**: 
     ```
     http://localhost:3000
     ```
   - Click "Save Changes"
5. **Generate AUTH0_SECRET:**
   ```bash
   openssl rand -hex 32
   ```
6. **Add to `.env.local`** in the `frontend` directory:
   ```env
   AUTH0_SECRET='your-generated-secret-here'
   AUTH0_BASE_URL='http://localhost:3000'
   AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
   AUTH0_CLIENT_ID='your-client-id'
   AUTH0_CLIENT_SECRET='your-client-secret'
   ```

### MongoDB Setup (To be added)

MongoDB integration will be added by the backend team.

## 📦 Deployment

### Vercel (Recommended)

#### Step 1: Initial Deployment

1. **Push your code to GitHub**
2. **Import project in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
3. **Configure project settings:**
   - **Root Directory**: Set to `src/frontend` (or `frontend` depending on your structure)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
4. **Add environment variables** (use your local values for now):
   - Go to "Settings" → "Environment Variables"
   - Add each variable:
     - `AUTH0_SECRET` - Your generated secret
     - `AUTH0_BASE_URL` - **Leave as `http://localhost:3000` for now** (we'll update after first deploy)
     - `AUTH0_ISSUER_BASE_URL` - Your Auth0 domain (e.g., `https://dev-vxvtfq5nmj6gloyn.us.auth0.com`)
     - `AUTH0_CLIENT_ID` - Your Auth0 client ID
     - `AUTH0_CLIENT_SECRET` - Your Auth0 client secret
5. **Deploy**: Click "Deploy"

#### Step 2: Configure Auth0 for Production (After First Deploy)

After your first successful deployment, you'll get a **Project URL** (not the deployment URL). This is your main production URL.

**Finding your Project URL:**
- Go to Vercel Dashboard → Your Project
- Look for the **"Domains"** section - this shows your **Project URL**
- If you have a custom domain set up, use that (e.g., `grantly-scholarships.vercel.app`)
- Otherwise, use the default project URL (e.g., `https://scholarship-scraper.vercel.app`)
- ⚠️ **Don't use** the deployment-specific URLs like `https://scholarship-scraper-5hmrnhnn3-ishaans-projects-9adbddf4.vercel.app`

1. **Update Auth0 Application Settings:**
   - Go to Auth0 Dashboard → Applications → Your Application → Settings
   - **Allowed Callback URLs** (use your **Project URL** from Domains section):
     ```
     http://localhost:3000/api/auth/callback, https://grantly-scholarships.vercel.app/api/auth/callback
     ```
   - **Allowed Logout URLs**:
     ```
     http://localhost:3000, https://grantly-scholarships.vercel.app
     ```
   - **Allowed Web Origins**:
     ```
     http://localhost:3000, https://grantly-scholarships.vercel.app
     ```
   - Click "Save Changes"

2. **Update Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Find `AUTH0_BASE_URL` and update it to your **Project URL** (from Domains section):
     ```
     https://grantly-scholarships.vercel.app
     ```
   - Make sure it's set for **Production** environment
   - Click "Save"

**Note:** If you want to test preview deployments (PR previews), you can add a wildcard pattern to Auth0:
```
https://*.vercel.app/api/auth/callback
```
But for production, always use your specific Project URL.

3. **Redeploy:**
   - Go to "Deployments" tab
   - Click the "..." menu on the latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger auto-deployment

#### Step 3: Verify Authentication Works

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Click "Get Started" or the user icon
3. You should be redirected to Auth0 login
4. After logging in, you should be redirected back to your app

**Troubleshooting:**
- If you see "redirect_uri_mismatch" error, double-check your Auth0 callback URLs
- If login works but redirect fails, check `AUTH0_BASE_URL` in Vercel
- Make sure all environment variables are set for the correct environment (Production, Preview, Development)

The project is configured with `vercel.json` for automatic deployment.

## 🎨 Features Overview

### Landing Page
- Sleek, minimalist design
- Interactive dot shader background
- Responsive hero section
- Feature highlights

### Dashboard
- View matched scholarships
- Track application status
- Search and filter scholarships
- Statistics overview

### Profile Management
- Complete profile setup
- Academic information
- Demographics
- Interests and extracurriculars
- Scholarship preferences

## 🔐 Authentication

The app uses Auth0 for authentication:
- Secure login/logout
- User session management
- Protected API routes
- User profile integration

## 📝 API Routes

- `GET /api/auth/login` - Auth0 login
- `GET /api/auth/logout` - Auth0 logout
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/scholarships` - Get user's scholarships
- `PUT /api/scholarships/[id]/status` - Update application status

## 🚧 Coming Soon

- MongoDB database integration
- Gumloop workflow automation
- Weekly scholarship matching
- Email notifications
- Application deadline reminders

## 🤝 Contributing

This project is part of the Gumloop Challenge. Backend integration (MongoDB) will be added by the team.

## 📄 License

© 2024 grantly. All rights reserved.
