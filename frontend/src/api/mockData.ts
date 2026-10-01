import type {
  Employee,
  Department,
  Designation,
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  Project,
  FormerEmployee,
  HRDashboardData,
  ManagerDashboardData,
  EmployeeDashboardData,
  PaginatedResponse,
} from '../types';

export const mockDepartments: Department[] = [
  { id: 1, name: 'Engineering', description: 'Software Development, QA, and Infrastructure', created_at: '2025-01-10', updated_at: '2025-01-10' },
  { id: 2, name: 'Human Resources', description: 'Talent Acquisition, Employee Relations, and Payroll', created_at: '2025-01-10', updated_at: '2025-01-10' },
  { id: 3, name: 'Product Management', description: 'Product Roadmap, User Research, and Analytics', created_at: '2025-01-12', updated_at: '2025-01-12' },
  { id: 4, name: 'Design', description: 'UI/UX Design, Brand Identity, and User Testing', created_at: '2025-01-15', updated_at: '2025-01-15' },
  { id: 5, name: 'Marketing', description: 'Growth, Digital Marketing, and Communications', created_at: '2025-01-20', updated_at: '2025-01-20' },
];

export const mockDesignations: Designation[] = [
  { id: 1, name: 'Senior Software Engineer', description: 'Full stack development lead', department_id: 1, department: mockDepartments[0], created_at: '2025-01-10', updated_at: '2025-01-10' },
  { id: 2, name: 'Engineering Manager', description: 'Team management & technical direction', department_id: 1, department: mockDepartments[0], created_at: '2025-01-10', updated_at: '2025-01-10' },
  { id: 3, name: 'HR Manager', description: 'HR Operations & Compliance Manager', department_id: 2, department: mockDepartments[1], created_at: '2025-01-10', updated_at: '2025-01-10' },
  { id: 4, name: 'Product Lead', description: 'Core product strategy', department_id: 3, department: mockDepartments[2], created_at: '2025-01-12', updated_at: '2025-01-12' },
  { id: 5, name: 'Senior UX Designer', description: 'Design system & user research', department_id: 4, department: mockDepartments[3], created_at: '2025-01-15', updated_at: '2025-01-15' },
];

export const mockEmployees: Employee[] = [
  {
    id: 1,
    employee_code: 'EMP001',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    email: 'hr@ems.com',
    phone: '+1 555-0192',
    date_of_birth: '1990-04-12',
    gender: 'FEMALE',
    address: '100 Enterprise Way, Suite 400, Tech City',
    skills: 'HR Operations, Talent Acquisition, Labor Compliance, Mediation',
    emergency_contact: '+1 555-9911 (Spouse)',
    joining_date: '2021-03-15',
    department_id: 2,
    designation_id: 3,
    manager_id: null,
    status: 'ACTIVE',
    user_id: 1,
    department: mockDepartments[1],
    designation: mockDesignations[2],
    created_at: '2021-03-15',
    updated_at: '2025-01-01',
  },
  {
    id: 2,
    employee_code: 'EMP002',
    first_name: 'David',
    last_name: 'Miller',
    email: 'manager@ems.com',
    phone: '+1 555-0184',
    date_of_birth: '1986-09-24',
    gender: 'MALE',
    address: '452 Innovation Blvd, Tech City',
    skills: 'React, Node.js, Architecture, Team Leadership, Agile',
    emergency_contact: '+1 555-8822 (Sister)',
    joining_date: '2020-06-01',
    department_id: 1,
    designation_id: 2,
    manager_id: 1,
    status: 'ACTIVE',
    user_id: 2,
    department: mockDepartments[0],
    designation: mockDesignations[1],
    manager: {
      id: 1,
      employee_code: 'EMP001',
      first_name: 'Sarah',
      last_name: 'Jenkins',
      email: 'hr@ems.com',
      department: mockDepartments[1],
      designation: mockDesignations[2],
    },
    created_at: '2020-06-01',
    updated_at: '2025-01-01',
  },
  {
    id: 3,
    employee_code: 'EMP003',
    first_name: 'Alex',
    last_name: 'Rivera',
    email: 'employee@ems.com',
    phone: '+1 555-0143',
    date_of_birth: '1995-11-05',
    gender: 'OTHER',
    address: '789 Software Ave, Tech City',
    skills: 'React, TypeScript, MUI, Tailwind CSS, REST APIs',
    emergency_contact: '+1 555-7733 (Parent)',
    joining_date: '2022-09-10',
    department_id: 1,
    designation_id: 1,
    manager_id: 2,
    status: 'ACTIVE',
    user_id: 3,
    department: mockDepartments[0],
    designation: mockDesignations[0],
    manager: {
      id: 2,
      employee_code: 'EMP002',
      first_name: 'David',
      last_name: 'Miller',
      email: 'manager@ems.com',
      department: mockDepartments[0],
      designation: mockDesignations[1],
    },
    created_at: '2022-09-10',
    updated_at: '2025-01-01',
  },
  {
    id: 4,
    employee_code: 'EMP004',
    first_name: 'Emily',
    last_name: 'Chen',
    email: 'emily.chen@ems.com',
    phone: '+1 555-0155',
    date_of_birth: '1992-02-18',
    gender: 'FEMALE',
    address: '12 Design Studio Way, Tech City',
    skills: 'Figma, UI/UX, Motion Design, Prototyping',
    emergency_contact: '+1 555-4422 (Brother)',
    joining_date: '2023-01-15',
    department_id: 4,
    designation_id: 5,
    manager_id: 2,
    status: 'ACTIVE',
    user_id: 4,
    department: mockDepartments[3],
    designation: mockDesignations[4],
    manager: {
      id: 2,
      employee_code: 'EMP002',
      first_name: 'David',
      last_name: 'Miller',
      email: 'manager@ems.com',
    },
    created_at: '2023-01-15',
    updated_at: '2025-01-01',
  },
];

export const mockLeaveTypes: LeaveType[] = [
  { id: 1, name: 'Annual Leave', max_days: 18 },
  { id: 2, name: 'Casual Leave', max_days: 12 },
  { id: 3, name: 'Sick Leave', max_days: 10 },
];

export const mockLeaveBalances: LeaveBalance[] = [
  { leave_type: mockLeaveTypes[0], total: 18, used: 4, remaining: 14 },
  { leave_type: mockLeaveTypes[1], total: 12, used: 2, remaining: 10 },
  { leave_type: mockLeaveTypes[2], total: 10, used: 1, remaining: 9 },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 101,
    employee_id: 3,
    leave_type_id: 1,
    leave_type: mockLeaveTypes[0],
    start_date: '2026-10-10',
    end_date: '2026-10-14',
    days: 4,
    reason: 'Family vacation and personal downtime',
    status: 'PENDING',
    remarks: null,
    employee: {
      id: 3,
      employee_code: 'EMP003',
      first_name: 'Alex',
      last_name: 'Rivera',
      email: 'employee@ems.com',
    },
    reviewed_by: null,
    created_at: '2026-09-28',
    updated_at: '2026-09-28',
  },
  {
    id: 102,
    employee_id: 2,
    leave_type_id: 2,
    leave_type: mockLeaveTypes[1],
    start_date: '2026-10-02',
    end_date: '2026-10-03',
    days: 2,
    reason: 'Attending technical conference',
    status: 'APPROVED',
    remarks: 'Approved. Enjoy the conference!',
    employee: {
      id: 2,
      employee_code: 'EMP002',
      first_name: 'David',
      last_name: 'Miller',
      email: 'manager@ems.com',
    },
    reviewed_by: 1,
    created_at: '2026-09-20',
    updated_at: '2026-09-22',
  },
];

export const mockProjects: Project[] = [
  {
    id: 201,
    name: 'EMS Platform Modernization',
    description: 'Upgrading Enterprise Employee Management frontend to React 19, Vite, and MUI v9.',
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
    created_by: 2,
    members: [
      {
        id: 1,
        project_id: 201,
        employee_id: 2,
        project_role: 'Lead Architect',
        assigned_at: '2026-08-01',
        employee: {
          id: 2,
          employee_code: 'EMP002',
          first_name: 'David',
          last_name: 'Miller',
          email: 'manager@ems.com',
        },
      },
      {
        id: 2,
        project_id: 201,
        employee_id: 3,
        project_role: 'Frontend Engineer',
        assigned_at: '2026-08-05',
        employee: {
          id: 3,
          employee_code: 'EMP003',
          first_name: 'Alex',
          last_name: 'Rivera',
          email: 'employee@ems.com',
        },
      },
    ],
    created_at: '2026-08-01',
    updated_at: '2026-08-01',
  },
  {
    id: 202,
    name: 'Mobile HR Portal v2',
    description: 'Cross-platform mobile application for employee self-service and quick approvals.',
    start_date: '2026-09-15',
    end_date: '2027-02-28',
    status: 'PLANNING',
    created_by: 2,
    members: [
      {
        id: 3,
        project_id: 202,
        employee_id: 4,
        project_role: 'Lead Designer',
        assigned_at: '2026-09-15',
        employee: {
          id: 4,
          employee_code: 'EMP004',
          first_name: 'Emily',
          last_name: 'Chen',
          email: 'emily.chen@ems.com',
        },
      },
    ],
    created_at: '2026-09-15',
    updated_at: '2026-09-15',
  },
];

export const mockFormerEmployees: FormerEmployee[] = [
  {
    id: 901,
    employee_code: 'EMP901',
    first_name: 'Michael',
    last_name: 'Scott',
    email: 'm.scott@former.ems.com',
    phone: '+1 555-9090',
    date_of_birth: '1975-03-15',
    gender: 'MALE',
    address: '172 Paper Mill Road, Scranton',
    skills: 'Regional Management, Client Relations, Public Speaking',
    emergency_contact: '+1 555-0099',
    joining_date: '2015-04-01',
    leaving_date: '2024-12-31',
    archived_at: '2025-01-02',
    department_name: 'Management',
    designation_name: 'Regional Manager',
    manager_name: 'Corporate Board',
    project_history: [
      {
        project_name: 'Branch Expansion 2022',
        project_role: 'Executive Sponsor',
        start_date: '2022-01-01',
        end_date: '2022-12-31',
        status: 'COMPLETED',
      },
    ],
    leave_history: [
      {
        leave_type: 'Annual Leave',
        start_date: '2024-07-10',
        end_date: '2024-07-20',
        days: 10,
        status: 'APPROVED',
        reason: 'Summer vacation',
      },
    ],
  },
];

/* ── Mock API Route Handler ──────────────────────────────────── */
export function getMockResponse(url: string, _params?: Record<string, unknown>) {
  const cleanUrl = url.split('?')[0];

  /* Auth Me */
  if (cleanUrl.includes('/auth/me')) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return { data: JSON.parse(storedUser) };
      } catch {
        // fallback
      }
    }
    return {
      data: {
        id: 1,
        email: 'hr@ems.com',
        role: 'HR',
        employee_id: 1,
        is_first_login: false,
        is_active: true,
      },
    };
  }

  /* HR Dashboard */
  if (cleanUrl.includes('/dashboard/hr')) {
    const hrData: HRDashboardData = {
      total_employees: 48,
      total_managers: 8,
      active_employees: 45,
      total_departments: 5,
      pending_manager_leaves: 2,
      department_summary: [
        { department_name: 'Engineering', employee_count: 22 },
        { department_name: 'Human Resources', employee_count: 6 },
        { department_name: 'Product Management', employee_count: 8 },
        { department_name: 'Design', employee_count: 7 },
        { department_name: 'Marketing', employee_count: 5 },
      ],
    };
    return { data: hrData };
  }

  /* Manager Dashboard */
  if (cleanUrl.includes('/dashboard/manager')) {
    const mgrData: ManagerDashboardData = {
      team_size: 6,
      pending_team_leaves: 1,
      team_projects: mockProjects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        member_count: p.members?.length ?? 0,
      })),
    };
    return { data: mgrData };
  }

  /* Employee Dashboard */
  if (cleanUrl.includes('/dashboard/employee')) {
    const empData: EmployeeDashboardData = {
      leave_balance: mockLeaveBalances,
      recent_leave_requests: mockLeaveRequests,
      assigned_projects: mockProjects,
    };
    return { data: empData };
  }

  /* Current User Me */
  if (cleanUrl.includes('/employees/me')) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.role === 'HR') return { data: mockEmployees[0] };
      if (parsed.role === 'MANAGER') return { data: mockEmployees[1] };
    }
    return { data: mockEmployees[2] };
  }

  /* Managers List */
  if (cleanUrl.includes('/employees/managers')) {
    const managers = mockEmployees.filter((e) => e.department_id === 1 || e.id === 2);
    const paginated: PaginatedResponse<Employee> = {
      items: managers,
      total: managers.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };
    return { data: paginated };
  }

  /* My Team */
  if (cleanUrl.includes('/employees/my-team')) {
    const team = mockEmployees.filter((e) => e.manager_id === 2 || e.id === 3 || e.id === 4);
    const paginated: PaginatedResponse<Employee> = {
      items: team,
      total: team.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };
    return { data: paginated };
  }

  /* Single Employee by ID */
  const empMatch = cleanUrl.match(/\/employees\/(\d+)$/);
  if (empMatch) {
    const id = parseInt(empMatch[1], 10);
    const found = mockEmployees.find((e) => e.id === id) || mockEmployees[0];
    return { data: found };
  }

  /* All Employees */
  if (cleanUrl.includes('/employees')) {
    const paginated: PaginatedResponse<Employee> = {
      items: mockEmployees,
      total: mockEmployees.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };
    return { data: paginated };
  }

  /* Single Department by ID */
  const deptMatch = cleanUrl.match(/\/departments\/(\d+)$/);
  if (deptMatch) {
    const id = parseInt(deptMatch[1], 10);
    const found = mockDepartments.find((d) => d.id === id) || mockDepartments[0];
    return { data: found };
  }

  /* Departments */
  if (cleanUrl.includes('/departments')) {
    const paginated: PaginatedResponse<Department> = {
      items: mockDepartments,
      total: mockDepartments.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };
    return { data: paginated };
  }

  /* Single Designation by ID */
  const desigMatch = cleanUrl.match(/\/designations\/(\d+)$/);
  if (desigMatch) {
    const id = parseInt(desigMatch[1], 10);
    const found = mockDesignations.find((d) => d.id === id) || mockDesignations[0];
    return { data: found };
  }

  /* Designations */
  if (cleanUrl.includes('/designations')) {
    const paginated: PaginatedResponse<Designation> = {
      items: mockDesignations,
      total: mockDesignations.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };
    return { data: paginated };
  }

  /* Leaves */
  if (cleanUrl.includes('/leaves/types')) {
    return { data: mockLeaveTypes };
  }
  if (cleanUrl.includes('/leaves/balance')) {
    return { data: mockLeaveBalances };
  }
  if (cleanUrl.includes('/leaves/my') || cleanUrl.includes('/leaves/team') || cleanUrl.includes('/leaves/manager-requests') || cleanUrl.includes('/leaves')) {
    const paginated: PaginatedResponse<LeaveRequest> = {
      items: mockLeaveRequests,
      total: mockLeaveRequests.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };
    return { data: paginated };
  }

  /* Single Project by ID */
  const projMatch = cleanUrl.match(/\/projects\/(\d+)$/);
  if (projMatch) {
    const id = parseInt(projMatch[1], 10);
    const found = mockProjects.find((p) => p.id === id) || mockProjects[0];
    return { data: found };
  }

  /* Projects */
  if (cleanUrl.includes('/projects/my') || cleanUrl.includes('/projects')) {
    if (cleanUrl.includes('/members')) {
      return { data: mockProjects[0].members || [] };
    }
    const paginated: PaginatedResponse<Project> = {
      items: mockProjects,
      total: mockProjects.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };
    return { data: paginated };
  }

  /* Single Former Employee by ID */
  const formerMatch = cleanUrl.match(/\/former-employees\/(\d+)$/);
  if (formerMatch) {
    const id = parseInt(formerMatch[1], 10);
    const found = mockFormerEmployees.find((fe) => fe.id === id) || mockFormerEmployees[0];
    return { data: found };
  }

  /* Former Employees */
  if (cleanUrl.includes('/former-employees')) {
    const paginated: PaginatedResponse<FormerEmployee> = {
      items: mockFormerEmployees,
      total: mockFormerEmployees.length,
      page: 1,
      page_size: 10,
      total_pages: 1,
    };
    return { data: paginated };
  }

  /* Default empty list fallback */
  return {
    data: {
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
    },
  };
}
