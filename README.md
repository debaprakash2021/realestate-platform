# 🏠 RealEstate Platform

> A modern, full-stack real estate listing and management platform built with the MERN stack

[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📁 Project Structure

```
realestate-platform/
├── backend/              # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/       # DB & cloud configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API route definitions
│   │   ├── middlewares/  # Auth, error & validation middleware
│   │   ├── services/     # Business logic layer
│   │   ├── utils/        # Helper utilities
│   │   └── validators/   # Input validation rules
│   ├── uploads/          # Temporary file uploads
│   └── server.js         # App entry point
│
├── frontend/             # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/        # Route-level pages
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # Axios API service calls
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # Global state via Context API
│   │   └── utils/        # Frontend helpers
│   └── public/           # Static assets
│
├── docker-compose.yml    # Docker orchestration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## ✨ Features

### Core Features
- 🔐 **Authentication** — JWT-based auth with secure refresh tokens
- 👥 **User Management** — Role-based access control (Admin / Agent / Buyer)
- 🏡 **Property Listings** — Create, browse, update, and delete property listings
- ✅ **Task & Follow-up Tracking** — Kanban-style task management for agents
- 📊 **Dashboard** — Analytics, property stats, and activity summaries
- 🔔 **Notifications** — Real-time update alerts
- 📎 **File & Image Upload** — Property images via Cloudinary
- 🔍 **Search & Filter** — Search properties by location, price, type
- 📄 **Pagination** — Efficient data loading across listings

### Advanced Features
- 💬 **Comments & Enquiries** — Buyer enquiries at listing level
- 📈 **Activity Logs** — Track all agent and admin actions
- 🏷️ **Tags & Labels** — Categorize listings (luxury, affordable, commercial, etc.)
- 📅 **Appointment Scheduling** — Book property viewings with due date tracking
- 📧 **Email Notifications** — Automated emails via Nodemailer
- 🌓 **Dark Mode** — Theme switching support
- 📱 **Responsive Design** — Mobile-first, fully responsive UI

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 18+ | Runtime environment |
| Express.js | Web framework |
| MongoDB + Mongoose | Database & ODM |
| JWT + Bcrypt | Authentication & password hashing |
| express-validator | Input validation |
| Multer + Cloudinary | File & image uploads |
| Nodemailer | Email notifications |
| Helmet + CORS | Security headers |
| Winston | Logging |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI library |
| Vite | Build tool |
| TailwindCSS | Utility-first styling |
| React Router v6 | Client-side routing |
| Context API | Global state management |
| Axios | HTTP client |
| React Hook Form | Form management |
| React Hot Toast | Toast notifications |
| Lucide React | Icon library |

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- MongoDB 6.0 or higher (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/debaprakash2021/realestate-platform.git
cd realestate-platform
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration (see below)
npm run dev
```

3. **Frontend Setup** *(open a new terminal)*
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

App runs at: `http://localhost:5173`  
API runs at: `http://localhost:5000`

### Environment Variables

**Backend (`backend/.env`)**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realestate
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive tokens |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh-token` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/update-profile` | Update profile info |
| PUT | `/api/auth/change-password` | Change user password |

### Listings (Projects)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects` | Create a new listing |
| GET | `/api/projects` | Get all listings |
| GET | `/api/projects/:id` | Get a single listing |
| PUT | `/api/projects/:id` | Update a listing |
| DELETE | `/api/projects/:id` | Delete a listing |

### Tasks / Follow-ups
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks` | Create a task/follow-up |
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/:id` | Get a single task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| PATCH | `/api/tasks/:id/status` | Update task status |

## 🗄️ Database Schema

### User
- `name`, `email`, `password` (hashed)
- `role` — `user` | `agent` | `admin`
- `avatar`, `isActive`
- `timestamps`

### Project *(Property Listing)*
- `name`, `description`
- `owner` → ref: User (Agent)
- `members` → array of User refs
- `status`, `priority`
- `startDate`, `endDate`
- `timestamps`

### Task *(Follow-up / Viewing)*
- `title`, `description`
- `project` → ref: Project (Listing)
- `assignedTo` → ref: User
- `createdBy` → ref: User
- `status` — `todo` | `in-progress` | `done`
- `priority` — `low` | `medium` | `high`
- `dueDate`, `completedAt`
- `timestamps`

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down
```

## 🚀 Deployment

### Backend
- **Recommended:** Render, Railway, or AWS EC2
- Set all environment variables in your hosting dashboard
- Connect to **MongoDB Atlas** for production database

### Frontend
- **Recommended:** Vercel or Netlify
- Set `VITE_API_URL` to your deployed backend URL
- Connect GitHub repo for automatic deployments

## � Git Workflow

### Branch Strategy
| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `dev` | Active development |
| `feature/*` | Feature branches |
| `fix/*` | Bug fix branches |

### Commit Convention
```
feat: add property search filter
fix: resolve authentication token expiry
docs: update API reference
refactor: simplify listing service layer
test: add unit tests for auth controller
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to your branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [MIT License](LICENSE)

## � Author

**Debaprakash** — [@debaprakash2021](https://github.com/debaprakash2021)

---

**Made with ❤️ · Built on the MERN Stack · [View on GitHub](https://github.com/debaprakash2021/realestate-platform)**
