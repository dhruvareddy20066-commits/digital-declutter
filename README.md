# DigitalDeclutter

An account, file and subscription cleanup planner built with the MERN stack.
Track what you want to clean up, set how often each item should be reviewed, and let the app flag anything you have not looked at for too long.

**Student:** Dhruva Reddy J
**USN:** 2102508563
**Course:** Semester 3, Backend Development, CIA-II

## Differentiating feature: Stale Item Detection and Review Planner

Cleanup lists usually rot because nobody looks at them again. DigitalDeclutter solves this with a stale-item review flow:

- **Choose a threshold N** (7, 30, 90, 180 or 365 days) on the Dashboard and on the Items page.
- **`GET /api/items/stale?days=N`** returns active items whose `lastReviewedAt` is older than N days, longest-neglected first.
- **Dashboard "Needs review" section** lists those items with an "Unreviewed for 45 days" badge and a review meter that shows how much of the item's own review interval has been used.
- **Navbar badge** shows the number of stale items at the default 30-day threshold and updates after every change.
- **One-click "Mark reviewed"** calls `PATCH /api/items/:id/review`, removes the item from the list instantly (optimistic update), shows a success toast, and restores the row if the request fails.
- Each item also carries virtual fields `daysSinceReview`, `nextReviewAt` and `isOverdue` (its own `reviewIntervalDays` has run out), which power the meter and the detail page.

The stale query is:

```js
const thresholdDate = new Date(Date.now() - N * 24 * 60 * 60 * 1000);
CleanupItem.find({ status: 'active', lastReviewedAt: { $lt: thresholdDate } });
```

It is backed by the compound index `{ status: 1, lastReviewedAt: 1 }`.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18 (Vite), React Router v6, Axios, Tailwind CSS 3, Lucide icons |
| Backend | Node.js 18+, Express 4, Mongoose 8, express-validator, dotenv, cors, nodemon |
| Database | MongoDB (local, with optional Atlas fallback) |

## Run instructions

Requirements: Node.js 18+ and MongoDB running locally (or an Atlas connection string).

```bash
cd digital-declutter
```

**Server**

```bash
cd server
npm install
cp .env.example .env
npm run seed
npm run dev
```

**Client** (new terminal)

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:5000.

To use MongoDB Atlas as a fallback, set `MONGO_URI_FALLBACK` in `server/.env`. It is used automatically if the local connection fails.

## Project structure

```text
digital-declutter/
├── server/
│   ├── src/
│   │   ├── config/db.js              # Mongoose connection (local, Atlas fallback)
│   │   ├── controllers/itemController.js
│   │   ├── middleware/errorHandler.js, validate.js
│   │   ├── models/CleanupItem.js
│   │   ├── routes/itemRoutes.js
│   │   ├── utils/ApiError.js, asyncHandler.js
│   │   └── server.js
│   ├── seed.js
│   └── .env, .env.example, package.json
├── client/
│   ├── src/
│   │   ├── api/client.js             # Axios instance + API functions
│   │   ├── components/               # Navbar, ConfirmDialog, EmptyState, LoadingSpinner, Toast, ...
│   │   ├── context/ToastContext.jsx
│   │   ├── pages/                    # Dashboard, ItemsList, ItemForm, ItemDetail
│   │   ├── App.jsx, main.jsx, index.css
│   └── tailwind.config.js, vite.config.js, package.json
└── README.md
```

## Data model: CleanupItem

| Field | Type | Rules |
| --- | --- | --- |
| title | String | required, trimmed, max 100 |
| type | String | required: account, file, subscription |
| category | String | required: Work, Personal, Finance, Entertainment, Cloud Storage, Other |
| status | String | required: active, archived, deleted (default active) |
| reviewIntervalDays | Number | required, integer, 1 to 730 (default 30) |
| lastReviewedAt | Date | default now |
| notes | String | optional, max 500 |
| link | String | optional, valid http(s) URL or empty |
| createdAt, updatedAt | Date | automatic |

Indexes: `{ lastReviewedAt: 1 }` and `{ status: 1, lastReviewedAt: 1 }`.
Authentication is out of scope, so the app runs in a single demo context with no user ID.

## API reference

Base URL: `http://localhost:5000/api`. Every response uses the envelope `{ success, ... }`.

| Method | Endpoint | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | /items | Create an item | 201 `{ success, data }` | 422 validation |
| GET | /items | List items. Query: `type`, `category`, `status`, `q`, `sort` (title, lastReviewedAt, reviewIntervalDays, createdAt; prefix `-` for descending) | 200 `{ success, count, data }` | 500 |
| GET | /items/:id | Get one item | 200 `{ success, data }` | 400 invalid ID, 404 |
| PUT | /items/:id | Update an item | 200 `{ success, data }` | 400, 404, 422 |
| PATCH | /items/:id/review | Mark reviewed now | 200 `{ success, data }` | 400, 404 |
| DELETE | /items/:id | Delete an item | 200 `{ success, message: "Deleted successfully" }` | 400, 404 |
| GET | /items/stale?days=N | Stale items (default 30) | 200 `{ success, count, thresholdDays, data }` | 400 invalid days |
| GET | /stats?days=N | Dashboard summary | 200 `{ success, data: { totalItems, activeItems, archivedItems, staleCount, overdueCount, categoryBreakdown, typeBreakdown } }` | 500 |

### Validation (express-validator)

Rules live in `server/src/middleware/validate.js` and are shared by POST and PUT: required title (max 100), type and category from fixed lists, optional status from the list, integer `reviewIntervalDays` from 1 to 730, optional `notes` (max 500) and optional http(s) `link`.
Failures return **422**:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "title", "message": "Title is required and cannot exceed 100 characters." }]
}
```

### Error handling

- `ApiError` carries a status code and an errors array.
- `asyncHandler` forwards controller exceptions to the error middleware.
- `errorHandler` returns `{ success: false, message, errors }` for every failure and maps Mongoose `CastError` to 400, `ValidationError` to 422, duplicate keys to 409 and malformed JSON to 400.
- Unmatched routes return 404 `{ success: false, message: "Route not found" }`.

## Frontend overview

- **Dashboard:** summary cards, the "Needs review" section with a threshold selector and one-click review, and quick filter links.
- **All items:** debounced search, type/category/status/sort filters, stale threshold filter, table on desktop and cards on mobile, with Mark Reviewed, Edit and Delete on every row. Filters live in the URL, so dashboard links open pre-filtered.
- **Add / Edit item:** one form for both modes, inline field errors (client and server), dirty-check on edit, character counters.
- **Item detail:** all fields, review meter, external link button, review and delete actions.
- **Shared:** sticky navbar with stale badge and mobile drawer, confirm dialog for deletes, toasts, loading spinner and empty states.
- **Responsive:** designed from 375px up to 1440px, 44px minimum touch targets, scrollable table container, wrapped long text, dates formatted with `en-IN`.

## Quick API test

```bash
curl http://localhost:5000/api/items/stale?days=90
curl -X PATCH http://localhost:5000/api/items/<id>/review
curl -X POST http://localhost:5000/api/items -H "Content-Type: application/json" -d '{"title":""}'   # 422
curl http://localhost:5000/api/unknown                                                                # 404
```
