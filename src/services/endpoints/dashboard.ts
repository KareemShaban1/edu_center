import { apiClient, USE_MOCK } from '../api-client';
import type { DashboardPayload, UserRole } from '@/types/models';

const superAdminDashboard: DashboardPayload = {
  stats: [
    { id: 'tenants', title: 'Total Tenants', value: '12', icon: 'globe', trend: { value: 8.3, label: 'vs last month' } },
    { id: 'active_users', title: 'Active Users', value: '3,456', icon: 'users', trend: { value: 12.1, label: 'vs last month' } },
    { id: 'subscriptions', title: 'Active Subscriptions', value: '11', icon: 'credit-card' },
    { id: 'api_calls', title: 'API Calls', value: '284K', variant: 'exams', icon: 'activity' },
  ],
  sections: [
    {
      key: 'recent_tenants',
      title: 'Recent Tenants',
      items: [
        { id: 1, title: 'Al-Noor Academy', subtitle: 'alnoor.edu', status: 'active' },
        { id: 2, title: 'Future School', subtitle: 'future.edu', status: 'active' },
        { id: 3, title: 'Bright Minds', subtitle: 'bright.edu', status: 'trial' },
      ],
    },
    {
      key: 'activity',
      title: 'Recent Activity',
      items: [
        { id: 1, title: 'Created tenant Al-Noor Academy', meta: '2026-03-10' },
        { id: 2, title: 'Upgraded Future School subscription', meta: '2026-03-11' },
      ],
    },
  ],
};

const roleDashboards: Record<UserRole, DashboardPayload> = {
  admin: {
    stats: [
      { id: 'students', title: 'Total Students', value: '1,234', variant: 'default', icon: 'graduation-cap', trend: { value: 5.2, label: 'vs last month' } },
      { id: 'teachers', title: 'Teachers', value: '86', variant: 'default', icon: 'users', trend: { value: 2.1, label: 'vs last month' } },
      { id: 'attendance', title: 'Attendance Rate', value: '94.7%', variant: 'attendance', icon: 'calendar-check', trend: { value: 1.3, label: 'vs last week' } },
      { id: 'revenue', title: 'Revenue', value: '$142K', variant: 'finance', icon: 'dollar-sign', trend: { value: -2.4, label: 'vs last month' } },
    ],
    sections: [
      {
        key: 'recent_students',
        title: 'Recent Students',
        items: [
          { id: 1, title: 'Student 1', subtitle: 'male', meta: '2024-01-15' },
          { id: 2, title: 'Student 2', subtitle: 'female', meta: '2024-01-15' },
          { id: 3, title: 'Student 3', subtitle: 'male', meta: '2024-01-15' },
        ],
      },
      {
        key: 'announcements',
        title: 'Announcements',
        items: [
          { id: 1, title: 'Final Exams Schedule', subtitle: 'Final exams start March 20th.', meta: '2024-03-01' },
          { id: 2, title: 'Parent Meeting', subtitle: 'Parent-teacher meeting on March 15th.', meta: '2024-03-05' },
        ],
      },
    ],
  },
  teacher: {
    stats: [
      { id: 'classes', title: 'My Classes', value: '5', variant: 'default', icon: 'book-open' },
      { id: 'students', title: 'Total Students', value: '148', variant: 'default', icon: 'users' },
      { id: 'attendance', title: 'Avg Attendance', value: '92%', variant: 'attendance', icon: 'calendar-check' },
      { id: 'homework', title: 'Pending Homework', value: '3', variant: 'exams', icon: 'clipboard-list' },
    ],
    sections: [
      {
        key: 'today_schedule',
        title: "Today's Schedule",
        items: [
          { id: 1, title: 'Math - Grade 3A', meta: '08:00' },
          { id: 2, title: 'Science - Grade 2B', meta: '09:00' },
          { id: 3, title: 'Math - Grade 1A', meta: '10:30' },
        ],
      },
      {
        key: 'attendance',
        title: 'Attendance',
        items: [
          { id: 1, title: 'Student 1', status: 'present' },
          { id: 2, title: 'Student 2', status: 'late' },
          { id: 3, title: 'Student 3', status: 'absent' },
        ],
      },
    ],
  },
  student: {
    stats: [
      { id: 'courses', title: 'Enrolled Courses', value: '6', icon: 'book-open' },
      { id: 'attendance', title: 'Attendance Rate', value: '96%', variant: 'attendance', icon: 'calendar-check' },
      { id: 'gpa', title: 'GPA', value: '3.7', variant: 'exams', icon: 'trophy' },
      { id: 'homework', title: 'Pending Homework', value: '4', variant: 'alerts', icon: 'clipboard-list' },
    ],
    sections: [
      {
        key: 'assignments',
        title: 'Upcoming Assignments',
        items: [
          { id: 1, title: 'Math Chapter 5 Exercises', subtitle: 'Mathematics', meta: 'Due Mar 10' },
          { id: 2, title: 'Science Lab Report', subtitle: 'Science', meta: 'Due Mar 12' },
        ],
      },
      {
        key: 'grades',
        title: 'Recent Grades',
        items: [
          { id: 1, title: 'Mathematics', subtitle: '92/100', status: 'A' },
          { id: 2, title: 'Science', subtitle: '87/100', status: 'B+' },
        ],
      },
    ],
  },
  parent: {
    stats: [
      { id: 'children', title: 'Children', value: '2', icon: 'users' },
      { id: 'attendance', title: 'Avg Attendance', value: '95%', variant: 'attendance', icon: 'calendar-check' },
      { id: 'fees', title: 'Pending Fees', value: '$1,200', variant: 'finance', icon: 'dollar-sign' },
      { id: 'reports', title: 'Reports', value: '3', icon: 'file-text' },
    ],
    sections: [
      {
        key: 'children',
        title: 'Children Overview',
        items: [
          { id: 1, title: 'Ahmed', subtitle: 'Grade 3 - Section A', meta: 'Attendance 97% | GPA 3.8' },
          { id: 2, title: 'Sara', subtitle: 'Grade 1 - Section B', meta: 'Attendance 93% | GPA 3.5' },
        ],
      },
      {
        key: 'payments',
        title: 'Recent Payments',
        items: [
          { id: 1, title: 'Tuition Fee - Ahmed', subtitle: '$2,500', status: 'Paid' },
          { id: 2, title: 'Lab Fee - Sara', subtitle: '$400', status: 'Pending' },
        ],
      },
    ],
  },
  super_admin: superAdminDashboard,
  platform_admin: superAdminDashboard,
};

export const dashboardApi = {
  async getByRole(role: UserRole): Promise<DashboardPayload> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250));
      return roleDashboards[role];
    }
    return apiClient.get<DashboardPayload>('/dashboard', undefined, false);
  },
};
