# Visa Assistant Design Guidelines – Absher Design System

## Design System Foundation
Following the established Absher government platform aesthetic: clean, spacious, white-dominant interface with strong green accent color, circular icon containers, and Arabic-friendly typography for a calm, trustworthy government service experience.

## Colors

### Primary Palette
- **Primary Green:** `#1E9B63` (buttons, icons, highlights, CTAs)
- **Dark Green:** `#0F6B3A` (hover states, emphasis)
- **Light Green Badge:** `#E6F5EE` (status tags, new features)

### Neutrals
- **Background:** `#F5F6F8` (page background)
- **Card White:** `#FFFFFF`
- **Borders:** `#E4E4E4`
- **Text Dark:** `#444444` (primary text)
- **Text Medium:** `#777777` (secondary text)
- **Text Light:** `#A0A0A0` (metadata)

## Typography
Arabic-friendly typeface (GE SS, Helvetica Neue Arabic, or DIN Next Arabic style):
- **Page Titles:** 24-26px, Bold
- **Section Headings:** 20px, Medium (600)
- **Button Text:** 16-17px, Medium (600)
- **Card Labels:** 16px, Medium
- **Body Text:** 14-15px, Regular (400)
- **Metadata:** 12-13px, Light (300)

## Layout & Spacing Philosophy
Extremely spacious, government-appropriate breathing room:
- **Section Padding:** 48-64px vertical spacing between major sections
- **Card Spacing:** 24-32px between cards
- **Inner Padding:** 16-20px inside components
- **Rounded Corners:** Cards 12px, Buttons 8-12px

## Component Library

### Buttons
**Primary Button:** Green (#1E9B63) background, white text, 14px 24px padding, 8px border-radius, font-weight 600
**Secondary Button:** Transparent background, 1px green border, green text, same padding/radius

### Cards
White background, 12px rounded corners, 20-24px padding, subtle shadow `0px 3px 8px rgba(0,0,0,0.05)`. Structure: circular icon container at top, content in middle, green button/label at bottom.

### Icons
Minimal line icons in Absher green, placed in white circular containers (64-72px diameter) with subtle shadows. Icon size inside: 32-36px.

### Status Badges
Light green background (#E6F5EE) with green text (#1E9B63), 12px font, 6px border-radius, positioned top-right on cards.

### Progress Indicators
3-step horizontal progress bar showing "Step X of 3" with step titles: "Basic Details" → "Requirements & Documents" → "Embassy Appointment"

## Application-Specific Elements

### Landing Screen
Hero card with page title "Visa Preparation Assistant", description text, large primary CTA "Start a New Visa Request". Below: simple list of previous requests (country + date + status tags: Draft/Completed) with "View PDF Pack" actions.

### Country Selection (Step 1)
Country list with flag icons, country names, and Passport Index status labels ("Visa required", "e-Visa", "Visa-free"). Visa type dropdown/segmented buttons. Traveler selection with checkboxes, showing name, relationship, ID from Absher records.

### Requirements Summary (Step 2)
Country/visa header card at top. Requirements checklist with status icons (green checkmark for "Available from Absher data", info icon for "To be provided"). Individual traveler cards with name, relationship, "Preview PDF Pack" button, and status tags ("Ready", "Missing 2 items").

### Embassy Appointment (Step 3)
Date/time picker for integrated embassies, or external link button for non-integrated ones. Summary card showing country, visa type, travelers. Completion screen: large check icon, success message, "Download PDF Pack" and "Back to Absher Home" buttons.

### Search & Navigation
Minimal rectangular search bar (white background, light gray border, 12px 16px padding). Top header with white background, green icons, 20-24px vertical spacing.

## Shadow System
Subtle, minimal shadows throughout:
- Cards: `0px 2px 6px rgba(0,0,0,0.05)`
- Elevated elements: `0px 3px 8px rgba(0,0,0,0.05)`

## Images
No hero images needed - this is a government service interface focused on functionality. Use icon illustrations only in circular containers as specified above.