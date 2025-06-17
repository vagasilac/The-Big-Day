Please correct the following issues in the wedding planner app. These items were previously implemented or requested but are now missing or broken:

---

### 🔁 1. "Scroll to Today" is broken again
- Restore the feature that scrolls the Gantt chart **horizontally** to **center today's date** when the chart loads.
- Use `useLayoutEffect` with a `hasScrolledRef` guard.
- The scroll logic should only run once `containerWidth > 0`.

Example:
```ts
scrollRef.current.scrollLeft =
  (todayOffset / totalRange) * containerWidth +
  LABEL_WIDTH -
  scrollRef.current.clientWidth / 2;

🧾 2. To-Do list tab does not scroll vertically
When the "To-Do List" tab is selected, allow full page vertical scrolling so the user can view all tasks.

Only the Gantt tab should lock scroll and isolate it to the chart.

➕ 3. "Add new task" UI is still missing
Implement the ability to add a new task in the To-Do list.

User should enter:

Task name (required)

Optional note

Persist the new task to localStorage.

Render it immediately in the list and sync it to the Gantt chart view.

🪟 4. Tooltips still appear under top elements
Fix the z-index of the tooltip on Gantt chart bars:

Tooltip must appear above the progress bar card and tab switcher

Use z-50 or higher on the tooltip container

Ensure no parent element with a lower z-index or overflow-hidden is clipping it

📏 5. Month grid lines missing
Add vertical grid lines in the Gantt chart:

Line should start in the date header row and extend down through the task rows

Align lines to month start dates

Use subtle style: e.g. border-muted/40, w-px, absolute inset-y-0, bg-border

These lines should:

Improve readability of time segments

Scroll together with the chart content