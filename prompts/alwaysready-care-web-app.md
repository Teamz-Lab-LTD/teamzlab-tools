# AlwaysReady Care - Web Application Build Prompt

## Project Context

You are building the **web version** of **AlwaysReady Care** - a Compliance Evidence Layer for UK social care providers. The Flutter mobile app already exists and you must achieve **100% feature parity** on web with full authentication (login/logout), and every feature must be **100% human-tested** before delivery.

### Source Project Location (Reference)
```
/Users/mdgolamkibriaemon/Projects/Teamz Lab Projects/teamz-projects/always-ready-care/
```

Use this path to read any file, model, service, widget, or configuration from the existing Flutter app. The entire codebase is your reference - read it whenever you need clarity on business logic, data models, Firestore structure, or UI behavior.

### Key Reference Files
- **Main entry**: `lib/main.dart`
- **Router/Routes**: `lib/src/core/router/app_router.dart`
- **Auth/Login**: `lib/src/features/auth/ui/login_page.dart`
- **Dashboard**: `lib/src/features/dashboard/ui/role_based_dashboard_page.dart`
- **Evidence Capture**: `lib/src/features/evidence/ui/evidence_capture_view.dart`
- **Evidence Review**: `lib/src/features/review/ui/evidence_review_page.dart`
- **Compliance Dashboard**: `lib/src/features/compliance/ui/compliance_dashboard_page.dart`
- **Pack Generation**: `lib/src/features/packs/ui/pack_generation_page.dart`
- **Actions Dashboard**: `lib/src/features/actions/ui/actions_dashboard_page.dart`
- **Firebase Config**: `lib/firebase_options.dart` and `firebase.json`
- **Localization**: `lib/l10n/app_en.arb`
- **All Data Models**: `lib/src/data/models/` (evidence_model, user_model, pack_model, follow_up_action_model, audit_log_model, category_config_model, org_model, site_model, evidence_template_model)
- **All Services**: `lib/src/data/services/` (audit_service, compliance_service, ai_service, storage_service, pdf_service, firebase_remote_config_service)
- **All Repositories**: `lib/src/data/repositories/`
- **All Use Cases**: `lib/src/domain/usecases/`
- **All BLoCs**: `lib/src/features/evidence/bloc/`
- **Core Widgets**: `lib/src/core/widgets/` (coming_soon_badge, offline_indicator, real_time_indicator, theme_toggle_button, help_tooltip)
- **DI Setup**: `lib/src/core/dependency_injection/injector.dart`
- **User Context Service**: `lib/src/core/services/user_context_service.dart`
- **Anonymous Auth Service**: `lib/src/core/services/anonymous_auth_service.dart`
- **pubspec.yaml**: For all dependencies and versions
- **Design System**: Uses `team_mvp_kit` package from `teamz_mvp_kit/` submodule

---

## What This App Does

AlwaysReady Care is a **Compliance Evidence Layer** for UK social care providers. It does NOT replace care planning systems, eMAR, or rostering/payroll. It:

1. **Captures** compliance evidence (text, photo, audio, incident forms) in under 60 seconds
2. **Structures** evidence using AI (Google Gemini) - summaries, tags, risk flags, follow-up actions
3. **Reviews & Approves** evidence through a workflow (draft -> submitted -> approved -> archived)
4. **Monitors** compliance readiness across required categories
5. **Exports** inspection packs as PDFs for CQC/regulatory inspections
6. **Tracks** follow-up actions with priorities and due dates

---

## Firebase Backend (SHARED - Same Firebase Project)

The web app MUST use the **same Firebase project** as the mobile app:
- **Project ID**: `always-ready-care`
- **Web App ID**: `1:54979000806:web:805514f2111f63fc6abe27`

### Firebase Services Used
- **Firebase Auth** - Email/password login + anonymous auth
- **Cloud Firestore** - All data storage
- **Firebase Storage** - File uploads (photos, audio, PDFs)
- **Firebase App Check** - Security
- **Firebase Remote Config** - Feature flags, AI config
- **Firebase Analytics** - Usage tracking
- **Firebase Crashlytics** - Error reporting (web alternative needed)
- **Google Generative AI (Gemini)** - AI evidence structuring

### Firestore Collections Structure
```
orgs/{orgId}
  - name, plan, settings

orgs/{orgId}/sites/{siteId}
  - name, createdAt

orgs/{orgId}/users/{uid}
  - role (carer | senior | manager | director | admin), siteIds[]

orgs/{orgId}/config/categories
  - required[], custom[], timeWindows

orgs/{orgId}/evidence/{evidenceId}
  - siteId, type (text|photo|audio|incident), status (draft|submitted|approved|archived)
  - rawText, attachments[], ai {summary, tags[], riskFlags[], actions[]}
  - audit {createdBy, createdAt, updatedBy, updatedAt}
  - tags[], followUpActions[]

orgs/{orgId}/packs/{packId}
  - siteId, filters, readinessSnapshot, pdfStoragePath

orgs/{orgId}/auditLogs/{logId}
  - actorUid, action, targetType, targetId, timestamp
```

### Firebase Storage Structure
```
/orgs/{orgId}/sites/{siteId}/evidence/{evidenceId}/attachments/
/orgs/{orgId}/sites/{siteId}/packs/{packId}/inspection-pack.pdf
```

---

## Authentication Requirements (CRITICAL - LOGIN/LOGOUT)

### Login System
1. **Email/Password Login** - Primary auth method using Firebase Auth `signInWithEmailAndPassword`
2. **Continue as Guest** - Anonymous auth using `signInAnonymously()` for demo/trial users
3. **Logout** - Full sign out with `FirebaseAuth.instance.signOut()`, redirect to login page
4. **Auth State Persistence** - User stays logged in across browser sessions
5. **Route Guards** - Protected routes redirect to `/login` if not authenticated
6. **Post-Login Redirect** - After successful login, redirect to `/dashboard`

### Login Page Must Include
- Email input field
- Password input field
- "Sign In" button with loading state
- "Continue as Guest" button with loading state
- Error handling (invalid credentials, network errors)
- Healthcare-friendly language (not "Login" but "Sign In")
- Theme toggle (dark/light mode)
- Help tooltips on fields

### Logout Must Include
- Logout button accessible from dashboard/navigation
- Confirmation before logout (optional but recommended)
- Clear all local state/cache on logout
- Redirect to login page after logout
- Handle logout errors gracefully

---

## Multi-Role System (100% Required)

### Roles
| Role | Access Level |
|------|-------------|
| **Carer** | Capture evidence, view templates, see own evidence |
| **Senior** | + Review evidence |
| **Manager** | + Compliance dashboard, pack generation, team overview |
| **Director** | + Organisation-wide stats, multi-site analytics |
| **Admin** | Full access to everything |

### Role-Based Dashboards
- **Carer Dashboard**: Quick actions (Record Evidence, Use Template), my recent evidence, pending items
- **Manager Dashboard**: Pending reviews count, compliance status overview, team activity, evidence stats
- **Director Dashboard**: Organisation-wide readiness score, multi-site comparison, trend analytics

---

## ALL Features (100% Feature Parity Required)

### Feature 1: Evidence Capture
- Text note input with AI structuring
- Photo upload (use file picker on web, NOT camera)
- Audio recording indicator (show "Coming Soon" badge on web - audio recording not supported)
- Structured incident form
- Evidence templates (5 pre-built):
  - Medication Given
  - Personal Care Completed
  - Meal Support
  - Activity Participation
  - Incident Occurred
- Template auto-fill into evidence text
- Site selection dropdown
- Category/tag selection
- Evidence capturable in under 60 seconds
- Offline indicator widget

### Feature 2: Evidence Review & Approval
- List of submitted evidence needing review
- Approve/reject with reason
- Edit tags and follow-up actions
- Only approved evidence included in compliance exports
- Real-time indicator widget
- Role-based access (seniors, managers, directors, admins only)

### Feature 3: AI-Assisted Evidence Structuring
- Triggered ONLY by explicit user action (button press)
- Uses Google Gemini API to transform human text into:
  - Concise professional summary
  - Suggested compliance categories (tags)
  - Risk flags
  - Suggested follow-up actions
- AI output MUST be human-approved before saving
- No diagnosis, no care decisions, no invented facts

### Feature 4: Follow-up Action Tracking
- Actions linked to evidence
- Track: priority (low/medium/high/urgent), due date, status (open/in_progress/completed)
- View overdue actions by site
- Actions dashboard with filtering

### Feature 5: Compliance Readiness Monitoring
- Track evidence coverage across required compliance categories
- Rules-based gap detection
- Readiness percentage + gap list
- Category coverage visualization
- Role-based access (managers+ only)

### Feature 6: Inspection Pack Export
- Generate packs by: site, date range, evidence types
- PDF document with structured evidence list
- Secure links to attachments
- Store PDF in Firebase Storage
- On web: use `Uint8List` for PDF (not `File`)
- Role-based access (managers+ only)

### Feature 7: Offline Indicators
- Show online/offline connectivity status
- Green indicator when online
- Yellow indicator when offline
- Pending sync count placeholder
- Present on ALL major screens

### Feature 8: Real-Time Collaboration Indicators
- Blue indicator with pulsing dot showing live updates
- Present on evidence review and actions dashboard

### Feature 9: "Coming Soon" Badges
- Semi-transparent overlay with badge for:
  - Voice-to-Text (audio recording on web)
  - Photo AI Analysis
  - Smart Notifications (director dashboard)

### Feature 10: Healthcare-Friendly Language
- ALL text must use healthcare-appropriate terminology:
  - "Record Care Evidence" (not "Capture Evidence")
  - "What happened?" (not "Evidence details")
  - "Select Care Location" (not "Select Site")
  - "Sign In" (not "Login")
  - Full localization via ARB files

### Feature 11: Theme Support
- Dark mode (default)
- Light mode
- Theme toggle button in app bar
- Theme persistence across sessions

### Feature 12: Audit Trail
- Log all significant actions (create, update, approve, reject, export)
- Actor UID, action type, target, timestamp
- Stored in `auditLogs` collection

---

## Web-Specific Technical Requirements

### Platform Handling
- Use `kIsWeb` checks for web-specific behavior
- **File uploads**: Use `Uint8List` on web (NOT `dart:io File`)
- **Image picker**: Use `ImageSource.gallery` on web (no camera)
- **Image display**: Use `Image.memory()` on web (NOT `Image.file()`)
- **Audio recording**: Disabled on web with user-friendly message
- **Storage uploads**: Use `putData()` on web (NOT `putFile()`)
- **PDF generation**: Return `Uint8List` on web (NOT `File`)
- **Orientation lock**: Skip `SystemChrome.setPreferredOrientations` on web

### Responsive Web Design
- Desktop-optimized layouts (not just mobile-stretched)
- Max dashboard width constraint
- Side navigation for desktop, bottom nav for mobile
- Responsive grid layouts for cards/stats
- Proper use of `ConstrainedBox` and `maxDashboardWidth`

### Web Build & Deploy
```bash
# Build for web
fvm flutter build web --release -v

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Flutter (Web) |
| Language | Dart |
| State Management | BLoC (flutter_bloc) |
| Routing | GoRouter |
| DI | GetIt + Injectable |
| Backend | Firebase (Auth, Firestore, Storage, Remote Config) |
| AI | Google Generative AI (Gemini) |
| PDF | pdf + printing packages |
| Models | Freezed + JSON Serializable |
| Design System | TeamzLab Design System (team_mvp_kit) |
| Localization | Flutter intl / ARB files |

---

## Data Models (Read from source for exact fields)

Read these files for exact Freezed model definitions:
```
lib/src/data/models/evidence_model.dart
lib/src/data/models/user_model.dart
lib/src/data/models/pack_model.dart
lib/src/data/models/follow_up_action_model.dart
lib/src/data/models/audit_log_model.dart
lib/src/data/models/category_config_model.dart
lib/src/data/models/org_model.dart
lib/src/data/models/site_model.dart
lib/src/data/models/evidence_template_model.dart
```

---

## Testing Requirements (100% Human-Tested)

Every feature MUST be tested by a human. Create a test checklist:

### Authentication Tests
- [ ] Email/password login with valid credentials
- [ ] Email/password login with invalid credentials (error message shown)
- [ ] Email/password login with empty fields (validation message)
- [ ] Continue as Guest works
- [ ] Logout works and redirects to login
- [ ] Auth state persists after browser refresh
- [ ] Protected routes redirect to login when not authenticated
- [ ] Login redirects to dashboard on success

### Role-Based Access Tests
- [ ] Carer sees carer dashboard
- [ ] Manager sees manager dashboard with review/compliance access
- [ ] Director sees director dashboard with org-wide stats
- [ ] Carer cannot access compliance dashboard (permission denied)
- [ ] Carer cannot access pack generation (permission denied)

### Evidence Capture Tests
- [ ] Create text evidence
- [ ] Upload photo evidence (file picker works on web)
- [ ] Audio shows "Coming Soon" badge on web
- [ ] Use each of the 5 evidence templates
- [ ] Template auto-fills text correctly
- [ ] Select site and categories
- [ ] Evidence saves to Firestore
- [ ] Evidence appears in review queue

### Evidence Review Tests
- [ ] List shows submitted evidence
- [ ] Approve evidence (status changes)
- [ ] Reject evidence with reason
- [ ] Edit tags on evidence
- [ ] Add/edit follow-up actions
- [ ] Only approved evidence in compliance calculations

### AI Structuring Tests
- [ ] AI button triggers Gemini API
- [ ] AI returns summary, tags, risk flags, actions
- [ ] AI output shown for human review
- [ ] User can approve/modify AI suggestions
- [ ] AI doesn't run without explicit action

### Compliance Dashboard Tests
- [ ] Readiness percentage displays correctly
- [ ] Gap list shows missing categories
- [ ] Category coverage visualization works
- [ ] Data matches Firestore evidence

### Pack Generation Tests
- [ ] Filter by site, date range, evidence type
- [ ] PDF generates correctly on web
- [ ] PDF downloads/opens in browser
- [ ] PDF stored in Firebase Storage

### Actions Dashboard Tests
- [ ] List follow-up actions
- [ ] Filter by priority, status, due date
- [ ] Mark actions as complete
- [ ] Overdue actions highlighted

### UI/UX Tests
- [ ] Dark mode works
- [ ] Light mode works
- [ ] Theme toggle persists
- [ ] All text is healthcare-friendly (no technical jargon)
- [ ] Help tooltips display correctly
- [ ] Responsive on desktop (1920px, 1440px, 1280px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on mobile (375px)
- [ ] Offline indicator shows correctly
- [ ] Real-time indicators show correctly
- [ ] "Coming Soon" badges display correctly
- [ ] Loading states work (buttons show spinner)
- [ ] Error states show user-friendly messages
- [ ] Navigation works (all routes accessible)

### Cross-Browser Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Game-Changing Features (Implement What's Ready, Badge the Rest)

### Fully Implement NOW
1. **Evidence Templates & Quick Actions** - 5 pre-built templates, auto-fill, quick action buttons
2. **Role-Based Dashboards** - Different views per role (Carer/Manager/Director)
3. **Evidence Search & Filters** - Full-text search, advanced filters, saved queries
4. **Bulk Operations** - Bulk approve/reject, bulk tagging, batch export
5. **Multiple Export Formats** - PDF + Excel + CSV export
6. **Role-Based Access Control** - Permission checks throughout

### Show as "Coming Soon" (Badge)
1. **Offline-First with Smart Sync** - Show offline indicators, actual sync not yet implemented
2. **Real-Time Collaboration** - Show real-time indicators, actual listeners not yet implemented
3. **Voice-to-Text Transcription** - Badge on audio features
4. **Photo AI Analysis** - Badge on photo capture
5. **Smart Notifications & Reminders** - Badge on director dashboard
6. **Advanced Analytics & Predictions** - Trend analysis, predictive alerts
7. **Integration Hub** - REST API, webhooks
8. **Compliance Calendar** - Calendar view of deadlines
9. **Multi-Language Support** - Polish, Romanian, etc.

---

## Monetization Structure (For Reference)

### Tiered Plans
- **Free**: Basic capture, limited AI (5/day)
- **Pro**: Full features, unlimited AI, all export formats
- **Enterprise**: Custom integrations, dedicated support, white-label

### Pricing
- Carers: £5-10/user/month
- Managers: £20-30/user/month

---

## Deployment

### Firebase Hosting Config
The `firebase.json` already has Flutter web config. Deploy with:
```bash
fvm flutter build web --release -v
firebase deploy --only hosting
```

### Environment
- Flutter SDK: 3.35.7 (managed via FVM)
- Dart SDK: >=3.8.0 <4.0.0
- FVM config: `.fvmrc` in project root

---

## CRITICAL REMINDERS

1. **100% Feature Parity** - Every feature from the mobile app must work on web
2. **Login/Logout is MANDATORY** - Full Firebase Auth with email/password + guest mode
3. **100% Human-Tested** - Use the test checklist above, every box must be checked
4. **Same Firebase Backend** - Do NOT create a new Firebase project
5. **Web-Specific Handling** - Use `kIsWeb`, `Uint8List`, `putData()`, gallery-only image picker
6. **Healthcare Language** - All user-facing text must be professional and care-appropriate
7. **Read the Source** - When in doubt, read the actual Flutter source files at the project path above
8. **Design System** - Use TeamzLab Design System (`team_mvp_kit`) for all UI components
9. **Clean Architecture** - Maintain the existing architecture: features -> domain -> data -> core
10. **No Shortcuts** - Every screen, every widget, every BLoC, every service must work on web
