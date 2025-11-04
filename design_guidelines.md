# Design Guidelines: Trazabilidad de Lotes - Enterprise Inventory Tracking System

## Design Approach

**Selected System: Carbon Design System (IBM)**

**Justification**: This is a data-intensive enterprise application requiring clarity, efficiency, and consistency across complex workflows. Carbon Design excels in:
- Information-dense interfaces with clear data hierarchy
- Production-grade form patterns and validation states
- Robust table components for extensive data management
- Systematic approach to multi-step processes
- Enterprise-level accessibility standards

**Core Principles**:
1. Data clarity over visual flair
2. Consistent patterns reduce cognitive load
3. Efficiency in data entry and navigation
4. Clear visual hierarchy for decision-making
5. Accessibility for industrial environments

## Typography System

**Font Stack**: IBM Plex Sans (primary), IBM Plex Mono (data/codes)

**Hierarchy**:
- Page Titles: 2rem (32px), semibold, tracking-tight
- Section Headers: 1.5rem (24px), medium
- Card/Module Titles: 1.125rem (18px), medium
- Body Text: 0.875rem (14px), regular
- Data Tables: 0.8125rem (13px), regular
- Small Labels/Meta: 0.75rem (12px), medium
- Code/Batch Numbers: IBM Plex Mono, 0.875rem, medium

**Line Heights**: 
- Headings: 1.25
- Body: 1.5
- Data dense areas: 1.4

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** consistently
- Tight spacing: p-2, gap-2 (within components)
- Standard spacing: p-4, gap-4 (component padding)
- Module spacing: p-6, gap-6 (between sections)
- Section spacing: p-8, py-12 (major divisions)

**Grid System**:
- Container: max-w-7xl with px-4 md:px-6 lg:px-8
- Main content area: flex-1 with proper overflow handling
- Sidebar: 240px (collapsed: 64px icon-only)
- Two-column forms: grid grid-cols-1 md:grid-cols-2 gap-6
- Three-column cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4

**Application Shell**:
- Persistent sidebar (left): Navigation with icons + labels, collapsible
- Top bar (sticky): Breadcrumbs, global search, user menu, quick actions
- Main content: Scrollable area with proper padding
- Footer: Minimal, company info only

## Component Library

### Navigation & Layout

**Sidebar Navigation**:
- Width: 240px expanded, 64px collapsed
- Icon + label pattern for all items
- Active state: visual indicator (border-l-4)
- Grouped by function with subtle dividers
- Collapsible sections for sub-navigation

**Breadcrumbs**:
- Top of each page below header
- Size: text-sm with chevron separators
- Clickable path showing hierarchy
- Current page non-clickable and emphasized

**Top Bar**:
- Height: 64px
- Global search: expandable search input (w-64 default, expands to w-96 on focus)
- Right side: notifications icon, user avatar with dropdown
- Quick action button for common tasks per module

### Data Display

**Tables (Critical Component)**:
- Full-width with horizontal scroll on mobile
- Sticky header row
- Alternating row treatment for readability
- Row height: h-12 for data rows, h-14 for header
- Column padding: px-4
- Sortable columns with indicator icons
- Inline actions: icon buttons in last column
- Selection: checkboxes in first column (multi-select scenarios)
- Pagination: bottom center with page size selector
- Empty states: centered message with icon and action

**Cards**:
- Standard padding: p-6
- Header section: flex justify-between items-center mb-4
- Subtle borders for separation
- Hover state: subtle elevation change
- KPI Cards: Larger number (text-3xl font-bold), label below (text-sm), icon top-right

**Status Badges**:
- Pill shape with rounded-full
- Sizes: px-3 py-1 text-xs
- Different visual treatments for states (RECEPCION, EN_PROCESO, RETENIDO, APROBADO, BLOQUEADO, EXPEDIDO)
- Icon + text when space allows

### Forms & Inputs

**Form Layout**:
- Two-column grid on desktop (md:grid-cols-2 gap-6)
- Single column on mobile
- Related fields grouped with subtle background cards
- Label above input pattern
- Required indicator after label (asterisk)
- Help text below input (text-xs, muted)

**Input Fields**:
- Height: h-10 for text inputs
- Padding: px-3
- Border width: border-2 for focus visibility
- Error state: border treatment + error message below
- Success state: subtle indicator when validated
- Disabled state: reduced opacity with cursor-not-allowed

**Select/Dropdowns**:
- Match input height (h-10)
- Search-enabled for long lists (products, lotes, clients)
- Multi-select with chips/tags display
- Clear button for single selects

**Date/Time Pickers**:
- Input group with calendar icon
- Combined date + time picker for timestamps
- Clear default to current time with override option

**Buttons**:
- Primary: h-10 px-6 rounded-md font-medium
- Secondary: h-10 px-6 rounded-md 
- Tertiary/Ghost: h-10 px-4
- Icon buttons: w-10 h-10 rounded-md
- Danger actions: visually distinct
- Loading state: spinner replaces text/icon

### Specialized Components

**Batch/Lote Selector**:
- Searchable dropdown with extended info
- Shows: Lote code, product, quantity available, expiry date
- FEFO sorting integrated (expiry soonest first)
- Multi-select for production inputs
- Disabled items for RETENIDO/BLOQUEADO states

**Stock Movement Timeline**:
- Vertical timeline on left
- Each entry: icon (movement type), timestamp, user, from→to locations, quantity
- Expandable details per movement
- Pagination for long histories

**Genealogy Tree (Trazabilidad)**:
- Horizontal or vertical tree layout
- Expandable/collapsible nodes
- Each node: batch code, product, quantity, state badge
- Lines connecting parent→child relationships
- Click node to view details panel

**QR Code Display**:
- Size: 120px × 120px for screen display
- Downloadable as high-res for printing
- Payload data shown below QR in small mono font
- Print preview option

**KPI Dashboard Grid**:
- 4-column grid on desktop (grid-cols-4)
- 2-column on tablet (md:grid-cols-2)
- 1-column on mobile
- Each KPI card: large number, trend indicator (optional), label, timeframe
- Quick action link if applicable

### Modals & Overlays

**Modal Dialogs**:
- Max width: max-w-2xl for forms, max-w-4xl for data display
- Padding: p-6
- Header: flex justify-between with title and close button
- Body: scrollable if needed
- Footer: action buttons right-aligned, cancel left

**Side Panels**:
- Slide from right
- Width: w-96 for details, w-1/2 for complex forms
- Close button top-right
- Sticky footer with actions

**Toasts/Notifications**:
- Fixed position: top-right
- Max 3 visible, auto-dismiss after 5s
- Types: success, error, warning, info
- Dismissible with X button

### Filtering & Search

**Filter Bar**:
- Collapsible section above tables
- Inline form with date ranges, selects, search inputs
- Apply/Reset buttons
- Show active filter count badge

**Global Search**:
- Keyboard shortcut (Ctrl/Cmd + K)
- Searches across: lotes, productos, clientes, proveedores
- Grouped results by entity type
- Recent searches stored

## Page-Specific Layouts

**Dashboard/Trazabilidad**:
- Top: KPI cards grid (4 columns)
- Middle: Charts row (2 columns) - stock levels, upcoming expiries
- Bottom: Quick access tables (recent receptions, pending quality checks)

**List Pages (Recepciones, Expediciones, etc.)**:
- Header: page title, primary action button (right), filter toggle (right)
- Filter bar (collapsible)
- Results count and export button
- Data table
- Pagination footer

**Detail/Edit Pages**:
- Breadcrumb trail
- Page header: title, status badge, action buttons
- Main content: form or detail cards in 2-column grid
- Related data section below (timeline, related batches)
- Sticky action bar at bottom on scroll

**Production Steps Forms**:
- Stepper indicator at top (visual progress)
- Input section: available lotes table with select checkboxes
- Quantity allocation inputs
- Merma section (collapsible)
- Output preview (calculated)
- Action buttons: Save Draft, Complete Step

**Configuración (Settings) Pages**:
- Vertical tab navigation on left (desktop) or segmented control (mobile)
- Each section: searchable table with inline add/edit
- Bulk actions toolbar when items selected

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

**Mobile Adaptations**:
- Sidebar becomes drawer overlay
- Tables: horizontal scroll or card view toggle
- Multi-column forms become single column
- Reduce padding (p-4 instead of p-6)
- Stack action buttons vertically
- Bottom navigation for primary actions

**Tablet**:
- Sidebar remains visible but narrower
- 2-column grids maintained
- Comfortable touch targets (min 44px)

## Accessibility

- Minimum touch target: 44px × 44px
- Focus indicators: 2px offset outline
- Skip to main content link
- ARIA labels for icon-only buttons
- Keyboard navigation throughout
- Form error announcements
- Loading states announced to screen readers
- High contrast mode support

## States & Feedback

**Loading States**:
- Skeleton screens for initial page load
- Spinner for button actions
- Progress bars for file uploads/processing
- Shimmer effect for table rows loading

**Empty States**:
- Centered icon (96px size)
- Primary message (text-lg)
- Secondary explanation
- Primary action button if applicable

**Error States**:
- Inline field errors (text-sm below input)
- Page-level errors in alert banner
- Toast for action failures
- Retry option when applicable

## Images

**No hero images required** - This is a data-driven enterprise application focused on functionality over marketing aesthetics.

**Iconography Only**:
- Consistent icon set throughout (use Heroicons or Material Icons)
- Functional icons for: actions, status indicators, navigation items
- Empty state illustrations (simple line art)
- User avatars (initials or uploaded photo)