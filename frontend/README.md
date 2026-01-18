# Scholarship Finder Frontend

A modern, sleek frontend for the Scholarship Finder application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 Modern, professional UI design
- 🔐 Auth0 authentication integration
- 📱 Responsive design (mobile-friendly)
- 🎯 Dashboard with scholarship matching
- 👤 User profile management
- 📊 Application tracking
- 🔍 Search and filter functionality

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Auth0** - Authentication
- **Lucide React** - Icons

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the `frontend` directory:
   ```bash
   touch .env.local
   ```

   Add the following variables to `.env.local`:
   ```env
   # Auth0 Configuration
   # Generate AUTH0_SECRET with: openssl rand -hex 32
   AUTH0_SECRET='your-generated-secret-here'
   AUTH0_BASE_URL='http://localhost:3000'
   AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
   AUTH0_CLIENT_ID='your-client-id'
   AUTH0_CLIENT_SECRET='your-client-secret'
   
   # Supabase Configuration (optional for now)
   NEXT_PUBLIC_SUPABASE_URL='https://your-project.supabase.co'
   NEXT_PUBLIC_SUPABASE_ANON_KEY='your-supabase-anon-key'
   ```

   **Required variables:**
   - `AUTH0_SECRET` - Generate with `openssl rand -hex 32` (or use: `a856cdfc02f911c8a33a74c41209a4e7e340bc07fdfd28d534997aaef9746d6d`)
   - `AUTH0_BASE_URL` - Your app URL (e.g., `http://localhost:3000`)
   - `AUTH0_ISSUER_BASE_URL` - Your Auth0 domain (e.g., `https://your-tenant.auth0.com`)
   - `AUTH0_CLIENT_ID` - From Auth0 dashboard
   - `AUTH0_CLIENT_SECRET` - From Auth0 dashboard
   
   **Optional (for full functionality):**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   
   **Note:** The landing page will work without Auth0 configured, but dashboard and profile pages require Auth0 setup.

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/        # Auth0 handlers
│   │   ├── profile/     # Profile API
│   │   └── scholarships/ # Scholarships API
│   ├── dashboard/       # Dashboard page
│   ├── profile/         # Profile page
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   └── globals.css      # Global styles
├── public/              # Static assets
└── package.json
```

## Pages

- **Landing Page** (`/`) - Public homepage with features and CTA
- **Dashboard** (`/dashboard`) - Main dashboard showing matched scholarships
- **Profile** (`/profile`) - User profile setup and editing

## API Routes

- `GET /api/auth/login` - Auth0 login
- `GET /api/auth/logout` - Auth0 logout
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/scholarships` - Get user's scholarships
- `PUT /api/scholarships/[id]/status` - Update application status

## Design System

### Colors
- Primary: Blue (`primary-600`)
- Success: Green
- Warning: Yellow
- Error: Red

### Components
- `btn-primary` - Primary button
- `btn-secondary` - Secondary button
- `card` - Card container
- `input-field` - Form input
- `badge` - Status badge

## Next Steps

1. Connect to your Supabase database
2. Set up Auth0 application
3. Configure environment variables
4. Test authentication flow
5. Test API endpoints

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Follow Next.js deployment guides
- Ensure environment variables are set
- Configure Auth0 callback URLs for production
