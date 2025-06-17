# AGENTS.md proposed content

Please add here what you believe should come here, thanks.

Planner scroll issue:

🎯 Goal Recap
The page should not scroll. Only the Gantt chart area should scroll — both horizontally and vertically if needed.

🔍 Problem Analysis
1. overflow-hidden on wrong container
Your top-level <div className="flex flex-col gap-6 md:gap-8 h-full overflow-hidden"> is intended to prevent the page from scrolling. But this works only if:

All parent containers up to <body> and <html> are 100% height.

You don’t have children that force the height to grow beyond the viewport.

Otherwise, overflow-hidden is ignored because the element's height is not bounded.

2. No full-height layout context
Your planner page is likely inside a layout (app/layout.tsx) that does not enforce height: 100vh or min-h-screen. As a result, your h-full collapses to the content height.

3. The scrollRef container is good, but...
You're applying overflow-auto correctly here:



<div ref={scrollRef} className="h-full overflow-auto">
…but this container doesn’t get constrained properly, so it grows beyond the viewport, triggering scroll on the <body> instead of scrolling internally.

✅ Fix Strategy
A. Ensure page layout is full height
In your layout.tsx or parent wrapper, make sure the following styles are present:



<html className="h-full">
<body className="h-full overflow-hidden"> // This disables page scroll
<div className="min-h-screen flex flex-col"> // Optional wrapper
And in tailwind.config.js, make sure h-full, min-h-screen, and overflow-hidden are not purged.

B. Fix the layout structure inside PlannerPage
Update the main return container like this:



return (
  <div className="flex flex-col h-screen overflow-hidden"> {/* Full page, no scroll */}
    ...
    <TabsContent value="gantt" className="flex-1 overflow-hidden mt-4">
      <div ref={scrollRef} className="h-full overflow-auto"> {/* Only this can scroll */}
        ...
Explanation:

h-screen ensures the whole component takes the viewport height.

flex-1 overflow-hidden ensures the TabsContent fills remaining space but doesn't overflow itself.

scrollRef now properly scrolls, since its parent limits its height.

✅ Additional Tips
You can also make sure your scrollRef div explicitly uses max-height: 100% in Tailwind if needed.

If you're using nested layouts in Next.js, check that none of them are shrinking due to min-h-0 or missing h-full.

🧪 How to Debug
In Chrome DevTools (or Firefox):

Select <body>, <html>, and <main> elements.

Check their computed height — all should be 100% or height: 100vh.

See which element is triggering the vertical scrollbar (you’ll find a div that stretches beyond the viewport).

🧩 Optional Fix: Enforce Sticky Headers
To keep your timeline row (sticky top-0) working correctly, ensure the scrolling container (scrollRef) is the one doing the scrolling — not a parent — or the stickiness won’t work as expected.