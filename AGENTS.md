// Please apply the following fixes in the wedding planner Gantt & To-Do UI:

// ---------------------------
// 🔁 1. Restore "scroll to Today" on Gantt chart load
// ---------------------------
/*
✅ This used to work — now it's broken.
✅ Reinstate the working logic that scrolls to the TODAY marker on initial render.
✅ Use useLayoutEffect + hasScrolledRef to avoid repeating.

Logic:
  scrollRef.current.scrollLeft =
    (todayOffset / totalRange) * containerWidth +
    LABEL_WIDTH - scrollRef.current.clientWidth / 2;

Make sure it runs only:
- once
- when ganttTasks are populated
- when containerWidth > 0
*/

// ---------------------------
// 🧾 2. To-Do List still doesn't scroll vertically
// ---------------------------
/*
✅ You already added dynamic scroll control based on activeTab (good!).

BUT: The To-Do tab is still unscrollable.

🔧 Fix:
- Ensure parent wrapper div has: `overflow-y-auto` when tab is "todo"
- There might still be a container with `overflow-hidden` blocking it
- Double-check that all parent heights allow for scrolling
*/

// ---------------------------
// 🎨 3. Gantt background rows stop prematurely
// ---------------------------
/*
Issue:
- Each task row background bar (light-colored) stops before the full timeline width.

Fix:
- Ensure these background elements stretch:
  width = Math.max(containerWidth, totalRange * 10 + LABEL_WIDTH)
- Or set `min-w-full` on the wrapping div
*/

// ---------------------------
// 📅 4. Vertical lines at month start missing
// ---------------------------
/*
✅ You are mapping `monthTicks`, but likely didn't see the effect due to style/layout bugs.

Fix:
- Each vertical gridline:
  - `absolute inset-y-0 w-px bg-muted/30` or `border-muted/40`
  - `left: ${(offset / totalRange) * 100}%`
  - Should be inside `.relative` container
- Layer should be below task bars, above background
*/

// ---------------------------
// 📍 5. "Today" line is still missing
// ---------------------------
/*
✅ Reintroduce the green "Today" marker line.

Fix:
- Add a div like:

  <div className="absolute inset-y-0 w-px bg-green-600 z-20"
       style={{ left: `${(todayOffset / totalRange) * 100}%` }} />

- Append to the same relative container that holds vertical month lines.
- Ensure scrollable chart body doesn’t clip it.
*/

// ---------------------------
// ➕ 6. Add task section now supports notes — ✅
// ---------------------------
/*
Great job with:
- Storing to localStorage
- Adding "optional note" input
- Mapping plannerTasks + customTasks into ganttTasks (✅)
*/

// 🧪 Test checklist after applying all changes:
/*
- Gantt auto-scrolls to Today on load
- "Today" green vertical line is visible
- Month gridlines span from header to body
- Light row backgrounds stretch fully
- To-Do tab is scrollable
- Added tasks persist and show up in chart
*/
