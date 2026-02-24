# 🚀 TaskFlow Setup Guide

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] MongoDB 6+ installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## Quick Setup (5 minutes)

### Step 1: Clone or Download
If you have this folder, you're already done with this step!

### Step 2: Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your settings
# Use any text editor to edit backend/.env
```

**IMPORTANT: Edit `backend/.env` file:**
- Change `JWT_SECRET` to a random string
- Change `JWT_REFRESH_SECRET` to another random string
- Set `MONGODB_URI` to your MongoDB connection string

### Step 3: Frontend Setup
```bash
# Open a NEW terminal
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Usually .env defaults are fine for local development
```

### Step 4: Start MongoDB
```bash
# Make sure MongoDB is running
# On Mac: brew services start mongodb-community
# On Windows: Start MongoDB service
# On Linux: sudo systemctl start mongod
```

### Step 5: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
You should see: `🚀 Server running on http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
You should see: `Local: http://localhost:5173`

### Step 6: Open Your Browser
Visit: http://localhost:5173

## 🎉 You're Done!

The application should now be running with:
- Backend API: http://localhost:5000
- Frontend UI: http://localhost:5173

## Next Steps

1. **Create an account** - Go to Register page
2. **Create a project** - Click "New Project"
3. **Add tasks** - Click on a project and add tasks
4. **Explore features** - Try different features

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
mongosh

# If not, start it:
# Mac: brew services start mongodb-community
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
```

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Kill the process or change the port in `backend/.env`

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution:** Install dependencies
```bash
cd backend
npm install
```

## Environment Variables Explained

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens (MUST change for production)
- `JWT_EXPIRE` - How long access tokens last (7d = 7 days)
- `CLIENT_URL` - Frontend URL for CORS

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Development Commands

### Backend
```bash
npm run dev      # Start with auto-reload
npm start        # Start in production mode
npm test         # Run tests
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Project Structure

```
TaskFlow-Monorepo/
├── backend/
│   ├── src/
│   │   ├── config/        ← Configuration files
│   │   ├── controllers/   ← API route handlers
│   │   ├── models/        ← Database schemas
│   │   ├── routes/        ← API routes
│   │   ├── services/      ← Business logic
│   │   ├── middlewares/   ← Auth, validation, etc.
│   │   ├── utils/         ← Helper functions
│   │   └── validators/    ← Input validation
│   └── server.js          ← Entry point
│
└── frontend/
    ├── src/
    │   ├── pages/         ← Page components
    │   ├── components/    ← Reusable components
    │   ├── services/      ← API calls
    │   ├── context/       ← Global state
    │   └── hooks/         ← Custom hooks
    └── index.html         ← Entry HTML
```

## Default Login Credentials

You'll need to register first! No default credentials exist.

## Getting Help

1. Check console for errors (F12 in browser)
2. Check terminal output for both backend and frontend
3. Read error messages carefully
4. Check if MongoDB is running
5. Verify environment variables are set correctly

## Production Deployment

See the main README.md for deployment instructions to:
- Render/Railway (Backend)
- Vercel/Netlify (Frontend)
- MongoDB Atlas (Database)

---

Happy coding! 🚀
