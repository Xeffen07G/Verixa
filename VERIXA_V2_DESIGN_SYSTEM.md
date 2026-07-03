# VeriXa V2: Reference Design System Specification

This internal specification documents the design tokens, layout behaviors, state machines, and components implemented for the Document Intelligence workspace. All future feature modules (Image Verification, Video Verification, etc.) must follow these guidelines to preserve platform-wide aesthetic alignment.

---

## 1. Color Palette (Obsidian & Warm Gold)

VeriXa V2 utilizes an obsidian-dominated color palette with warm gold highlights to evoke forensic authority and premium quality.

| Token | CSS Value / Variable | Purpose |
| :--- | :--- | :--- |
| **Canvas Background** | `#06060a` (`--di-bg`) | Infinite main workspace canvas |
| **Sidebar Background** | `#09090e` (`--di-sidebar-bg`) | Navigation drawer background |
| **Brand Accent** | `#c9a96e` (`--di-accent`) | Action highlights, active states, gold icons |
| **Brand Accent (Dim)** | `rgba(201, 169, 110, 0.04)` | Selection hover states, focused inputs |
| **Primary Text** | `#f5f3ef` (`--di-text-primary`) | High contrast headings, message copy |
| **Secondary Text** | `rgba(245, 243, 239, 0.6)` | Metadata labels, muted body copy |
| **Muted Text** | `rgba(245, 243, 239, 0.3)` | Placeholder labels, quiet details |
| **Borders** | `rgba(255, 255, 255, 0.03)` | Invisible grid boundaries, dashed zones |

---

## 2. Typography Scale

- **Headings (Editorial / Serif)**: Used exclusively for page headers or empty states to lend authority.
  - Font Family: `'Cormorant Garamond', serif`
  - Font Size: `32px` (`di-empty-title`), Weight: `300`
- **Body & Interface (Functional / Sans-Serif)**: Clean, system-level fallback for text clarity.
  - Font Family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Body Text: `14px` (`di-bubble`), Line Height: `1.7`
  - Subtitles / Metadata: `11px` / `12px`, Line Height: `1.5`
  - Section Labels: `10px`, Weight: `700`, Letter Spacing: `1.5px` (Uppercase)

---

## 3. Layout Grid & Panel Ratios

The page is split into two persistent panels with zero visual borders to make the workspace feel integrated:
- **Left Panel (Library)**: `20%` width (min `220px`, max `280px`). Contains file navigation and action triggers.
- **Main Panel (Workspace/Canvas)**: `80%` width (flexes dynamically). Contains empty upload states, processing loader steps, and conversational chats.
- **Right Panel (Inspector)**: **Removed**. Detailed inspector panels are replaced with lightweight overlays (tooltips/popovers) or inline text descriptors.

---

## 4. State Machine Progression

### State 1: Empty (Invitation)
- **Visuals**: Centers copy vertically. Displays a serif title, a single sentence explanation, and a dashed border drop zone with a centered upload icon. Generous margins and breathing room.
- **Interaction**: The drop zone supports file browser clicks as well as drag-and-drop triggers anywhere on the main canvas.

### State 2: Processing (Ingestion)
- **Visuals**: The empty state transitions smoothly to a center-aligned loader.
- **Copy Progress Flow**: Text status moves sequentially without technical codes:
  1. `Uploading document...`
  2. `Reading pages...`
  3. `Understanding content...`
  4. `Ready.`
- **Animation**: The text pulses slowly (`animation: di-pulse 2s infinite`) and transitions into State 3 upon completion.

### State 3: Conversation (Primary)
- **Visuals**: The upload and loading components vanish. The workspace transitions into an open canvas:
  - **Header**: Quiet, minimal header showing the active filename and inline metadata details.
  - **Greeting**: The first AI response lists concrete welcome actions contextually with bullets.
  - **Chat Feed**: Messages flow directly on the canvas without heavy borders.
  - **Citations**: Source markers in content are replaced with interactive bold tokens (`[Page X]`).

---

## 5. Spacing System

- **Gaps between messages**: `36px` to let paragraphs breathe.
- **Gaps between sections**: `24px` / `32px`.
- **Canvas padding**: `24px 48px` to ensure text lines do not feel crowded.

---

## 6. Components & Microinteractions

- **Library Item Active State**: Indicated solely by a `2px` left border in `#c9a96e` (warm gold) and a light backdrop tint. No pills or colored check marks.
- **Input Area**: Anchored at the bottom center of the canvas (`max-width: 760px`). Visually prominent with a `24px` border radius, subtle input background (`rgba(255,255,255,0.015)`), and a warm gold submit circle.
- **Suggestion Chips**: Compact chips (`border-radius: 14px`) placed directly below the first assistant message. Hovering triggers a gold border transition.
- **Motion**: Restrict animations to smooth fade-ins (`transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`) and pulsing loops. No bouncing effects.
