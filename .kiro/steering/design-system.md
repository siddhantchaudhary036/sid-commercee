---
inclusion: always
---

# Design System Guidelines

## Core Philosophy

CommerceOS values **minimalism, whitespace, and clarity**. Every design decision should prioritize:
- Open space over density
- Simplicity over decoration
- Clarity over cleverness

## Typography Rules

### Font Sizes - Keep Everything Small

**NEVER use large text unless absolutely necessary.**

```typescript
// ❌ WRONG - Too large
<h1 className="text-4xl">Dashboard</h1>
<p className="text-xl">Description</p>

// ✅ CORRECT - Appropriately sized
<h1 className="text-lg font-semibold">Dashboard</h1>
<p className="text-sm">Description</p>
```

### Approved Font Sizes:
- **Headings**: `text-sm` to `text-lg` (never larger)
- **Body text**: `text-xs` to `text-sm`
- **Labels**: `text-xs`
- **Large numbers/stats**: `text-2xl` maximum

### Font Weights:
- **Normal**: 400 (default)
- **Medium**: 500 (for emphasis)
- **Semibold**: 600 (for headings only)
- **Bold**: 700 (avoid unless critical)

## Spacing & Layout

### Embrace Whitespace

**More space = better design**

```typescript
// ❌ WRONG - Too cramped
<div className="p-2 gap-1">
  <div className="mb-1">Content</div>
</div>

// ✅ CORRECT - Generous spacing
<div className="p-6 gap-4">
  <div className="mb-4">Content</div>
</div>
```

### Spacing Scale:
- **Tight**: `gap-2`, `p-2` (rare)
- **Normal**: `gap-4`, `p-4` (common)
- **Comfortable**: `gap-6`, `p-6` (preferred)
- **Spacious**: `gap-8`, `p-8` (for major sections)

### Container Sizes:
- Keep containers **narrow** for readability
- Max width: `max-w-3xl` for content
- Use `max-w-7xl` only for full-width layouts

## Color System

### MANDATORY: Import from Theme

**ALL colors must be imported from `constants/theme.ts`**

```typescript
import { colors } from '@/constants/theme';

// ❌ WRONG - Hardcoded colors
<div className="bg-gray-100 text-gray-900" />
<div style={{ color: '#000000' }} />

// ✅ CORRECT - Theme imports
<div className="bg-gray-50 text-gray-900" />
<div style={{ backgroundColor: colors.background.secondary }} />
```

### Available Colors:
- **Backgrounds**: `bg-white`, `bg-gray-50`, `bg-gray-100`
- **Text**: `text-gray-900`, `text-gray-600`, `text-gray-500`, `text-gray-400`
- **Borders**: `border-gray-200`, `border-gray-300`
- **Accents**: `bg-black`, `text-black` (for CTAs only)

## Icons & Visual Elements

### NO EMOJIS - EVER

**Emojis are STRICTLY FORBIDDEN in the UI.**

```typescript
// ❌ WRONG - Using emojis
<span>✨ AI Discovered</span>
<div>📊 Analytics</div>
<button>🎯 Create Segment</button>

// ✅ CORRECT - Use text or SVG icons
<span className="text-xs uppercase">AI Discovered</span>
<div className="text-sm">Analytics</div>
<button>Create Segment</button>
```

### Icon Guidelines:
- Use **Lucide React** or **Heroicons** for icons
- Keep icons small: `w-4 h-4` or `w-5 h-5`
- Use `text-gray-400` or `text-gray-500` for icon colors
- Icons should be subtle, not dominant

```typescript
import { Sparkles, BarChart } from 'lucide-react';

<Sparkles className="w-4 h-4 text-gray-400" />
<BarChart className="w-4 h-4 text-gray-500" />
```

## Component Patterns

### Cards

```typescript
// Minimal card design
<div className="border border-gray-200 rounded-lg p-6">
  <h3 className="text-sm font-semibold text-gray-900 mb-2">Title</h3>
  <p className="text-xs text-gray-600">Description</p>
</div>
```

### Buttons

```typescript
// Primary button
<button className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800">
  Action
</button>

// Secondary button
<button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
  Cancel
</button>
```

### Input Fields

```typescript
<input
  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
  placeholder="Enter text..."
/>
```

## Layout Principles

### 1. Generous Padding
- Sections: `p-6` to `p-8`
- Cards: `p-4` to `p-6`
- Containers: `px-6` minimum

### 2. Clear Hierarchy
- Use size and weight, not color
- Primary: `text-sm font-semibold text-gray-900`
- Secondary: `text-xs text-gray-600`
- Tertiary: `text-xs text-gray-500`

### 3. Subtle Borders
- Always use `border-gray-200` or `border-gray-300`
- Never use thick borders (`border-2` is maximum)

### 4. Minimal Shadows
- Avoid shadows unless necessary
- If needed: `shadow-sm` only
- Hover states: `hover:shadow-sm`

## Examples

### ❌ BAD - Cramped, emoji-heavy, large text
```typescript
<div className="p-2">
  <h1 className="text-4xl mb-2">✨ Dashboard</h1>
  <div className="bg-blue-500 p-2">
    <span className="text-2xl">📊 Stats</span>
  </div>
</div>
```

### ✅ GOOD - Spacious, clean, appropriate sizing
```typescript
<div className="p-8">
  <h1 className="text-lg font-semibold text-gray-900 mb-6">Dashboard</h1>
  <div className="border border-gray-200 rounded-lg p-6">
    <span className="text-xs uppercase text-gray-500 tracking-wide">Stats</span>
  </div>
</div>
```

## Checklist

Before committing any UI code, verify:
- [ ] No emojis anywhere in the UI
- [ ] All colors imported from `constants/theme.ts`
- [ ] Font sizes are small (`text-sm` or smaller for most text)
- [ ] Generous padding and spacing (`p-6`, `gap-4` minimum)
- [ ] Only grayscale colors used
- [ ] Clear visual hierarchy without relying on color
- [ ] Plenty of whitespace between elements

## Remember

**Less is more. Space is valuable. Simplicity wins.**
