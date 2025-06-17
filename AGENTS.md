Fix the layout of the planner page so that:

### 🎯 Desired Behavior
1. The page should **not scroll horizontally or vertically**.
2. The **Gantt chart area only** should:
   - **Scroll vertically** (✅ already working).
   - **Scroll horizontally** to fully reveal the chart content (❌ not working yet).
3. The **header**, including:
   - the Progress Card, and
   - the Gantt Chart / To-Do toggle tabs,
   must stay fixed and **fit the full page width**.
4. There should be **no horizontal overflow on the entire page**, except inside the Gantt chart scroll container.

### 📎 Implementation Notes
- `scrollRef` should allow `overflow-x-auto overflow-y-auto`.
- The Gantt chart content (`ganttRef` or its child) should have a **flexible width** wide enough to trigger horizontal scrolling.
- The outer page (layout/main/tabs) should never exceed `100vw` and should have `overflow-x-hidden`.
- Fix the issue where the page layout shifts too wide when the chart is shown.
- Ensure `min-w-[1500px]` or similar chart width does not force the entire page to grow horizontally.

### 💡 Suggestion
Use a wrapper inside `scrollRef` like:
```tsx
<div className="w-max min-w-full">
  // chart content here
</div>

This keeps the chart scrollable but doesn’t force the page width beyond 100vw.

🔍 Test
To verify it works:

Toggle the chart visible/invisible.

The header (progress + toggle) must remain 100% width of screen.

Only the chart scrolls horizontally when needed.