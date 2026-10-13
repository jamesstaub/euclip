# UI library

The atoms every screen is built from. A live page with every atom on both surfaces is at `/styleguide`
(`client/app/templates/styleguide.hbs`); compare any new screen with it.

## Rules

1. **Tachyons first.** Layout, spacing, type and colour are tachyons classes in the template. Write CSS only where a
   class cannot say it: a state that depends on hovering or focusing a parent, an animation, a grid, a media rule.
2. **No BEM.** No `block__element--modifier` class names. Where CSS needs a hook, use a short flat class
   (`sound-row`, `rack-grid`) or a data attribute (`data-state='target'`). Tests hook on `data-test-*`, never on classes.
3. **Use an atom before you style a button, badge, chip, tab strip or card by hand.** If an atom cannot do what you need,
   extend the atom (a variant or an argument), so the next screen gets it too.
4. **One palette.** Colours come from the CSS variables in `app.css` through the tachyons classes in `helpers.css`
   (`yellow`, `b--yellow`, `bg-yellow` are all `--yellow`; tachyons' own gold `#ffd700` is overridden).
5. **Two surfaces.** The dark panels (default) and the yellow footer. Every atom takes `@on='dark' | 'yellow'`.

## Atoms (`client/app/components/ui/`)

| Atom | Use | Arguments |
|---|---|---|
| `<Ui::Button>` | every button | `@variant` `outline` (default action) / `solid` (the one that matters) / `ghost` (text); `@on`; `@size` `m` (uppercase, default) / `s`; `@block`; `@pressed` (a toggle: draws solid, sets `aria-pressed`); `@muted` (a quiet ghost) |
| `<Ui::Badge>` | a short fact about a row ("Sampler 2", "not used") | `@tone` `accent` / `muted`; `@on` |
| `<Ui::Chip>` | a small toggle standing for one of several things (a sampler of the track) | `@pressed`; `@quiet` (empty); `@on` |
| `<Ui::Segmented>` | one of a few shelves | `@items` `[{ value, label, count?, showCount? }]`, `@selected`, `@onSelect`, `@label`, `@on` |
| `<Ui::Card>` | a bordered surface | `@on`; `@state` `selected` / `empty` (dashed) / `target` (ring) |

Typography: body `f6 fw4`, titles `f5 fw6`, small and quiet `f7 moon-gray`, button labels `fw6`. Weights in use: 4, 5, 6, 7 only.
Focus: one global ring (`buttons.css`, `:where(...):focus-visible`), so no component draws its own; opt out with `.no-outline`.

Small utilities tachyons lacks live at the end of `styles/helpers.css`: `scroll-y` (thin yellow scroller), `stretched` (a button
whose box covers its card), `max-h-chips`, `max-h-rack`, `max-h-menu`, `bg-yellow-15`, `ring-light-blue`, `accent-yellow`, `min-h-0`.

## Audit that led to this (12 Oct 2026)

71 buttons in the app templates used **55 distinct class combinations**: `ButtonPrimary` with five colour pairs, bare
`<button>`s with `textbutton`, `bn bg-transparent` and `bn` variants, three hand-made chip styles, two yellows (text and
borders `#ffd700`, backgrounds `#ffce55`) and two light blues. Plain `div`s fell back to the browser's serif because the base
font was set on a hand-picked list of elements.

## Migration (gradual)

Done: the sound browser (`components/sounds`, `file-picker`, `project/sample-pool`), the sampler rack, `Ui::*`.

To do, roughly in order of how visible they are:

- `ButtonPrimary` / `ButtonText` / `IconButton`: make them thin wrappers over `Ui::Button` (or replace their call sites) and delete the colour-pair
  variants (`b--light-gray bg-dark-gray light-gray`, `b--dark-red bg-dark-gray dark-red`, ...). Decide what the destructive variant looks like first.
- `Console::TabMenu` (the footer's sequence/source/controls strip and the script tabs): a `Ui::Segmented` or `Ui::Tabs` atom.
- `Source::NodeTabs` (pill tabs for oscillators and macros): chips.
- The nexus controls' headers and `controls/wrapper.hbs`: a `Ui::Card` header.
- The shell: `sidebar-wrapper`, `track-row`, `project-bar` use flat grid-area class names plus BEM-style element names
  (`sidebar__header`, `track-row__order`); the grid needs them, the names should be flattened and the rest moved to tachyons.
- Auth forms, the project list and the about page: inputs (`Ui::Field`) and the same buttons.
