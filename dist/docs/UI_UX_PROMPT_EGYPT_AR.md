# EduCenter UI/UX creative prompt — Egypt & Arabic-first

> **How to use this file:** Copy everything inside the **“Main prompt”** code block and paste it into your design or AI tool (Figma AI, Midjourney, ChatGPT, etc.). Specify desired outputs: web UI, RTL layout, design system, or suggested HTML/CSS.

---

## Context (for the AI)

- **Product:** **EduCenter** — a platform to run educational centers and schools in **Egypt** (multi-tenant, Arabic/English, RTL-aware).
- **Audience:** Center admins, teachers, students, parents, and central platform operators.
- **Surfaces to design with high creativity:**
  1. **Public marketing landing** (e.g. route `/`)
  2. **Per-center landing** — as if each school/center has its own welcome or visual onboarding page
  3. **Teacher landing** — welcoming, energetic, digital teaching tools
  4. **All auth screens:** school/tenant login, platform login, password recovery (if applicable), and any login-related empty states

---

## Main prompt (copy from here)

```
You are a lead UI/UX designer focused on education products in Egypt and the Arabic-speaking world.

Task: Propose a full visual system and user experience for "EduCenter" — a SaaS platform for educational centers and schools (attendance, fees, exams, homework, library, announcements, online classes).

Mandatory requirements:
1) Primary end-user facing copy must be in clear **Modern Standard Arabic** or **formal Egyptian Arabic** in an educational context — respectful and trustworthy; avoid heavy colloquialisms that weaken credibility.
2) Full **RTL-first** thinking: layout, icons, navigation, tables, and forms are designed right-to-left first; English is optional as a global accent (e.g. nav or logo) only where appropriate.
3) Audience: center directors in Cairo, Alexandria, and governorates — they value trust, clarity, and speed; parents want transparency; teachers are time-poor — their UI must reduce visual noise.
4) Creativity: avoid clichéd "boring school blue" templates. Draw from: subtle abstract geometric patterns (inspired by Islamic geometry as light backgrounds), warm earth tones with a fresh turquoise or emerald accent for growth, or an elegant light/dark pairing with a contemporary Egyptian identity (not tourist kitsch).
5) Accessibility: at least **WCAG AA** contrast, touch-friendly sizes on mobile, clear focus states on login fields.
6) No political or sectarian symbols; use neutral education motifs (book, abstract graduation cap, learning grid, schedule).

Deliverables (in order):
a) Color palette (names + suggested hex) + Arabic-capable type (e.g. Noto Sans Arabic or IBM Plex Sans Arabic) with weights for headings and body.
b) Three distinct art directions (A: premium formal for large centers — B: youthful dynamic for language institutes — C: calm minimal for STEM centers) with one sentence each describing the mood.
c) Structure of the **public platform landing**: sections (Hero, features, stats, roles, CTA, footer) with **ready-to-paste Arabic** microcopy.
d) Structure of a **center landing page**: welcome with center name, trust strip (testimonials, student counts, pricing tiers), quick links for parents/teachers.
e) Structure of a **teacher landing**: welcome, compact cards (my classes, attendance, homework), a distinct accent so teachers feel different from admin dashboards.
f) **Auth screens:** floating login card, clear visual role tabs, "tenant code" field that feels secure and trustworthy, a visually separate **platform** login (color or icon) from **school** login — include states: validation error, loading, success.
g) Five **micro-interaction** ideas (hover, tab transition, subtle error shake) without excess.

Start your answer with a short comparison table of the three art directions, then elaborate sections a–g.
```

---

## Technical notes (for designers or AI)

- The app uses **Tailwind + shadcn**; proposals should map to **design tokens** (e.g. CSS color variables), not only static mockups.
- Current marketing page: `LandingPage.tsx` — features, roles, stats; Arabic strings can be rewritten in a more **locally Egyptian** tone without losing clarity.
- Login pages: `LoginPage.tsx` (school + tenant) and `PlatformLoginPage.tsx` (platform) — **strong visual separation** between them reduces user error.
- There is **no** dedicated `/c/:slug` center route in the codebase yet; this prompt assumes a **future** center page or a section inside the main landing — implement later as a route if needed.

---

## Ready-to-use Arabic taglines (for designs)

| Context | Suggestion |
|--------|------------|
| Sub-headline | «منصة واحدة… لكل فصول مركزك» |
| Parents | «تابع ابنك… حضورًا ودرجاتً ورسومًا — بشفافية» |
| Teachers | «أقل ورق… أكثر تأثيرًا في الفصل» |
| Admins | «قرارات أوضح… تقارير أسرع» |
| CTA | «ابدأ تجربتك المجانية — دقائق وليس أيامًا» |

---

## Usage

Internal project reference. Tune the prompt for your AI tool (context length, creativity slider, output length limits, etc.).
