# Chat Module

Living documentation for the in-app realtime chat feature. Update this file whenever chat behavior, APIs, authorization rules, or UI flows change. After edits, run `npm run docs:sync` so `/developer/documentation` serves the latest copy from `public/docs/`.

> Last updated: **2026-09-19**

---

## Purpose

Secure, center-scoped messaging for **admin**, **teacher**, **student**, and **parent**:

- Direct (1:1) chats and staff-created groups
- Message types: text (with inline emoji), image, voice notes
- Live updates via authenticated SSE (with polling fallback)
- Web push for background alerts
- Strict who-can-talk-to-whom rules so unauthorized users cannot read or write chats

---

## Who can talk to whom

Conversations are always tied to **one center**. Cross-center pairs are rejected.

### Direct (1:1)

| Actor | Can message |
|-------|-------------|
| Admin (of a center) | Teachers, students, parents of **that** center; other admins/teachers in the same center |
| Teacher (of a center) | Same as admin for that center |
| Student | Admins and teachers of **every assigned center** |
| Parent | Admins and teachers of **every center where their children are assigned** (fallback: parent's own memberships) |

### Never allowed

- Student ↔ student
- Parent ↔ parent
- Student ↔ parent
- Any pair across two different centers

### Groups

- Only **admin** or **teacher** can create groups
- All members must be allowed contacts of the creator **in the same center**
- Students/parents can participate if added; they cannot create groups or add members

---

## Frontend routes

| Role | Paths |
|------|--------|
| Admin | `/admin/chat`, `/admin/chat/:conversationId` |
| Teacher | `/teacher/chat`, `/teacher/chat/:conversationId` |
| Student | `/student/chat`, `/student/chat/:conversationId` |
| Parent | `/parent/chat`, `/parent/chat/:conversationId` |

Shared UI: [`src/pages/chat/ChatPage.tsx`](../src/pages/chat/ChatPage.tsx)

Navigation: sidebar link + header chat icon with unread badge in [`DashboardLayout.tsx`](../src/components/DashboardLayout.tsx).

Admin ACL: path `/admin/chat` requires `view chat` (module `chat`) unless full admin. Seeded in `RolesAndPermissionsSeeder`.

---

## UI components

| File | Role |
|------|------|
| `src/pages/chat/ChatPage.tsx` | Inbox + thread (WhatsApp-style) |
| `src/components/chat/ChatComposer.tsx` | Text, emoji **insert into draft**, image, voice record |
| `src/components/chat/ChatMessageBubble.tsx` | Message rendering; auth-gated media blobs |
| `src/components/chat/ChatNewConversationDialog.tsx` | New DM / group; contact search |
| `src/hooks/use-chat-stream.ts` | SSE client + reconnect + poll fallback |
| `src/hooks/use-chat-unread.ts` | Unread count for badges |
| `src/services/endpoints/chat.ts` | API client |
| `src/types/chat.ts` | Shared TypeScript types |

### Contact search UX

- Search starts only after **3 characters** (debounced ~300ms)
- Backend also rejects queries shorter than 3 characters and limits results
- Direct mode: clicking a contact **starts the conversation immediately**
- Group mode: multi-select then **Start**

### Composer UX

- Emoji picker **inserts into the textarea**, does not send a separate message
- Text messages appear optimistically (temp id) then swap to server message
- Voice notes via `MediaRecorder`; images via file picker

---

## Backend API

Registered in [`backend/routes/api/chat.php`](../backend/routes/api/chat.php) (included from `api.php` inside session + bearer middleware).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/chat/contacts?q=&center_id=` | Search allowed contacts (min 3 chars) |
| `GET` | `/chat/conversations` | Inbox with last message + unread |
| `POST` | `/chat/conversations` | Start direct or group |
| `GET` | `/chat/conversations/{id}` | Conversation detail |
| `GET` | `/chat/conversations/{id}/messages` | Cursor-paginated messages |
| `POST` | `/chat/conversations/{id}/messages` | Send text/emoji/image/voice |
| `POST` | `/chat/conversations/{id}/read` | Mark read |
| `POST` | `/chat/conversations/{id}/typing` | Typing indicator |
| `GET` | `/chat/conversations/{id}/attachment/{mediaId}` | **Auth-gated** private file |
| `GET` | `/chat/unread` | Total unread count |
| `GET` | `/chat/stream?last_id=` | SSE live events |

### Key services

| Class | Responsibility |
|-------|----------------|
| `ChatActorResolver` | Resolve current admin/teacher/student/parent identities (incl. portal multi-center) |
| `ChatAuthorizationService` | Contact list + pair/group allow rules |
| `ChatService` | Conversations, messages, attachments, typing, unread, notify |
| `ChatApiController` | HTTP + SSE + rate limit on send |

### Realtime

- **SSE** (`/chat/stream`): polls DB for new messages in the caller's conversations, emits `message.created`, `typing`, heartbeats; closes after ~25s so the client reconnects
- **Fallback**: client polls conversations every 5s if SSE fails
- **Web push**: after response (`dispatch()->afterResponse()`), `ChatMessageNotification` + existing `NotificationDispatchService` / VAPID

No Laravel Reverb / Redis required for chat.

---

## Data model

Tables (shared MySQL, `center_id` scoped — listed in `config/centers.php`):

### `chat_conversations`

- `center_id`, `type` (`direct` \| `group`), `title` (groups), `created_by_type` / `created_by_id`

### `chat_participants`

- `conversation_id`, `participant_type` / `participant_id` (`admin` \| `teacher` \| `student` \| `parent`)
- `last_read_message_id`
- Unique per conversation + participant

### `chat_messages`

- `conversation_id`, `sender_type` / `sender_id`
- `type` (`text` \| `emoji` \| `image` \| `voice`)
- `body` (text/emoji)

### Media

- Spatie Media Library on `ChatMessage`, collection `attachment`, disk **`chat`** (`storage/app/chat`, private)
- Never served via public `/api/storage/{id}/{file}` — only via authenticated `/chat/conversations/{id}/attachment/{mediaId}`

Migration: `backend/database/migrations/2026_09_19_000001_create_chat_tables.php`

Config: `backend/config/chat.php` (limits, MIME types, SSE timing)

---

## Security checklist

- Guard + identity from session/bearer (`web` / `teacher` / `student` / `parent`)
- Contact search returns only allowed people
- Cannot open / stream / download unless participant
- Direct create rejected if pair not allowed **now** (membership revoked → 403)
- Group create/add only for staff; each member must be an allowed contact in that center
- Attachments on private disk only
- Send rate limit (~30/min)
- Message body stripped of HTML (`strip_tags`)
- Portal students/parents: inbox aggregates all assigned profile IDs by email

---

## Message types

| Type | Storage | UI |
|------|---------|-----|
| text | `body` | Bubble; emoji may be embedded in text |
| emoji | `body` (legacy/standalone still supported) | Large emoji |
| image | Private media (jpeg/png/webp/gif, ~5MB) | Thumb via authenticated blob URL |
| voice | Private media (webm/mp4/ogg…, ~2 min / ~8MB) | In-thread audio player |

---

## Manual test cases

Also mirrored in the platform manual test plan:

- `ADM-CHAT-01` — Admin chat DM/group + media
- `TCH-11` — Teacher chat with center contacts
- `STU-12` — Student chat with admin/teacher only
- `PAR-07` — Parent chat; cannot create groups

---

## How to update this doc

1. Change chat code or rules
2. Edit this file (`docs/16-chat-module.md`) to match
3. Run `npm run docs:sync` (copies to `public/docs/` for the Developer viewer)
4. If you rename the file or add a new doc ID, update [`src/config/platform-documentation.ts`](../src/config/platform-documentation.ts) and locale keys `docs.chat.*` in `LocaleContext.tsx`
