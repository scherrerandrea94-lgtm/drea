# Drea — Build Phases Playbook

## HOW TO USE THIS FILE
Each phase below is a self-contained build target. At the start of a Claude Code session, say:
> "Read CLAUDE.md and BUILD_PHASES.md. Build the next incomplete phase."

Mark each phase ✅ when complete. Claude Code should check this file, find the first unmarked phase, and build it.

---

## PHASE 0 — Project Setup & GitHub ✅
Initialize the project repository and deployment pipeline.

- Create a new GitHub repo called `drea`
- Initialize with `main` branch
- Create `README.md` with project name "Drea — Andrea's Personal Fitness Companion" and brief description
- Create `.gitignore` (node_modules, .DS_Store, *.log)
- Copy `CLAUDE.md` and `BUILD_PHASES.md` into the repo root
- Create placeholder `index.html` with just a centered "Drea" title on dark background
- Create `netlify.toml` with publish directory set to `.` (root)
- Commit and push to `main`
- **Do NOT set up Netlify** — Andrea will connect the repo to Netlify manually
- Log work in `.agent-log.md`

---

## PHASE 1a — App Shell, Navigation & Firebase ✅
Build the foundational app structure with Firebase connectivity.

**index.html setup:**
- Full HTML document with PWA meta tags (viewport, theme-color, apple-mobile-web-app-capable, etc.)
- CDN script tags: React 18, ReactDOM 18, Babel standalone, Tailwind CSS
- Firebase compat SDK: firebase-app-compat.js + firebase-database-compat.js (version 10.12.0)
- Tailwind config: extend colors with the Drea palette (see CLAUDE.md Color Scheme)
- Global CSS: safe area insets, scrollbar hiding, fade-in animation, system font stack
- `<div id="root">` mount point
- `<script type="text/babel">` containing all React code

**Firebase initialization:**
- Placeholder Firebase config (will be replaced with real credentials later):
```javascript
const firebaseConfig = {
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER.firebaseapp.com",
  databaseURL: "https://PLACEHOLDER-default-rtdb.firebaseio.com",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER.appspot.com",
  messagingSenderId: "000000000000",
  appId: "PLACEHOLDER"
};
```
- Initialize Firebase app and get database reference
- Create `useFirebase(path)` custom hook:
  - Returns `[data, loading]`
  - Sets up `.on('value')` listener, cleans up on unmount
  - Handles null/undefined gracefully
- Create `fbSet(path, value)` and `fbUpdate(path, updates)` helper functions
- Create `localGet(key)` / `localSet(key, value)` for localStorage fallback

**App component:**
- Three-tab navigation: Today, History, You
- Bottom nav bar with custom SVG icons (thin-stroke style):
  - Today: calendar/sun icon
  - History: clock/list icon
  - You: person/circle icon
- Active tab: amber-gold accent color (`#D4A574`), inactive: muted gray
- Active tab indicator: small dot or underline below icon
- Tab content area with fade-in animation on switch
- Safe area padding (bottom nav accounts for `env(safe-area-inset-bottom)`)
- Max-width 480px centered content area

**Placeholder tab content:**
- Today: "Today" header
- History: "History" header
- You: "You" header

**PWA files:**
- `manifest.json`: app name "Drea", short_name "Drea", display standalone, background_color #0f0f0f, theme_color #0f0f0f, start_url "/", id "/"
- `sw.js`: versioned caching, skipWaiting(), activate cache purge, stale-while-revalidate for app assets, network-only for Firebase requests

**Commit and push.** Verify the app loads with tab switching working.

---

## PHASE 1b — Exercise Database & Seeding ✅
Set up the exercise name database in Firebase with the full exercise library.

**Exercise-to-Muscle mapping:**
- Create the full `EXERCISE_MUSCLE_MAP` constant (150+ exercises) covering: chest, back, shoulders, legs, biceps, triceps, traps, core
- This constant lives in the `<script>` block as reference data (not stored in Firebase)

**Firebase exercise names:**
- On app load, check if `drea/exerciseNames` exists in Firebase
- If empty/null, seed it with all keys from `EXERCISE_MUSCLE_MAP` using `db.ref('drea/exerciseNames').push(name)` for each
- Show a brief "Setting up your exercise library..." loading state during seed
- After seeding, the autocomplete database is ready

**useFirebase hook for exercise names:**
- `const [exerciseNamesData] = useFirebase('drea/exerciseNames')`
- Derive sorted array: `Object.values(exerciseNamesData).sort()`

**ExerciseInput component (reusable autocomplete):**
- Text input with dropdown suggestions
- Filters exercise names as user types (case-insensitive partial match)
- Shows all exercises when input is empty or very short
- Tap to select fills the input
- Dropdown dismisses on selection or blur
- Styled per the Drea design language (dark input, subtle border, warm accent on focus)

**Verification:** Open the app, check Firebase console — `drea/exerciseNames` should be populated with 150+ exercises. Type in a text field and see autocomplete suggestions.

**Commit and push.**

---

## PHASE 2a — Split Picker & Workout Start Flow ✅
Build the guided workout initiation flow.

**SPLITS constant:**
- 5 predefined splits + Free Workout option (see CLAUDE.md for full definition)
- Each split has: id, label, icon identifier, defaults (exercise name array), muscles (muscle group array)

**Exercise frequency engine:**
- Build `exerciseFrequency` from `drea/workouts` data: count how many times each exercise name appears across all workouts
- `getSuggestions(split)` function: for a given split, return exercises sorted by user frequency for matching muscle groups, then defaults (deduped)

**Split Picker screen (replaces Today tab content when triggered):**

*Step 1 — Choose a split:*
- Header: "What are you training?"
- Subtitle: "Pick a split for exercise suggestions, or go free."
- Split cards: large tappable buttons, each showing icon + split label + 3 example exercises as preview
- "Free Workout" card with dashed border
- Cancel button to return to Today tab

*Step 2 — Exercise selection:*
- Back arrow to return to Step 1
- Header: split label (e.g., "Chest / Back")
- Subtitle: "Tap to add or remove exercises."
- List of suggested exercises, each as a toggle button:
  - Selected: amber-gold border, checkmark, full opacity
  - Deselected: gray border, empty checkbox, reduced opacity
- All exercises pre-selected by default
- Bottom bar: "Cancel" button + "Start Workout (N)" button with count

**"Start Workout" on Today tab:**
- When no workout exists for today: show hero card with dumbbell icon, "Ready to lift?" heading, "Track your exercises, sets, and reps." subtitle, and "Start Workout" button
- Tapping "Start Workout" opens the Split Picker

**State management:**
- `showPicker` boolean — when true, picker replaces Today tab content
- `selectedSplit` — null (step 1) or split object (step 2)
- `pickerExercises` — array of {name, selected} objects

**Commit and push.**

---

## PHASE 2b — Active Workout Logger ✅
Build the full workout logging experience.

**Active workout state:**
- `isActive` boolean — when true, active logger replaces Today tab content
- `startTime` — Date.now() when workout begins
- `exercises` — array of exercise objects: `{ id, name, sets: [{ id, weight, reps }] }`
- `notes` — optional text
- `activeSplit` — which split was chosen (or null for free)

**ExerciseBlock component:**
- Exercise name: `ExerciseInput` autocomplete component (from Phase 1b)
- Sets table: each set is a row with:
  - Set number label (#1, #2, etc.)
  - Weight input (number, placeholder from lastWeightMap or 0)
  - "×" separator
  - Reps input (number)
  - Delete set button (X icon, right side)
- "Add Set" button below sets:
  - Pre-fills weight from the last set in this exercise block
  - If first set, pre-fills from `lastWeightMap[exerciseName]` (last weight used for this exercise across all workouts)
  - Pre-fills reps as 0
- Remove exercise button (top-right corner of block)
- Per-exercise volume display: subtle text below sets showing total lbs for this exercise

**lastWeightMap:**
- Built from `drea/workouts` data on load
- For each exercise name, stores the highest weight used in the most recent workout containing that exercise
- Used for smart pre-fill on first set

**Active workout view layout:**
- Header: "Logging Workout" + elapsed time display (green pulse dot + "Xm")
- Exercise blocks stacked vertically
- "+ Add Exercise" dashed button
- Notes textarea (optional, 500 char max)
- Total volume display (large, prominent): sum of all (weight × reps) across all sets
- Bottom bar: Cancel (gray) + Finish Workout (amber-gold, 2× width)

**Cancel workout:** Clears all state, returns to Today tab.

**Input behavior:**
- Weight inputs: `type="number"`, `inputmode="decimal"`, step 2.5
- Reps inputs: `type="number"`, `inputmode="numeric"`
- Large tap targets (min 44px height) for mobile usability
- Auto-focus on weight field when a new set is added

**Commit and push.**

---

## PHASE 2c — Finish Workout, PR Detection & Today Summary ✅
Complete the workout lifecycle.

**finishWorkout function:**
- Validate: at least one exercise with a name must exist
- Build workout data object:
```javascript
{
  exercises: { exercise_001: { name, sets: { set_001: { reps, weight }, ... } }, ... },
  totalVolume: number,
  duration: number (minutes from startTime to now),
  notes: string,
  split: string (split id or 'free'),
  timestamp: Date.now()
}
```
- Save to Firebase: `drea/workouts/{todayKey}`
- Update `drea/stats/totalGymDays` (increment by 1)
- Update `drea/stats/lastWorkoutDate` to todayKey

**PR Detection:**
- For each exercise in the finished workout:
  - Calculate best estimated 1RM across all sets: `Math.round(weight * (1 + reps / 30))` (Epley formula)
  - Compare against existing PR in `drea/personalRecords/{exerciseName}`
  - If new est1RM > existing est1RM (or no existing PR): update Firebase with `{ weight, reps, est1rm, date }`
  - Collect all new PRs hit in this workout
- If PRs were hit: show celebration banner (amber-gold background, star icon, list of PR exercises)
- If no PRs: show success toast ("Workout saved! X,XXX lbs total volume.")

**Auto-add exercise names:**
- For each exercise in the finished workout, check if the name exists in `drea/exerciseNames`
- If not, push it to Firebase

**Today's workout summary (post-workout view on Today tab):**
- When `drea/workouts/{todayKey}` exists, show summary card instead of "Ready to lift?"
- Summary shows: date, duration, exercise count, total volume
- Expandable: tap to see full exercise + set details
- "Log Another Workout" secondary button below

**Haptic feedback:**
- `navigator.vibrate && navigator.vibrate(50)` on finish workout
- Stronger haptic on PR: `navigator.vibrate([50, 50, 100])`

**Commit and push.** Test the complete flow: Start → Pick split → Select exercises → Log sets → Finish → See summary.

---

## PHASE 3a — Workout History & Progression Charts ✅
Build the History tab.

**Workout History list:**
- Fetch all workouts from `drea/workouts`
- Sort by date descending (newest first)
- Each entry is an expandable card:
  - Collapsed: date (formatted as "Wed, Apr 14"), exercise count, duration, total volume
  - Chevron indicator for expand/collapse
  - Expanded: full exercise details — each exercise name in accent color, sets listed below
  - Notes shown if present (italic, muted)

**Sub-tabs within History tab:**
- "History" | "Progress" | "PRs"
- Small pill buttons at top of the tab
- Active: amber-gold text + subtle background; Inactive: gray text

**Progression View (sub-tab):**
- Exercise picker: dropdown button showing selected exercise or "Select exercise..."
  - Tap opens scrollable list of exercises that have history data
  - Each item shows exercise name + number of data points
- Line chart (SVG, hand-drawn):
  - X-axis: dates (MM-DD format)
  - Y-axis: estimated 1RM
  - Warm amber-gold line with dots at data points
  - Subtle grid lines
  - Chart fills available width, ~180px tall
- Below chart: recent entries table (last 5 sessions for selected exercise)
  - Date | Weight × Reps | Est. 1RM

**Weekly Volume bar chart:**
- Below exercise progression section
- Header: "Weekly Volume"
- Last 8 weeks of total volume as vertical bars
- Week labels on X-axis
- Amber-gold bars on dark background
- SVG-based, responsive

**Commit and push.**

---

## PHASE 3b — Personal Records Board ✅
Build the PR board on the History tab (sub-tab) and the You tab.

**PR Board (accessible from History > PRs sub-tab AND You tab):**
- List all entries from `drea/personalRecords`
- Sort alphabetically by exercise name
- Each PR card:
  - Exercise name (white, semi-bold)
  - Date achieved (muted, small)
  - Weight × Reps on the right side (large, amber-gold)
  - Est. 1RM below that (small, muted)
- Empty state: star icon + "No personal records yet." + "Hit the gym and set some PRs!"
- Amber-gold border accent on PR cards

**Commit and push.**

---

## PHASE 4a — Body Weight Tracker ✅
Build body weight tracking on the You tab.

**Log weight form:**
- Number input with lbs/kg toggle buttons
- "Log" button (amber-gold)
- Success confirmation with fade-out
- Validates: 50-500 range, non-empty

**Weight trend chart (SVG):**
- Line chart showing all body weight entries over time
- Dots at each data point, line connecting them
- Area fill below line (subtle, 6% opacity)
- Latest weight labeled on the chart
- First and last dates shown below
- Only renders with 2+ entries

**Stats row:**
- Three compact cards in a row:
  - Current weight (latest entry)
  - 7-day average
  - Total change (from first to latest, colored green if down, rose if up)

**Recent entries list:**
- Last 10 entries, newest first
- Each row: weight + "lbs" on left, date on right, delete button (subtle)
- Delete removes from Firebase

**Data storage:**
- `drea/bodyWeights/{timestamp}`: { weight, unit, date, timestamp }
- Store weight in lbs internally (convert from kg if needed: × 2.20462)

**Commit and push.**

---

## PHASE 4b — Exercise Manager ✅
Build the exercise database manager on the You tab.

**Exercise Manager section:**
- Header: "Exercises (N)" with count
- Toggle: "Single add" / "Bulk add" mode

**Single add:**
- Text input + "Add" button
- Duplicate detection (case-insensitive)
- Toast on success/duplicate

**Bulk add:**
- Textarea: "Paste exercise names, one per line..."
- "Add All" button
- Deduplicates against existing entries
- Toast showing count added

**Search:**
- Search input above the list
- Filters as you type

**Exercise list:**
- Alphabetically sorted
- Each row: exercise name + delete button (X icon)
- Delete removes from `drea/exerciseNames/{key}`

**Commit and push.**

---

## PHASE 5a — Rest Timer ✅
Build the minimal rest timer for use during active workouts.

**Rest timer component:**
- Small circular SVG timer (48px diameter)
- Circular progress ring: amber-gold stroke on dark background
- Center text: time remaining in M:SS format
- Preset buttons row: 60s, 90s, 2m, 3m (compact pills)
- Start / Restart / Stop controls

**Behavior:**
- Timer appears inline within the active workout view, below the most recently edited exercise block
- Auto-starts when a set is saved (weight > 0 and reps > 0)
- Default duration: 90 seconds
- On completion: vibrate (`navigator.vibrate(200)`), show "Rest done!" briefly, then collapse
- Dismissible: tap X to hide timer without stopping
- Does NOT take up permanent screen space — only visible during active rest

**useRestTimer hook:**
- `restDuration`, `setRestDuration`
- `timeLeft`, `isResting`
- `startTimer(duration?)`, `stopTimer()`
- Interval-based countdown, cleans up on unmount

**Commit and push.**

---

## PHASE 5b — Progressive Overload Suggestions ✅
Build smart suggestions that appear during workout logging.

**Last session data:**
- For each exercise being logged, look up the most recent workout containing that exercise
- Extract: sets, reps, weight from the last time Andrea did this exercise

**Suggestion engine (inline, below exercise name):**
- Shows only when the exercise name matches a previously logged exercise
- "Last time: 185 lbs × 8 reps" — muted text
- Smart suggestion with rationale:
  - If last reps ≥ 10 and weight > 0: "Try {weight + 5} lbs — you hit {reps} reps last time"
  - If last reps > 0 and < 12: "Try {reps + 1} reps at {weight} lbs"
  - Otherwise: "Match last session, then push"
- "Use this" tap target to auto-fill the suggestion into the current set
- Subtle styling: sage green accent, small text, doesn't crowd the input area
- First-time exercises show: "First time logging this one" in muted italic

**Commit and push.**

---

## PHASE 5c — Weekly Summary Stats ✅
Build the weekly summary cards on the Today tab.

**Stats cards (horizontal scroll row at top of Today tab):**
- Gym Days This Week: count workouts with dates in the current Sun-Sat week
- Weekly Volume: sum of totalVolume for workouts this week, formatted with commas
- Streak: consecutive weeks with at least 1 workout (computed from workout dates)

**Streak logic:**
- Look at all workout dates, group by week (Sun-Sat)
- Count consecutive weeks (ending at current week) that have at least one workout
- Store/update in `drea/stats/currentStreak`

**Card styling:**
- Compact horizontal scroll container
- Each card: dark bg, subtle border, stat number in amber-gold (large), label below (muted, small)
- No emoji — just clean number + label

**Commit and push.**

---

## PHASE 6 — AI Coach Panel ✅
Build the Claude-powered coaching layer.

**Floating coach button:**
- Positioned: bottom-right, 16px above the nav bar, 16px from right edge
- 52px circle, amber-gold background with subtle shadow
- SVG icon inside (sparkle/brain/lightning — something "AI")
- `z-index` above content, below modals

**Slide-up panel:**
- Triggered by tapping the coach button
- Slides up from bottom, covers ~80% of viewport height
- Dark background with handle bar at top (grab indicator)
- Close button (X) top-right
- Tap outside or swipe down to dismiss

**Chat interface inside panel:**
- Messages list: assistant messages left-aligned (dark card), user messages right-aligned (amber-tinted card)
- Assistant avatar: small amber circle with sparkle icon
- Loading indicator: three bouncing dots
- Input bar at bottom: text input + send button

**Anthropic API integration:**
- POST to `https://api.anthropic.com/v1/messages`
- Model: `claude-sonnet-4-20250514`
- No API key in code — handled by artifact environment (or placeholder for deployed version)
- System prompt builder function that injects:
  - Andrea's workout history (last 10 workouts summarized)
  - Body weight trend (last 5 entries)
  - Muscle group frequency (which muscles trained how often in last 30 days)
  - Personal records list
  - Current date and day of week
  - Instruction: "You are Drea, Andrea's personal AI fitness coach. Be warm, direct, and knowledgeable. Keep responses concise. Reference her actual data."

**Quick questions (shown when conversation is fresh):**
- "What should I train next?"
- "Am I making progress?"
- "What muscles am I neglecting?"
- "Give me a training tip"

**Post-workout insight (stretch goal for this phase):**
- After `finishWorkout` runs, if the coach panel has been used at least once, auto-generate a brief insight
- Show as a subtle card on the Today tab below the workout summary
- "Solid chest/back day. Volume up from last week. Consider adding an extra back exercise next time."

**Error handling:**
- Network errors: friendly message ("Coaching is offline right now. Try again later.")
- Timeout: 15-second AbortController
- Sandbox blocked: "Coach works fully when deployed. For now, check the quick tips!"

**Commit and push.**

---

## PHASE 7 — Polish, PWA & Accessibility ✅
Final quality pass across the entire app.

**Animations & transitions:**
- Tab switch: `fadeIn 0.15s ease-in` on tab content
- Set save: brief green flash confirmation
- PR celebration: amber glow animation + scale bounce on PR banner
- Workout finish: success animation
- Button presses: `active:scale-[0.98]` on all tappable elements
- Timer completion: pulse animation

**Empty states (every section needs one):**
- Today (no workouts ever): Warm welcome message for Andrea
- History (no workouts): "No workouts logged yet — let's change that."
- Progression (no exercise selected): "Pick an exercise to see your progress over time."
- PRs (none yet): Star icon + "No personal records yet. Hit the gym and set some PRs!"
- Body weight (no entries): "Start tracking to see your trend."
- Coach (first open): Greeting from Drea

**Offline handling:**
- Service worker caches app shell
- Subtle "Offline" indicator when Firebase is unreachable
- localStorage fallback for critical writes (queue and sync when back online)

**Accessibility:**
- `aria-label` on all icon-only buttons and nav items
- `role="main"` on main content area
- `id` and `name` attributes on all form inputs
- `<label>` associations or `aria-label` on form fields
- Semantic heading hierarchy (h1 for app name, h2 for sections, h3 for subsections)

**Security:**
- `_headers` file for Netlify: CSP (whitelist unpkg.com, cdn.tailwindcss.com, Firebase domains, api.anthropic.com, `unsafe-inline`, `unsafe-eval`), X-Frame-Options DENY, X-Content-Type-Options nosniff
- Input sanitization: strip HTML from all user-entered text (exercise names, notes, body weight)
- Max-length limits on text inputs

**Performance:**
- Preload CDN scripts with `<link rel="preload">`
- Memoize expensive computations (`useMemo` for exercise frequency, workout history sorting, chart data)
- Debounce search/filter inputs

**Final visual audit:**
- Every screen matches the "quiet premium" design language
- No emoji in structural UI
- Consistent spacing, colors, typography
- Test on iPhone SE viewport (375px) and iPhone 14 (390px)

**Commit and push.** Full end-to-end test of all features.

---

## PHASE 8 — Stretch Features ✅
Optional enhancements. Build any/all based on available time.

**Custom splits:**
- Let Andrea create her own splits beyond the 5 defaults
- "Create Split" flow: name, select muscle groups, choose default exercises
- Stored in `drea/customSplits/`
- Appear alongside default splits in the picker

**Workout streak milestones:**
- Milestone celebrations at 7, 14, 30, 60, 90, 180, 365 consecutive workout weeks
- Special banner/animation when a milestone is hit
- Milestone history stored in Firebase

**Muscle group heat map:**
- Visual body diagram (simplified SVG outline)
- Color-coded by training recency: green (trained this week), yellow (trained last week), gray (2+ weeks ago)
- Displayed on the Today tab or You tab

**Pushover notifications:**
- Google Apps Script webhook that sends daily reminders via Pushover
- "Rest day? Your legs are fresh — consider training tomorrow"
- Streak-at-risk alerts
- Weekly summary push

**Share workout card:**
- Generate a beautiful summary image (HTML → canvas → PNG)
- Workout date, exercises, total volume, any PRs
- "Share" button on workout summary
- Uses Web Share API

**Voice logging:**
- Speech-to-text for hands-free set entry
- "185, 8" → fills weight: 185, reps: 8
- Microphone button on each set row
- Uses Web Speech API

**Commit and push.**

---

## PHASE 9 — Tools & Insights ✅
Quality-of-life utilities and training intelligence.

**Plate calculator:**
- Input target weight → shows exact plates to load per side (assumes 45 lb Olympic bar; 35 lb women's bar toggle)
- Available plates: 45, 35, 25, 10, 5, 2.5 lbs
- Visual horizontal barbell diagram with colored plate stack
- Preset weight buttons (95, 135, 155, 185, 225, 275, 315, 365)
- Accessible via button in ExerciseBlock during active workout AND as standalone tool in You tab

**Data export:**
- "Export to CSV" button in You tab
- One row per set: Date, Split, Exercise, Set#, Weight, Reps, Volume, Duration, Notes
- Triggers browser download of `drea-workouts.csv`

**Deload week detection:**
- Analyze last 8 weeks of volume data
- If streak ≥ 4 weeks AND no light week (< 50% avg) in last 6 weeks AND all last 4 training weeks ≥ 70% of avg → suggest a deload
- Dismissible card shown on Today tab (suppressed for the rest of the day via localStorage)

**Commit and push.**

---

## PHASE 10 — Workout Templates & Superset Mode ✅
Reusability and advanced logging patterns.

**Workout Templates:**
- "Save as Template" button in TodaySummary — opens modal with name input + exercise preview
- Templates saved to Firebase at `drea/templates/{key}`: { name, split, exercises[], createdAt }
- Quick-start section in SplitPickerStep1 — if templates exist, show them above the split cards
- Tapping a template starts the workout directly (skips exercise picker)
- Templates section in YouTab: list all templates with split label, exercise count, "Use" + delete buttons
- `handleSaveTemplate` / `handleDeleteTemplate` in App; `templatesData` Firebase listener

**Superset Mode:**
- Small "SS" link button rendered between consecutive exercise blocks in ActiveWorkoutLogger
- Clicking links two exercises into a superset (amber left-border accent + "SS" badge on both)
- Clicking again unlinks them
- Superset state managed locally in ActiveWorkoutLogger (`supersets` Set of paired IDs)
- On save: `supersetGroup` field added to paired exercises in Firebase
- WorkoutCard and TodaySummary show "SS" badge next to exercises in a superset

**Commit and push.**

---

## POST-LAUNCH IDEAS (Future Sessions)
- Apple Health / Google Fit integration for heart rate
- Spotify integration: track what Andrea listens to during workouts
- Gym geofencing: auto-detect arrival and prompt to start workout
- Photo progress: monthly body photos with side-by-side comparisons
- AI-generated weekly workout plans with periodization
- Deload week detection and suggestions
- Superset / circuit training mode
- Plate calculator: "How to load 225 on the bar"
- Export workout data to CSV
- Dark/light theme toggle (if Andrea ever wants it)
