# Login Screen - Visual Design Guide

## 🎨 Color Reference

```
Primary (Coral)        #E67C5C     Used for: CTA buttons, selected states, highlights
Secondary (Teal)       #1F3D3A     Used for: Headers, authority elements
Background             #FAF7F2     Used for: Main background, safe/neutral space
Text Primary           #1F2933     Used for: Main text, high contrast
Text Secondary         #6B7280     Used for: Subtitles, labels, secondary info
Border                 #E5E7EB     Used for: Input borders, dividers
White                  #FFFFFF     Used for: Cards, input backgrounds
```

## 📐 Key Measurements

```
Icon Size              72px (reduced from 84px)
Input Height           52px (increased from 40px)
Button Height          56px (increased from ~45px)
Border Radius          12-18px (increased from 10px)
Icon Padding           14px horizontal, 12px vertical
Button Shadow          4px drop, 20% opacity
Input Focus Shadow     6px drop, 10% opacity
```

## 📝 Typography Stack

```
HEADINGS
Font: Poppins (SemiBold)
Size: 28px
Weight: 700
Line Height: 1.3
Example: "Welcome Back"

SUBTITLE
Font: Inter (Regular)
Size: 15px
Weight: 400
Line Height: 1.5
Example: "Log in to your account and explore amazing artists"

LABELS
Font: Inter (SemiBold)
Size: 13px
Weight: 600
Letter Spacing: 0.3px
Example: "Email Address"

HELPER TEXT
Font: Inter (Regular)
Size: 11px
Weight: 400
Color: #6B7280
Example: "Book artists"

BUTTON TEXT
Font: Inter (Bold)
Size: 16px
Weight: 700
Letter Spacing: 0.2px
Example: "Continue"
```

## 🎯 Component Spacing

```
Page Padding (horizontal)     20px
Page Padding (top)            32px
Page Padding (bottom)         40px

Icon to Title                 20px
Title to Subtitle             8px
Subtitle to Content           32px

Card Padding                  24px
Segmented Control Bottom      28px
Input Label Bottom            8px
Input Bottom                  18px
Password Field Bottom         20px
Forgot Password Bottom        24px
Button Bottom                 8px
Signup Link Top               20px
```

## 🔘 Button States

### Default State
- Background: #E67C5C (Coral)
- Text: White
- Height: 56px
- Shadow: 4px, 20% opacity
- Corner Radius: 14px
- Font Weight: 700

### Pressed State
- Background: #D66349 (Darker coral)
- Text: White
- Shadow: Increased (4px, 30% opacity)
- Elevation: +1

### Disabled State
- Background: #E67C5C
- Opacity: 0.5
- No interaction

## 🎨 Segmented Control

### Structure
```
┌─────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐    │
│  │ User     │  │ Artist   │    │
│  │ Book     │  │ Get      │    │
│  └──────────┘  └──────────┘    │
└─────────────────────────────────┘
```

### Active State
- Background: #E67C5C (Coral)
- Text: White
- Icon: Filled
- Shadow: 4px, 20% opacity

### Inactive State
- Background: Transparent
- Text: #6B7280 (Gray)
- Icon: Outline
- Border: #E5E7EB

## ⌨️ Input Field Focus

### Default State
- Border: #E5E7EB (Light gray)
- Border Width: 1.5px
- Background: #FFFFFF
- Icon Color: #6B7280
- Height: 52px

### Focused State
- Border: #E67C5C (Coral)
- Border Width: 1.5px
- Background: #FFFFFF
- Icon Color: #E67C5C (Coral)
- Shadow: 6px, 10% opacity
- Height: 52px

## 🔐 Password Eye Icon

### Default
- Size: 16px
- Color: #6B7280 (Secondary text)
- Style: Outline

### On Focus
- Size: 16px
- Color: #6B7280 (Stays same)
- Style: Outline

## 🎯 Visual Hierarchy

1. **Icon** - Largest, focal point (72px)
2. **Title** - Large, primary heading (28px, bold)
3. **Subtitle** - Supporting text (15px, gray)
4. **Account Type** - Important choice (medium, with helper text)
5. **Form Labels** - Clear structure (13px, semibold)
6. **Inputs** - Large touch targets (52px tall)
7. **Button** - Strong CTA (56px tall, coral)
8. **Links** - Secondary actions (14px, coral underlined)

## 🌟 Microcopy

| Element | Text | Why |
|---------|------|-----|
| Main Title | "Welcome Back" | Warm, personal greeting |
| Subtitle | "Log in to your account and explore amazing artists" | Clear value proposition |
| User Helper | "Book artists" | Explains user role |
| Artist Helper | "Get booked & earn" | Explains artist role |
| Forgot Password | "Reset password" | Clearer than "Forgot?" |
| New Account | "New here?" | Warmer than "Don't have account?" |
| Signup Link | "Sign Up" | Simple, clear CTA |
| Button | "Continue" | Friendly, modern feel |

## 📱 Responsive Behavior

```
Phone (320-480px)      - Full width, same spacing
Tablet (480px+)        - Optional: Center card, max-width 400px
                       - Maintain all spacing and sizing
```

## ✨ Animation & Micro-interactions

```
Button Press           - Color change, shadow increase (100ms)
Input Focus           - Border color + shadow appear (150ms)
Tab Switching         - Smooth color transition (200ms)
Eye Icon Toggle       - Icon swap instantly
```

## 🎯 Accessibility Checklist

✅ Minimum tap target: 48x48px (button is 56px tall)
✅ Input height: 52px (larger than minimum)
✅ Text contrast ratio: 7:1+ (WCAG AAA)
✅ Clear labels for all inputs
✅ Focus states clearly visible
✅ Icon + text for clarity
✅ Large enough touch targets
✅ Clear visual hierarchy
✅ No color-only information
✅ Readable font sizes (13px+)
