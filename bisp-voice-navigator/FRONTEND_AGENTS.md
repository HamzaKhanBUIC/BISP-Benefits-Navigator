# Project: BISP Benefits Navigator — UI Polish (USAII Global AI Hackathon 2026)

## What this project is
An AI-powered Benefits Navigator helping low-literacy citizens in Pakistan
navigate the Benazir Income Support Programme (BISP) via voice and text.
Backend (Deepgram STT, Gemini 2.5 Flash, ElevenLabs TTS) is complete and
working. Your job is UI/UX polish only.

## Tech stack
- Next.js 16, App Router
- Tailwind CSS
- Icons: lucide-react (NOT emojis, NOT inline SVG hand-drawn unless noted)
- Fonts: Inter (English), Noto Nastaliq Urdu (Urdu) via next/font/google
- Deploy target: Vercel / Cloud Run

## ABSOLUTE RULES — violating any of these breaks the hackathon submission

1. **Never modify `app/api/chat/route.ts`.** Backend is frozen.
2. **Never change the API payload contract.** Frontend must keep sending
   FormData with exactly: `text` (string), `audio` (Blob), `history` (JSON
   string). Backend returns `{ transcript, aiText, audioBase64, ttsError, history }`.
   Do not rename, restructure, or add/remove fields on either side.
3. **Never remove or alter the wording of:**
   - The transparency badge: "Disclaimer: AI-assisted guidance based on BISP
     2026 Guidelines. Not an official government decision."
   - The HelpModal content: BISP Toll-Free Helpline, 8171 SMS info, Anti-Scam
     warnings.
   These satisfy hackathon judging criteria (Responsible AI / Human-in-the-Loop).
   You may restyle them, never delete or reword them.
4. **Never remove or break `onPointerDown` / `onPointerUp` handlers** on the
   voice button in VoiceAssistantCard.tsx. These drive the walkie-talkie
   record/release behavior. You may restyle the button; the handlers and the
   `appState` state machine (`idle | recording | processing | speaking`)
   must keep working exactly as before.
5. **Zero emojis anywhere in UI.** Use lucide-react icons exclusively
   (mic, send, help/circle-question, alert-triangle, check-circle, x, etc.).
6. **No placeholder/dummy images.** If imagery is added, it must be final,
   real, appropriately licensed/generated — never lorem-picsum, unsplash
   placeholders, or "image coming soon" boxes.
7. **Do not touch core state management.** Component state shape (appState,
   history, messages array, etc.) stays as-is unless a phase prompt
   explicitly says to extend it (e.g. adding a `isTyping` UI-only flag is
   fine; renaming `history` is not).

## Design system (apply consistently across all phases)

**Color palette**
- Primary: Emerald green (trust, growth) — e.g. `emerald-600` / `emerald-500`
- Secondary: Official blue — e.g. `blue-700` / `blue-600`
- Background: clean white / `slate-50`
- Body text: `#0F172A` (slate-900) ALWAYS — never light gray, never below
  WCAG AA contrast. Target users may have cheap screens or be outdoors.
- Error/scam-warning: `red-600` / `amber-600` (not used decoratively —
  reserved for genuine warnings)

**Typography**
- English: Inter (next/font/google)
- Urdu: Noto Nastaliq Urdu (next/font/google) — required, not a generic
  Arabic font. Apply via a `font-urdu` utility class or `lang="ur"`
  attribute-based CSS, auto-detected or toggled per message.
- Sizes: generous. Minimum 16px body text, 18-20px+ preferred for primary
  content, given low-literacy/accessibility target users. Headings bold
  and large.

**Interaction & motion**
- Tactile feedback on all tappable elements: `hover:scale-105 active:scale-95
  transition-transform`
- Layout shifts (e.g. AI response expanding) must use
  `transition-all duration-300` — no jitter/jump.
- Big tappable targets (min 44x44px touch target, prefer larger).
- Glassmorphism (`backdrop-blur-md bg-white/80` or similar) for modal and
  floating elements only — not overused everywhere.

**Aesthetic reference points** (for your own calibration, do not literally
copy any copyrighted UI): Pi by Inflection / ChatGPT Voice Mode (voice
button mechanics), Gov.uk Design System / Code for America (trust &
accessibility patterns), modern glassmorphic dashboards (depth/material).

## Workflow rules for you (the agent)
- Before editing any component, read the full current file first.
- Make one phase's worth of changes per turn. Do not jump ahead to
  components not yet requested.
- After changing a component, briefly state what you changed and flag
  anything you were unsure about — don't silently guess on ambiguous
  instructions affecting the API contract or required text content.
- If a requested visual change would require touching `app/api/chat/route.ts`
  or changing the payload contract, STOP and flag it instead of doing it.


PHASE 0 — Project Setup

Set up the design foundation for this Next.js 16 App Router project. Do not
touch any component logic yet — this phase is configuration only.

1. Install and configure Tailwind CSS if not already present (check first;
   this is a fresh setup per the brief).
2. Install lucide-react for icons.
3. Configure next/font/google for two fonts:
   - Inter (weights: 400, 500, 600, 700, 800) as the default sans font
   - Noto Nastaliq Urdu (weights available for that font) as a secondary
     font, exposed as a CSS variable (e.g. --font-urdu) and a Tailwind
     utility (e.g. `font-urdu`) for use on Urdu text
4. In tailwind.config, extend the theme with this palette as named tokens
   (don't just use raw Tailwind defaults inline everywhere — define them
   once):
   - brand-emerald: emerald-600 (#059669) as primary
   - brand-blue: blue-700 (#1d4ed8) as secondary
   - ink: #0F172A (slate-900) for all body text
   - surface: white / slate-50 for backgrounds
5. Add the font variables to the root layout (app/layout.tsx) `<html>` tag
   so they're available globally. Set the default body text color to the
   `ink` token.
6. Do NOT redesign layout.tsx beyond font/theme wiring. Do NOT touch
   app/api/chat/route.ts.

When done, list exactly what was installed/configured and confirm
`npm run dev` / `npm run build` succeeds with no errors.


PHASE 1 — Landing Page (app/page.tsx)

Redesign app/page.tsx — the landing page that lets the user choose between
"Voice Assistant" mode and "Text Chat" mode. This sets the visual tone for
the whole app, so get the design system right here; later phases will match it.

Requirements:
- "Modern Civic Tech / GovTech" feel: official, trustworthy, modern — not
  like a typical old government website. Use the emerald/blue/white palette
  and `ink` text color from the design tokens set up in Phase 0.
- Clear, large, high-contrast header identifying this as a BISP benefits
  navigator (cite BISP — Benazir Income Support Programme — directly).
- Two large, unmistakable, tappable mode-selection cards/buttons:
  "Voice Assistant" and "Text Chat". These must be big targets (low-literacy,
  possibly stressed users, cheap Android phones) — not small nav links.
  Use lucide-react icons (e.g. Mic, MessageSquare) — no emojis.
- A visible, easy-to-find entry point to open HelpModal (e.g. a persistent
  help/question-mark icon button, top corner) — even though HelpModal itself
  isn't being built in this phase, wire a state hook and a placeholder
  onClick if the component doesn't exist yet, or import it if it does.
- Apply hover/active tactile feedback (scale transforms) per the global
  design system.
- Fully responsive: must look excellent on small Android screens first,
  scale up gracefully to desktop.
- Keep whatever routing/state logic currently controls which mode is shown
  — only restyle, don't restructure how mode-switching works unless it's
  trivially presentational.

Show me the new app/page.tsx in full when done, and briefly describe the
visual choices you made (layout, color usage, iconography).


PHASE 2 — Voice Assistant Card (components/VoiceAssistantCard.tsx)

Redesign components/VoiceAssistantCard.tsx — the walkie-talkie style voice
interface. This is the centerpiece of the demo, so it needs the most polish.

CRITICAL CONSTRAINT — read first:
- Do NOT remove, rename, or alter the behavior of the `onPointerDown` and
  `onPointerUp` event handlers on the central button. They drive the actual
  recording start/stop logic against the backend. You may restyle the
  button completely — wrap it, layer elements around it, add SVG
  ornamentation — but the same DOM element (or one with identical handlers
  attached) must remain the press target, and the press/release logic must
  fire exactly as before.
- Do NOT change the `appState` state machine (`idle | recording | processing
  | speaking`) or how state transitions are triggered. You're styling
  reactions to these states, not inventing new ones.
- Do NOT change how `audioBlob` and `history` are sent to the backend, and
  do NOT change how the returned MP3 base64 audio is played.

Design requirements:
- Inspired by ChatGPT Voice Mode / Pi by Inflection: one massive circular
  button, centered, dominating the screen — not a small mic icon in a corner.
- The button must visually communicate all 4 states distinctly:
  - idle: calm, inviting, brand emerald/blue gradient, subtle resting
    animation (gentle breathing scale or soft glow pulse, not distracting)
  - recording: clear "listening" treatment — layered pulsing rings
    (like a Siri/voice orb), warmer or more saturated color, animation
    should feel "alive" but not chaotic. Use multiple staggered
    animate-ping/animate-pulse rings of different sizes/opacities/delays
    rather than one flat pulse.
  - processing: a thinking/loading treatment — e.g. a rotating gradient
    ring or subtle shimmer — communicate "working on it" clearly.
  - speaking: an "audio output" treatment — could be a waveform-like pulse
    synced loosely to perceived speech rhythm, distinct from the recording
    state so users don't confuse listening vs. responding.
- Tactile press feedback: `active:scale-95` (or similar) on press, smooth
  transition back on release.
- Large, readable status text below/around the button (e.g. "Hold to speak",
  "Listening...", "Thinking...", "Speaking...") in Inter, `ink` color,
  generous size. If you show the same text in Urdu, use the `font-urdu`
  class.
- No emojis. Any supporting icons (mic, stop, etc.) via lucide-react.
- Keep the transparency disclaimer badge ("Disclaimer: AI-assisted guidance
  based on BISP 2026 Guidelines. Not an official government decision.")
  visible at the bottom — restyle it (e.g. small, muted, centered) but do
  not remove or reword it.
- Fully responsive — this is a mobile-first interface.

Show me the full updated file. Confirm explicitly that onPointerDown/
onPointerUp and the appState logic are unchanged from before, and point out
exactly which lines they're on.


PHASE 3 — Text Chat Dashboard (components/LowLiteracyDashboard.tsx)

Redesign components/LowLiteracyDashboard.tsx — the ChatGPT-style text chat
interface.

CRITICAL CONSTRAINT — read first:
- Do NOT change how `text` and `history` are sent to the backend, or how
  the response is parsed/appended to the conversation. Styling and
  structure only.

Design requirements:
- Clean, minimalist chat bubble layout:
  - User messages: emerald/green bubble, right-aligned
  - AI messages: light gray/slate bubble, left-aligned
  - Clear visual distinction, generous padding, rounded corners (large
    radius, e.g. rounded-2xl) for a friendly but professional feel
- The AI is instructed to output checklists like "✅ Next Steps:" followed
  by bullet points. Render these beautifully:
  - Use `whitespace-pre-wrap` at minimum so line breaks are preserved
  - Replace any emoji-style checkmarks the AI text contains with a
    lucide-react CheckCircle icon rendered alongside the line, OR style
    the line itself with a check icon — do not display raw emoji
    characters in the rendered UI. (If literal emoji come through in the
    AI's text content, strip/replace them at render time rather than
    passing them through raw.)
  - Wrap message containers in `transition-all duration-300` so growing
    content (e.g. an expanding checklist) animates smoothly instead of
    jittering/snapping.
- Add a polished typing/processing indicator (three animated dots or
  similar) shown while waiting for the AI response — no spinner-as-emoji,
  build it with CSS/Tailwind.
- Input field: large, high-contrast, clearly tappable send button
  (lucide-react Send icon), generous touch target, sticky to bottom of
  viewport on mobile.
- Keep the transparency disclaimer badge visible at the bottom of the
  dashboard, restyled to match this component's look but with unchanged
  wording.
- Support both English and Urdu text rendering — apply `font-urdu` to
  message content when the text is Urdu (detect via simple Unicode range
  check on the string, or via existing language metadata if the app
  already tracks it — check first before inventing new detection logic).
- Fully responsive, mobile-first.

Show me the full updated file, and confirm the `text`/`history` payload
logic is untouched.


PHASE 4 — Help Modal (components/HelpModal.tsx)

Redesign components/HelpModal.tsx — the modal showing the BISP Toll-Free
Helpline, 8171 SMS info, and Anti-Scam warnings.

CRITICAL CONSTRAINT — read first:
- Do NOT remove or reword any of the existing helpline numbers, SMS
  instructions, or anti-scam warning text. This content is a hard hackathon
  judging requirement (Human-in-the-Loop / Responsible AI). You may
  restructure visually (e.g. into cards/sections with icons) but the
  factual content and wording must be preserved exactly.

Design requirements:
- Glassmorphism treatment: `backdrop-blur-md bg-white/80` (or similar) on
  the modal panel, with a dimmed/blurred backdrop overlay behind it, for a
  modern, official, trustworthy feel.
- Organize content into clearly separated sections, each with a
  lucide-react icon:
  - Toll-Free Helpline (e.g. Phone icon)
  - 8171 SMS info (e.g. MessageSquare or Smartphone icon)
  - Anti-Scam warning (e.g. ShieldAlert or AlertTriangle icon, in a
    visually distinct warning treatment — amber/red accent border or
    background tint, NOT full alarming red — this should read as
    "important official notice," not a system error)
- Large, high-contrast, easy-to-read text (this is often the most critical
  content for a stressed or scam-targeted user) — `ink` color, generous
  size, no light gray.
- Close button: clear, large tap target, lucide-react X icon, plus support
  closing on backdrop click and Escape key if not already present.
- Smooth open/close transition (fade + slight scale, `transition-all
  duration-300`), no abrupt pop-in.
- Fully responsive — must work as a near-fullscreen sheet on small mobile
  screens, centered modal on desktop.

Show me the full updated file, and quote back the exact helpline/SMS/
anti-scam text you preserved so I can verify nothing was altered.


PHASE 5 — Final Polish & QA Pass

This is a cross-cutting consistency and QA pass across app/page.tsx,
VoiceAssistantCard.tsx, LowLiteracyDashboard.tsx, and HelpModal.tsx. Do not
do a major redesign here — this is about consistency, correctness, and
demo-readiness.

Go through all four files and check/fix:

1. Visual consistency: same color tokens, same border-radius scale, same
   spacing scale, same shadow/elevation style used consistently across all
   four components. Fix any component that drifted from the design system
   established in earlier phases.
2. Zero emojis: grep all four files for any remaining emoji characters in
   JSX/strings (not just AI-generated content) and remove/replace with
   lucide-react icons.
3. Transparency badge: confirm the exact disclaimer text is present and
   correctly worded on both VoiceAssistantCard and LowLiteracyDashboard.
4. HelpModal content: confirm helpline, SMS, and anti-scam text is still
   present and unaltered.
5. Contract check: confirm onPointerDown/onPointerUp on the voice button
   are intact and unchanged, and confirm the FormData payload shape
   (text/audio/history) sent to /api/chat is unchanged in both
   VoiceAssistantCard and LowLiteracyDashboard.
6. Responsiveness pass: confirm every component looks correct at a small
   mobile width (~360px) — common low-cost Android screen width — not just
   desktop. Fix any overflow, text truncation, or cramped tap targets.
7. Animation smoothness: confirm all layout-affecting transitions use
   `transition-all duration-300` (or an equivalent deliberate easing) and
   none of them cause visible jitter when content changes size.
8. Accessibility: confirm text contrast meets WCAG AA against its
   background everywhere (especially text over gradient/glass surfaces),
   and confirm all interactive elements have adequate touch target size
   and either visible focus states or aria-labels where icon-only buttons
   are used.
9. Run `npm run build` and fix any TypeScript/build errors introduced
   across the phases.

Give me a short checklist-style summary of what you found and fixed, item
by item against the list above.