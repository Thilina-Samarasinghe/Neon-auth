# Neon Auth System

## 🚀 Introduction
NeonAuth is an industry-level, highly scalable authentication system built with Next.js (App Router), Prisma ORM, and Neon PostgreSQL. This system ensures enterprise-grade security features like JWT token rotation, HTTP-only cookies, robust account limit controls (device tracking), brute-force locking mechanisms, and UTC-based data timestamps. 

## ✨ Features
- **Two-Step Email Registration**: Enhanced security flow where users verify their email first before setting a password.
- **JWT Authentication Flow**: Utilizes distinct short-lived Access Tokens and long-lived Refresh Tokens with auto-rotation.
- **Secure Handling**: Access tokens are kept in memory and Refresh tokens are secured via HTTP-only strict cookies.
- **Session Management**: A strictly enforced maximum limit of 2 concurrent devices per user. The system automatically evicts the oldest active session internally.
- **Brute-Force & Lockout Systems**: Account auto-locking mechanism after 5 failed login attempts (15-minute lock). 
- **Forgotten Passwords/Resets**: Includes generation of expiring cryptographic tokens, enabling secure recovery.
- **Database Protections**: Defense against SQL injections natively through Prisma ORM bounds.
- **Standardized API Structure**: A complete RESTful interface generating predictable, type-safe API responses with distinct status codes.

## Authentication Flow Diagram
![Authentication Flow Diagram](./Diagram/loginauth.drawio.png)

## 📦 Dependencies & Versions
- **Next.js:** `^16.2.4` (App router & server-side API support)
- **React:** `19.2.4` 
- **Prisma / @prisma/client:** `^5` (Node.js 20+ compatibility wrapper)
- **Bcryptjs:** `^2.4.3` (Synchronous & asynchronous hashed environments)
- **JsonWebToken (JWT):** `^9.0.2` 
- **TailwindCSS:** `^4.0`
- **TypeScript:** `^5.0`

## 🛠️ How To Setup

### 1. Prerequisites
- Node.js installed (v20+ recommended)
- A registered [Neon PostgreSQL](https://neon.tech/) SQL database url.

### 2. Environment Variables
Create a `.env` file at the root of the standard directory and configure the variables:
```env
# Neon PostgreSQL URL
DATABASE_URL="postgres://user:password@hostname:5432/dbname?sslmode=require"

# JWT Secrets (Generate using a crypto library or openssl base64)
JWT_ACCESS_SECRET="your-super-secret-access-key-replace-me"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-replace-me"

# Mail Key (for Forgot Password emails)
EMAIL_SERVICE_KEY=""
```

### 3. Install packages & Setup Prisma
```bash
npm install
npx prisma generate
npx prisma db push 
```

### 4. Run Development Server
```bash
npm run dev
```

## 📂 File Structure
```text
neon-auth/
├── Diagram/                  <- Architecture and sequence flow diagrams
├── prisma/
│   └── schema.prisma         <- Database entities & relationships
├── public/                   <- Public static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/         <- Core Authentication API Endpoints
│   │   │       ├── forgot-password/
│   │   │       ├── login/
│   │   │       ├── logout/
│   │   │       ├── me/
│   │   │       ├── refresh-token/
│   │   │       ├── register/         <- Registration Flow
│   │   │       │   ├── route.ts      <- Step 1: Request Link
│   │   │       │   ├── verify/       <- Step 2: Token Validation
│   │   │       │   └── complete/     <- Step 3: Finalize Account
│   │   │       └── reset-password/
│   │   ├── dashboard/        <- Protected user dashboard
│   │   ├── forgot-password/  <- Frontend forgot password page
│   │   ├── login/            <- Frontend login page
│   │   ├── register/         <- Frontend registration page
│   │   ├── reset-password/   <- Frontend reset password page
│   │   ├── layout.tsx
│   │   └── page.tsx          <- Frontend Main landing 
│   └── lib/
│       ├── auth-utils.ts     <- Hashing and JWT verification utilities
│       ├── email.ts          <- SMTP email sending and connection pool
│       └── prisma.ts         <- Prisma active singleton instance 
├── .env                      <- Secret environmental keys
├── neonauth_postman_collection.json  <- Auto-generated API Postman workspace
└── package.json
```

## 📊 Database Structure (Prisma schema)

**1. User (`User`)**
- `id` (String / UUID) - Primary Key
- `email` (String) - Encrypted login identifier
- `passwordHash` (String) - Bcrypt hash
- `isEmailVerified` (Boolean) - Auto tracks initial recovery configurations
- `failedLoginAttempts` (Int) - Counter for lockout logic 
- `lockedUntil` (DateTime?) - Sets precise UTC restriction ranges
- `createdAt` / `updatedAt` (DateTime) - UTC native tracking.
- `sessions` - One-to-many relation back into `Session`.

**2. Session (`Session`)**
Tracks connected devices currently authenticated constraints.
- `id` (String / UUID) - Primary Key
- `userId` (String) - Associated reference back to generic `User`. 
- `refreshToken` (String) - Hashed verification target. 
- `ipAddress` (String?) 
- `userAgent` (String?)
- `expiresAt` (DateTime) - Expiration boundary.

**3. VerificationToken (`VerificationToken`)**
Password recovery and isolated external token bindings.
- `id` (String / UUID) - Primary Key 
- `identifier` (String) - General target (usually an Email)
- `token` (String) - One-time hashed payload. 
- `type` (String) - Designation (like `password_reset`)
- `expiresAt` (DateTime) 

## 🌐 API Endpoints Reference
(See the imported Postman workspace `neonauth_postman_collection.json` to directly interact with inputs)
### Registration Flow
- `POST /api/auth/register` (Initiates registration, sends verification link)
- `GET  /api/auth/register/verify` (Validates registration token)
- `POST /api/auth/register/complete` (Finalizes account with password)

### Core Auth
- `POST /api/auth/login` (Auth validation & Cookie setup)
- `POST /api/auth/refresh-token` (Rotates Access / Refresh pairs directly via Cookie)
- `POST /api/auth/logout` (Destroys Sessions natively)
- `POST /api/auth/forgot-password` (Issues the recovery email verification tokens)
- `POST /api/auth/reset-password` (Consumes recovery tokens & generates new hashes)
- `GET  /api/auth/me` (Protected status route utilizing Auth Header Bearer strings)
