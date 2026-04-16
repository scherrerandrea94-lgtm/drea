# Drea — Andrea's Personal Fitness Companion

**See BUILD_PHASES.md for the sequential build playbook. Each session should read both files and build the next incomplete phase.**

## PROJECT OVERVIEW
Drea is a personal fitness PWA built exclusively for Andrea. It combines a guided workout flow (split-based exercise selection, per-set logging with progressive overload suggestions), workout history and progression tracking, personal record detection, body weight tracking, and an AI coaching layer powered by Claude. The app is designed to feel like a premium personal trainer — calm, guided, and intelligent.

**Live URL:** https://drea.netlify.app *(update once Netlify is configured)*
**Repo:** *(update once GitHub repo is created)*
**Deploy:** Netlify auto-deploy from `main` branch via GitHub

---

## ARCHITECTURE RULES (MANDATORY)

### Single-File HTML Architecture
- **The entire app lives in `index.html`** — all React components, styles, and logic in one file
- React 18 via CDN (babel standalone for JSX transformation)
- Tailwind CSS via CDN
- No build step, no npm, no bundler
- This is non-negotiable — do not split into multiple files except for the service worker (`sw.js`)

### CDN Dependencies
```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
```

### Data Backend: Firebase Realtime Database
- Use Firebase JS SDK via CDN (compat version)
- Firebase config will be provided — use placeholder config until then
- All data stored in Firebase under the `drea/` root path
- Real-time listeners for live data updates
- localStorage fallback for offline resilience

### Design Language — "Quiet Premium"
This app should feel like Oura Ring or Whoop — not a neon gaming dashboard.

**Color Scheme:**
- **Background:** Deep charcoal (`#0f0f0f`)
- **Cards:** Dark gray (`#1a1a1a`)
- **Card borders:** Subtle (`#262626` or `border-gray-800`)
- **Primary accent:** Warm amber-gold (`#D4A574`) — used sparingly for CTAs, active states, PRs
- **Secondary accent:** Soft rose (`#C08B8B`) — for highlights, streaks, celebratory moments
- **Success:** Muted sage green (`#7A9E7E`)
- **Danger/Warning:** Dusty rose (`#C47070`)
- **Text primary:** Warm off-white (`#F0EDE8`)
- **Text secondary:** Muted gray (`#8A8680`)
- **Text tertiary:** Dark gray (`#4A4744`)

**Typography:**
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Clean, proportional fonts everywhere — NO monospace except for numbers/stats
- Font weights: 400 for body, 500 for labels, 600 for headings, 700 for hero numbers
- Keep font sizes restrained: 11-13px for body, 14-16px for headings, 20-28px for hero stats only

**Spacing & Layout:**
- Generous whitespace — let elements breathe
- Card padding: 16-20px
- Section gaps: 16-24px
- Border radius: 12-16px for cards, 8-10px for buttons, full-round for pills
- No visible borders on every element — use subtle shadows or bg contrast instead
- Max-width 480px centered for content area

**Iconography:**
- Custom SVG icons — NO emoji in the UI (emoji are for chat/notifications only)
- Icons should be thin-stroke, 1.5-2px stroke weight, matching text color
- Use Lucide-style icon design language

**Interactions:**
- `active:scale-[0.98]` on tappable elements
- `transition-all duration-200` on state changes
- Haptic feedback on key actions: `navigator.vibrate && navigator.vibrate(50)`
- Subtle fade-in animations on tab switches

---

## NAVIGATION STRUCTURE

**Three tabs only. No more.**

| Tab | Label | Purpose |
|-----|-------|---------|
| Today | "Today" | Home screen: weekly summary stats, start/view today's workout |
| History | "History" | Past workouts list, progression charts, exercise search |
| You | "You" | Body weight tracking, personal records, exercise manager, settings |

**Plus:** A floating coach button (bottom-right, above nav) that opens a slide-up AI panel. This is NOT a tab.

---

## CORE FEATURES

### 1. Today Tab (Home Screen)
The first thing Andrea sees. Clean, focused, actionable.

**Top section — Weekly summary cards (horizontal scroll):**
- Gym Days: X this week (with small target indicator)
- Weekly Volume: total lbs lifted this week
- Current Streak: consecutive workout weeks
- These are compact stat cards, not large blocks

**Main section — Workout state machine:**
- **No workout today:** Hero card with "Ready to lift?" message and prominent "Start Workout" button
- **Workout in progress:** Active session takes over the tab (see Workout Flow below)
- **Workout completed:** Today's workout summary card showing exercises, volume, duration, any PRs hit. "Log Another Workout" secondary button.

### 2. Workout Flow (The Core Experience)
This is the most important feature. Uses a split-picker pattern for guided workout selection.

**Step 1 — Split Picker ("What are you training?"):**
- Full-screen picker with split cards:
  - 💪 Chest / Back
  - 🔁 Biceps / Triceps
  - 🏋️ Shoulders
  - 🦵 Legs / Abs
  - 🔗 Back / Traps
  - 🎯 Free Workout (log anything)
- Each split card shows 2-3 example exercises as preview text
- Tapping a split advances to Step 2

**Step 2 — Exercise Selection:**
- Shows suggested exercises for the chosen split
- Exercises are pre-selected (toggled on) by default
- Sorted by Andrea's usage frequency (most-used first), then split defaults
- Tap to toggle exercises on/off
- "Start Workout (N)" button at bottom with count of selected exercises
- Back button to return to split picker

**Step 3 — Active Workout Logger:**
- Header: "Logging Workout" with elapsed time (green pulse dot + Xm)
- Exercise blocks stacked vertically, each containing:
  - Exercise name (editable, with autocomplete from exercise database)
  - Per-set rows: weight (lbs) input + reps input
  - "Add Set" button — pre-fills weight from last set, or from lastWeightMap if first set
  - Delete set (X button, right side)
  - Per-exercise volume display (subtle, below sets)
  - "Last time" indicator showing previous session's numbers for this exercise
- "+ Add Exercise" dashed button below all exercise blocks
- Notes textarea (optional)
- Total volume display (prominent)
- Cancel / Finish Workout buttons

**On Finish:**
- Save to Firebase: `drea/workouts/{YYYY-MM-DD}/`
- Calculate totalVolume, duration
- PR detection: compare each exercise's best estimated 1RM (Epley: weight × (1 + reps/30)) against `drea/personalRecords/{exerciseName}`
- If new PR: update Firebase, show celebration banner (amber glow, star icon)
- Auto-add any new exercise names to `drea/exerciseNames/`
- Return to Today tab showing completed workout summary

### 3. History Tab
**Workout History:**
- Scrollable list of past workouts, newest first
- Each entry: date, exercise count, duration, total volume
- Tap to expand: full exercise + set details
- Clean accordion-style expand/collapse

**Progression View:**
- Exercise picker dropdown (populated from exercises with history data)
- Line chart (SVG) showing estimated 1RM over time for selected exercise
- Recent entries table below chart
- Weekly volume bar chart (last 8 weeks)

### 4. You Tab
**Body Weight Tracker:**
- Log weight form: number input with lbs/kg toggle
- Trend line SVG chart (last N entries)
- Stats: Current weight, 7-day average, total change
- Recent entries list with delete option

**Personal Records Board:**
- All-time PRs by exercise
- Each PR shows: exercise name, weight × reps, estimated 1RM, date achieved
- Amber/gold accent styling for PR cards

**Exercise Manager:**
- Searchable list of all exercises in the database
- Add single exercise
- Bulk add (paste list, one per line)
- Delete exercises
- Exercise count display

### 5. AI Coach (Slide-Up Panel)
- Floating button (bottom-right, 56px, above nav bar)
- Opens slide-up panel (80vh height) with chat interface
- Anthropic API integration (model: `claude-sonnet-4-20250514`)
- System prompt includes: workout history summary, body weight trend, muscle group frequency, recent PRs, Andrea's stats
- Quick-action suggestions: "What should I train next?", "Am I overtraining?", "Give me a tip"
- Post-workout insight: auto-generated brief note after finishing a workout

### 6. Rest Timer
- Minimal circular SVG timer (48px diameter)
- Appears inline after saving a set during active workout
- Preset buttons: 60s, 90s, 120s, 180s
- Auto-starts on set save (configurable)
- Vibration on completion
- Dismissible — does NOT dominate the screen

### 7. Progressive Overload Engine
- When Andrea logs an exercise she's done before, show inline:
  - "Last time: {weight} × {reps}" in muted text below exercise name
  - Smart suggestion with rationale (e.g., "Try 190 lbs — you hit 8 reps at 185 last time")
  - One-tap to apply suggested weight/reps
- Logic:
  - If last reps ≥ 10 and weight > 0: suggest adding 5lbs (or 2.5 if under 100lbs)
  - If last reps < 12: suggest adding 1 rep at same weight
  - Otherwise: suggest matching last session

---

## WORKOUT SPLITS & EXERCISE DATABASE

### Default Splits
```javascript
const SPLITS = [
  {
    id: 'chest_back', label: 'Chest / Back', icon: 'chest-back',
    defaults: ['Bench Press','Incline Dumbbell Press','Cable Fly','Lat Pulldown','Seated Cable Row','Dumbbell Pullover'],
    muscles: ['chest','back'],
  },
  {
    id: 'bis_tris', label: 'Biceps / Triceps', icon: 'bis-tris',
    defaults: ['Barbell Curl','Hammer Curl','Incline Dumbbell Curl','Preacher Curl','Tricep Pushdown','Skull Crushers','Overhead Tricep Extension','Close Grip Bench Press'],
    muscles: ['biceps','triceps'],
  },
  {
    id: 'shoulders', label: 'Shoulders', icon: 'shoulders',
    defaults: ['Overhead Press','Lateral Raise','Front Raise','Face Pulls','Reverse Flyes','Arnold Press','Cable Lateral Raise','Upright Row'],
    muscles: ['shoulders'],
  },
  {
    id: 'legs_abs', label: 'Legs / Abs', icon: 'legs-abs',
    defaults: ['Squat','Leg Press','Romanian Deadlift','Leg Curl','Leg Extension','Calf Raise','Cable Crunch','Hanging Leg Raise','Plank'],
    muscles: ['legs','core'],
  },
  {
    id: 'back_traps', label: 'Back / Traps', icon: 'back-traps',
    defaults: ['Deadlift','Barbell Row','T-Bar Row','Lat Pulldown','Seated Cable Row','Shrugs','Face Pulls'],
    muscles: ['back','traps'],
  },
];
```

### Exercise-to-Muscle Mapping
Include a comprehensive EXERCISE_MUSCLE_MAP (150+ exercises covering chest, back, shoulders, legs, biceps, triceps, traps, core). This powers the frequency-based suggestion engine — when Andrea picks a split, exercises she does most often for those muscle groups appear first.

### Exercise Database Seeding
On first load (or if `drea/exerciseNames` is empty), seed Firebase with all exercise names from the EXERCISE_MUSCLE_MAP keys. This gives Andrea a complete autocomplete database from day one.

---

## FIREBASE DATA STRUCTURE
```
drea/
  exerciseNames/
    {pushKey}: "Bench Press"
    {pushKey}: "Squat"
    ...
  workouts/
    2026-04-14/
      exercises/
        exercise_001/
          name: "Bench Press"
          sets/
            set_001: { reps: 8, weight: 185 }
            set_002: { reps: 8, weight: 185 }
            set_003: { reps: 6, weight: 185 }
        exercise_002/
          name: "Incline Dumbbell Press"
          sets/
            set_001: { reps: 10, weight: 65 }
            ...
      totalVolume: 12400
      duration: 55
      notes: ""
      split: "chest_back"
      timestamp: 1713100800000
  personalRecords/
    "Bench Press": { weight: 185, reps: 8, est1rm: 234, date: "2026-04-14" }
    "Squat": { weight: 225, reps: 6, est1rm: 270, date: "2026-04-12" }
  bodyWeights/
    {timestamp}/
      weight: 135.5
      unit: "lbs"
      date: "2026-04-14"
      timestamp: 1713100800000
  stats/
    totalGymDays: 0
    currentStreak: 0
    lastWorkoutDate: ""
```

---

## DEVELOPMENT WORKFLOW

### GitHub Setup
- Repo: *(update once created — e.g., `your-username/drea`)*
- Branch: `main`
- Auto-deploy to Netlify from `main`

### Testing
- Test locally by opening `index.html` in a browser before every commit
- Verify mobile responsiveness using browser dev tools (iPhone SE / iPhone 14 viewport)
- Firebase operations should gracefully handle offline state
- Test the split picker → exercise selection → active logging → finish flow end-to-end

### Deployment
- `git add . && git commit -m "description" && git push origin main`
- Netlify auto-deploys from main branch
- Verify at the live URL after each push

**DEPLOYMENT RULE:** After completing any phase or significant change, run `git add . && git commit -m "Phase X complete" && git push origin main` to deploy to Netlify. Every session should end with a deploy.

### Session Continuity
- Log work in `.agent-log.md` at the end of each session
- Track incomplete work in `.wip.md` for the next session to pick up
- Reference this CLAUDE.md at the start of every session

---

## TONE & UX GUIDELINES
- This app is for ONE person — Andrea. Design for her, not for a general audience.
- "Quiet premium" aesthetic. Think wellness app meets personal trainer.
- The workout flow should feel guided and effortless — pick a split, confirm exercises, log sets, done.
- Celebrate PRs warmly. Empty states should have personality ("No workouts yet — let's change that").
- Dark mode only. No light mode toggle needed.
- Minimal visual noise. If an element doesn't help Andrea during her workout, it shouldn't be on screen.
- NO emoji in the structural UI (headers, labels, nav). Emoji are acceptable only in chat/coach responses and celebration banners.
- Numbers and stats use tabular/monospace rendering (`font-variant-numeric: tabular-nums` or `font-mono` on number elements only).
