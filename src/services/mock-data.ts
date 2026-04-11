import type { User, Student, Teacher, Parent, Attendance, Fee, Payment, Announcement, Notification, ActivityLog, Grade, ClassRoom, Section, Unit, Lesson, Homework } from '@/types/models';

export const mockUser: User = {
  id: 1, name: 'Admin User', email: 'admin@school.com', role: 'admin', locale: 'en', created_at: '2024-01-01',
};

export const mockGrades: Grade[] = [
  { id: 1, name: 'Grade 1' }, { id: 2, name: 'Grade 2' }, { id: 3, name: 'Grade 3' },
];

export const mockClasses: ClassRoom[] = [
  { id: 1, name: 'Class A', grade_id: 1, notes: 'Morning shift' },
  { id: 2, name: 'Class B', grade_id: 1 },
  { id: 3, name: 'Class A', grade_id: 2, notes: 'Afternoon shift' },
  { id: 4, name: 'Class B', grade_id: 2 },
  { id: 5, name: 'Class A', grade_id: 3 },
];

export const mockSections: Section[] = [
  { id: 1, name: 'Section 1', class_id: 1, grade_id: 1, teacher_id: 1 },
  { id: 2, name: 'Section 2', class_id: 1, grade_id: 1, teacher_id: 2 },
  { id: 3, name: 'Section 1', class_id: 2, grade_id: 1, teacher_id: 3 },
  { id: 4, name: 'Section 1', class_id: 3, grade_id: 2, teacher_id: 4 },
  { id: 5, name: 'Section 2', class_id: 3, grade_id: 2, teacher_id: 5 },
  { id: 6, name: 'Section 1', class_id: 5, grade_id: 3, teacher_id: 6 },
];

const studentSectionMap = [
  { grade_id: 1, classroom_id: 1, section_id: 1 },
  { grade_id: 1, classroom_id: 1, section_id: 1 },
  { grade_id: 1, classroom_id: 1, section_id: 2 },
  { grade_id: 1, classroom_id: 1, section_id: 2 },
  { grade_id: 1, classroom_id: 2, section_id: 3 },
  { grade_id: 1, classroom_id: 2, section_id: 3 },
  { grade_id: 2, classroom_id: 3, section_id: 4 },
  { grade_id: 2, classroom_id: 3, section_id: 4 },
  { grade_id: 2, classroom_id: 3, section_id: 5 },
  { grade_id: 2, classroom_id: 3, section_id: 5 },
  { grade_id: 3, classroom_id: 5, section_id: 6 },
  { grade_id: 3, classroom_id: 5, section_id: 6 },
];

export const mockStudents: Student[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Student ${i + 1}`,
  email: `student${i + 1}@school.com`,
  gender: i % 2 === 0 ? 'male' : 'female',
  status: (['active', 'active', 'inactive', 'active', 'graduated', 'active', 'suspended', 'active', 'active', 'active', 'active', 'active'] as const)[i],
  grade_id: studentSectionMap[i].grade_id,
  classroom_id: studentSectionMap[i].classroom_id,
  section_id: studentSectionMap[i].section_id,
  parent_id: (i % 8) + 1,
  attachments: [],
  created_at: '2024-01-15',
}));

export const mockTeachers: Teacher[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: `Teacher ${i + 1}`,
  email: `teacher${i + 1}@school.com`,
  specialization: ['Math', 'Science', 'English', 'Arabic', 'History', 'Art'][i],
  gender: i % 2 === 0 ? 'male' : 'female',
  class_ids: [1, 2].slice(0, (i % 2) + 1),
  attachments: [],
}));

export const mockParents: Parent[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Parent ${i + 1}`,
  email: `parent${i + 1}@school.com`,
  phone: `+96650000000${i}`,
  job_title: ['Engineer', 'Doctor', 'Teacher', 'Accountant', 'Manager', 'Lawyer', 'Designer', 'Developer'][i],
  status: (i % 3 === 2 ? 'inactive' : 'active') as 'active' | 'inactive',
  address: `Street ${i + 1}, City`,
  attachments: [],
}));

export const mockAttendance: Attendance[] = mockStudents.slice(0, 8).map((s, i) => ({
  id: i + 1,
  student_id: s.id,
  date: '2024-03-08',
  status: (['present', 'present', 'absent', 'present', 'late', 'present', 'present', 'absent'] as const)[i],
  student: s,
}));

export const mockFees: Fee[] = [
  { id: 1, title: 'Tuition Fee', amount: 5000, type: 'tuition', year: '2024' },
  { id: 2, title: 'Transport Fee', amount: 1200, type: 'transport', year: '2024' },
  { id: 3, title: 'Lab Fee', amount: 800, type: 'lab', year: '2024' },
];

export const mockPayments: Payment[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1, student_id: i + 1, amount: 1500 + i * 300, date: `2024-0${i + 1}-15`, description: 'Monthly payment',
}));

export const mockAnnouncements: Announcement[] = [
  { id: 1, title: 'Final Exams Schedule', content: 'Final exams start March 20th.', created_at: '2024-03-01' },
  { id: 2, title: 'Parent Meeting', content: 'Parent-teacher meeting on March 15th.', created_at: '2024-03-05' },
  { id: 3, title: 'Holiday Notice', content: 'School closed March 12th for public holiday.', created_at: '2024-03-07' },
];

export const mockNotifications: Notification[] = Array.from({ length: 5 }, (_, i) => ({
  id: String(i + 1),
  type: 'general',
  data: { title: `Notification ${i + 1}`, message: `This is notification message ${i + 1}` },
  read_at: i < 2 ? null : '2024-03-08',
  created_at: `2024-03-0${8 - i}`,
}));

export const mockActivityLogs: ActivityLog[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  description: ['Created student', 'Updated attendance', 'Added payment', 'Deleted grade', 'Modified class', 'Created exam', 'Updated quiz', 'Added homework', 'Sent announcement', 'Modified fee'][i],
  causer_id: 1,
  created_at: `2024-03-0${8 - (i % 8)}`,
}));

export const mockUnits: Unit[] = [
  { id: 1, name: 'Unit 1: Introduction', class_id: 1, notes: 'First unit' },
  { id: 2, name: 'Unit 2: Basics', class_id: 1 },
  { id: 3, name: 'Unit 3: Advanced', class_id: 2, notes: 'Advanced topics' },
  { id: 4, name: 'Unit 1: Foundations', class_id: 3 },
  { id: 5, name: 'Unit 2: Practice', class_id: 3, notes: 'Hands-on practice' },
];

export const mockLessons: Lesson[] = [
  { id: 1, name: 'Lesson 1: Welcome', unit_id: 1, notes: 'Introductory lesson' },
  { id: 2, name: 'Lesson 2: Getting Started', unit_id: 1 },
  { id: 3, name: 'Lesson 1: Core Concepts', unit_id: 2, notes: 'Key concepts' },
  { id: 4, name: 'Lesson 2: Exercises', unit_id: 2 },
  { id: 5, name: 'Lesson 1: Deep Dive', unit_id: 3 },
  { id: 6, name: 'Lesson 1: Setup', unit_id: 4, notes: 'Environment setup' },
  { id: 7, name: 'Lesson 1: Lab Work', unit_id: 5 },
];

export const mockHomework: Homework[] = [
  { id: 1, title: 'Math Assignment 1', content: 'Complete exercises 1-10 from chapter 3', grade_id: 1, classroom_id: 1, section_id: 1, start_date: '2024-03-01', due_date: '2024-03-08' },
  { id: 2, title: 'Science Project', content: 'Research and present a science topic', grade_id: 1, classroom_id: 2, section_id: 3, start_date: '2024-03-05', due_date: '2024-03-15' },
  { id: 3, title: 'English Essay', content: 'Write a 500-word essay on your favorite book', grade_id: 2, classroom_id: 3, section_id: 4, start_date: '2024-03-03', due_date: '2024-03-10' },
  { id: 4, title: 'History Worksheet', content: 'Answer questions about ancient civilizations', grade_id: 2, classroom_id: 3, section_id: 5, start_date: '2024-03-06', due_date: '2024-03-13' },
  { id: 5, title: 'Art Portfolio', content: 'Create 3 drawings using different techniques', grade_id: 3, classroom_id: 5, section_id: 6, start_date: '2024-03-01', due_date: '2024-03-20' },
];
