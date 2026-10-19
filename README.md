# Employee Management System (EMS)

A full-stack, enterprise-grade Employee Management System designed for modern workforce management. Features role-based access control (HR, Manager, Employee), department & designation hierarchies, project allocation, leave request workflows, auto-generated employee codes, and real-time dashboard analytics.

---

## 🚀 Tech Stack

### Backend
- **Framework:** Python FastAPI (RESTful API architecture following strict MVC pattern)
- **Database & ORM:** MySQL 8.0+ integrated via **SQLAlchemy 2.0 ORM** (Zero raw SQL queries; optimized eager `joinedload` queries)
- **Database Migrations:** **Alembic** schema versioning & migration scripts
- **Authentication & Security:** JWT (JSON Web Tokens) with `Passlib` (Bcrypt) password hashing, Bearer Token dependencies, and role-based guards (`HR`, `MANAGER`, `EMPLOYEE`)
- **Environment Management:** Centralized configuration via `.env` loaded with `pydantic-settings`
- **API Testing:** Pre-built Postman v2.1.0 Collection (`backend/postman/EMS.postman_collection.json`)

### Frontend
- **Framework & Language:** React 19 + TypeScript
- **Build Tool:** Vite
- **Design System & Styling:** Material UI (MUI v9) + Tailwind CSS + Emotion (Centralized Design System tokens)
- **Routing:** React Router DOM (v6) with Role-Based Route Protection
- **HTTP Client:** Axios with JWT Bearer Interceptors & error handlers
- **State & Notifications:** React Context API (`AuthContext`) + Notistack (Snackbar Alerts)
- **Date Utilities:** Dayjs

---

## 🔑 Key Features & Role Portals

### 🏢 HR Portal
- **Employee Management:** Create and update employee profiles with auto-assigned employee codes (`EMP001`, `EMP002`, etc.), assign managers, and mark employees inactive. Inactive employees remain in the employee records and appear on the Archived Employees page.
- **Organization Hierarchy:** Manage company departments and designation structures.
- **Projects Oversight:** View all company projects and department assignments (read-only project view; management reserved for Managers).
- **Leave Approvals:** Review and approve/reject leave requests submitted by Managers.

### 👔 Manager Portal
- **Project Management (Exclusive):** Create, update, and delete team projects. Assign department employees to projects with specific roles.
- **Department Team Operations:** Access department employee lists, assign roles, and track project allocations.
- **Team Leave Approvals:** Review, approve, or reject leave applications submitted by direct team members.

### 👤 Employee Portal
- **Self Profile:** View and update personal profile details, phone numbers, and technical skills.
- **Leave Management:** Submit new leave requests, check leave balances, view request history, and cancel pending requests.
- **Project View:** Track assigned projects and view project team members.

### 🔐 Security & Access Control
- **Mandatory First-Time Login:** Forces initial password change upon first authentication.
- **Show/Hide Password Toggle:** Eye button toggle for viewing passwords across login and password reset forms.
- **JWT Authorization Guards:** Route protection and backend endpoint authorization for all CRUD operations.
- **Browser credential protection:** Login sets an `HttpOnly` cookie; JavaScript cannot read or persist the JWT. The browser sends the cookie with API requests.
- **Database boundary:** Only FastAPI connects to the database. The browser receives API response data, never database credentials or connection details.
- **Request flow:** The browser sends HTTPS requests to FastAPI. The backend validates input, authenticates and authorizes the user, runs service/ORM logic against the database, then returns an API response. Browser requests and responses are inherently visible to that browser, so frontend code and Vite environment variables must contain no secrets.
- **Production settings:** Use `APP_ENV=production`, HTTPS, `AUTH_COOKIE_SECURE=true`, a unique random `JWT_SECRET` of at least 32 bytes, a non-root database account, and explicit CORS origins. API docs are disabled in production.

---

## 🛠️ Setup & Installation Guide

### Prerequisites
- Python 3.10+ (Python 3.13 recommended)
- Node.js 18+ and npm
- MySQL Server (or SQLite for local lightweight testing)

---

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```powershell
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install backend dependencies:**
   ```bash
   python -m pip install -r requirements.txt
   ```

4. **Environment Configuration:**
   Copy the example environment file:
   ```powershell
   Copy-Item .env.example .env
   ```
   Generate a secure secret key for `JWT_SECRET`:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
   Configure your MySQL credentials and paste the generated JWT secret into `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ems_db

   JWT_SECRET=your_generated_jwt_secret_key_here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60

   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   APP_ENV=development
   AUTH_COOKIE_SECURE=false
   AUTH_COOKIE_SAMESITE=lax
   ```
   *Note: Ensure `ems_db` database exists in MySQL before proceeding.*

5. **Run Alembic Migrations:**
   Apply pending database schema migrations:
   ```bash
   alembic upgrade head
   ```

6. **Seed Initial Demo Data (Optional):**
   Set a local-only initial password first. All seeded accounts require a password change at first login.
   ```bash
   $env:EMS_SEED_INITIAL_PASSWORD = "choose-a-unique-password-of-at-least-12-characters"
   python -m scripts.seed
   ```
   Seeded accounts include `hr@ems.com`, `fin.manager@ems.com`, and `asha@ems.com`. Use the password you set above; it is not stored in frontend code. Only run the seed script in development.

7. **Start the Backend API Server:**
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The API will be live at `http://localhost:8000`; interactive Swagger docs are available at `http://localhost:8000/docs` in development only.

---

### 2. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the Frontend Vite Development Server:**
   ```bash
   npm run dev
   ```
   Access the web application at `http://localhost:5173`.

---

## 📬 Postman API Collection

A complete Postman v2.1.0 collection is included in the project under `backend/postman/EMS.postman_collection.json`.

### How to use:
1. Open **Postman**.
2. Click **Import** and select `backend/postman/EMS.postman_collection.json`.
3. Use the `Login` request under **1. Authentication**. Postman stores the HTTP-only session cookie and sends it with subsequent requests.

---

## 📐 Architecture & Coding Standards

- **MVC Pattern:** Backend follows clear model schemas (`app/models`), controller handlers (`app/controllers`), data validation models (`app/schemas`), and business logic (`app/services`).
- **ORM & Relationships:** Uses SQLAlchemy ORM mapper models with foreign key constraints, `joinedload` optimizations, and junction tables (e.g. `ProjectMember`).
- **UI Design System:** Material UI theme tokens (`frontend/src/theme/index.ts`) combined with Tailwind CSS utilities (`frontend/src/index.css`) eliminate inline styling redundancies and guarantee modern visual aesthetics.
