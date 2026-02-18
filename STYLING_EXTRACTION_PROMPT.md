# 🎨 Complete Design System Extraction Prompt

Use this prompt to extract and apply the complete styling system from ReserveHub to another website.

---

## 📋 PROMPT FOR STYLING EXTRACTION

```
I need you to implement the complete design system from ReserveHub restaurant reservation platform. 
Apply ALL styling exactly as specified below. This is a premium, sophisticated SaaS design system 
with strict spacing, typography, and color guidelines.

# ============================================
# 1. COLOR PALETTE - EXACT HEX CODES
# ============================================

## PRIMARY COLORS (Green - Main Brand)
- Primary 50: #F0F9F6 (Lightest background)
- Primary 100: #D1F2E5 (Light background)
- Primary 200: #A3E5CB (Light accent)
- Primary 300: #75D8B1 (Medium light)
- Primary 400: #47CB97 (Medium)
- Primary 500: #1A9E6F (MAIN BRAND COLOR - Use for primary buttons, links, highlights)
- Primary 600: #157E59 (Hover state for primary)
- Primary 700: #105E43 (Active/pressed state)
- Primary 800: #0A3F2D (Dark)
- Primary 900: #051F17 (Darkest)

## ACCENT COLORS (Gold - Premium Accent)
- Accent 50: #FFFBEB
- Accent 100: #FEF3C7
- Accent 200: #FDE68A
- Accent 300: #FCD34D
- Accent 400: #FBBF24
- Accent 500: #F59E0B (Main accent)
- Accent 600: #D97706 (Hover)

## NEUTRAL PALETTE (Grays - Text & Backgrounds)
- Neutral 50: #FAFAFA (Background subtle)
- Neutral 100: #F5F5F5 (Background muted)
- Neutral 200: #E5E5E5 (Borders, dividers)
- Neutral 300: #D4D4D4 (Border strong)
- Neutral 400: #A3A3A3 (Text disabled, icons)
- Neutral 500: #737373 (Text tertiary)
- Neutral 600: #525252 (Text secondary)
- Neutral 700: #404040 (Dark backgrounds)
- Neutral 800: #262626 (Very dark)
- Neutral 900: #171717 (Text primary - main text color)

## SEMANTIC COLORS
- Success: #10B981 (Green)
- Success Light: #D1FAE5 (Success background)
- Warning: #F59E0B (Orange/Gold)
- Warning Light: #FEF3C7 (Warning background)
- Error: #EF4444 (Red)
- Error Light: #FEE2E2 (Error background)
- Info: #3B82F6 (Blue)
- Info Light: #DBEAFE (Info background)

## BACKGROUND COLORS
- Background: #FFFFFF (White - main background)
- Background Subtle: #FAFAFA (Light gray background)
- Background Muted: #F5F5F5 (Slightly darker gray)
- Background Elevated: #FFFFFF (Cards, elevated surfaces)

## TEXT COLORS
- Text Primary: #171717 (Main text - use for headings, important text)
- Text Secondary: #525252 (Secondary text - body text)
- Text Tertiary: #737373 (Less important text, placeholders)
- Text Disabled: #A3A3A3 (Disabled states)
- Text Inverse: #FFFFFF (White text on dark backgrounds)

## BORDER COLORS
- Border: #E5E5E5 (Default borders)
- Border Light: #F5F5F5 (Subtle borders)
- Border Strong: #D4D4D4 (Strong borders)

# ============================================
# 2. TYPOGRAPHY SYSTEM
# ============================================

## FONT FAMILY
- Primary Font: 'Inter' (Google Fonts)
- Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Import: @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

## FONT SIZES
- xs: 12px
- sm: 14px
- base: 16px (Body text default)
- lg: 18px
- xl: 20px
- 2xl: 24px (H3 headings)
- 3xl: 30px
- 4xl: 36px (H2 headings)
- 5xl: 48px (H1 headings - desktop)
- 6xl: 60px (Large H1)
- 7xl: 72px (Hero headings)

## LINE HEIGHTS
- Tight: 1.25 (Headings)
- Snug: 1.375
- Normal: 1.5 (Default)
- Relaxed: 1.625 (Body text)
- Loose: 2.0

## FONT WEIGHTS
- Light: 300
- Normal: 400 (Body text)
- Medium: 500
- Semibold: 600 (Headings, buttons)
- Bold: 700 (Main headings)

## LETTER SPACING
- Tighter: -0.05em
- Tight: -0.025em (Headings)
- Normal: 0 (Default)
- Wide: 0.025em

## TYPOGRAPHY HIERARCHY
- H1: 48px (5xl), Bold (700), Line-height 1.25, Letter-spacing -0.025em
- H2: 36px (4xl), Bold (700), Line-height 1.25
- H3: 24px (2xl), Semibold (600), Line-height 1.25
- H4: 20px (xl), Semibold (600)
- H5: 18px (lg), Semibold (600)
- H6: 16px (base), Semibold (600)
- Body: 16px (base), Normal (400), Line-height 1.625, Color #525252
- Small: 14px (sm), Normal (400)

## RESPONSIVE TYPOGRAPHY
- Mobile H1: 36px (4xl)
- Mobile H2: 30px (3xl)
- Mobile H3: 20px (xl)

# ============================================
# 3. SPACING SYSTEM (8px Base Grid)
# ============================================

STRICT RULE: All spacing must follow 8px grid system. NO random values.

- 0: 0px
- 1: 4px
- 2: 8px (Base unit)
- 3: 12px
- 4: 16px (Common spacing)
- 5: 20px
- 6: 24px (Card padding, section spacing)
- 8: 32px (Larger spacing)
- 10: 40px
- 12: 48px
- 16: 64px
- 20: 80px (Container padding desktop)
- 24: 96px (Section vertical spacing)
- 32: 128px (Large section spacing)

## SECTION SPACING
- Standard Section: 96px (24) top and bottom padding
- Small Section: 64px (16) top and bottom
- Large Section: 128px (32) top and bottom

## CONTAINER PADDING
- Desktop: 80px left/right
- Tablet: 40px left/right
- Mobile: 24px left/right

## COMPONENT SPACING
- Card internal padding: 24px (6) or 32px (8)
- Input spacing between fields: 16px (4) to 24px (6)
- Button margin-top in forms: 24px (6)
- Gap between form elements: 16px (4)

# ============================================
# 4. LAYOUT SYSTEM
# ============================================

## CONTAINER
- Max Width: 1440px
- Centered: margin-left: auto; margin-right: auto
- Padding Desktop: 80px left/right
- Padding Tablet: 40px left/right
- Padding Mobile: 24px left/right

## GRID SYSTEM
- Columns: 12 columns
- Gutter: 24px

## RESPONSIVE BREAKPOINTS
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

# ============================================
# 5. COMPONENT SIZES
# ============================================

## BUTTONS
### Heights
- Small: 36px
- Medium: 44px (Default)
- Large: 52px

### Padding Horizontal
- Small: 16px
- Medium: 24px (Default)
- Large: 32px

### Border Radius: 12px (lg)

### Variants:
1. **Primary**: 
   - Background: #1A9E6F
   - Text: White
   - Hover: #157E59
   - Active: #105E43
   - Shadow: sm, hover: md
   - Focus ring: 2px, color #1A9E6F

2. **Secondary**:
   - Background: White
   - Text: #1A9E6F
   - Border: 2px solid #1A9E6F
   - Hover background: #F0F9F6
   - Shadow: sm, hover: md

3. **Outline**:
   - Background: Transparent
   - Text: #525252
   - Border: 1px solid #E5E5E5
   - Hover background: #FAFAFA
   - Hover border: #D4D4D4

4. **Ghost**:
   - Background: Transparent
   - Text: #525252
   - Hover background: #FAFAFA
   - No border

5. **Destructive**:
   - Background: #EF4444
   - Text: White
   - Hover: #DC2626
   - Shadow: sm, hover: md

### Disabled State:
- Background: #A3A3A3
- Cursor: not-allowed
- Opacity: 0.6

## INPUTS
### Heights
- Small: 40px
- Medium: 48px (Default)
- Large: 56px

### Padding
- Horizontal: 16px
- Vertical: 12px

### Border Radius: 12px (lg)

### States:
- Default: Border #E5E5E5, Background white
- Hover: Border #D4D4D4
- Focus: Border #1A9E6F, Ring 2px #1A9E6F
- Error: Border #EF4444, Ring #EF4444
- Disabled: Background #F5F5F5, Text #A3A3A3
- Placeholder: #737373

### Label:
- Font: 14px (sm), Semibold (600)
- Color: #171717
- Margin bottom: 8px

## CARDS
### Variants:
1. **Default**: 
   - Background: White
   - Border: 1px solid #E5E5E5
   - Shadow: sm

2. **Elevated**:
   - Background: White
   - Border: None
   - Shadow: lg
   - Hover: shadow-xl
   - Transition: shadow 300ms

3. **Outlined**:
   - Background: White
   - Border: 2px solid #E5E5E5
   - Shadow: None

4. **Subtle**:
   - Background: #FAFAFA
   - Border: 1px solid #F5F5F5
   - Shadow: sm

5. **Glass**:
   - Background: rgba(255, 255, 255, 0.9)
   - Backdrop blur: 20px
   - Border: 1px solid rgba(255, 255, 255, 0.3)
   - Shadow: xl

### Padding:
- None: 0
- Small: 16px
- Medium: 24px (Default)
- Large: 32px

### Border Radius: 16px (xl)

## MODALS
### Sizes:
- Small: max-width 480px
- Medium: max-width 640px (Default)
- Large: max-width 800px

### Structure:
- Backdrop: rgba(0, 0, 0, 0.5) with blur
- Background: White
- Border Radius: 16px (xl)
- Shadow: 2xl
- Padding: 32px (8) horizontal, 24px (6) vertical
- Max height: 90vh
- Animation: scale-in on open

### Header:
- Padding: 32px (8) horizontal, 24px (6) vertical
- Border bottom: 1px solid #E5E5E5
- Title: 20px (xl), Bold, Color #171717

### Footer:
- Padding: 32px (8) horizontal, 24px (6) vertical
- Border top: 1px solid #E5E5E5
- Button gap: 24px (6)

# ============================================
# 6. BORDER RADIUS
# ============================================

- None: 0px
- Small: 6px
- Medium: 8px
- Large: 12px (Buttons, inputs)
- XL: 16px (Cards, modals)
- 2XL: 24px
- Full: 9999px (Pills, badges)

# ============================================
# 7. SHADOWS
# ============================================

- xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)
- md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)
- lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)
- xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)
- 2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
- inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)

# ============================================
# 8. TRANSITIONS & ANIMATIONS
# ============================================

## TRANSITION DURATIONS
- Fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
- Base: 200ms cubic-bezier(0.4, 0, 0.2, 1) (Default)
- Slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Slower: 500ms cubic-bezier(0.4, 0, 0.2, 1)

## ANIMATIONS
### Fade In:
- From: opacity 0
- To: opacity 1
- Duration: 200ms

### Fade Up:
- From: opacity 0, translateY(20px)
- To: opacity 1, translateY(0)
- Duration: 300ms

### Slide In:
- From: opacity 0, translateX(-20px)
- To: opacity 1, translateX(0)
- Duration: 200ms

### Scale In:
- From: opacity 0, scale(0.95)
- To: opacity 1, scale(1)
- Duration: 200ms

## TRANSITION PROPERTIES
- Buttons: all 200ms
- Cards: shadow 300ms, transform 300ms
- Inputs: all 200ms
- Hover effects: 200-300ms

# ============================================
# 9. Z-INDEX SCALE
# ============================================

- Base: 0
- Dropdown: 1000
- Sticky: 1020
- Fixed: 1030
- Modal Backdrop: 1040
- Modal: 1050
- Popover: 1060
- Tooltip: 1070

# ============================================
# 10. SPECIAL EFFECTS
# ============================================

## GLASSMORPHISM
- Background: rgba(255, 255, 255, 0.8) or rgba(255, 255, 255, 0.9)
- Backdrop filter: blur(20px)
- Border: 1px solid rgba(255, 255, 255, 0.3)
- Shadow: xl

## GRADIENT OVERLAY
- Background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.6) 100%)
- Use for hero sections with images

## HOVER EFFECTS
- Cards: translateY(-4px), shadow increase
- Buttons: Background color change, shadow increase
- Links: Color change to primary

# ============================================
# 11. UTILITY CLASSES
# ============================================

## TEXT UTILITIES
- .text-balance: text-wrap: balance (for headings)

## SCROLLBAR STYLING
- Width: 8px
- Track: #FAFAFA
- Thumb: #D4D4D4, border-radius: 9999px
- Thumb hover: #A3A3A3

## SELECTION
- Background: #F0F9F6 (Primary light)
- Color: #105E43 (Primary dark)

## FOCUS VISIBLE
- Outline: 2px solid #1A9E6F
- Offset: 2px
- Border radius: 6px

# ============================================
# 12. HEADER STYLING
# ============================================

- Background: White (sticky)
- Height: Auto (content-based)
- Padding: 16px (4) vertical, responsive horizontal (24px mobile, 80px desktop)
- Border bottom: 1px solid #E5E5E5 (optional)
- Shadow: sm (on scroll)
- Logo: Left aligned, margin-left responsive (24px mobile, 80px desktop)
- Navigation: Center aligned
- Auth buttons: Right aligned, margin-right responsive (24px mobile, 80px desktop)

# ============================================
# 13. FOOTER STYLING
# ============================================

- Background: #171717 (Dark)
- Text: White
- Padding: 64px (16) vertical, responsive horizontal (24px mobile, 80px desktop)
- Border top: 1px solid #404040
- Links: #737373, hover: White
- Copyright: #737373, 14px

# ============================================
# 14. HERO SECTION STYLING
# ============================================

- Height: 100vh (minimum 700px)
- Background: Full-width image with gradient overlay
- Overlay: Gradient from black/70 via black/60 to black/70
- Content: Centered, white text
- Headline: 72px (7xl) desktop, 48px mobile, Bold, Line-height 1.25
- Subheadline: 20px (xl), Line-height 1.625, White/90 opacity
- Search card: Glass effect, max-width 600px, padding 32px

# ============================================
# 15. RESPONSIVE DESIGN RULES
# ============================================

## MOBILE (< 768px)
- Container padding: 24px
- Typography scales down (see Typography section)
- Cards stack vertically
- Buttons full width in forms
- Spacing reduces by ~25%

## TABLET (768px - 1024px)
- Container padding: 40px
- Grid: 2 columns max
- Typography: Medium sizes

## DESKTOP (> 1024px)
- Container padding: 80px
- Full grid system
- Maximum typography sizes

# ============================================
# 16. IMPLEMENTATION CHECKLIST
# ============================================

✅ Import Inter font from Google Fonts
✅ Set up CSS variables for all colors
✅ Implement 8px spacing grid system
✅ Create button component with all variants
✅ Create input component with all states
✅ Create card component with all variants
✅ Create modal component
✅ Set up typography hierarchy
✅ Implement responsive container system
✅ Add transitions and animations
✅ Style scrollbars
✅ Implement glassmorphism effects
✅ Set up z-index scale
✅ Add hover effects
✅ Test responsive breakpoints
✅ Verify color contrast ratios
✅ Test focus states for accessibility

# ============================================
# CRITICAL DESIGN PRINCIPLES
# ============================================

1. **8px Grid System**: ALL spacing must be multiples of 8px
2. **Consistent Colors**: Use exact hex codes, never approximate
3. **Typography Hierarchy**: Strict font size/weight relationships
4. **Subtle Shadows**: Never use heavy shadows, keep them refined
5. **Smooth Transitions**: All interactions should be smooth (200-300ms)
6. **White Space**: Generous spacing = premium feel
7. **Consistent Radius**: 12px for buttons/inputs, 16px for cards
8. **Accessibility**: Proper focus states, contrast ratios
9. **Mobile First**: Design for mobile, enhance for desktop
10. **No Random Values**: Every spacing, size, color must be from the system

# ============================================
# END OF DESIGN SYSTEM
# ============================================

Apply this design system consistently across ALL components and pages. 
Every element should follow these exact specifications. No deviations.
```

---

## 📝 USAGE INSTRUCTIONS

1. **Copy the entire prompt above** (everything between the triple backticks)
2. **Provide it to your AI assistant** when working on the new website
3. **Specify**: "Apply this complete design system to [your website name]"
4. **Reference**: The AI should use these exact values for all styling decisions

## 🎯 KEY FEATURES TO IMPLEMENT

- ✅ Complete color palette with exact hex codes
- ✅ Typography system with Inter font
- ✅ 8px spacing grid (strict)
- ✅ Component library (buttons, inputs, cards, modals)
- ✅ Responsive breakpoints
- ✅ Animations and transitions
- ✅ Glassmorphism effects
- ✅ Shadow system
- ✅ Border radius scale
- ✅ Z-index hierarchy

## 🔍 VERIFICATION

After implementation, verify:
- All colors match exact hex codes
- Spacing follows 8px grid
- Typography uses Inter font
- Components match specifications
- Responsive breakpoints work
- Animations are smooth
- Focus states are accessible

---

**Note**: This design system is optimized for premium SaaS applications with a sophisticated, minimal aesthetic. Maintain consistency across all implementations.
