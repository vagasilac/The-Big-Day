The Gantt chart area in the wedding planner page needs vertical scrolling restored.

---

### ✅ Goal

Fix the layout so that the **Gantt chart section scrolls vertically** when the content overflows.  
This scroll should be **inside the chart area only**, not the full page.

---

### ✅ Context

- The outer page and header already fit the screen — this is correct, do not change.
- The chart area correctly supports horizontal scrolling — keep this as-is.
- But now, when many tasks are rendered, the user **cannot scroll down** the chart section. This is broken.

---

### 🔧 Implementation Instructions

- Make sure the scroll container (`scrollRef`) has:  
  `className="h-full overflow-x-auto overflow-y-auto"`

- Its parent container (likely inside `<TabsContent value="gantt">`) should:
  - Use `className="flex-1 overflow-hidden"`
  - Be inside a `flex-col flex-1` layout chain up to the full height container

- Make sure any intermediate wrappers (e.g. tabs, cards, outer layout) allow the scroll container to grow in height:
  - Add `flex-1` where necessary
  - Avoid hard-coded `min-h`, `max-h`, or missing height settings

---

### 📌 Final Checklist

After your update:
- ✅ The **page stays fixed**
- ✅ The **header (progress + tab)** remains static and full-width
- ✅ The **Gantt chart can scroll horizontally and vertically** **inside its section**
