# Bugfix Requirements Document

## Introduction

Three bugs were identified during code review of the vanilla JS life dashboard (`index.html`, `css/style.css`, `js/script.js`).

1. **Dead CSS selector** — `[data-theme="light"] html` in `style.css` is an impossible descendant selector because `data-theme` is set directly on `<html>`, so no element can ever match it. The `color-scheme: light` rule is therefore silently skipped, breaking native form control and scrollbar styling in light mode.

2. **XSS via `javascript:` URI in Quick Links** — `Links.normalizeUrl()` in `script.js` only checks whether the raw input already starts with `https?://` and prepends `https://` otherwise. It does not reject `javascript:` URIs. A user who pastes `javascript:alert(document.cookie)` as a link URL will have it stored in `localStorage` and rendered as an `<a href="javascript:…">` tile, executing arbitrary code on every click.

3. **Double-click re-entry in `startEdit`** — `Todo.startEdit()` in `script.js` has no guard against being called when the task row is already in edit mode. A second double-click replaces the in-progress `<input>` element before `render()` runs, leaving an orphaned input (its `blur`/`commit` listeners still fire against stale DOM), which can corrupt the task text or trigger redundant saves.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `data-theme="light"` is set on `<html>` THEN the rule `[data-theme="light"] html { color-scheme: light; }` never matches because `<html>` cannot be a descendant of itself, so `color-scheme` remains `dark` and native browser controls (scrollbars, date pickers, etc.) render in dark mode regardless of the selected theme.

1.2 WHEN a user enters a `javascript:` URI (e.g., `javascript:alert(1)`) into the Quick Links URL field THEN the system stores the URI in `localStorage` and renders it as the `href` of an `<a>` tile without sanitization.

1.3 WHEN a user clicks a saved Quick Links tile whose `href` is a `javascript:` URI THEN the system executes the embedded JavaScript in the page context.

1.4 WHEN `startEdit` is called on a task row that already contains an edit `<input>` (e.g., by double-clicking the text span or edit button a second time) THEN the system inserts a second `<input>` element into the row, leaving the first input orphaned with its `blur` commit listener still attached.

1.5 WHEN the orphaned `<input>` from 1.4 loses focus THEN the system may fire a redundant `edit()` call using stale text, potentially saving incorrect task content or triggering an extra `render()`.

---

### Expected Behavior (Correct)

2.1 WHEN `data-theme="light"` is set on `<html>` THEN the system SHALL apply `color-scheme: light` to the root element so that native browser controls reflect the light theme correctly.

2.2 WHEN a user enters a `javascript:` URI into the Quick Links URL field THEN the system SHALL reject the input and not add the link (or shall sanitize it to a safe no-op), preventing the URI from being stored or rendered as an `href`.

2.3 WHEN a user clicks a Quick Links tile THEN the system SHALL only navigate to `http://` or `https://` URLs; no JavaScript execution shall occur via the link `href`.

2.4 WHEN `startEdit` is called on a task row that already has an active edit `<input>` THEN the system SHALL return early without inserting a second input element, preserving the existing edit session.

2.5 WHEN the user dismisses or commits an edit via `Enter`, `Escape`, or blur THEN the system SHALL fire exactly one `edit()` or `render()` call with no orphaned listeners remaining.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `data-theme="dark"` is active THEN the system SHALL CONTINUE TO apply all existing dark-mode design tokens and `color-scheme: dark` styling without change.

3.2 WHEN a user enters a valid `https://` URL into the Quick Links URL field THEN the system SHALL CONTINUE TO store and render the link tile exactly as before.

3.3 WHEN a user enters a bare domain (e.g., `github.com`) into the Quick Links URL field THEN the system SHALL CONTINUE TO prepend `https://` and render the tile correctly.

3.4 WHEN a user enters an `http://` URL into the Quick Links URL field THEN the system SHALL CONTINUE TO store and render the link tile without modification.

3.5 WHEN `startEdit` is called on a task row that is NOT already in edit mode THEN the system SHALL CONTINUE TO replace the text span with an editable input and focus it as before.

3.6 WHEN the user commits a task edit via `Enter` or `blur` THEN the system SHALL CONTINUE TO save the updated text and re-render the list.

3.7 WHEN the user cancels a task edit via `Escape` THEN the system SHALL CONTINUE TO discard the change and re-render the list without modifying stored data