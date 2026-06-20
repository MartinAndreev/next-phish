# Brand

## Color Palette

Available as Tailwind utility classes via `bg-{name}`, `text-{name}`, `border-{name}`, etc.

| Token          | Hex       | Usage                       |
| -------------- | --------- | --------------------------- |
| `brand-cyan`   | `#15E5D4` | Success states, accent      |
| `brand-aqua`   | `#1ED8F0` | Secondary accent            |
| `brand-blue`   | `#29B8FF` | Primary buttons, links      |
| `brand-azure`  | `#3B8FFF` | Hover state (buttons/links) |
| `brand-indigo` | `#5C73FF` | Interactive element accent  |
| `brand-violet` | `#7B5CFF` | Brand gradient endpoint     |
| `brand-navy`   | `#020B1D` | Dark mode page background   |
| `brand-dark`   | `#07142E` | Card/surface background     |

## Gradient

Defined as a CSS custom property on `:root`:

```css
--brand-gradient: linear-gradient(
  135deg,
  #15e5d4 0%,
  #29b8ff 35%,
  #3b8fff 60%,
  #5c73ff 80%,
  #7b5cff 100%
);
```

**Tailwind usage:** `bg-(image:--brand-gradient)`

## Recommended Usage

| Element          | Token / Value                              |
| ---------------- | ------------------------------------------ |
| Primary buttons  | `bg-brand-blue`                            |
| Button hover     | `bg-brand-azure`                           |
| Success          | `text-brand-cyan`                          |
| Links            | `text-brand-blue` `hover:text-brand-azure` |
| Brand background | `bg-(image:--brand-gradient)`              |
| Page background  | `bg-brand-navy` (dark)                     |
| Cards            | `bg-brand-dark`                            |
| Borders          | `border-[#1C2945]`                         |

## Accessibility

| Foreground        | Background      | Ratio |
| ----------------- | --------------- | ----- |
| `text-white`      | `bg-brand-blue` | 5.2:1 |
| `text-brand-cyan` | `bg-brand-navy` | 7.8:1 |
| `text-brand-blue` | `bg-brand-navy` | 5.7:1 |
| `text-white`      | `bg-brand-dark` | 6.9:1 |

Avoid light text on `brand-cyan` or `brand-aqua` — use `text-brand-navy` instead.

## PrimeReact Palette Overrides

The following Tailwind default palette slots are overridden with brand colors so that PrimeReact components pick up the brand automatically via the built-in Tailwind preset:

| Override    | Brand color | Hex       |
| ----------- | ----------- | --------- |
| `blue-500`  | brand-blue  | `#29B8FF` |
| `blue-600`  | brand-azure | `#3B8FFF` |
| `green-400` | brand-cyan  | `#15E5D4` |
| `green-500` | brand-cyan  | `#15E5D4` |

These overrides affect both PrimeReact and any custom code using those classes. See `apps/next-app/app/globals.css` for the `@theme` block.
