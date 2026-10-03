# Employee Management System (EMS)

A modern, role-based Employee Management System built for managing enterprise operations, employee profiles, department hierarchies, project allocations, leave workflows, and access controls.

---

## 🚀 Tech Stack

### Frontend
- **Framework & Language:** React 19 + TypeScript
- **Build Tool:** Vite
- **UI & Styling:** Material UI (MUI v9) + Tailwind CSS + Emotion
- **Routing:** React Router DOM (v6) with Role-Based Guards (`HR`, `MANAGER`, `EMPLOYEE`)
- **HTTP Client:** Axios (with Bearer Token Interceptors)
- **State & Alerts:** React Context API + Notistack (Snackbar Alerts)
- **Date Handling:** Dayjs

### Backend
- Python FastAPI

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Manasi-creator/Employee-Management-System.git
cd Employee-Management-System
```

### 2. Backend Setup

The FastAPI API runs under `/api/v1`. Python 3.13 is recommended. On Windows, open a PowerShell terminal at the repository root and run:

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` with your database settings. By default, the backend connects to MySQL; create the `ems_db` database before starting the API. To use SQLite for local development instead, set `DATABASE_URL=sqlite:///./ems.db` in `backend/.env`.

Set `JWT_SECRET` in `backend/.env` to a unique random value. 
```
Copy the output into `JWT_SECRET`. Do not commit or share the real `.env` file; the `.env.example` file contains placeholders only.

From the `backend` directory, initialize or update the database schema and start the API:

```powershell
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

For an existing database, always apply pending migrations using `python -m alembic upgrade head` before using the app. Startup table creation does not add missing columns to existing tables.

### 3. Frontend Setup

Open a **second terminal** at the repository root:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```


### 4. Demo Data (Optional)

After the schema is initialized, activate the backend virtual environment and run this from the `backend` directory:

```bash
python -m scripts.seed
```

---


## 🔑 Key Features & Role Portals

- **HR Portal:** Manage employee directory, manager assignments, departments, designations, former employees, leave requests, and company projects.
- **Manager Portal:** Oversee team members, manage projects involving their direct reports, and approve or reject team leave applications.
- **Employee Portal:** View personal profile, submit leave applications, check leave request statuses, and view assigned projects.
- **Role Guards & Security:** Route protection for public, authenticated, and role-restricted views with mandatory password change enforcement.
