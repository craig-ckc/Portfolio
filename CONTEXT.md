# Portfolio

Language for the portfolio site and the sections used to present Craig's work, practice, and experiments.

## Language

**Work**:
Selected client or product projects shown as proof of delivery and design-development capability.
_Avoid_: Projects, case studies

**About**:
A homepage section that introduces Craig's working style and personal positioning without requiring a dedicated page.
_Avoid_: Bio, profile

**About statement**:
The approved copy used in **About** to describe Craig as a product designer and developer working end to end.
_Avoid_: Biography, manifesto

**Playground**:
A section and destination for experimental UI, animation, and interaction ideas that show range beyond client-facing **Work**.
_Avoid_: Lab, experiments, exploration

**Playground preview**:
A packed masonry-style homepage gallery with varied tile prominence that teases selected **Playground** experiments.
_Avoid_: Marquee, carousel

**Playground shell**:
A canvas-like detail page frame for presenting and adjusting one small **Playground** experiment.
_Avoid_: Detail dashboard, settings page

## Relationships

- The homepage sequence is **Work**, **About**, **Playground**, then service/list content.
- **About** is a homepage-only section for now.
- **About** uses the approved **About statement** from the layout reference.
- **About** should initially match its layout reference closely before later visual iteration.
- **About** uses temporary placeholder imagery until final personal or process images exist.
- **About** includes booking and email actions inside the section.
- **Playground** has a homepage preview section and a dedicated page for interactive experiments.
- **Playground** prioritizes showing over explaining.
- **Playground preview** uses a packed masonry layout with mostly one-column tiles, a few two-column tiles, and a single three-column feature-style tile.
- **Playground preview** tiles include compact captions.
- **Playground preview** includes a simple section heading and a single link to the dedicated **Playground** page.
- The dedicated **Playground** page repeats the masonry gallery and loads additional batches as the visitor scrolls.
- Individual **Playground** items open in a **Playground shell** with a dotted canvas, centered experiment mount, and project-name notch.
- **Playground shell** uses an icon-only return control instead of text navigation.

## Example dialogue

> **Dev:** "Should the **About** section route to another page?"
> **Domain expert:** "No, **About** stays on the homepage; **Playground** has a homepage preview and a dedicated page."

## Flagged ambiguities

- "Project" and "case study" both describe portfolio proof points, but the site language uses **Work**.
- "About page" was used casually, but the resolved concept is the homepage **About** section.
- "Marquee" was explored for **Playground preview**, but the resolved layout is masonry.
