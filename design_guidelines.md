# ISKCON Digital Service Portal - Design Guidelines

## Design Approach

**Religious/Devotional Web Application** - This portal requires a respectful, calming aesthetic that honors ISKCON's spiritual mission while providing modern, accessible functionality. The design must balance traditional devotional elements with contemporary UX patterns.

## Core Design Principles

1. **Devotional Respect**: Every element should convey reverence and spiritual purpose
2. **Clarity & Accessibility**: Information hierarchy must be crystal clear for all user types
3. **Generous Spacing**: Use ample whitespace/cream space to create breathing room and peace
4. **Modern Minimalism**: Clean cards and components without excessive decoration

## Color System

**Primary Palette:**
- **Saffron**: `#f39c12` - Primary actions, highlights, sacred elements
- **Deep Maroon**: `#7a1f2f` - Headers, important text, grounding elements
- **Cream**: `#fff8ec` - Background, card backgrounds, light sections

**Supporting Colors:**
- White: `#ffffff` - Alternative backgrounds, overlays
- Dark text: `#2c3e50` - Body text for readability
- Muted text: `#7f8c8d` - Secondary information

**Usage:**
- Saffron for CTAs, active states, devotional accents
- Deep maroon for navigation, headings, footers
- Cream as primary background throughout
- Maintain high contrast for accessibility (WCAG AA minimum)

## Typography

**Font Families:**
- **Headings**: Poppins (600, 700 weights) - Modern, clean, dignified
- **Body**: Noto Sans (400, 500, 600 weights) - Highly readable, supports multiple scripts
- Load via Google Fonts CDN

**Hierarchy:**
- H1: 2.5rem (40px), Poppins 700, deep maroon
- H2: 2rem (32px), Poppins 600, deep maroon
- H3: 1.5rem (24px), Poppins 600
- Body: 1rem (16px), Noto Sans 400
- Small: 0.875rem (14px), Noto Sans 400

**Sanskrit/Devotional Text:**
- Use slightly larger sizes (1.125rem) for scripture quotes
- Italic treatment for transliterated Sanskrit terms
- Maintain excellent contrast for readability

## Layout System

**Spacing Scale (Tailwind units):**
- Use consistent spacing: `2, 4, 6, 8, 12, 16, 20, 24` units
- Cards: `p-6` to `p-8` padding
- Section spacing: `py-12` to `py-20`
- Component gaps: `gap-4` to `gap-8`

**Container Widths:**
- Max content width: `max-w-7xl` (1280px)
- Form containers: `max-w-2xl` (672px)
- Reading content: `max-w-4xl` (896px)

**Grid Patterns:**
- Event cards: 3-column grid on desktop (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Feature tiles (homepage): 3-column (`grid-cols-1 md:grid-cols-3`)
- Admin dashboard: 2-column layout for charts and stats

## Component Design

**Cards:**
- Clean white or cream backgrounds with subtle shadows
- Border radius: `rounded-lg` (8px)
- Shadow: `shadow-md` for elevation
- Hover: Gentle lift effect (`hover:shadow-lg transition-shadow`)

**Buttons:**
- Primary (Saffron): `bg-[#f39c12] text-white hover:bg-[#e67e22]`
- Secondary (Maroon): `bg-[#7a1f2f] text-white hover:bg-[#5c1623]`
- Outline: `border-2 border-[#f39c12] text-[#f39c12] hover:bg-[#f39c12] hover:text-white`
- Padding: `px-6 py-3` for primary actions
- Border radius: `rounded-md` (6px)
- Font: Poppins 500, 1rem

**Forms:**
- Input fields: White backgrounds, `border-2` with gray, `focus:border-[#f39c12]`
- Labels: Poppins 500, dark text, positioned above inputs
- Generous spacing between fields (`space-y-6`)
- Error states: Red border with error message below
- Success states: Green border with checkmark

**Navigation:**
- Header: Deep maroon background (`bg-[#7a1f2f]`)
- Logo area: Include "ISKCON Digital Service Portal" text with Om symbol
- Nav links: White text, underline on hover
- Mobile: Hamburger menu with slide-in drawer
- Sticky header on scroll

**Footer:**
- Deep maroon background
- Multi-column layout: About, Quick Links, Contact, Social
- Copyright and devotional tagline
- Newsletter signup form

## Page-Specific Layouts

**Homepage:**
- Hero section: 60vh height, cream background
- Devotional invocation: "Om ādi-puruṣāya namaḥ — Welcome. May all work here be for devotional service."
- Three main feature tiles: Events & Volunteers, Donations & Seva, Digital Library
- Daily Gita Verse: Card component with language toggle buttons
- Rotating verse with fade transition

**Events Page:**
- Filter bar: Date range picker, category dropdown, search input
- Event cards grid with image, title, date, venue, "Learn More" button
- Hover reveals volunteer count and quick register option

**Event Detail:**
- Hero image of event (if available)
- Date, time, venue prominently displayed
- Google Maps embed: 400px height, rounded corners
- Schedule timeline with time markers
- "Register as Volunteer" CTA (saffron button, prominent)
- Volunteer role selection in modal/form

**Library Page:**
- Search bar: Full width, prominent
- Filters: Language, category dropdowns, side-by-side
- Book grid: 4-column on desktop, cover image, title, author, language tag
- Language tags: Small badges with language code (e.g., "EN", "NE", "HI")

**PDF Reader:**
- Full-screen viewer option
- Top toolbar: Page navigation, zoom controls, download, translate
- "Translate Page" button: Saffron, icon with language code
- Translation overlay: Semi-transparent cream background, readable text
- Options: Overlay, Replace, Side-by-side modes
- "Restore Original" button always visible when translated

**Donation Page:**
- Simple, focused form layout
- Amount selector: Preset buttons + custom input
- Purpose dropdown: Prasāda, Temple Maintenance, Book Distribution, etc.
- Receipt preview/download: PDF icon, auto-download on submit

**Admin Dashboard:**
- Sidebar navigation: Deep maroon, icons + labels
- Chart cards: White backgrounds, Chart.js visualizations
- Stats cards: Number displays with icons, colored accents
- Data tables: Zebra striping, sortable columns, action buttons

## Accessibility

- Semantic HTML5 elements throughout
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators: Saffron outline (`focus:ring-2 ring-[#f39c12]`)
- Alt text for all images
- Skip to main content link
- Color contrast ratios meeting WCAG AA

## Responsive Design

**Breakpoints:**
- Mobile: Base styles (< 768px)
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)
- Large: `xl:` (1280px+)

**Mobile Considerations:**
- Touch-friendly buttons (min 44x44px)
- Simplified navigation (hamburger)
- Single-column layouts
- Reduced padding for smaller screens
- Bottom-aligned CTAs for easy thumb reach

## Images

**Hero Section (Homepage):**
- Large background image: ISKCON temple, deity, or spiritual gathering
- Dimensions: 1920x800px, optimized for web
- Overlay: Semi-transparent maroon gradient for text readability
- Placement: Full-width behind devotional invocation

**Event Images:**
- Card thumbnails: 400x250px, event photos or temple activities
- Detail page hero: 1200x500px, event-specific imagery

**Book Covers:**
- Library thumbnails: 200x280px, book cover images
- Default placeholder: Saffron background with book icon if no cover

**Icons:**
- Use Heroicons (outline style) via CDN
- Consistent 24px size for UI icons
- Sacred symbols (Om, Lotus) as SVG assets in `/assets/icons/`

## Animations

**Minimal & Purposeful:**
- Page transitions: Subtle fade (200ms)
- Button hovers: Slight scale (1.02) and shadow increase
- Card hovers: Shadow lift (300ms ease)
- Daily verse rotation: Fade in/out (500ms)
- Modal overlays: Fade background, slide content (250ms)
- **Avoid**: Excessive parallax, complex scroll animations

## Special UI Elements

**Daily Gita Verse Card:**
- Centered card, max-w-3xl
- Verse text: 1.25rem, italic, centered
- Translation below: 1rem, regular
- Language toggle: Small pill buttons (EN | NE | HI)
- Refresh icon to get new verse

**Language Selector (Global):**
- Top-right corner of header
- Dropdown or toggle buttons
- Flags optional, text codes preferred (EN, नेपाली, हिंदी)

**Theme Toggle:**
- Sun/Moon icon in header
- Light mode: Cream backgrounds
- Temple-dark mode: Deep maroon/dark brown backgrounds, cream text
- Smooth transition between modes (300ms)

## Devotional UI Copy

- Header tagline: "ISKCON Digital Service Portal — seva, śraddhā, śikṣā"
- Event CTA: "Join as a volunteer — become an instrument of prasāda"
- Donation CTA: "Offer with love — your gift supports prasāda and seva"
- Library header: "Scriptures & Teachings — read, reflect, and share"
- Translate button: "Translate Page — देख्नुहोस् (नेपालीमा अनुवाद)"
- Footer: "Hare Krishna. All service offered in devotion."

## Technical Implementation Notes

- Mobile-first CSS approach
- Use Tailwind utility classes
- Custom color classes in tailwind.config
- pdf.js for PDF rendering
- Chart.js for admin visualizations
- Responsive images with proper srcset
- Loading states: Spinner with Om symbol or simple circular loader