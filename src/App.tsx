import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import { defaultTenantSlug } from "@/config/login-defaults";
import LoginPage from "@/pages/LoginPage";
import PlatformLoginPage from "@/pages/PlatformLoginPage";
import StudentLoginPage from "@/pages/StudentLoginPage";
import ParentLoginPage from "@/pages/ParentLoginPage";
import StudentRegisterPage from "@/pages/StudentRegisterPage";
import ParentRegisterPage from "@/pages/ParentRegisterPage";
import NotFound from "./pages/NotFound";

// Admin
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminTeachers from "@/pages/admin/AdminTeachers";
import AdminParents from "@/pages/admin/AdminParents";
import AdminGrades from "@/pages/admin/AdminGrades";
import AdminClasses from "@/pages/admin/AdminClasses";
import AdminSections from "@/pages/admin/AdminSections";
import AdminSectionSessions from "@/pages/admin/AdminSectionSessions";
import AdminAttendance from "@/pages/admin/AdminAttendance";
import AdminAttendanceForm from "@/pages/admin/AdminAttendanceForm";
import AdminAttendanceHistory from "@/pages/admin/AdminAttendanceHistory";
import AdminFees from "@/pages/admin/AdminFees";
import AdminExams from "@/pages/admin/AdminExams";
import AdminExamForm from "@/pages/admin/AdminExamForm";
import AdminExamHistory from "@/pages/admin/AdminExamHistory";
import AdminQuizzes from "@/pages/admin/AdminQuizzes";
import AdminQuizForm from "@/pages/admin/AdminQuizForm";
import AdminQuizHistory from "@/pages/admin/AdminQuizHistory";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminPaymentForm from "@/pages/admin/AdminPaymentForm";
import AdminPaymentHistory from "@/pages/admin/AdminPaymentHistory";
import AdminLibrary from "@/pages/admin/AdminLibrary";
import AdminAnnouncements from "@/pages/admin/AdminAnnouncements";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminReports from "@/pages/admin/AdminReports";
import AdminReportDetail from "@/pages/admin/AdminReportDetail";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminUnits from "@/pages/admin/AdminUnits";
import AdminLessons from "@/pages/admin/AdminLessons";
import AdminHomework from "@/pages/admin/AdminHomework";
import AdminHomeworkReview from "@/pages/admin/AdminHomeworkReview";

const AdminHomeworkRemark = lazy(() => import("@/pages/admin/AdminHomeworkRemark"));
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminRolesPermissions from "@/pages/admin/AdminRolesPermissions";
import AdminSessions from "@/pages/admin/AdminSessions";
import AdminLandingPages from "@/pages/admin/AdminLandingPages";
import AdminLandingBuilder from "@/pages/admin/AdminLandingBuilder";
import AdminLandingAnalytics from "@/pages/admin/AdminLandingAnalytics";
import PublicLandingPage from "@/pages/PublicLandingPage";

// Teacher
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherClasses from "@/pages/teacher/TeacherClasses";
import TeacherAttendance from "@/pages/teacher/TeacherAttendance";
import TeacherExams from "@/pages/teacher/TeacherExams";
import TeacherQuizzes from "@/pages/teacher/TeacherQuizzes";
import TeacherHomework from "@/pages/teacher/TeacherHomework";
import TeacherLibrary from "@/pages/teacher/TeacherLibrary";
import TeacherSessions from "@/pages/teacher/TeacherSessions";
import TeacherLiveKitSession from "@/pages/teacher/TeacherLiveKitSession";

// Student
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentSessions from "@/pages/student/StudentSessions";
import StudentLiveKitSession from "@/pages/student/StudentLiveKitSession";
import StudentAttendance from "@/pages/student/StudentAttendance";
import StudentGrades from "@/pages/student/StudentGrades";
import StudentHomework from "@/pages/student/StudentHomework";
import StudentLibrary from "@/pages/student/StudentLibrary";

// Parent
import ParentDashboard from "@/pages/parent/ParentDashboard";
import ParentChildren from "@/pages/parent/ParentChildren";
import ParentAttendance from "@/pages/parent/ParentAttendance";
import ParentExams from "@/pages/parent/ParentExams";
import ParentQuizzes from "@/pages/parent/ParentQuizzes";
import ParentFees from "@/pages/parent/ParentFees";
import ParentReports from "@/pages/parent/ParentReports";

// Platform
import PlatformDashboard from "@/pages/platform/PlatformDashboard";
import PlatformTenants from "@/pages/platform/PlatformTenants";
import PlatformSubscriptions from "@/pages/platform/PlatformSubscriptions";
import PlatformUsers from "@/pages/platform/PlatformUsers";
import PlatformRoles from "@/pages/platform/PlatformRoles";
import PlatformLogs from "@/pages/platform/PlatformLogs";
import PlatformDocumentation from "@/pages/platform/PlatformDocumentation";
import PlatformSettings from "@/pages/platform/PlatformSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LocaleProvider>
          <BrandingProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/:tenantSlug/p/*" element={<PublicLandingPage />} />
              <Route path="/p/*" element={<PublicLandingPage />} />
              <Route path="/login" element={<Navigate to={`/${defaultTenantSlug}/login`} replace />} />
              <Route path="/student/login" element={<StudentLoginPage />} />
              <Route path="/parent/login" element={<ParentLoginPage />} />
              <Route path="/student/register" element={<StudentRegisterPage />} />
              <Route path="/parent/register" element={<ParentRegisterPage />} />
              <Route path="/:tenantSlug/login" element={<LoginPage />} />
              <Route path="/platform/login" element={<PlatformLoginPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>} />
              <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><AdminTeachers /></ProtectedRoute>} />
              <Route path="/admin/parents" element={<ProtectedRoute allowedRoles={['admin']}><AdminParents /></ProtectedRoute>} />
              <Route path="/admin/grades" element={<ProtectedRoute allowedRoles={['admin']}><AdminGrades /></ProtectedRoute>} />
              <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin']}><AdminClasses /></ProtectedRoute>} />
              <Route path="/admin/sections" element={<ProtectedRoute allowedRoles={['admin']}><AdminSections /></ProtectedRoute>} />
              <Route path="/admin/sections/:sectionId/sessions" element={<ProtectedRoute allowedRoles={['admin']}><AdminSectionSessions /></ProtectedRoute>} />
              <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendance /></ProtectedRoute>} />
              <Route path="/admin/attendance/section/:sectionId/today" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendanceForm /></ProtectedRoute>} />
              <Route path="/admin/attendance/section/:sectionId/history" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendanceHistory /></ProtectedRoute>} />
              <Route path="/admin/attendance/section/:sectionId/date/:date" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendanceForm /></ProtectedRoute>} />
              <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['admin']}><AdminFees /></ProtectedRoute>} />
              <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={['admin']}><AdminExams /></ProtectedRoute>} />
              <Route path="/admin/exams/section/:sectionId/today" element={<ProtectedRoute allowedRoles={['admin']}><AdminExamForm /></ProtectedRoute>} />
              <Route path="/admin/exams/section/:sectionId/history" element={<ProtectedRoute allowedRoles={['admin']}><AdminExamHistory /></ProtectedRoute>} />
              <Route path="/admin/exams/section/:sectionId/date/:date" element={<ProtectedRoute allowedRoles={['admin']}><AdminExamForm /></ProtectedRoute>} />
              <Route path="/admin/quizzes" element={<ProtectedRoute allowedRoles={['admin']}><AdminQuizzes /></ProtectedRoute>} />
              <Route path="/admin/quizzes/section/:sectionId/today" element={<ProtectedRoute allowedRoles={['admin']}><AdminQuizForm /></ProtectedRoute>} />
              <Route path="/admin/quizzes/section/:sectionId/history" element={<ProtectedRoute allowedRoles={['admin']}><AdminQuizHistory /></ProtectedRoute>} />
              <Route path="/admin/quizzes/section/:sectionId/date/:date" element={<ProtectedRoute allowedRoles={['admin']}><AdminQuizForm /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayments /></ProtectedRoute>} />
              <Route path="/admin/payments/section/:sectionId/today" element={<ProtectedRoute allowedRoles={['admin']}><AdminPaymentForm /></ProtectedRoute>} />
              <Route path="/admin/payments/section/:sectionId/history" element={<ProtectedRoute allowedRoles={['admin']}><AdminPaymentHistory /></ProtectedRoute>} />
              <Route path="/admin/payments/section/:sectionId/date/:date" element={<ProtectedRoute allowedRoles={['admin']}><AdminPaymentForm /></ProtectedRoute>} />
              <Route path="/admin/library" element={<ProtectedRoute allowedRoles={['admin']}><AdminLibrary /></ProtectedRoute>} />
              <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnnouncements /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/reports/:type" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportDetail /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/units" element={<ProtectedRoute allowedRoles={['admin']}><AdminUnits /></ProtectedRoute>} />
              <Route path="/admin/lessons" element={<ProtectedRoute allowedRoles={['admin']}><AdminLessons /></ProtectedRoute>} />
              <Route path="/admin/homework" element={<ProtectedRoute allowedRoles={['admin']}><AdminHomework /></ProtectedRoute>} />
              <Route path="/admin/homework/:homeworkId/review" element={<ProtectedRoute allowedRoles={['admin']}><AdminHomeworkReview /></ProtectedRoute>} />
              <Route path="/admin/homework/:homeworkId/submissions/:submissionId/remarks" element={<ProtectedRoute allowedRoles={['admin']}><Suspense fallback={null}><AdminHomeworkRemark /></Suspense></ProtectedRoute>} />
              <Route path="/admin/sessions" element={<ProtectedRoute allowedRoles={['admin']}><AdminSessions /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin']}><AdminRolesPermissions /></ProtectedRoute>} />
              <Route path="/admin/landing" element={<ProtectedRoute allowedRoles={['admin']}><AdminLandingPages /></ProtectedRoute>} />
              <Route path="/admin/landing/:pageId/edit" element={<ProtectedRoute allowedRoles={['admin']}><AdminLandingBuilder /></ProtectedRoute>} />
              <Route path="/admin/landing/:pageId/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminLandingAnalytics /></ProtectedRoute>} />

              {/* Teacher Routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
              <Route path="/teacher/sessions" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSessions /></ProtectedRoute>} />
              <Route path="/teacher/sessions/:sessionId/livekit" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLiveKitSession /></ProtectedRoute>} />
              <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
              <Route path="/teacher/exams" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherExams /></ProtectedRoute>} />
              <Route path="/teacher/quizzes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherQuizzes /></ProtectedRoute>} />
              <Route path="/teacher/homework" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHomework /></ProtectedRoute>} />
              <Route path="/teacher/library" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLibrary /></ProtectedRoute>} />

              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} loginPath="/student/login"><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/sessions" element={<ProtectedRoute allowedRoles={['student']} loginPath="/student/login"><StudentSessions /></ProtectedRoute>} />
              <Route path="/student/sessions/:sessionId/livekit" element={<ProtectedRoute allowedRoles={['student']} loginPath="/student/login"><StudentLiveKitSession /></ProtectedRoute>} />
              <Route path="/student/courses" element={<Navigate to="/student/sessions" replace />} />
              <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']} loginPath="/student/login"><StudentAttendance /></ProtectedRoute>} />
              <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['student']} loginPath="/student/login"><StudentGrades /></ProtectedRoute>} />
              <Route path="/student/homework" element={<ProtectedRoute allowedRoles={['student']} loginPath="/student/login"><StudentHomework /></ProtectedRoute>} />
              <Route path="/student/library" element={<ProtectedRoute allowedRoles={['student']} loginPath="/student/login"><StudentLibrary /></ProtectedRoute>} />

              {/* Parent Routes */}
              <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']} loginPath="/parent/login"><ParentDashboard /></ProtectedRoute>} />
              <Route path="/parent/children" element={<ProtectedRoute allowedRoles={['parent']} loginPath="/parent/login"><ParentChildren /></ProtectedRoute>} />
              <Route path="/parent/attendance" element={<ProtectedRoute allowedRoles={['parent']} loginPath="/parent/login"><ParentAttendance /></ProtectedRoute>} />
              <Route path="/parent/exams" element={<ProtectedRoute allowedRoles={['parent']} loginPath="/parent/login"><ParentExams /></ProtectedRoute>} />
              <Route path="/parent/quizzes" element={<ProtectedRoute allowedRoles={['parent']} loginPath="/parent/login"><ParentQuizzes /></ProtectedRoute>} />
              <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={['parent']} loginPath="/parent/login"><ParentFees /></ProtectedRoute>} />
              <Route path="/parent/reports" element={<ProtectedRoute allowedRoles={['parent']} loginPath="/parent/login"><ParentReports /></ProtectedRoute>} />

              {/* Platform Admin Routes */}
              <Route path="/platform" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformDashboard /></ProtectedRoute>} />
              <Route path="/platform/tenants" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformTenants /></ProtectedRoute>} />
              <Route path="/platform/subscriptions" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformSubscriptions /></ProtectedRoute>} />
              <Route path="/platform/users" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformUsers /></ProtectedRoute>} />
              <Route path="/platform/roles" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformRoles /></ProtectedRoute>} />
              <Route path="/platform/logs" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformLogs /></ProtectedRoute>} />
              <Route path="/platform/documentation" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformDocumentation /></ProtectedRoute>} />
              <Route path="/platform/documentation/:docId" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformDocumentation /></ProtectedRoute>} />
              <Route path="/platform/settings" element={<ProtectedRoute allowedRoles={['super_admin', 'platform_admin']} loginPath="/platform/login"><PlatformSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
          </BrandingProvider>
        </LocaleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
