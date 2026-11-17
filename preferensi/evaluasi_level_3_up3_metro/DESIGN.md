---
name: Evaluasi Level 3 UP3 Metro
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c494c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c797c'
  outline-variant: '#bbc9cc'
  surface-tint: '#006876'
  primary: '#006876'
  on-primary: '#ffffff'
  primary-container: '#23c4db'
  on-primary-container: '#004d57'
  inverse-primary: '#46d8ef'
  secondary: '#4d6171'
  on-secondary: '#ffffff'
  secondary-container: '#d0e5f9'
  on-secondary-container: '#536778'
  tertiary: '#006876'
  on-tertiary: '#ffffff'
  tertiary-container: '#53c1d5'
  on-tertiary-container: '#004c57'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9fefff'
  primary-fixed-dim: '#46d8ef'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004e59'
  secondary-fixed: '#d0e5f9'
  secondary-fixed-dim: '#b4c9dc'
  on-secondary-fixed: '#081d2c'
  on-secondary-fixed-variant: '#354959'
  tertiary-fixed: '#a0efff'
  tertiary-fixed-dim: '#6ad5e9'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e59'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  tabular-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system establishes a high-density, professional enterprise operational environment tailored for internal workforce development within energy infrastructure management. It balances the institutional authority of utility operations with contemporary, high-clarity data tools.

### Core Attributes
- **Presisi & Akurat (Precision & Accuracy):** Every data point, assessment metric, and status flag is immediately interpretable without visual ambiguity.
- **Transparansi Evaluasi (Evaluation Transparency):** Multi-stakeholder progress across Peserta, Atasan Langsung, and Koordinator Eksternal is visible at a glance through crisp tabular structures and unified progress meters.
- **Efisiensi Kerja (Operational Efficiency):** Minimized visual ornamentation, calibrated typography, and deliberate accent placement prioritize cognitive throughput during long evaluation sessions.

### Design Movement: Modern Corporate Utility
The aesthetic aligns with refined corporate minimalism engineered for information-dense workflows. Visual hierarchy relies on razor-thin 1px structural framing, subdued cool-tinted canvas backdrops, high-contrast typography, and a vivid cyan signature accent reserved strictly for active states, interactive controls, and positive completion tracking.

## Colors

The palette uses high-contrast corporate navy anchored by clean neutral grays and energized by an electric cyan for interactive states and operational milestones.

### Palette Architecture
- **Brand Navy (`#172B3A`):** The foundational ink for text, primary headings, dark-mode sidebar backgrounds, and high-emphasis structural boundaries.
- **Electric Cyan (`#23C4DB`):** The primary interactive driver. Used selectively for primary buttons, active link indicators, table row selections, focused input halos, and progress fill meters.
- **Deep Cyan (`#0F96A9`):** Interactive hover state and high-contrast accessible variants of the primary cyan against light backgrounds.
- **Canvas Base (`#F5F7F9`):** Application canvas background, providing cool, glare-free contrast behind pure white card surfaces.
- **Card Surface (`#FFFFFF`):** High-clarity white for table containers, form cards, dropdown overlays, and modal bodies.
- **Borders & Dividers:** Subtle border `#E2E8F0` for interior dividers and table cells; structural border `#CBD5E1` for outer card perimeters, input field outlines, and header baselines.

### Functional Roles (Evaluasi Multi-Pihak)
- **Peserta Status:** Soft slate blue background (`#F1F5F9`), text `#334155`, border `#CBD5E1`.
- **Atasan Langsung Status:** Soft amber background (`#FEF3C7`), text `#92400E`, border `#FDE68A` when pending; soft emerald (`#ECFDF5`), text `#065F46`, border `#A7F3D0` when approved.
- **Koordinator Eksternal Status:** Soft cyan tint (`#E0F7FA`), text `#006064`, border `#B2EBF2`.
- **Destructive/Ditolak:** Background (`#FEF2F2`), text `#991B1B`, border `#FECACA`.

## Typography

The typography is built around **Inter**, optimized for data density and numeric auditing. 

### Numeric & Table Standards
- All table cells and evaluation scores utilize OpenType tabular figures (`font-variant-numeric: tabular-nums; lining-nums;`) to prevent vertical jitter across score grids and metrics columns.
- Uppercase styling with micro letter-spacing (`0.02em` to `0.04em`) is strictly reserved for small metadata tags, role badges, and table column headers.

### Readability Guardrails
- Body copy scales strictly between 12px (secondary captions, breadcrumb tails, table metadata) and 13px–15px (primary assessment instructions, table contents, and form inputs).
- High-contrast text pairings are mandatory: primary body text uses `#172B3A`, while secondary labels use `#64748B`.

## Layout & Spacing

The layout is built on a strict 8px structural grid (with 4px half-steps for compact UI badges and button padding) prioritizing high data visibility.

### Layout Topology
- **Fixed Persistent Sidebar:** Fixed width of 260px docked to the left edge with a deep `#172B3A` background, rendering system navigation, unit branding (UP3 Metro), and session status.
- **Header Top Bar:** 56px fixed height, containing module breadcrumbs, global search, and role switcher dropdowns (Peserta / Atasan / Koordinator).
- **Primary Content View:** Fluid container stretching across desktop viewports with a 24px outer margin, dividing into structured multi-pane data cards, progress strips, or dense tables.

### Density & Breakpoint Rules
- **Desktop (>= 1280px):** Full 260px sidebar expanded; primary table views display all multi-stakeholder assessment columns simultaneously.
- **Laptop / Compact Desktop (1024px – 1279px):** Sidebar remains docked; tables feature horizontal inner-scrolling while freezing employee identity columns (NIP & Nama Peserta).
- **Tablet (< 1024px):** Sidebar collapses into a slide-over drawer; sticky top action bar ensures submit buttons remain accessible.

## Elevation & Depth

This design system avoids heavy shadows, blur filters, and multi-tier drop elevation. Visual separation is accomplished using **structural borders** and subtle flat elevation tiers.

### Surface Hierarchy
- **Level 0 (Canvas):** `#F5F7F9` background canvas. Flat, unshaded.
- **Level 1 (Card & Table Surface):** Pure `#FFFFFF` surface bordered by a crisp `1px solid #E2E8F0` border. Zero shadow in standard state.
- **Level 2 (Interactive Floating Elements):** Dropdown select menus, role switcher popovers, and sticky subheaders receive a subtle shadow: `0 2px 4px -1px rgba(23, 43, 58, 0.06), 0 4px 6px -1px rgba(23, 43, 58, 0.04)` combined with a `1px solid #CBD5E1` outline.
- **Level 3 (Modal Dialogs & Drawers):** High-priority evaluation review modals utilize `0 10px 15px -3px rgba(23, 43, 58, 0.12), 0 4px 6px -2px rgba(23, 43, 58, 0.05)` layered above a `#172B3A` 45% opacity backdrop overlay.

## Shapes

The design system employs a disciplined, soft enterprise geometry (`roundedness: 1`). Elements favor precise, compact forms that maximize canvas area for operational data.

### Corner Radii Guidelines
- **Containers, Cards, & Panels:** `rounded-lg` (0.5rem / 8px) with hairline 1px borders to present crisp information panels.
- **Form Controls, Table Cells, & Buttons:** `rounded` (0.25rem / 4px) to retain structural alignment within dense vertical tables and input stacks.
- **Pill Badges (Status Labels & Chips):** Soft-pill finish (9999px) strictly for status flags, role tags, and numerical counts to distinguish them from actionable buttons and inputs.

## Components

### Buttons (Tombol Aksi)
- **Primary:** Background `#23C4DB`, text `#172B3A` (font-weight 600 for contrast), border none, 4px border radius. Hover: `#0F96A9`, text `#FFFFFF`.
- **Secondary / Ghost:** Background transparent, text `#172B3A`, border `1px solid #CBD5E1`. Hover: background `#F1F5F9`, border `#94A3B8`.
- **Destructive:** Background `#FEF2F2`, text `#991B1B`, border `1px solid #FECACA`. Hover: background `#FEE2E2`.
- **Sizing:** Compact enterprise height standard of 32px for table row actions, 38px for primary page headers.

### Data Tables (Tabel Evaluasi)
- **Header:** Background `#F8FAFC`, text `#475569`, uppercase 11px font with bold tracking, bottom border `1px solid #CBD5E1`.
- **Row Styling:** Minimum height 44px; alternate row highlighting is avoided in favor of clean white rows separated by `1px solid #E2E8F0`. Hover row state: `#F0FDFA` (subtle cyan wash) with active border line.
- **Sticky Columns:** Employee identity (`NIP / Nama Peserta`) pinned left on scrolling tables with subtle shadow indicator.

### Input Fields & Controls (Formulir Penilaian)
- **Inputs & Selects:** White background, 1px border `#CBD5E1`, 4px radius, 36px height. Placeholder color `#94A3B8`.
- **Focus State:** Border color `#23C4DB`, focus ring `0 0 0 3px rgba(35, 196, 219, 0.20)`.
- **Radio Likert Scales (Skala Penilaian 1-5):** Segmented button group style using horizontal button cells with active state filled in `#172B3A` with `#23C4DB` top accent line.

### Multi-Perspective Status Badges (Lencana Status)
- Display role ownership clearly with distinct color-pair tokens:
  - **Status Peserta:** `Belum Mengisi` (Slate/Neutral), `Sudah Mengisi` (Cyan).
  - **Status Atasan Langsung:** `Menunggu Persetujuan` (Amber), `Disetujui` (Emerald).
  - **Status Koordinator Eksternal:** `Verifikasi Valid` (Navy/Cyan outline).

### Navigation & Tab Strips
- **Sidebar Navigation:** Navy base `#172B3A`, inactive links `#94A3B8`, active item background `#1E384D`, active accent indicator via a 3px vertical bar in `#23C4DB` on the left border.
- **Crisp Tab Bars:** Segmented tabs with bottom hairline indicator: active tab features a 2px `#23C4DB` underline, font-weight 600, color `#172B3A`.

### Modal Dialogs (Dialog Evaluasi)
- Centered dialogs with explicit structural split: header (with close trigger and breadcrumb title), scrollable body (max height 80vh), and sticky footer action bar housing primary and cancellation actions.