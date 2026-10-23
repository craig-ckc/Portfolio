These panel, section, slider, and switch components are adapted from
[Toolcraft](https://github.com/pixel-point/toolcraft), Copyright (c) 2026 Pixel Point,
under the accompanying MIT license.

Source revision: `4952c4a59dc85a5a29079d81c8666c4898461ab6`.

Original sources in `starter/src/toolcraft/ui/components/`:

- `panel/panel.tsx`, `panel/panel-section.tsx`, `panel/panel-surface.tsx`
- `controls/slider/slider-control.tsx`, `controls/slider/slider-value.ts`
- `primitives/slider/slider.tsx`, `primitives/switch.tsx`

The adaptation retains Base UI's accessible slider and switch primitives,
Toolcraft's grouped floating panel and editable numeric slider pattern,
and its slider formatting and clamping helpers. Styles are scoped in the
portfolio's existing stylesheet. The full starter, application shell, and
unrelated media, timeline, and renderer modules are not included.
