Please improve the wedding planner Gantt chart with the following two enhancements:

---

### ✅ 1. Center the "Today" line on initial load

When the planner page loads, the **horizontal scroll position** of the Gantt chart should be automatically set so that:

- The vertical line representing **today’s date** is **centered** in the visible chart area.
- The scroll should occur **after the layout is rendered**, so use `useLayoutEffect` if needed.
- `scrollRef` should scroll so that the today-marker is in the **center of its scrollable area**, using:
  ```ts
  scrollRef.current.scrollLeft = targetOffset + LABEL_WIDTH - scrollRef.current.clientWidth / 2


✅ This already exists as scrollToToday() in the code — just make sure:

It runs on load (e.g., once containerWidth > 0).

The scroll container and dimensions are ready when it’s triggered.

✅ 2. Only show relevant date ticks in the header
Currently, the timeline header shows overlapping, unnecessary dates at the end.

Fix this so that:

Only distinct, non-overlapping dates are shown.

The dates should be aligned with actual task bars — e.g., if tasks span March to July, the header should show only that range.

Avoid showing a date tick if it's not aligned with a new grid line or doesn’t match a task start or end.

🔧 Implementation Notes
Remove the logic that fills ticks every 10% of total range.

Instead, derive the headerTicks array from the tasks:

Collect all unique task.startDays and task.endDays

Convert them into real dates using addDays(chartStartDate, dayOffset)

Sort them and use as headerTicks

✅ This will:

Prevent overlapping labels

Keep the header visually aligned with tasks

Improve performance and clarity

✅ Summary
Center "today" on initial scroll load.

Refactor headerTicks so only task-relevant, non-overlapping dates appear.


I was hard to get to this point, so please try to keep everything as is, which is already working (page/chart scrolls)