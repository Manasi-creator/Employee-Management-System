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
- Modular REST API Architecture (Express / Node.js ready)

---

## ⚙️ Prerequisites

Ensure you have the following installed on your system before proceeding:

- **Node.js:** `v18.x` or higher (v20+ recommended)
- **npm:** `v9.x` or higher (comes bundled with Node.js)
- **Git:** Latest version

---

## 💻 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd EMS
```

### 2. Frontend Setup

Navigate into the `frontend` directory:

```bash
cd frontend
```

Install all required dependencies:

```bash
npm install
```

Configure environment variables:
Create a `.env` file in the `frontend` folder (or copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the local development server:

```bash
npm run dev
```

The application will launch at `http://localhost:5173` (or the next available port shown in your terminal).

---

## 📜 Available Scripts

Run the following commands inside the `frontend` directory:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles TypeScript and builds the production-ready static assets in `dist/`. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs `oxlint` to check code quality and syntax compliance. |

---

## 🔑 Key Features & Role Portals

- **HR Portal:** Manage employee directory, manager assignments, departments, designations, former employees, leave requests, and company projects.
- **Manager Portal:** Oversee team members, review project allocations, and approve or reject team leave applications.
- **Employee Portal:** View personal profile, submit leave applications, check leave request statuses, and view assigned projects.
- **Role Guards & Security:** Route protection for public, authenticated, and role-restricted views with mandatory password change enforcement.
