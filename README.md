# 🚀 TaskFlow - Project Management System

> A modern, full-stack project management application built with MERN stack

[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📁 Monorepo Structure

```
TaskFlow-Monorepo/
├── backend/              # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database schemas
│   │   ├── routes/       # API routes
│   │   ├── middlewares/  # Custom middleware
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helper functions
│   │   └── validators/   # Input validation
│   ├── tests/            # Test files
│   ├── uploads/          # Temporary uploads
│   └── server.js         # Entry point
│
├── frontend/             # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API services
│   │   ├── hooks/        # Custom hooks
│   │   ├── context/      # Context providers
│   │   └── utils/        # Utility functions
│   └── public/           # Static files
│
├── docker-compose.yml    # Docker configuration
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## ✨ Features

### Core Features
- 🔐 **Authentication** - JWT-based auth with refresh tokens
- 👥 **User Management** - Role-based access (Admin/User)
- 📁 **Project Management** - Create, update, delete projects
- ✅ **Task Management** - Kanban-style task tracking
- 📊 **Dashboard** - Analytics and statistics
- 🔔 **Notifications** - Real-time updates
- 📎 **File Upload** - Avatar and file attachments
- 🔍 **Search** - Global search across projects/tasks
- 📄 **Pagination** - Efficient data loading

### Advanced Features
- 💬 **Comments** - Task-level discussions
- 📈 **Activity Logs** - Track all changes
- 🏷️ **Tags & Labels** - Organize tasks
- 📅 **Due Dates** - Deadline management
- 📧 **Email Notifications** - Automated emails
- 🌓 **Dark Mode** - Theme switching
- 📱 **Responsive** - Mobile-first design

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + Bcrypt
- **Validation:** express-validator
- **File Upload:** Multer + Cloudinary
- **Email:** Nodemailer
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Winston

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Routing:** React Router v6
- **State:** Context API
- **HTTP:** Axios
- **Forms:** React Hook Form
- **Notifications:** React Hot Toast
- **Icons:** Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- MongoDB 6.0 or higher
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd TaskFlow-Monorepo
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Frontend Setup** (in a new terminal)
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
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

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/status` - Update task status

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🐳 Docker Deployment

```bash
# Build and run
docker-compose up -d

# Stop services
docker-compose down
```

## 📝 Development Workflow

### Git Branches
- `main` - Production code
- `dev` - Development branch
- `feature/*` - Feature branches

### Commit Convention
```
feat: add user authentication
fix: resolve login bug
docs: update README
refactor: improve service layer
test: add unit tests
```

## 🚀 Deployment

### Backend
- **Recommended:** Render, Railway, or AWS EC2
- Set environment variables
- Connect to MongoDB Atlas

### Frontend
- **Recommended:** Vercel or Netlify
- Set `VITE_API_URL` to backend URL
- Deploy from Git repository

## 📊 Database Schema

### User
- name, email, password (hashed)
- role (user/admin)
- avatar, isActive
- timestamps

### Project
- name, description
- owner (ref: User)
- members (array of User refs)
- status, priority
- startDate, endDate
- timestamps

### Task
- title, description
- project (ref: Project)
- assignedTo (ref: User)
- createdBy (ref: User)
- status (todo/in-progress/done)
- priority, dueDate
- timestamps

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License

## 👥 Authors

- **Your Name** - [GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Built following industry best practices
- Inspired by modern project management tools

---

**Made with ❤️ for learning and production use**
