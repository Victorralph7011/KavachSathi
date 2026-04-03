# Design System Specification: The Editorial Safety Net

## 1. Overview & Creative North Star: "The Digital Heirloom"
This design system is built to bridge the gap between clinical fintech efficiency and the warmth of a human safety net. Moving beyond the "standard SaaS" look, our Creative North Star is **The Digital Heirloom**. 

We interpret the "InsurTech" space through a lens of high-end editorial design. By pairing the mathematical precision of Stripe with the approachable storytelling of Lemonade, we create an experience that feels both authoritative and empathetic. We break the "template" look by utilizing extreme typographic scales, intentional asymmetry in layouts, and a "physical" approach to layering that honors the Indian gig economy worker’s need for clarity, respect, and speed.

---

## 2. Color Philosophy: Depth Over Division
Our palette avoids the sterile coldness of pure greys. We use a warm, organic foundation to build trust.

### The Palette
*   **Primary (Deep Navy - `#002645`):** The "Anchor." Used for primary actions and brand-heavy moments. It conveys the weight of a traditional financial institution.
*   **Secondary (Teal Green - `#006b5d`):** The "Growth." Used for success states and secondary CTAs. It signals prosperity and health.
*   **Tertiary (Amber-Orange - `#451600` / `#ff8043`):** The "Alert & Warmth." Used for accents, warnings, or highlighting "human" moments in the journey.
*   **Neutral Foundation:** We use a warm `surface` (`#f9f9f7`) to avoid "screen fatigue."

### The "No-Line" Rule
Sectioning must **never** be achieved with 1px solid borders. High-end UI feels seamless. To separate sections, use background shifts. For example, a `surface-container-low` section should sit directly against a `background` section. Let the change in tonal value define the edge.

### Surface Hierarchy & Nesting
Treat the UI as physical sheets of paper stacked on a desk.
*   **Base:** `surface` (`#f9f9f7`)
*   **Sectioning:** `surface-container-low` (`#f4f4f2`)
*   **Primary Content Cards:** `surface-container-lowest` (`#ffffff`)
*   **Interactive Elements:** `surface-container-high` (`#e8e8e6`)

### The "Glass & Gradient" Rule
To add "soul" to the professional frame, use subtle linear gradients for hero sections (transitioning from `primary` to `primary_container`). For floating navigation or mobile headers, use **Glassmorphism**: `surface-container-lowest` at 80% opacity with a `20px` backdrop blur.

---

## 3. Typography: The Editorial Voice
We use typography to create a narrative rhythm. The contrast between a modern sans-serif and a classical serif creates a "Modern Legacy" feel.

*   **Display & Headlines (Instrument Serif):** Our "Voice of Authority." Use `display-lg` (3.5rem) for hero statements. *Italics* should be used sparingly for "human" emphasis (e.g., "Your *safety net* for the road ahead").
*   **Title & Body (Inter):** Our "Voice of Reason." Inter provides maximum legibility for complex insurance terms. 
    *   `title-lg`: 1.375rem (Semibold) for card headers.
    *   `body-md`: 0.875rem (Regular) for standard descriptions.
*   **Hierarchy Tip:** Never center-align more than three lines of text. Use left-aligned "Editorial Grids" where the headline takes up 60% of the horizontal space, leaving 40% as breathing room.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often a crutch for poor contrast. In this system, we prioritize **Tonal Layering**.

*   **The Layering Principle:** Instead of adding a shadow to every card, place a `surface-container-lowest` (#FFFFFF) card on top of a `surface-container-low` (#F4F4F2) background. The subtle 2% shift in brightness is enough to signify elevation to the human eye.
*   **Ambient Shadows:** If a card must "float" (e.g., a modal or a floating action button), use a multi-layered shadow:
    *   `box-shadow: 0 4px 20px -2px rgba(26, 28, 27, 0.04), 0 12px 40px -8px rgba(26, 28, 27, 0.08);`
*   **The "Ghost Border" Fallback:** If a border is required for accessibility on forms, use `outline-variant` at 20% opacity. It should be felt, not seen.

---

## 5. Components: Precision Primitives

### Buttons
*   **Primary:** Solid `primary` (#002645) with `on-primary` (#FFFFFF) text. Corner radius: `md` (0.75rem).
*   **Secondary:** Solid `secondary-container` (#96f0de) with `on-secondary-container` (#006f61). No border.
*   **Tertiary:** Text-only in `primary`, using a `title-sm` weight. Use for "Cancel" or "Back" actions.

### Cards & Lists (The "No Divider" Rule)
*   **Cards:** Use `xl` (1.5rem) padding. Do not use horizontal lines to separate card content. Use **Vertical White Space** (minimum 24px) or a slight background tint (`surface-container-high`) for list headers.
*   **List Items:** Instead of dividers, use a `surface` hover state that lightens the background.

### Input Fields
*   **Style:** Minimalist. No heavy borders. Use a `surface-container-highest` bottom-border (2px) that transforms into a `primary` color on focus.
*   **Micro-copy:** Helper text should use `label-md` in `on-surface-variant` to maintain a clean, non-cluttered look.

### Context-Specific Component: The "Benefit Chip"
For the Indian gig economy context, use rounded `chips` (`full` radius) to highlight insurance coverage (e.g., "Accident Cover," "Instant Payout"). Use `secondary-fixed` backgrounds with `on-secondary-fixed-variant` text for a premium, vetted feel.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a functional element. If a screen feels cluttered, increase the padding, don't shrink the text.
*   **DO** use `Instrument Serif Italic` for one word in a headline to add "humanity" to the financial data.
*   **DO** ensure all touch targets are at least 48px, acknowledging users who may be interacting with the app while on the move (e.g., delivery partners).

### Don’t
*   **DON'T** use pure black (`#000000`). It is too harsh for the warm editorial aesthetic. Use `on-surface` (#1A1C1B).
*   **DON'T** use 1px dividers. They break the "Physical Layering" illusion and make the UI look like a template.
*   **DON'T** use neon or high-vibrancy colors for anything other than critical errors. This system relies on "Muted Sophistication."
*   **DON'T** use "Standard" 4px corners. Stay within the `8px - 24px` range to maintain the "Friendly Professional" persona.