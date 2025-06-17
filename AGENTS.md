Two issues remain to be fixed in the Gantt chart:

---

### ✅ 1. Center the "Today" line on load

The `scrollToToday()` function already exists, but it's not working properly. Fix it so that:

- The chart scrolls horizontally to **center the "Today" vertical line** on page load.
- Make sure this runs inside `useLayoutEffect`, **after**:
  - containerWidth is known
  - scrollRef is populated
  - chartStartDate and totalRange are all valid

Example logic to use:
```ts
const todayOffset = differenceInCalendarDays(new Date(), chartStartDate);
scrollRef.current.scrollLeft = 
  (todayOffset / totalRange) * containerWidth + LABEL_WIDTH - scrollRef.current.clientWidth / 2;
Use a hasScrolledRef.current flag to ensure it triggers only once.

✅ 2. Prevent overlapping header date ticks
Even though headerTicks are now correctly based on task boundaries, they sometimes render too close together, creating overlapping text.

Fix this by:

Skipping ticks that would render less than ~50px apart from the previous one.

In the .map() step, calculate where each tick would be positioned using:
const leftPercent = offset / totalRange;
const leftPx = leftPercent * containerWidth;

Only render ticks that are far enough apart from the last rendered tick.

This will:

Prevent overcrowding

Maintain date clarity

Eliminate the overlapping cluster at the end of the chart

Please pay attention to not screw up anything which is already working fine! Thanks