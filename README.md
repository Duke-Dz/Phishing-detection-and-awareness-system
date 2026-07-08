# CyberSense - Phishing Detection and Awareness System

CyberSense is a full-stack phishing detection and awareness platform. It helps users scan suspicious URLs, email content, and SMS messages, report threats, receive security notifications, and learn safer digital habits through awareness content.

The project is split into two main applications:

- `pdas-backend` - Node.js, Express, PostgreSQL, Sequelize API.
- `pdas-frontend` - React, Vite, Tailwind-based user interface.

## What The Project Does

CyberSense provides a security-focused workflow for identifying and managing phishing risks:

- Scan URLs, SMS messages, and email content for phishing indicators.
- Analyze threats using a layered detection engine.
- Store scan history and user reports.
- Notify users about scan results and account/security events.
- Support user authentication, email verification, password reset, and session handling.
- Provide admin features for users, reports, threat intelligence, settings, and analytics.
- Offer awareness training content to help users recognize phishing attempts.

## Core Features

- Multi-layer phishing detection for URLs, SMS, and email content.
- Authentication with email verification, password reset, refresh tokens, and role-based access.
- User dashboard for scans, reports, notifications, profile, and settings.
- Admin dashboard for platform oversight and configuration.
- Threat reporting and report status tracking.
- Awareness training content.
- Email templates and notification workflows.
- Backend validation, rate limiting, request logging, caching, and database migrations.

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Zod
- Sonner toast notifications
- Lucide icons

### Backend

- Node.js
- Express
- PostgreSQL
- Sequelize
- JWT authentication
- bcryptjs
- express-validator
- express-rate-limit
- Nodemailer
- Winston logging
- Swagger documentation

## Project Structure

```text
.
+-- pdas-backend/
|   +-- src/
|   |   +-- config/
|   |   +-- controllers/
|   |   +-- middleware/
|   |   +-- migrations/
|   |   +-- models/
|   |   +-- routes/
|   |   +-- runtime/
|   |   +-- services/
|   |   +-- templates/
|   |   +-- utils/
|   +-- tests/
|   +-- server.js
|   +-- worker.js
+-- pdas-frontend/
|   +-- src/
|   |   +-- components/
|   |   +-- context/
|   |   +-- hooks/
|   |   +-- pages/
|   |   +-- router/
|   |   +-- services/
|   |   +-- utils/
|   +-- vite.config.js
+-- postman/
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL
- Git

### Backend Setup

```bash
cd pdas-backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

The backend runs on the port configured in `.env`, commonly `http://localhost:5000`.

### Frontend Setup

```bash
cd pdas-frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs through Vite, commonly at `http://localhost:3000` or the next available local port.

## Environment Configuration

Each application has its own environment example file:

- Backend: `pdas-backend/.env.example`
- Frontend: `pdas-frontend/.env.example`

Important backend settings include database credentials, JWT secrets, frontend URL, SMTP settings, and optional threat intelligence API keys.

Important frontend settings include the backend API URL.

Never commit real `.env` credentials.

## Useful Commands

### Backend

```bash
npm run dev              # Start backend in development
npm start                # Start backend normally
npm run start:worker     # Start background worker
npm run check            # Run syntax checks
npm run test:unit        # Run unit tests
npm test                 # Run all tests
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed sample data
```

### Frontend

```bash
npm run dev              # Start Vite dev server
npm run build            # Build frontend for production
npm run preview          # Preview production build
```

## Main User Flows

- Create an account and verify email.
- Sign in and access the dashboard.
- Submit URL, SMS, or email content for scanning.
- Review scan history and threat classification.
- Report suspicious content.
- Receive notifications.
- Update profile and settings.
- Reset password securely through email.

## Security Notes

CyberSense includes several security controls:

- Password hashing.
- Token-based authentication.
- Refresh token handling.
- Email verification.
- Password reset tokens.
- Role-based access control.
- Input validation.
- Rate limiting.
- Safe frontend error messages.
- Request logging and security event tracking.

This project is intended as a phishing detection and awareness system. It should be tested, configured, and reviewed carefully before production deployment.

## Testing

Run backend tests from `pdas-backend`:

```bash
npm run check
npm run test:unit
npm test
```

Run frontend build verification from `pdas-frontend`:

```bash
npm run build
```

## License

This project currently uses the license defined in the package files.
