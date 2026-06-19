# /ui

---
name: ui
description: Use this skill to implement any UI component, screen, or page on any platform — web (React, Next.js, Vue, Svelte), mobile (React Native, Expo, Flutter, SwiftUI, Jetpack Compose), or cross-platform. If the project already has a design.md file at the root, the skill reads it and acts as a professional frontend/mobile engineer who implements strictly to that design system. Run /ui with a screenshot or image for pixel-perfect replication. Run /ui without an image to pick from 5 curated design templates, provide a URL to a design.md, or describe a custom style — in all cases the skill auto-detects the tech stack, generates design.md at the project root, creates the matching platform-native token files, and implements the UI. Do not run /ui for backend logic, API routes, server actions, or data queries — those are driven by the ADR and implemented separately.
---

## What this skill does

Three entry points — checked in this order:

1. **Existing design.md** — `./design.md` already present → professional engineer role, implement strictly to spec for the detected platform.
2. **Image provided** — pixel-perfect replication: vision analysis → token extraction → platform-native token files → implementation.
3. **No image, no design.md** — template / URL / custom style → generate `./design.md` + platform-native token files → implementation.

All paths go through: **stack detection → token files → five implementation phases**.

---

## Step 0 — Check for existing design.md

Run this first, before anything else:

```bash
find . -maxdepth 3 -name "design.md" \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/.claude/*' | head -5
```

**Found** → **Design.md path** (below). Skip Steps 1 onward.

**Not found** → **Step 1**.

---

## Stack detection (run once, used by all paths)

Before creating or updating any token files, identify the tech stack:

```bash
# React Native / Expo
find . -maxdepth 2 -name "package.json" -not -path '*/node_modules/*' \
  | xargs grep -l '"react-native"\|"expo"' 2>/dev/null | head -1

# Flutter
find . -maxdepth 3 -name "pubspec.yaml" -not -path '*/node_modules/*' | head -1

# SwiftUI
find . -maxdepth 6 -name "*.swift" | head -1

# Jetpack Compose / Android Kotlin
find . -maxdepth 8 -name "*.kt" | head -1

# Web (default if none of the above match)
find . -maxdepth 2 \( -name "next.config.*" -o -name "vite.config.*" \
  -o -name "nuxt.config.*" -o -name "svelte.config.*" \) \
  -not -path '*/node_modules/*' | head -1
```

**Detected stack → token format → structure primitives:**

| Detected | Stack label | Token file | Token format |
|---|---|---|---|
| `react-native` or `expo` in package.json | **React Native** | `src/theme/tokens.ts` | Exported TS const object with numeric spacing, string colors |
| `pubspec.yaml` present | **Flutter** | `lib/core/theme/app_tokens.dart` | Dart `const` — `Color(0xFF...)`, `double` spacing |
| `*.swift` files present | **SwiftUI** | `Sources/DesignSystem/Tokens.swift` | Swift `extension Color`, `struct Tokens` with `CGFloat` |
| `*.kt` files present | **Jetpack Compose** | `ui/theme/Tokens.kt` | Kotlin `object` with `Color(0xFF...)`, `Dp` values |
| Everything else | **Web** | `app/globals.css` or `src/styles/tokens.css` | CSS custom properties in `:root {}` |

If a token file already exists in a different location, use that path instead of the default above.

---

## Design.md path — existing design system

You are a **professional frontend/mobile engineer** maintaining this project's design system. Your primary directive:

> Every colour, font family, spacing value, border radius, shadow, and component pattern in your implementation must be sourced from `design.md`. You do not invent visual values. If something is not specified in design.md, derive it from the closest specified value rather than guessing freely.

### DS1 — Read and internalize design.md

Read `./design.md` in full. Extract:

- **Color palette**: canvas, surface(s), ink, body, muted, accent(s), border, semantic colors
- **Typography**: font family + open-source substitute if proprietary, type scale, weight ladder, line-heights, letter-spacing rules
- **Spacing system**: base unit, named steps, section rhythm
- **Border radius**: per-element mapping (buttons, cards, inputs, badges, pills)
- **Shadows / elevation**: shadow values, surface-color ladder, or border-only approach
- **Component patterns**: button hierarchy, card structure, input style, any signature components
- **Do's and Don'ts**: apply every constraint listed without exception

### DS2 — Detect stack and sync token files

Run **Stack detection** above. Then:

```bash
find . -not -path '*/node_modules/*' -not -path '*/.git/*' \
  \( -name "tokens.ts" -o -name "tokens.swift" -o -name "Tokens.kt" \
     -o -name "app_tokens.dart" -o -name "globals.css" -o -name "tokens.css" \
     -o -name "tailwind.config.*" -o -name "theme.ts" \) | head -10
```

Cross-check existing token files against design.md. Add absent tokens. **Never remove existing tokens** — only add or update. If no token file exists, create one in the stack-appropriate format (see **Token formats** section).

### DS3 — Implement

Proceed to **Implementation phases** using the detected stack. Apply design.md as the single source of truth throughout.

---

## Step 1 — Detect image vs no image

**Image is attached to the prompt** → **Path A**.

**No image** → **Path B**.

---

## Path A — Pixel-perfect from image

### A1 — Vision analysis

Examine the image with full attention. Extract every visual property:

**Colors** — exact hex values, not approximations:
- Canvas / page background
- Card or surface background (if different)
- Hover and selected state backgrounds
- Primary text, secondary/muted text, disabled text
- Accent / brand color and its pressed state
- Semantic: success, warning, error, info (if visible)
- Border, divider, overlay colors

**Typography**:
- Font family — name it if recognizable (Inter, SF Pro, Roboto, Geist…); otherwise describe character
- Font sizes — assign body text as 16px anchor, derive others proportionally
- Font weights — thin 300, regular 400, medium 500, semibold 600, bold 700
- Line height — estimate from vertical rhythm
- Letter spacing — note tight or tracked-out headings

**Spacing** — use 4px base unit:
- Internal card/container padding
- Gap between items and grid columns
- Section-level vertical rhythm
- Page margins and max-width

**Geometry**:
- Border radius per element type
- Border width and color
- Box shadows: `x y blur spread color/opacity`
- Gradients: direction and stops
- Glassmorphism or backdrop-blur

**Mode**: dark or light? High or low contrast? Sharp or rounded?

### A2 — Produce the token schema

Define tokens in the universal design.md YAML format (used across all platforms):

```yaml
colors:
  canvas: "<hex>"
  surface: "<hex>"
  surface-elevated: "<hex>"
  ink: "<hex>"
  body: "<hex>"
  muted: "<hex>"
  accent: "<hex>"
  accent-pressed: "<hex>"
  border: "<hex>"
  on-primary: "<hex>"
  success: "<hex>"    # only if visible
  error: "<hex>"      # only if visible

typography:
  body-md:
    fontFamily: "<Family>, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  heading-lg:
    fontFamily: "<same>"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
  button-md:
    fontFamily: "<same>"
    fontSize: 14px
    fontWeight: 500

rounded:
  sm: <px>
  md: <px>
  lg: <px>
  xl: <px>
  full: 9999px

spacing:
  sm:      <px>
  md:      <px>
  lg:      <px>
  xl:      <px>
  section: <px>
```

Only define tokens actually needed. Do not fabricate values not visible in the image.

### A3 — Token file management

Run **Stack detection**, then find existing token files:

```bash
find . -not -path '*/node_modules/*' -not -path '*/.git/*' \
  \( -name "tokens.ts" -o -name "tokens.swift" -o -name "Tokens.kt" \
     -o -name "app_tokens.dart" -o -name "globals.css" -o -name "tokens.css" \
     -o -name "tailwind.config.*" -o -name "theme.ts" \) | head -10
```

**Three cases:**

**No token file** → create one using the **Token formats** section below. Report path.

**File exists, no conflicts** → append new tokens. Report what was added.

**File exists, conflicts** → stop and show before writing:

```
I found `<path>` with values that differ from the image:

| Token | Current value | Value from image |
|---|---|---|
| accent | #0070f3 | #5E6AD2 |
| font-sans | 'Inter' | 'Geist' |

Reply with:
- `update` — overwrite conflicting tokens with image values
- `extend` — add image tokens under new names alongside existing
- `skip` — keep existing (implementation may not be pixel-perfect)
```

Wait for reply before writing.

---

## Path B — No image, no design.md yet

### B1 — Read templates and present options

Before calling `AskUserQuestion`, read all five template files:
```
.claude/skills/ui/templates/stripe.md
.claude/skills/ui/templates/posthog.md
.claude/skills/ui/templates/nike.md
.claude/skills/ui/templates/supabase.md
.claude/skills/ui/templates/raycast.md
```

`AskUserQuestion` supports max 4 options — use a **two-question flow**:

**Question 1 — Mood:**
```
question: "No design was provided. What mood should this UI have?"
header: "Visual mood"
options:
  - label: "Dark & developer"       description: "Near-black, command-palette precision, technical — Raycast style"
  - label: "Light & professional"   description: "White/off-white, trustworthy, technical — Stripe or Supabase style"
  - label: "Playful & editorial"    description: "Bold personality — warm cream (PostHog) or sport editorial (Nike)"
  - label: "Custom — I'll describe" description: "Describe a style, name a company, or paste a URL to a design.md file"
```

**Question 2 — Specific template** (skip if "Dark & developer" → auto-select Raycast; skip if "Custom"):

For "Light & professional":
```
question: "Which professional style?"
options:
  - label: "Stripe"    description/preview: <from stripe.md frontmatter>
  - label: "Supabase"  description/preview: <from supabase.md frontmatter>
```

For "Playful & editorial":
```
question: "Which personality fits best?"
options:
  - label: "PostHog"  description/preview: <from posthog.md frontmatter>
  - label: "Nike"     description/preview: <from nike.md frontmatter>
```

### B2 — Acquire the design system

**Template selected** → copy to project root:
```bash
cp .claude/skills/ui/templates/<name>.md ./design.md
```
Confirm: "`<name>` design system copied to `./design.md`. Future `/ui` runs will use it automatically."

---

**URL provided** (engineer's text contains a URL) → fetch and save:
```bash
# Convert GitHub blob URL to raw if needed:
# github.com/<o>/<r>/blob/<b>/<p> → raw.githubusercontent.com/<o>/<r>/<b>/<p>
```
Fetch the content. Save to `./design.md`. Confirm source URL.

---

**Style description provided** (e.g. "cyberpunk", "brutalist", "neon green dark", "like Notion") → generate `./design.md` using the exact format of the template files:

```
---
version: alpha
name: <StyleName>-design-analysis
description: <2–3 sentence character description>

colors:
  primary: "<hex>"
  on-primary: "<hex>"
  canvas: "<hex>"
  surface: "<hex>"
  ink: "<hex>"
  body: "<hex>"
  muted: "<hex>"
  hairline: "<hex>"
  <all remaining semantic + accent colors>

typography:
  <each role: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing>

rounded:
  <xs through full with px values>

spacing:
  <xxs through section with px values>

components:
  <key components referencing {colors.*}, {typography.*}, {rounded.*}>
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
  ### Do / ### Don't
## Responsive Behavior
```

Aesthetic derivation guide:
- **Cyberpunk** → near-black canvas, neon cyan `#00FFFF` / magenta `#FF00FF` accents, 0–2px radius, `'Share Tech Mono'` display, tight dense spacing
- **Brutalist** → pure `#000000` / `#FFFFFF`, 0px radius everywhere, thick 2–4px borders, oversized mismatched type, raw grid
- **Glassmorphism** → dark canvas, semi-transparent `rgba()` surfaces, `backdrop-filter: blur()`, 16–24px radius, neon border glow
- **Notion-like** → `#FFFFFF` / `#F7F6F3` canvas, Georgia + Inter, 3px radius, generous line-height, block-based structure
- **Apple consumer** → `#FFFFFF` canvas, `-apple-system` font stack, 10–20px radius, generous touch targets, system colors
- For any other description: choose values that are aesthetically correct for that mood — do not leave placeholders

Write the full file to `./design.md`.

### B3 — Create token code files

Run **Stack detection**. Read `./design.md` YAML frontmatter. Create the token file in the detected format:

---

#### Web (CSS)

`app/globals.css` or `src/styles/tokens.css`:
```css
:root {
  /* Colors */
  --color-canvas:   <colors.canvas>;
  --color-surface:  <colors.surface>;
  --color-ink:      <colors.ink>;
  --color-body:     <colors.body>;
  --color-muted:    <colors.muted>;
  --color-accent:   <colors.primary>;
  --color-border:   <colors.hairline>;
  /* ... all colors ... */

  /* Typography */
  --font-sans: <typography.body-md.fontFamily>;
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;
  /* ... weight variables ... */

  /* Spacing */
  --space-xs:  <spacing.xs>;
  --space-sm:  <spacing.sm>;
  --space-md:  <spacing.md>;
  --space-lg:  <spacing.lg>;
  --space-xl:  <spacing.xl>;
  --space-section: <spacing.section>;

  /* Radius */
  --radius-sm:   <rounded.sm>;
  --radius-md:   <rounded.md>;
  --radius-lg:   <rounded.lg>;
  --radius-xl:   <rounded.xl>;
  --radius-full: 9999px;
}
```

If Tailwind: add to `tailwind.config.ts` under `theme.extend.colors`, `.fontSize`, `.spacing`, `.borderRadius`.

---

#### React Native / Expo

`src/theme/tokens.ts`:
```typescript
export const colors = {
  canvas:   '<colors.canvas>',
  surface:  '<colors.surface>',
  ink:      '<colors.ink>',
  body:     '<colors.body>',
  muted:    '<colors.muted>',
  accent:   '<colors.primary>',
  border:   '<colors.hairline>',
  // ...
} as const;

export const typography = {
  fontFamily: {
    sans: '<fontFamily fallback — no web fonts, use system fonts>',
    mono: 'Courier New',
  },
  fontSize: {
    xs:   12,   // numeric, not rem — RN uses pt/dp not css units
    sm:   14,
    base: 16,
    lg:   18,
    xl:   20,
    '2xl':24,
    '3xl':30,
    '4xl':36,
  },
  fontWeight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    relaxed:1.7,
  },
} as const;

export const spacing = {
  xs:      4,    // numeric dp/pt — no units in RN
  sm:      8,
  md:      12,
  lg:      16,
  xl:      24,
  '2xl':   32,
  section: 48,
} as const;

export const radius = {
  sm:   <rounded.sm as number>,
  md:   <rounded.md as number>,
  lg:   <rounded.lg as number>,
  xl:   <rounded.xl as number>,
  full: 9999,
} as const;

// Font note: React Native cannot load arbitrary web fonts without expo-font or
// react-native-vector-icons. Use system fonts by default:
// iOS: 'SF Pro' equivalent via '-apple-system' → use undefined (system default)
// Android: 'Roboto' → use undefined (system default)
// Custom font: load with expo-font, then reference by postscript name.
```

---

#### Flutter

`lib/core/theme/app_tokens.dart`:
```dart
import 'package:flutter/material.dart';

abstract class AppColors {
  static const Color canvas   = Color(0xFF<canvas hex without #>);
  static const Color surface  = Color(0xFF<surface hex>);
  static const Color ink      = Color(0xFF<ink hex>);
  static const Color body     = Color(0xFF<body hex>);
  static const Color muted    = Color(0xFF<muted hex>);
  static const Color accent   = Color(0xFF<primary hex>);
  static const Color border   = Color(0xFF<hairline hex>);
  // ...
}

abstract class AppTypography {
  static const TextStyle bodyMd = TextStyle(
    fontSize:   16,
    fontWeight: FontWeight.w400,
    height:     1.5,     // lineHeight / fontSize
  );
  static const TextStyle headingLg = TextStyle(
    fontSize:   24,
    fontWeight: FontWeight.w600,
    height:     1.2,
  );
  static const TextStyle buttonMd = TextStyle(
    fontSize:   14,
    fontWeight: FontWeight.w500,
  );
}

abstract class AppSpacing {
  static const double xs  = 4.0;
  static const double sm  = 8.0;
  static const double md  = 12.0;
  static const double lg  = 16.0;
  static const double xl  = 24.0;
  static const double section = 48.0;
}

abstract class AppRadius {
  static const double sm  = <rounded.sm as double>;
  static const double md  = <rounded.md as double>;
  static const double lg  = <rounded.lg as double>;
  static const double xl  = <rounded.xl as double>;
  static const double full = 9999.0;
}
```

Also create `lib/core/theme/app_theme.dart` wiring `AppColors` into `ThemeData`.

---

#### SwiftUI

`Sources/DesignSystem/Tokens.swift`:
```swift
import SwiftUI

extension Color {
  static let canvas  = Color(hex: "<canvas hex>")
  static let surface = Color(hex: "<surface hex>")
  static let ink     = Color(hex: "<ink hex>")
  static let body    = Color(hex: "<body hex>")
  static let muted   = Color(hex: "<muted hex>")
  static let accent  = Color(hex: "<primary hex>")
  static let border  = Color(hex: "<hairline hex>")
}

// Hex initialiser (add once to the project):
extension Color {
  init(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)
    let r, g, b: Double
    (r, g, b) = (Double((int >> 16) & 0xFF) / 255,
                 Double((int >> 08) & 0xFF) / 255,
                 Double((int >> 00) & 0xFF) / 255)
    self.init(red: r, green: g, blue: b)
  }
}

enum Tokens {
  enum FontSize {
    static let xs:   CGFloat = 12
    static let sm:   CGFloat = 14
    static let base: CGFloat = 16
    static let lg:   CGFloat = 18
    static let xl:   CGFloat = 20
    static let xl2:  CGFloat = 24
    static let xl3:  CGFloat = 30
    static let xl4:  CGFloat = 36
  }
  enum Spacing {
    static let xs:      CGFloat = 4
    static let sm:      CGFloat = 8
    static let md:      CGFloat = 12
    static let lg:      CGFloat = 16
    static let xl:      CGFloat = 24
    static let section: CGFloat = 48
  }
  enum Radius {
    static let sm:   CGFloat = <rounded.sm>
    static let md:   CGFloat = <rounded.md>
    static let lg:   CGFloat = <rounded.lg>
    static let xl:   CGFloat = <rounded.xl>
    static let full: CGFloat = 9999
  }
}
```

---

#### Jetpack Compose

`ui/theme/Tokens.kt`:
```kotlin
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object AppColors {
  val Canvas  = Color(0xFF<canvas hex without #>)
  val Surface = Color(0xFF<surface hex>)
  val Ink     = Color(0xFF<ink hex>)
  val Body    = Color(0xFF<body hex>)
  val Muted   = Color(0xFF<muted hex>)
  val Accent  = Color(0xFF<primary hex>)
  val Border  = Color(0xFF<hairline hex>)
}

object AppType {
  val BodyMd   = androidx.compose.ui.text.TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Normal, lineHeight = 24.sp)
  val HeadingLg = androidx.compose.ui.text.TextStyle(fontSize = 24.sp, fontWeight = FontWeight.SemiBold, lineHeight = 29.sp)
  val ButtonMd  = androidx.compose.ui.text.TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium)
}

object AppSpacing {
  val Xs      = 4.dp
  val Sm      = 8.dp
  val Md      = 12.dp
  val Lg      = 16.dp
  val Xl      = 24.dp
  val Section = 48.dp
}

object AppRadius {
  val Sm   = <rounded.sm>.dp
  val Md   = <rounded.md>.dp
  val Lg   = <rounded.lg>.dp
  val Xl   = <rounded.xl>.dp
  val Full = 9999.dp
}
```

Also wire into `MaterialTheme` via `ui/theme/Theme.kt`.

---

After token files are written, proceed to **Design.md path → DS3** (Implementation phases).

---

## Implementation phases (all paths)

### Phase 1 — Structure

Build the structural skeleton using **platform-appropriate primitives**:

**Web**:
- `<button>` for actions, `<a>` for navigation — never `<div onClick>`
- `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>` for landmarks
- `<ul>/<li>` for lists, `<table>` for tabular data
- TypeScript: define the prop interface before styling

**React Native**:
- `Pressable` for touch targets (not `TouchableOpacity` unless required by existing code)
- `View` for layout, `Text` for text — never raw JSX string nodes outside `<Text>`
- `ScrollView` or `FlatList` for scrollable content
- `SafeAreaView` at screen root
- TypeScript: define prop types with `React.FC<Props>`

**Flutter**:
- `Scaffold` at screen root
- `GestureDetector` / `InkWell` for touch targets
- `Column` / `Row` / `Wrap` for layout
- `ListView.builder` for scrollable lists
- Define `Widget build(BuildContext context)` — no logic in build methods

**SwiftUI**:
- `View` protocol for all components
- `Button` for actions, `NavigationLink` for navigation
- `VStack` / `HStack` / `LazyVStack` / `LazyHStack` for layout
- `List` / `ScrollView` for scrollable content
- `@State` / `@Binding` / `@ObservedObject` for state — pick the right one

**Jetpack Compose**:
- `@Composable` for all UI functions
- `Button` / `IconButton` for actions
- `Column` / `Row` / `Box` / `LazyColumn` for layout
- State: `remember` + `mutableStateOf` — hoist state upward

### Phase 2 — Token application

Apply every visual property from the token files. No hardcoded values.

**Verify — adapt the check to the stack:**

Web:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}\|rgb(\|hsl(\|: [0-9]\+px" <new-files>
```

React Native:
```bash
grep -rn "color: ['\"]#\|fontSize: [0-9]\+[^,]\|padding: [0-9]\+" <new-files>
```
(Any hardcoded colour string or raw numeric spacing that bypasses the token object is a violation.)

Flutter:
```bash
grep -rn "Color(0x[^A]\|Color\.from\|fontSize: [0-9]\+\." <new-files>
```

SwiftUI:
```bash
grep -rn "Color(red:\|\.padding([0-9]\|\.font(\.system(size:" <new-files>
```

Jetpack Compose:
```bash
grep -rn "Color(0x[^A]\|\.dp[^,]\|fontSize = [0-9]\+\.sp[^,]" <new-files>
```

Any hit that isn't a `1` border or `0` is a violation — replace with the token reference.

**Path A only**: pixel-perfect check after token application:
- Every colour matches a token derived from the image
- Layout composition, column count, proportions match
- Typography ratio, weight contrast, letter-spacing match
- Spacing proportions match on 4px grid
- Every visible component present — nothing omitted

**Design.md / Path B**: cross-check against `./design.md` Do's and Don'ts section. Fix any violation.

### Phase 3 — Adaptive layout

**Web**: mobile-first CSS. Breakpoints from `./design.md` `## Responsive Behavior` if present, otherwise `sm:640 md:768 lg:1024 xl:1280`. 44px minimum touch targets. 16px minimum body text.

**React Native**: use `useWindowDimensions()` for responsive values. `Platform.select()` for iOS/Android divergence. Avoid fixed pixel widths — use `flex`, `%`, or `Dimensions` relative values. Minimum touch target: 44×44 per Apple HIG / 48×48 per Material.

**Flutter**: `MediaQuery.of(context).size` for responsive values. `LayoutBuilder` for constraint-based layout. `AdaptiveScaffold` if using Material 3. `SafeArea` at screen edges.

**SwiftUI**: `GeometryReader` for dynamic sizing. `@Environment(\.horizontalSizeClass)` for iPad vs iPhone. `.frame(maxWidth: .infinity)` for stretch. Minimum touch target: 44×44 pt.

**Jetpack Compose**: `BoxWithConstraints` for constraint-based layout. `WindowSizeClass` from `material3-window-size-class` for compact/medium/expanded breakpoints. Minimum touch target: 48×48 dp.

### Phase 4 — States

All interactive elements need these states:

| State | Web | React Native | Flutter | SwiftUI | Compose |
|---|---|---|---|---|---|
| Default | base styles | base styles | base styles | base styles | base styles |
| Pressed | `:active` | `Pressable` `pressed` state | `InkWell` splash | `.buttonStyle(.plain)` + `@State isPressed` | `Indication` |
| Disabled | `disabled` attr + opacity | `disabled` prop + reduced opacity | `onPressed: null` | `.disabled(true)` | `enabled = false` |
| Loading | skeleton or spinner | `ActivityIndicator` | `CircularProgressIndicator` | `ProgressView` | `CircularProgressIndicator` |
| Empty | empty state component | empty state component | empty state widget | empty state view | empty state composable |
| Error | error state component | error state component | error state widget | error state view | error state composable |

Note: **hover does not exist on native mobile**. Do not implement hover states for React Native, Flutter, SwiftUI, or Compose.

### Phase 5 — Accessibility

**Web**: WCAG 2.1 AA. `aria-label`, `aria-describedby`, `role`, `alt` text. Keyboard navigable. Focus visible. Work through `.claude/skills/ui/checklist.md`.

**React Native**:
- `accessible={true}` on touchable elements
- `accessibilityLabel` for every interactive element
- `accessibilityRole` (`button`, `link`, `image`, `header`, `none`)
- `accessibilityHint` for non-obvious actions
- `accessibilityState` for checked/selected/disabled
- Minimum 44×44 pt touch targets (use `hitSlop` if visual is smaller)
- Test with VoiceOver (iOS) and TalkBack (Android)

**Flutter**:
- `Semantics` widget wrapping interactive elements
- `label`, `hint`, `button`, `enabled` properties on `Semantics`
- `ExcludeSemantics` for decorative elements
- `MergeSemantics` for grouped elements
- Minimum 48×48 dp touch targets via `MaterialTapTargetSize`

**SwiftUI**:
- `.accessibilityLabel()` on interactive elements
- `.accessibilityHint()` for non-obvious actions
- `.accessibilityAddTraits(.isButton)` / `.isHeader` etc.
- `.accessibilityHidden(true)` for decorative elements
- Support Dynamic Type: use `.font(.body)` style references, not fixed sizes

**Jetpack Compose**:
- `Modifier.semantics { contentDescription = "..." }` on interactive elements
- `Modifier.semantics { role = Role.Button }` for interactive roles
- `Modifier.clearAndSetSemantics {}` for decorative elements
- `Modifier.minimumInteractiveComponentSize()` for touch targets
- Support font scaling: use `sp` for text, avoid fixed container heights

---

## Report

```
## /ui complete

**Stack**: Web | React Native | Flutter | SwiftUI | Jetpack Compose
**Path**: Design.md (existing) | A (image) | B (template: <name> | url: <url> | custom: "<description>")
**design.md**: pre-existing | created | fetched from <url> | none (Path A)
**Token file**: created | updated | unchanged — <path>
**Tokens written**: <N>
**Built**: <component/screen name> — <file paths>
**Design system adherence**: all values sourced from tokens | <deviations noted>
**Pixel-perfect check**: matched | <differences> (Path A only)
**Accessibility**: passed | <deferred items>
**What /test should verify**:
- <observable behaviour>
- <key edge case or platform-specific state>
```

---

## Reference files

- Web accessibility checklist: `.claude/skills/ui/checklist.md`
- Design templates: `.claude/skills/ui/templates/`
- Project design system: `./design.md` (created on first /ui run if not present)
