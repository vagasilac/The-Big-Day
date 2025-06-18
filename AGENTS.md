🧠 Codex Prompt for Fixing Remaining Planner Issues
We have a wedding planner app with a Gantt chart and to-do list. The current implementation has the following critical regressions and UI issues after recent changes:

🔧 TASKS TO FIX & IMPROVE
1. ✅ Gantt chart should auto-scroll to “today” on load
This was working 2 commits ago. Please investigate which commit broke this and restore the working scroll-to-today behavior.

The chart should scroll horizontally to center today’s date in the visible chart area.

2. ✅

3. ✅ Fix activity background bar cutoff issue
The colored background of chart rows gets cut off early, especially toward the right.

Ensure background bars stretch the entire visible container width, even if there’s no active task.

4. ✅ Today’s vertical highlight line
A vertical line showing today’s date should be rendered.

Style it to be a bit thicker and darker than the month separators (bg-green-600 z-20), and ensure it spans both header and task body.

5. ✅ Month separator grid lines
Subtle vertical lines should separate each month (from header down to the last row).

These should be light (border-muted/40) and rendered dynamically based on month changes in the chart range.

6. ✅ Fix chart overflow end (remove unused space)
Currently, the Gantt chart renders empty space far to the right beyond the last task.

Trim this area. The right edge of the scrollable chart container should match the end of the last visible task.

7. ✅ Fix Gantt task name visibility
The task name column is too narrow; only the first letter of each task is visible.

Ensure there’s a minimum width (e.g. min-w-[160px] or w-48) and enough horizontal padding to show the full name or at least 2–3 words.

🧩 Important Context / Constraints
Codebase uses React + TypeScript + Tailwind.

The planner is implemented in: src/app/dashboard/planner/page.tsx.

Tabs switch between Gantt Chart and To-Do List.

Only the chart area should be horizontally scrollable.

Only the To-Do tab should allow vertical scrolling.

✅ Example of expected fixes:
✅ Today = centered horizontally

✅ No extra empty space right of last task

✅ Monthly grid lines rendered from header to bottom

✅ Task name column readable

✅ Today line visible and prominent

Please perform the changes incrementally and test for visual correctness.