---
inclusion: always
---

# Color System Guidelines

## STRICT RULE: Grayscale Only

CommerceOS uses a **strictly grayscale color palette**. No colors are allowed in the design system.

## Mandatory Import Pattern

**ALL components and pages MUST import colors from the theme constants:**

```typescript
import { colors } from '@/constants/theme';
```

## ❌ NEVER DO THIS:

```typescript
// Hardcoded colors
<div className="bg-blue-500" />
<div style={{ color: '#FF0000' }} />
<div className="text-red-600" />

// Inline color values
const buttonStyle = { backgroundColor: '#3B82F6' };
```

## ✅ ALWAYS DO THIS:

```typescript
import { colors } from '@/constants/theme';

// Using Tailwind with custom config
<div className="bg-gray-100" />

// Using inline styles with theme constants
<div style={{ backgroundColor: colors.background.primary }} />
<div style={{ color: colors.text.secondary }} />

// Using in styled components or CSS-in-JS
const Button = styled.button`
  background-color: ${colors.gray[900]};
  color: ${colors.white};
`;
```

## Available Color Categories

1. **Pure Colors**: `colors.white`, `colors.black`
2. **Gray Scale**: `colors.gray[50]` through `colors.gray[950]`
3. **Semantic Backgrounds**: `colors.background.primary`, `colors.background.secondary`, etc.
4. **Text Colors**: `colors.text.primary`, `colors.text.secondary`, etc.
5. **Borders**: `colors.border.light`, `colors.border.medium`, `colors.border.dark`
6. **Surfaces**: `colors.surface.elevated`, `colors.surface.base`, `colors.surface.sunken`

## Tailwind Configuration

When using Tailwind classes, ensure your `tailwind.config.ts` extends the theme with grayscale values only:

```typescript
theme: {
  extend: {
    colors: {
      // Only grayscale extensions allowed
      gray: { /* custom gray shades */ }
    }
  }
}
```

## Why This Matters

1. **Consistency**: Single source of truth for all colors
2. **Maintainability**: Easy to update the entire color scheme
3. **Brand Identity**: Enforces the minimalist, professional aesthetic
4. **Accessibility**: Grayscale ensures high contrast and readability

## Code Review Checklist

Before committing code, verify:
- [ ] No hardcoded color values in className or style props
- [ ] All colors imported from `@/constants/theme`
- [ ] No Tailwind color classes outside grayscale (no `bg-blue-*`, `text-red-*`, etc.)
- [ ] No RGB/HEX color values in inline styles

## Exceptions

There are NO exceptions to this rule. If you think you need a color, you're wrong. Use grayscale.
