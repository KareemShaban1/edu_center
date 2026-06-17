/** Static SVG assets — neutral Egypt education motifs (books, classrooms, centers). */
export const EDUCATION_EGYPT_IMAGES = {
  heroClassroom: '/images/education-egypt/hero-classroom.svg',
  teacherLesson: '/images/education-egypt/teacher-lesson.svg',
  studentLearning: '/images/education-egypt/student-learning.svg',
  parentSupport: '/images/education-egypt/parent-support.svg',
  libraryBooks: '/images/education-egypt/library-books.svg',
  centerCampus: '/images/education-egypt/center-campus.svg',
  examPrep: '/images/education-egypt/exam-prep.svg',
  liveClass: '/images/education-egypt/live-class.svg',
} as const;

export type EducationEgyptImageKey = keyof typeof EDUCATION_EGYPT_IMAGES;

/** Default gallery set for landing page builder sections. */
export const EDUCATION_EGYPT_GALLERY: readonly string[] = [
  EDUCATION_EGYPT_IMAGES.libraryBooks,
  EDUCATION_EGYPT_IMAGES.studentLearning,
  EDUCATION_EGYPT_IMAGES.examPrep,
  EDUCATION_EGYPT_IMAGES.liveClass,
  EDUCATION_EGYPT_IMAGES.teacherLesson,
  EDUCATION_EGYPT_IMAGES.centerCampus,
];
