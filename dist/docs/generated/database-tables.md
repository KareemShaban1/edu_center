# Database Tables (auto-generated)

> Last synced: 2026-07-17T16:46:22.188Z
> Sources: `backend/database/migrations/`, `backend/config/centers.php`
> Regenerate: `npm run docs:sync`

## Migrations → Tables

| Table | Migration file |
|-------|----------------|
| `centers` | `2014_09_15_000000_create_centers_table.php` |
| `center_memberships` | `2014_09_15_000001_create_global_users_and_memberships_table.php` |
| `users` | `2014_10_12_000000_create_users_table.php` |
| `password_resets` | `2014_10_12_100000_create_password_resets_table.php` |
| `failed_jobs` | `2019_08_19_000000_create_failed_jobs_table.php` |
| `grades` | `2021_01_15_184804_create_grades_table.php` |
| `classes` | `2021_01_23_181414_create_classes_table.php` |
| `sections` | `2021_02_10_182227_create_sections_table.php` |
| `parents` | `2021_03_03_151536_create_parents_table.php` |
| `parent_attachments` | `2021_03_04_110235_create_parent_attachments_table.php` |
| `genders` | `2021_03_17_175656_create_genders_table.php` |
| `teachers` | `2021_03_18_174036_create_teachers_table.php` |
| `teacher_section` | `2021_03_28_155234_create_teacher_section_table.php` |
| `students` | `2021_04_10_181456_create_students_table.php` |
| `images` | `2021_04_28_195145_create_images_table.php` |
| `fees` | `2021_06_01_174202_create_fees_table.php` |
| `payments` | `2021_06_08_181848_create_payments_table.php` |
| `attendances` | `2021_07_16_185459_create_attendances_table.php` |
| `online_classes` | `2021_10_23_180609_create_online_classes_table.php` |
| `library` | `2021_10_31_185145_create_library_table.php` |
| `settings` | `2021_11_12_163746_create_settings_table.php` |
| `events` | `2021_12_11_142103_create_events_table.php` |
| `months` | `2023_02_08_162703_create_months_table.php` |
| `quiz_degrees` | `2023_02_09_111233_create_quiz_degree_table.php` |
| `exam_degrees` | `2023_02_09_113231_create_exam_degrees_table.php` |
| `announcements` | `2023_05_13_022236_create_announcements_table.php` |
| `notifications` | `2024_07_01_170137_create_notifications_table.php` |
| `sessions` | `2025_03_23_120000_create_sessions_table.php` |
| `notes` | `2025_03_24_144311_create_notes_table.php` |
| `units` | `2025_03_25_194122_create_units_table.php` |
| `lessons` | `2025_03_25_194123_create_lessons_table.php` |
| `questions` | `2025_03_25_194124_create_questions_table.php` |
| `answers` | `2025_03_25_201559_create_answers_table.php` |
| `words` | `2025_05_10_165257_create_words_table.php` |
| `rooms` | `2025_06_28_115653_create_rooms_table.php` |
| `media` | `2025_07_10_170137_create_media_table.php` |
| `whatsapp_templates` | `2025_07_25_151914_create_whatsapp_templates_table.php` |
| `certification_templates` | `2025_07_25_235412_create_certification_templates_table.php` |
| `homeworks` | `2025_08_05_124520_create_homeworks_table.php` |
| `student_homework` | `2025_08_05_125233_create_student_homework_table.php` |
| `activity_logs` | `2025_08_07_192820_create_activity_logs_table.php` |
| `admins` | `2025_08_11_221636_create_admins_table.php` |
| `landing_pages` | `2026_06_09_000001_create_landing_pages_tables.php` |
| `platform_settings` | `2026_06_17_000002_create_platform_settings_table.php` |
| `centers_new` | `2026_06_20_000002_convert_centers_id_to_integer.php` |
| `student_certifications` | `2026_07_06_000001_create_student_certifications_table.php` |
| `ui_translation_overrides` | `2026_07_13_000001_create_ui_translation_overrides_table.php` |
| `personal_todos` | `2026_07_17_000001_create_personal_productivity_tables.php` |

## Center-scoped tables (`center_id`)

- `users`
- `teachers`
- `grades`
- `classes`
- `sections`
- `teacher_section`
- `fees`
- `payments`
- `attendances`
- `homeworks`
- `student_homework`
- `quiz_degrees`
- `exam_degrees`
- `library`
- `announcements`
- `events`
- `images`
- `parent_attachments`
- `settings`
- `whatsapp_templates`
- `certification_templates`
- `student_certifications`
- `activity_logs`
- `months`
- `genders`
- `rooms`
- `sessions`
- `notes`
- `personal_todos`
- `personal_notes`
- `units`
- `lessons`
- `questions`
- `answers`
- `words`
- `landing_pages`
- `landing_page_revisions`
- `landing_page_analytics`
- `landing_media`
- `media`
- `notifications`
- `online_classes`
- `roles`
- `permissions`
- `model_has_roles`
- `model_has_permissions`
- `role_has_permissions`
- `failed_jobs`
- `password_resets`

## Membership-scoped tables

