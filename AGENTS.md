Fix the layout of the wedding planner page. These issues must be solved:

---

### ✅ GOAL

The page should:
- Have **no page-level scroll** (both vertical and horizontal).
- The **Progress Card** and **Tab Switcher** must fit **within the screen width** and always be visible.
- The **Gantt chart area** must:
  - Scroll **vertically** when chart content overflows in height ✅
  - Scroll **horizontally** when chart is wider than viewport ✅
  - Remain within the screen — must not overflow the page horizontally ❌

---

### 🔧 TECHNICAL REQUIREMENTS

- The **chart scroll container** (`scrollRef`) should have:  
  `className="h-full overflow-x-auto overflow-y-auto"`

- Inside `scrollRef`, the direct child should be:  
  `className="w-max min-w-full"`  
  to enable horizontal scrolling **without pushing the entire page wider**.

- Ensure the outer page layout and all parent wrappers:
  - Have `overflow-x-hidden` to prevent page scroll.
  - Are constrained to `w-full max-w-screen` so that no section pushes beyond the viewport width.

- The vertical scroll issue is likely caused by a missing `flex-1` or height constraint on a parent.  
  Please verify that:
  - The wrapper around `TabsContent` has `flex-1 overflow-hidden`
  - And that `scrollRef` is allowed to stretch vertically (`h-full`) inside that context.

---

### ❗ DO NOT

- Do not allow the page body to scroll.
- Do not use `min-w-[1500px]` directly, as it causes the whole page to overflow.
- Do not let any container inside the page push the layout wider than the viewport.

---

### 📌 Test Checklist

After the fix:
- The page should never scroll horizontally.
- The header content (progress card, toggle) must always fit.
- The Gantt chart area must be scrollable both vertically and horizontally **within its container only**.
