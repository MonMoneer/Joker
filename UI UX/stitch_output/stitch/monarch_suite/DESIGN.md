# Design System: Royal Classic

## 1. Overview & Creative North Star
**Creative North Star: "The Sovereign Table"**

This design system is a digital translation of high-stakes prestige. It moves away from the flat, utilitarian nature of standard web interfaces toward a "Sovereign Table" aesthetic—a curated, 3D-influenced space where every interaction feels tactile and significant. 

We break the "template" look by eschewing rigid grids in favor of **intentional depth and environmental storytelling**. By utilizing polished marble textures (surface-lowest), velvet-inspired depths (primary-container), and gold-light accents (secondary), the UI behaves like a series of physical objects resting upon a grand surface. This is achieved through asymmetric card layouts, overlapping elements that cast soft ambient shadows, and a typography scale that favors the authoritative weight of editorial serifs.

---

## 2. Colors
The palette is rooted in the contrast between deep, "velvet" blues and the pristine clarity of "marble" whites, punctuated by metallic gold highlights.

- **Primary & Tonal Depths:** `primary` (#001430) and `primary_container` (#002855) represent the deep velvet of a casino lounge. Use these for high-contrast moments or hero backgrounds.
- **The Secondary "Gold":** `secondary` (#7b5800) and its variants (`secondary_fixed_dim`) act as our metallic accents. They are reserved for critical calls to action and "royal" highlights.
- **The "No-Line" Rule:** Explicitly prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section sitting on a `surface` background creates a natural edge without a sterile line.
- **Surface Hierarchy & Nesting:** Treat the UI as a series of physical layers. Use the `surface_container` tiers to nest content. A card (using `surface_container_lowest`) should sit on a section (using `surface_container_low`), which in turn sits on the main `background`. This "Marble-on-Marble" stacking creates a sophisticated, multi-dimensional feel.
- **The "Glass & Gradient" Rule:** To provide visual "soul," use subtle gradients (e.g., transitioning from `primary` to `primary_container`) for CTAs. For floating overlays, apply **Glassmorphism**: use semi-transparent surface colors with a heavy backdrop-blur to mimic the reflection of a polished marble table.

---

## 3. Typography
Our typography is a dialogue between the classic authority of the serif and the modern precision of the sans-serif.

- **Display & Headlines (Noto Serif):** Used for "The Big Moments." The `display-lg` and `headline-md` scales provide an editorial, high-end feel that signals prestige. It should be used sparingly for titles that require gravitas.
- **Body & Labels (Manrope):** A clean, geometric sans-serif that ensures readability against rich, textured backgrounds. 
- **Hierarchy of Authority:** Large Serif headlines in `on_surface` convey a sense of history and "The House," while Manrope labels in `on_surface_variant` handle the data with quiet efficiency.

---

## 4. Elevation & Depth
In this system, elevation is not a drop shadow; it is **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by stacking the surface-container tiers. For instance, a "Deal" button should feel like a physical token resting on the table.
- **Ambient Shadows:** When a "floating" effect is required (like a playing card or a modal), shadows must be extra-diffused. Use large blur values (20px+) and low-opacity (4%-8%). The shadow color should not be black; it should be a tinted version of `on_surface` to mimic natural light reflecting off the marble.
- **The "Ghost Border" Fallback:** If a container needs more definition, use a "Ghost Border": the `outline_variant` token at 15% opacity. Never use 100% opaque borders.
- **Realistic Lighting:** Elements should feel like they are lit from a single source (top-down). Use the `surface_bright` token for subtle "rim lighting" on the top edges of cards to enhance the 3D casino aesthetic.

---

## 5. Components

### Buttons
- **Primary:** A gradient-filled container (`primary` to `primary_container`) with `on_primary` text. Use `xl` (0.75rem) roundedness for a pill-like, tactile feel.
- **Secondary (The Gold Standard):** `secondary_container` background with `on_secondary_container` text. This is for the "Win" or "Bet" actions.
- **Tertiary:** No background, `primary` text. Used for "Cancel" or "Back" to keep the focus on the table.

### Cards & Collections
- **Rules:** Forbid the use of divider lines. Separate content using vertical white space or subtle shifts from `surface_container_low` to `surface_container_highest`.
- **Layout:** Cards should occasionally overlap or be slightly rotated (1-2 degrees) to mimic cards thrown onto a table, breaking the rigid digital grid.

### Input Fields
- **Styling:** Use `surface_container_lowest` for the field background to make it look "carved" into the surface. 
- **States:** The focus state should never be a heavy blue line; instead, use a subtle glow using the `surface_tint` at low opacity.

### Navigation (The "Lounge" Bar)
- Use Glassmorphism (backdrop-blur + semi-transparent `surface`) for navigation bars. This allows the "marble table" background to bleed through, making the UI feel integrated into the environment.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `surface_container_lowest` for elements that need to "pop" off a darker background.
- **Do** lean into the "Royal" aspect by using `display-lg` typography for balance totals and win amounts.
- **Do** use generous spacing. Luxury is defined by the space you *don't* fill.

### Don't:
- **Don't** use 1px solid borders. It shatters the "Royal Classic" illusion and makes the UI look like a basic template.
- **Don't** use pure black for shadows. It looks "dirty" on white marble; use tinted transparencies instead.
- **Don't** clutter the screen. If an element doesn't serve the "Sovereign Table" experience, hide it behind a progressive disclosure pattern.
- **Don't** use high-vibrancy colors for anything other than `error` states. Stick to the velvet and gold palette.