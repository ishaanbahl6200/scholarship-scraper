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

1. Create an Auth0 account at [auth0.com](https://auth0.com)
2. Create a new application (Regular Web Application)
3. Configure callback URLs:
   - `http://localhost:3000/api/auth/callback`
   - `https://your-production-url.com/api/auth/callback`
4. Copy your credentials to `.env.local`

### MongoDB Setup (To be added)

MongoDB integration will be added by the backend team.

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables
5. Deploy!

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
