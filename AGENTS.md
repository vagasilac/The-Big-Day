Please improve the wedding planner's Gantt chart and To-Do List with the following changes:

---

### 🧭 0. Swap the tab order
- Make **"To-Do List" the first tab**, and **"Gantt Chart" the second**
- Adjust the default tab to `"todo"`

---

### 🗓️ 1. Header date format
- Update the timeline header to display **only months**
- Show full label only for **first month of each year**, e.g.:
Jan 2024, Feb, Mar, Apr, ... Dec, Jan 2025, Feb, ...


---

### 📐 2. Add vertical grid lines for each month
- Add subtle vertical lines in the Gantt chart aligned with:
- Each **month start**
- Each **month end** (optional, if visually useful)
- These grid lines must:
- Appear in both the **header** and the **task rows**
- Use a **light color**, e.g., `border-muted/40` or similar

---

### 🧰 3. Fix tooltip z-index
- Ensure the task tooltip (appears on hover) is **not clipped**
- It must appear **above the progress card and tabs**
- Use `z-50` or appropriate Tailwind `z-index` on the tooltip container

---

### ✅ 4. To-Do list: Task status toggle (3-state)
Implement 3-state cycle on task click:
1. **Empty** → task is not started
2. **Started** → shows as *started*, no strikethrough
3. **Completed** → checkbox checked, text strikethrough
4. Next click goes back to **empty**

- Reflect this visually in the checkbox and text style
- Persist this in `localStorage` like the current `completed` state

---

### ➕ 5. To-Do List: Add/edit/delete tasks
- Provide UI controls to:
- Add a new task (with name and optional due date)
- Edit a task’s name
- Delete task
- Update localStorage accordingly

---

### 📝 6. Add notes to tasks
- Each task should have a collapsible **note input area**
- Notes should be stored in localStorage
- Use a small textarea with autosave on blur

---

### 🧭 7. Scroll behavior
- When the **To-Do List tab is active**, allow page scroll
- When the **Gantt Chart tab is active**, disable page scroll and only allow internal chart scroll

---

### 🎨 8. Integrate To-Do with Gantt Chart

#### 8.a Color coding
- Match task status with Gantt bar color:
- `not started` → default (light pink or muted)
- `started` → blue (`bg-blue-500`)
- `completed` → green (`bg-green-600`)
- Use Tailwind conditional class logic in the `className` of each bar

### 🧾 8.b Show task notes in the Gantt chart tooltip

- If a task has a **note** added in the To-Do List, display it inside the Gantt chart tooltip.
- Append it below the existing info (task name, duration, start, end).
- If no note exists, omit the note section from the tooltip.
- Make sure line breaks in the note are preserved (use `<p>` or `white-space: pre-line` if necessary).
- Pull note content from `localStorage` or task state, same as the To-Do List.

✅ These improvements will make the planner more interactive, informative, and integrated.