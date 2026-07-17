# Requirements Document

## Introduction

The To-Do Life Dashboard is a standalone, single-page web application styled with a hacker/programmer terminal aesthetic. It consolidates four utility widgets — a live greeting clock, a Pomodoro focus timer, a task manager, and a quick-links bookmark panel — into a compact two-column layout. All data is persisted exclusively in the browser's Local Storage; no server, no account, no external network calls are required. The application ships as a single HTML file with one companion CSS file and one companion JavaScript file.

---

## Glossary

- **Dashboard**: The complete single-page web application described in this document.
- **Greeting_Bar**: The top navigation bar that displays the current user greeting, date, time, and theme toggle.
- **Status_Bar**: The bottom bar that displays the local-storage data notice.
- **Todo_Panel**: The left-column widget managing the user's task list (`~/todo.list`).
- **Pomodoro_Panel**: The upper-right widget managing the countdown focus timer (`~/pomodoro.sh`).
- **Bookmark_Panel**: The lower-right widget managing quick-access hyperlinks (`~/bookmarks.sh`).
- **Task**: A single to-do item with a text description, a completion state, and a creation timestamp.
- **Session**: A single Pomodoro countdown interval from its configured duration down to zero.
- **Bookmark**: A user-defined label and URL pair stored as a quick-access tile.
- **Local_Storage**: The browser's `window.localStorage` key-value persistence API.
- **Theme**: The visual colour scheme of the Dashboard, either `DARK` (default) or `LIGHT`.
- **Timer_Duration**: The number of minutes configured for a Pomodoro Session (15, 25, 45, or a custom integer ≥ 1).
- **Sort_Order**: The rule used to order Tasks in the Todo_Panel: `date_added`, `alphabetical`, or `completion_status`.
- **Renderer**: The JavaScript module responsible for updating the DOM to reflect current application state.

---

## Requirements

---

### Requirement 1: Application Shell and Layout

**User Story:** As a developer, I want a single self-contained HTML file with one CSS file and one JS file, so that the Dashboard can be opened directly in any modern browser without a build step or server.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly one HTML file, one CSS file located inside a `css/` directory, and one JavaScript file located inside a `js/` directory.
2. THE Dashboard SHALL render a two-column grid layout: the Todo_Panel occupies the left column spanning the full height of the content area; the Pomodoro_Panel occupies the upper-right cell and the Bookmark_Panel occupies the lower-right cell.
3. THE Dashboard SHALL display the Greeting_Bar as a full-width bar fixed at the top of the viewport, above the two-column grid.
4. THE Dashboard SHALL display the Status_Bar as a full-width bar fixed at the bottom of the viewport containing the text `local_storage:// all data stays on this device ~ nothing leaves the browser`.
5. THE Dashboard SHALL apply a dark terminal colour scheme by default, using a background with lightness ≤ 10% in HSL (near-black) and `#00ff88` as the accent colour applied to both text and interactive highlights.
6. WHEN the Dashboard is opened in Chrome, Firefox, Edge, or Safari (latest stable release), THE Dashboard SHALL render without layout breakage (defined as all four panels and both bars visible and non-overlapping) and without JavaScript errors logged to the browser console.
7. WHEN the viewport width is less than 768 px, THE Dashboard SHALL stack panels in a single column in this order (top to bottom): Greeting_Bar, Todo_Panel, Pomodoro_Panel, Bookmark_Panel, Status_Bar.

---

### Requirement 2: Greeting Bar — Live Clock and Greeting

**User Story:** As a user, I want the top bar to show my name, a time-appropriate greeting, and a live clock, so that I always have immediate situational awareness.

#### Acceptance Criteria

1. THE Greeting_Bar SHALL display a greeting prefix derived from the current local time: `good_morning_` for 05:00–11:59, `good_afternoon_` for 12:00–17:59, `good_evening_` for 18:00–20:59, and `good_night_` for 21:00–04:59.
2. THE Greeting_Bar SHALL display the username label in the format `{username}@dashboard:~$` to the left of the greeting prefix, where the username is truncated to a maximum of 32 characters, the day-of-week abbreviation is 3 letters (e.g., "Fri"), and the literal `user` is used as the fallback when a username is unavailable.
3. THE Greeting_Bar SHALL display the current day of the week (abbreviated), calendar date (e.g., `Jul 17, 2026`), and a live time display in `HH:MM:SS` 24-hour format on the right side of the bar.
4. WHEN one second elapses, THE Greeting_Bar SHALL update the live time display and recalculate the greeting prefix based on the current local hour if the hour boundary has changed.
5. THE Greeting_Bar SHALL display the current Theme state as a badge (`● DARK` or `● LIGHT`) adjacent to the live clock.
6. IF the local time source is unavailable, THEN THE Greeting_Bar SHALL display `--:--:--` in place of the live time.

---

### Requirement 3: Light/Dark Theme Toggle

**User Story:** As a user, I want to toggle between a dark terminal theme and a light theme, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Greeting_Bar SHALL display a clickable toggle control whose label reads "DARK" when the active Theme is `DARK` and "LIGHT" when the active Theme is `LIGHT`.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL switch the active Theme from `DARK` to `LIGHT` or from `LIGHT` to `DARK`, and SHALL update all foreground and background colours before the next animation frame.
3. WHEN the Theme changes, THE Dashboard SHALL persist the new Theme value to Local_Storage under the key `dashboard_theme`.
4. WHEN the Dashboard initialises, THE Renderer SHALL read the persisted Theme value from Local_Storage under the key `dashboard_theme` and apply it before the first paint, preventing a flash of unstyled content.
5. IF no Theme value exists in Local_Storage, THEN THE Renderer SHALL apply the `DARK` Theme as the default.
6. IF the Local_Storage value for `dashboard_theme` is not "DARK" or "LIGHT", THEN THE Renderer SHALL discard it and apply the `DARK` Theme as the default.

---

### Requirement 4: To-Do List — Task Creation

**User Story:** As a user, I want to type a task and press Enter (or a button) to add it to my list, so that I can quickly capture work items without disrupting my flow.

#### Acceptance Criteria

1. THE Todo_Panel SHALL display a single-line text input prefixed with a `$ ` prompt symbol that accepts a maximum of 500 characters.
2. WHEN the user submits a non-empty task description (via Enter key or submit action), THE Todo_Panel SHALL append a new Task to the task list with the provided description trimmed of leading and trailing whitespace, a `pending` completion state, and the current timestamp as the creation time.
3. WHEN a Task is created successfully, THE Todo_Panel SHALL clear the input field and retain focus on it.
4. WHEN the user submits an empty or whitespace-only task description, THE Todo_Panel SHALL ignore the submission and retain focus on the input field.
5. WHEN the user submits a task description exceeding 500 characters, THE Todo_Panel SHALL reject the submission and retain the input value without modifying the task list.
6. WHEN a Task is created, THE Todo_Panel SHALL persist the updated task list to Local_Storage before clearing the input field.
7. IF Local_Storage write fails (e.g., quota exceeded), THEN THE Todo_Panel SHALL display an error indication and retain the task in the in-memory list for the session.
8. WHEN no Tasks exist, THE Todo_Panel SHALL display the empty-state message `// no tasks yet - add your first one above`.

---

### Requirement 5: To-Do List — Task Completion and Deletion

**User Story:** As a user, I want to mark tasks done and delete them, so that I can track progress and keep my list clean.

#### Acceptance Criteria

1. THE Todo_Panel SHALL render each Task with a toggleable completion checkbox or equivalent control.
2. WHEN the user toggles the completion control on a pending Task, THE Todo_Panel SHALL set that Task's completion state to `done` and apply a visual strikethrough style to the task description.
3. WHEN the user toggles the completion control on a done Task, THE Todo_Panel SHALL set that Task's completion state back to `pending` and remove the strikethrough style.
4. THE Todo_Panel SHALL render each Task with a delete control that is visible without requiring a hover interaction or expansion step.
5. WHEN the user activates the delete control on a Task, THE Todo_Panel SHALL remove that Task from the list permanently without requiring a confirmation step.
6. WHEN any Task state changes (completion toggle or deletion), THE Todo_Panel SHALL persist the updated task list to Local_Storage, and the persistence SHALL complete before the next user interaction is accepted.
7. IF Local_Storage write fails, THE Todo_Panel SHALL display an error indication and retain the in-memory state.
8. THE Todo_Panel SHALL display a task count badge in the format `{done_count}/{total_count} DONE` that updates immediately whenever the task list changes, where `done_count` is the number of Tasks with completion state `done` and `total_count` is the total number of Tasks in the list.

---

### Requirement 6: To-Do List — Task Editing

**User Story:** As a user, I want to edit the text of an existing task inline, so that I can correct typos without deleting and re-adding items.

#### Acceptance Criteria

1. WHEN the user activates an edit action on a Task (e.g., double-click on task text), THE Todo_Panel SHALL replace the task text with an editable input field pre-filled with the current task description and the cursor positioned at the end of the text.
2. THE editable input field SHALL accept a maximum of 500 characters.
3. WHEN the user confirms the edit via the Enter key, THE Todo_Panel SHALL update the Task's description to the new non-empty value and return to read-only display; WHEN focus leaves the input field (blur), THE Todo_Panel SHALL also save the edit if the value is non-empty.
4. IF the user confirms an edit with an empty or whitespace-only value, THEN THE Todo_Panel SHALL discard the change and restore the original task description; the trimmed value SHALL be stored and Local_Storage SHALL NOT be modified on discard.
5. WHEN the user presses the Escape key during an edit, THE Todo_Panel SHALL cancel the edit and restore the original task description.
6. WHEN a Task description is updated, THE Todo_Panel SHALL persist the updated task list to Local_Storage, and the persistence SHALL complete within 500 ms of confirmation.

---

### Requirement 7: To-Do List — Sorting

**User Story:** As a user, I want to sort my task list by different criteria, so that I can prioritise what to focus on.

#### Acceptance Criteria

1. THE Todo_Panel SHALL display a `sort_by` dropdown control with the options: `date_added`, `alphabetical`, and `completion_status`.
2. WHEN the user selects a Sort_Order from the dropdown, THE Todo_Panel SHALL re-render the task list in the selected order without modifying the underlying task data.
3. WHEN `date_added` is the active Sort_Order, THE Todo_Panel SHALL display Tasks ordered from oldest creation timestamp to newest.
4. WHEN `alphabetical` is the active Sort_Order, THE Todo_Panel SHALL display Tasks ordered A-to-Z by task description, case-insensitively.
5. WHEN `completion_status` is the active Sort_Order, THE Todo_Panel SHALL display pending Tasks before done Tasks, with each group ordered by creation timestamp oldest-to-newest.
6. WHEN the Dashboard initialises, THE Todo_Panel SHALL apply the `date_added` Sort_Order as the default.
7. WHEN `date_added` is active and two Tasks share an identical creation timestamp, THE Todo_Panel SHALL break the tie by ordering those Tasks A-to-Z by description.
8. WHEN no Tasks exist, THE Todo_Panel SHALL display the empty-state indication regardless of the active Sort_Order.

---

### Requirement 8: To-Do List — Clear Completed Tasks

**User Story:** As a user, I want to clear all completed tasks in one action, so that I can declutter my list quickly.

#### Acceptance Criteria

1. THE Todo_Panel SHALL display a `clear done` button.
2. WHEN the user activates the `clear done` button and at least one done Task exists, THE Todo_Panel SHALL remove all Tasks whose completion state is `done` from the list, retaining all non-done Tasks in place.
3. THE `clear done` button SHALL remain visible and interactive even when no done Tasks exist; WHEN the user activates it in that state, THE Todo_Panel SHALL take no action.
4. WHEN done Tasks are cleared, THE Todo_Panel SHALL persist the updated task list to Local_Storage, and the persistence SHALL complete within 500 ms.
5. IF Local_Storage write fails, THE Todo_Panel SHALL display a visible error indication and restore the cleared tasks in-memory.

---

### Requirement 9: To-Do List — Persistence on Load

**User Story:** As a user, I want my tasks to be restored when I reopen the Dashboard, so that I never lose my list.

#### Acceptance Criteria

1. WHEN the Dashboard initialises, THE Todo_Panel SHALL read the task list from Local_Storage and render all persisted Tasks, preserving their original order, description, completion state, and creation timestamp.
2. IF no task list data exists in Local_Storage, THEN THE Todo_Panel SHALL initialise with an empty task list and display the empty-state message.
3. WHEN the Dashboard reads the task list from Local_Storage and the value is malformed or unparseable, THE Todo_Panel SHALL discard the value, initialise with an empty task list, and display the empty-state message.

---

### Requirement 10: Pomodoro Timer — Countdown Display

**User Story:** As a user, I want a large, clear countdown timer, so that I can monitor remaining focus time at a glance.

#### Acceptance Criteria

1. THE Pomodoro_Panel SHALL display a large digital countdown in `MM:SS` format, where MM is zero-padded (00–99) and SS is zero-padded (00–59).
2. WHEN the Dashboard initialises, THE Pomodoro_Panel SHALL display the default Timer_Duration of 25 minutes as `25:00`.
3. WHILE a Session is active, THE Pomodoro_Panel SHALL decrement the displayed time by one second every second, and the timer accuracy SHALL drift no more than ±1 second over the full session duration.
4. WHEN the countdown reaches `00:00`, THE Pomodoro_Panel SHALL stop the timer and display a visual completion indicator.
5. WHEN the countdown reaches `00:00`, THE Pomodoro_Panel SHALL emit an audible alert lasting 1–3 seconds.
6. WHEN no Session is active (idle or paused), THE Pomodoro_Panel SHALL hold the displayed countdown value without changing it.

---

### Requirement 11: Pomodoro Timer — Start, Stop, and Reset Controls

**User Story:** As a user, I want Start, Stop, and Reset buttons, so that I have full manual control over my focus session.

#### Acceptance Criteria

1. THE Pomodoro_Panel SHALL display a `START` button, a `STOP` button, and a `RESET` button.
2. WHEN the user activates the `START` button and no Session is active, THE Pomodoro_Panel SHALL begin decrementing the countdown from its current displayed value at a rate of 1 second per second.
3. WHEN the user activates the `STOP` button and a Session is active, THE Pomodoro_Panel SHALL pause the countdown, preserving the remaining time to the nearest second.
4. WHEN the user activates the `RESET` button, THE Pomodoro_Panel SHALL stop any active Session and restore the countdown display to the current Timer_Duration.
5. WHILE a Session is active, THE Pomodoro_Panel SHALL visually indicate the running state with the `START` button appearing visually distinguishable from its idle appearance (e.g., highlighted or with a blinking cursor).
6. WHEN the user activates the `START` button and a Session is already active, THE Pomodoro_Panel SHALL ignore the input.
7. WHEN the user activates the `STOP` button and no Session is active, THE Pomodoro_Panel SHALL ignore the input.

---

### Requirement 12: Pomodoro Timer — Duration Presets and Custom Input

**User Story:** As a user, I want to choose from preset durations or enter a custom duration, so that I can adapt the timer to different types of work.

#### Acceptance Criteria

1. THE Pomodoro_Panel SHALL display preset duration buttons for `15`, `25`, and `45` minutes, and a `cust` (custom) option.
2. WHEN the user activates a preset duration button, THE Pomodoro_Panel SHALL set the Timer_Duration to the selected preset value, stop any active Session, and reset the countdown display to the new Timer_Duration.
3. WHEN the user activates the `cust` option, THE Pomodoro_Panel SHALL display an input field accepting a positive integer representing minutes in the range 1–999.
4. WHEN the user confirms a custom duration value that is a positive integer in the range 1–999, THE Pomodoro_Panel SHALL set the Timer_Duration to the entered value, stop any active Session, and reset the countdown display.
5. IF the user confirms a custom duration value that is outside the range 1–999 or is not a positive integer, THEN THE Pomodoro_Panel SHALL reject the input, retain the previous Timer_Duration, display an error message indicating the valid range (1–999), and NOT stop any active Session.
6. THE active preset button SHALL be visually highlighted to indicate it is selected.
7. WHEN a custom duration is active, THE Pomodoro_Panel SHALL NOT highlight any of the preset buttons (15, 25, 45).
8. WHEN a custom duration is active, THE Pomodoro_Panel SHALL highlight the `cust` button.

---

### Requirement 13: Bookmarks — Adding a Bookmark

**User Story:** As a user, I want to save a website with a short label, so that I can navigate to frequently used URLs in one click.

#### Acceptance Criteria

1. THE Bookmark_Panel SHALL display a `label` text input and a `url` text input, and an `+ ADD` button.
2. WHEN the user activates the `+ ADD` button with a valid label (1–50 characters) and a valid URL beginning with `http://` or `https://`, THE Bookmark_Panel SHALL create a new Bookmark tile and append it to the bookmark list.
3. WHEN a Bookmark is added, THE Bookmark_Panel SHALL persist the updated bookmark list to Local_Storage before the next user interaction is processed.
4. IF the user activates the `+ ADD` button with an empty label, an empty URL, or an invalid URL format (not beginning with `http://` or `https://`), THEN THE Bookmark_Panel SHALL ignore the submission and retain the current input values.
5. WHEN a Bookmark is added successfully, THE Bookmark_Panel SHALL clear both input fields.
6. IF Local_Storage write fails, THE Bookmark_Panel SHALL display an error message and retain the Bookmark tile for the session.

---

### Requirement 14: Bookmarks — Displaying and Navigating Bookmarks

**User Story:** As a user, I want each bookmark displayed as a tile with its label, so that I can identify and open links quickly.

#### Acceptance Criteria

1. THE Bookmark_Panel SHALL render each Bookmark as a tile displaying a favicon or placeholder icon, the Bookmark's label truncated at 50 characters, and a `×` delete control.
2. WHEN the user activates a Bookmark tile (excluding the delete control), THE Bookmark_Panel SHALL open the Bookmark's URL in a new browser tab.
3. THE Bookmark_Panel SHALL display Bookmark tiles in the order they were added, with the first-added Bookmark appearing first.
4. IF the favicon fails to load, THE Bookmark_Panel SHALL display a generic placeholder icon.
5. WHEN no Bookmarks exist, THE Bookmark_Panel SHALL display a placeholder message (e.g., `// no bookmarks yet`).

---

### Requirement 15: Bookmarks — Deleting a Bookmark

**User Story:** As a user, I want to remove a bookmark I no longer need, so that the panel stays relevant and uncluttered.

#### Acceptance Criteria

1. WHEN the user activates the `×` delete control on a Bookmark tile, THE Bookmark_Panel SHALL remove that Bookmark from the list immediately with no confirmation dialog.
2. WHEN a Bookmark is deleted, THE Bookmark_Panel SHALL persist the updated bookmark list to Local_Storage, and the persistence SHALL complete before the operation is considered complete.
3. IF Local_Storage write fails, THE Bookmark_Panel SHALL display an error indication and restore the deleted Bookmark in-memory.
4. WHEN the last Bookmark is deleted, THE Bookmark_Panel SHALL display the empty-state placeholder message.

---

### Requirement 16: Bookmarks — Persistence on Load

**User Story:** As a user, I want my bookmarks to be restored when I reopen the Dashboard, so that my quick links are always available.

#### Acceptance Criteria

1. WHEN the Dashboard initialises, THE Bookmark_Panel SHALL read the bookmark list from Local_Storage and render all persisted Bookmarks in the order they were saved.
2. IF no bookmark data exists in Local_Storage, THEN THE Bookmark_Panel SHALL initialise with an empty bookmark list and display the placeholder message.
3. WHEN the Dashboard reads bookmarks from Local_Storage and the value is malformed, THE Bookmark_Panel SHALL discard the value, initialise with an empty list, and display the placeholder message.

---

### Requirement 17: Local Storage — Data Integrity

**User Story:** As a developer, I want all writes to Local Storage to be consistent and self-contained, so that the application never shows stale or corrupted state.

#### Acceptance Criteria

1. THE Dashboard SHALL store all persistent data (tasks, bookmarks, theme, timer duration) under distinct, namespaced Local_Storage keys following the pattern `dashboard_<dataType>` (e.g., `dashboard_tasks`, `dashboard_bookmarks`) to avoid key collisions.
2. WHEN the Dashboard reads a Local_Storage value and the value is not valid JSON or contains a type mismatch, THE Renderer SHALL discard the value, remove the malformed entry from Local_Storage, and use the applicable default state.
3. WHEN a Local_Storage write fails (quota exceeded), THE Dashboard SHALL display a visible notification and preserve in-memory state.
4. THE Dashboard SHALL NOT transmit any data to any external network endpoint, including analytics services, telemetry services, or third-party service calls.

---

### Requirement 18: Performance

**User Story:** As a user, I want the Dashboard to load and respond instantly, so that it never slows down my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL complete its initial render in under 500 milliseconds on a modern desktop browser (Chrome, Firefox, Edge, or Safari latest) with an empty cache, measured from parse start to all visible components painted.
2. WHEN the user interacts with any control (task add, timer start, bookmark add), THE Renderer SHALL update the visible UI within 100 milliseconds of the interaction with no intermediate loading state or blank frame shown.
3. THE Dashboard SHALL NOT load any external fonts, scripts, or stylesheets that require a network request; all assets SHALL be bundled or embedded in the three project files, ensuring fully offline operation.
4. IF the initial render exceeds 500 ms, THE Dashboard SHALL display a visible loading indicator until rendering completes.
5. THE Dashboard SHALL NOT exceed 50 MB of JS heap memory during normal operation.

---

### Requirement 19: Code Organisation

**User Story:** As a developer, I want the codebase to be clean and easy to navigate, so that I can maintain and extend it without confusion.

#### Acceptance Criteria

1. THE Dashboard's CSS SHALL reside in exactly one file at `css/style.css`.
2. THE Dashboard's JavaScript SHALL reside in exactly one file at `js/app.js`.
3. THE Dashboard's HTML entry point SHALL reside at the project root as `index.html`.
4. THE JavaScript file SHALL be organised into clearly named, single-responsibility functions where each function performs a single logical operation; conditionals, non-standard algorithms, and browser-specific workarounds MUST have inline comments explaining their intent.
5. WHEN the Dashboard loads in any supported browser, THE browser console SHALL contain zero errors and zero warnings.
6. THE JavaScript file SHALL contain no dead code (unused functions, unreachable branches, or variables declared but never referenced).
