# UI/UX TODO

Findings from the UI/UX review, ordered by impact.

## Bugs

- [ ] **Searching drops selected families.** `_index.tsx` filters non-matching names out of the DOM, and the checkboxes are
  uncontrolled, so selected families that don't match the search are unmounted and no longer submitted. The counter keeps
  showing the old count and the server recalculates the price from what it received, so the user pays for fewer families
  than they think they picked. Fix: keep the selection in React state (`Set<string>`, controlled `checked`) and hide
  non-matching chips with `hidden`/CSS instead of unmounting them. This also lets us remove the `setTimeout` + `.click()`
  logic used to restore a selection from a link / previous selection.
- [ ] Restoring the saved sender never restores the first name in the list (`storedNameIndex` is `0`, which is falsy).
- [ ] Submit failures are silent: the `action` catch block only logs to Telegram and returns nothing. Return `{ error }`
  and show an error banner above the submit button.

## Form (`app/routes/_index.tsx`, `app/app.css`)

- [x] Selected family chip: show a checkmark and bold text (not only a green fill).
- [ ] Lighten the default chip style: black 1px border + inset shadow is noisy; chip widths are ragged in the auto-fit grid.
- [ ] Merge the two stacked sticky banners (cyan counter + yellow search) into one bar: counter and sum on one line, search
  field always visible (no show/hide toggle), ✕ next to the input. Today they take ~200px of sticky space on a phone.
- [ ] Add a sticky bottom bar with the sum and the submit button, so the total is visible while scrolling a long list.
- [ ] Make the family checkboxes keyboard accessible: `display: none` removes them from tab order and the accessibility
  tree. Hide them visually instead and add `:focus-visible` styling on the chip.
- [ ] Icon-only search/close links (`<a href="#">` with an SVG) need to be `<button type="button" aria-label="...">`. Same for
  the close button on the name-management page.
- [ ] Sender `<select>`: associate the label (`htmlFor`/`id`), make the placeholder option `disabled hidden`, make it
  full width and stacked like the other questions (label and select currently share a row), and increase its font size.
- [ ] Replace the two `h1`s with one `h1` plus a subtitle line; the negative-margin hack in `app.css` doesn't work inside
  a flex container, leaving ~80px between them.
- [ ] Radio options: make each option a full-width tappable row and show its price (all families vs per family),
  and the volume discount when it applies.
- [ ] Submit button: remove the blurry `text-shadow` and gradient; use a flat, high-contrast button. Add a short note that
  the user is redirected to the payment page and that registration is saved only after payment.
- [ ] Move the bold fadiha note next to the counter, showing how many more families are needed to unlock it. Rework the
  "free insurance" message copy.
- [ ] Mobile layout: `form { width: 100vw }` has no side padding and can scroll horizontally. Use
  `width: min(100%, 720px); padding-inline: 16px`. Use at least 44px tap targets and a 16px input font (iOS zooms on
  inputs under 16px).
- [ ] Typography: `Lucida Grande` isn't available on Android/Windows. Use a system font stack or a Hebrew web font
  (Heebo / Assistant).
- [ ] Closed-registration page: use a neutral icon (not a warning triangle) and centre the message with padding.
- [ ] Add the missing React `key` on the "not found" family spans.
- [ ] Replace the `setTimeout` timings (200ms / 2000ms) used to restore state from a link with state-driven rendering.

## Name management (`app/routes/nameManagement.tsx`)

- [ ] **The page is unauthenticated**: anyone with the URL can add, edit and delete families. Add at least a secret token
  or basic auth.
- [ ] Show success/error feedback as a fixed toast (or scroll to it): after editing a card far down the list the message
  renders above the list, off-screen. The add success text reads "משפחת  נוספה" when only husband/wife is filled in.
- [ ] Add form: use a 2-column grid on desktop and visible labels (placeholders currently replace labels).
- [ ] Delete confirmation: make "ביטול" the default focus and the less prominent button the destructive one.
- [ ] Cards: the details line repeats names already in the title; collapse it into a single muted line.
- [ ] Style the `<h2>` headings (default margins).

## Quick wins

1. Error banner on submit failure.
2. `aria-label`s and real `<button>`s for the icon actions.
3. Visible focus rings.
4. `padding-inline: 16px` and a max-width on `form`.
5. Price shown on the all/specific radios.
6. Fix the first-name restore bug.
