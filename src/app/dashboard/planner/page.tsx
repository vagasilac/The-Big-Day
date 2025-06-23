
'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GanttChart, Heart, PlusCircle } from 'lucide-react';
import {
  addDays,
  differenceInCalendarDays,
  format,
  addMonths,
  startOfToday,
  startOfDay,
} from 'date-fns';
import { Rnd } from 'react-rnd';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import type { PlannerTask } from '@/types/planner';
import { plannerTasks } from '@/lib/planner-data';

export default function PlannerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskStatus, setTaskStatus] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [customTasks, setCustomTasks] = useState<PlannerTask[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('planner-status');
    if (stored) {
      try {
        setTaskStatus(JSON.parse(stored));
      } catch (_) {}
    }
    const storedNotes = localStorage.getItem('planner-notes');
    if (storedNotes) {
      try {
        setNotes(JSON.parse(storedNotes));
      } catch (_) {}
    }
    const storedCustom = localStorage.getItem('planner-custom-tasks');
    if (storedCustom) {
      try {
        setCustomTasks(JSON.parse(storedCustom));
      } catch (_) {}
    }
  }, []);

  const cycleTaskStatus = (id: string) => {
    setTaskStatus(prev => {
      const next = { ...prev, [id]: ((prev[id] ?? 0) + 1) % 3 };
      localStorage.setItem('planner-status', JSON.stringify(next));
      return next;
    });
  };

  const updateNote = (id: string, value: string) => {
    setNotes(prev => {
      const next = { ...prev, [id]: value };
      localStorage.setItem('planner-notes', JSON.stringify(next));
      return next;
    });
  };

  const handleAddTask = () => {
    if (!newTaskName) return;
    const id = `custom-${Date.now()}`;
    const due = newTaskDate ? new Date(newTaskDate) : weddingDateObj;
    const startDays = differenceInCalendarDays(due, weddingDateObj);
    const task: PlannerTask = {
      id,
      phase: 'Custom',
      name: newTaskName,
      startDays,
      durationDays: 1,
    };
    const nextCustom = [...customTasks, task];
    setCustomTasks(nextCustom);
    localStorage.setItem('planner-custom-tasks', JSON.stringify(nextCustom));
    if (newTaskNote) {
      updateNote(id, newTaskNote);
    }
    setGanttTasks(prev => [...prev, task]);
    setNewTaskName('');
    setNewTaskDate('');
    setNewTaskNote('');
  };

  const startEditTask = (task: PlannerTask) => {
    setEditTaskId(task.id);
    setEditTaskName(task.name);
  };

  const saveEditTask = () => {
    if (!editTaskId) return;
    setGanttTasks(prev => prev.map(t => (t.id === editTaskId ? { ...t, name: editTaskName } : t)));
    setCustomTasks(prev => {
      const next = prev.map(t => (t.id === editTaskId ? { ...t, name: editTaskName } : t));
      localStorage.setItem('planner-custom-tasks', JSON.stringify(next));
      return next;
    });
    setEditTaskId(null);
    setEditTaskName('');
  };

  const deleteTask = (id: string) => {
    setGanttTasks(prev => prev.filter(t => t.id !== id));
    setCustomTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      localStorage.setItem('planner-custom-tasks', JSON.stringify(next));
      return next;
    });
    setNotes(prev => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        localStorage.setItem('planner-notes', JSON.stringify(rest));
        return rest;
      }
      return prev;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const weddingsRef = collection(db, 'weddings');
          const q = query(weddingsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const weddingDoc = querySnapshot.docs[0];
            setWeddingData({ id: weddingDoc.id, ...weddingDoc.data() } as Wedding);
          } else {
            setWeddingData(null);
          }
        } catch (error) {
          console.error('Error fetching wedding data:', error);
          setWeddingData(null);
        }
      } else {
        setCurrentUser(null);
        setWeddingData(null);
        router.push('/auth');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const [ganttTasks, setGanttTasks] = useState<PlannerTask[]>([]);

  useEffect(() => {
    setGanttTasks([...plannerTasks, ...customTasks]);
  }, [customTasks]);

  const totalTasks = ganttTasks.length;
  const completedCount = ganttTasks.filter(t => taskStatus[t.id] === 2).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const nextTask = ganttTasks.find(t => (taskStatus[t.id] ?? 0) !== 2);

  // Define Gantt chart calculation constants before they are used by useState or useEffect
  const baseStart = ganttTasks.length > 0 ? Math.min(...ganttTasks.map(t => t.startDays)) : 0;
  const maxEnd = ganttTasks.length > 0 ? Math.max(...ganttTasks.map(t => t.startDays + t.durationDays)) : 500;
  const totalRange = Math.max(1, maxEnd - baseStart); 

  const weddingDateObj = startOfDay(
    weddingData?.date ? weddingData.date.toDate() : new Date()
  );
  const chartStartDate = addDays(weddingDateObj, baseStart);

  const ganttRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const LABEL_WIDTH = 192;
  const [containerWidth, setContainerWidth] = useState(Math.max(600, totalRange * 10));
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todo');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskNote, setNewTaskNote] = useState('');
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState('');

  const scrollToToday = () => {
    if (scrollRef.current && chartStartDate && totalRange > 0 && containerWidth > 0) {
      const todayOffset = differenceInCalendarDays(startOfToday(), chartStartDate);
      scrollRef.current.scrollLeft =
        (todayOffset / totalRange) * containerWidth -
        scrollRef.current.clientWidth / 2;
    }
  };

  useEffect(() => {
    const update = () => {
      if (ganttRef.current) {
        setContainerWidth(Math.max(0, ganttRef.current.offsetWidth));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [totalRange]);

  useEffect(() => {
    if (activeTab === 'gantt' && ganttRef.current) {
      setContainerWidth(Math.max(0, ganttRef.current.offsetWidth));
    }
  }, [activeTab, ganttTasks.length, totalRange]);

  useEffect(() => {
    document.body.style.overflow = activeTab === 'gantt' ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeTab]);

  const initialScrolledRef = useRef(false);

  useLayoutEffect(() => {
    if (
      activeTab === 'gantt' &&
      !initialScrolledRef.current &&
      containerWidth > 0 &&
      scrollRef.current &&
      totalRange > 0
    ) {
      scrollToToday();
      initialScrolledRef.current = true;
    }
  }, [activeTab, containerWidth, totalRange, chartStartDate]);

  const ganttData = ganttTasks.map(t => ({
    ...t,
    offset: t.startDays - baseStart,
  }));

  const groupedTasks: Record<string, PlannerTask[]> = {};
  ganttTasks.forEach(task => {
    groupedTasks[task.phase] = groupedTasks[task.phase] || [];
    groupedTasks[task.phase].push(task);
  });
  
  const headerTicks = React.useMemo(() => {
    const offsets = new Set<number>();
    ganttTasks.forEach(t => {
      offsets.add(t.startDays - baseStart);
      offsets.add(t.startDays + t.durationDays - baseStart);
    });
    offsets.add(0);
    offsets.add(totalRange);
    return Array.from(offsets).sort((a, b) => a - b);
  }, [ganttTasks, baseStart, totalRange]);

  const visibleHeaderTicks = React.useMemo(() => {
    const MIN_SPACING = 50; // pixels
    let lastLeft = -Infinity;
    const result: number[] = [];
    headerTicks.forEach(off => {
      const leftPx = (off / totalRange) * containerWidth;
      if (leftPx - lastLeft >= MIN_SPACING) {
        result.push(off);
        lastLeft = leftPx;
      }
    });
    return result;
  }, [headerTicks, containerWidth, totalRange]);

  const monthTicks = React.useMemo(() => {
    const result: number[] = [];
    const start = new Date(chartStartDate);
    start.setDate(1);
    let current = new Date(start);
    while (differenceInCalendarDays(current, chartStartDate) <= totalRange) {
      result.push(differenceInCalendarDays(current, chartStartDate));
      current = addMonths(current, 1);
    }
    return result;
  }, [chartStartDate, totalRange]);


  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <Card className="shadow-md">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col flex-1 w-full max-w-screen overflow-x-hidden',
        activeTab === 'gantt' ? 'overflow-y-hidden' : 'overflow-y-auto'
      )}
    >
      {!weddingData ? (
        <Card className="border-dashed border-2 p-8 text-center shadow-sm">
          <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <CardTitle className="text-xl font-semibold mb-2">No Wedding Site Yet</CardTitle>
          <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto">
            Please create your wedding site first to use the planner.
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/details">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your Wedding Site
            </Link>
          </Button>
        </Card>
      ) : (
        <TooltipProvider>
          <div className="flex items-center gap-3">
            <GanttChart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Wedding Planner</h1>
              <p className="text-muted-foreground mt-1">
                Track every step leading up to the big day.
              </p>
            </div>
          </div>

          <Card className="shadow-lg w-full max-w-screen">
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>
                {progressPercent}% complete{nextTask ? ` – Next: ${nextTask.name}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercent} />
            </CardContent>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            defaultValue="todo"
            className={cn(
              'flex flex-col flex-1',
              activeTab === 'todo' ? 'overflow-y-auto' : 'overflow-hidden'
            )}
          >
            <TabsList className="w-full max-w-screen">
              <TabsTrigger value="todo">To-Do List</TabsTrigger>
              <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="gantt" className="flex-1 overflow-hidden mt-4">
              <div className="flex h-full overflow-y-auto">
                <div
                  className="sticky left-0 z-20 shrink-0 pr-2 bg-background"
                  style={{ width: LABEL_WIDTH }}
                >
                  <div className="space-y-1">
                    {ganttData.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center h-6 text-sm w-48 min-w-[160px] truncate"
                      >
                        {task.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 h-full overflow-x-auto overflow-y-auto">
                  <div className="w-max min-w-full">
                    <div ref={ganttRef} className="relative" style={{ width: totalRange * 10 }}>
                      <div
                        className="absolute inset-y-0 pointer-events-none right-0"
                        style={{ width: containerWidth }}
                      >
                      {monthTicks.map((off, i) => (
                        <div
                          key={i}
                          className="absolute inset-y-0 w-px bg-border/40"
                          style={{ left: `${(off / totalRange) * 100}%` }}
                        />
                      ))}
                      {differenceInCalendarDays(startOfToday(), chartStartDate) >= 0 &&
                        differenceInCalendarDays(startOfToday(), chartStartDate) <= totalRange && (
                          <div
                            className="absolute inset-y-0 w-0.5 bg-green-600 z-30"
                            style={{
                              left: `${(differenceInCalendarDays(startOfToday(), chartStartDate) / totalRange) * 100}%`,
                            }}
                          />
                      )}
                  </div>
                  <div
                      className="relative mb-4 h-6 text-xs sticky top-0 bg-background z-20"
                      style={{ width: containerWidth }}
                    >
                      {monthTicks.map((off, i) => {
                      const currentDate = addDays(chartStartDate, off);
                      const nextOff = i < monthTicks.length - 1 ? monthTicks[i + 1] : totalRange;
                      return (
                        <div
                          key={i}
                          className="absolute top-0 border-r border-border/50 text-center whitespace-nowrap"
                          style={{
                            left: `${(off / totalRange) * 100}%`,
                            width: `${((nextOff - off) / totalRange) * 100}%`,
                          }}
                        >
                          {format(currentDate, currentDate.getMonth() === 0 || i === 0 ? 'MMM yyyy' : 'MMM')}
                        </div>
                      );
                    })}
                      {differenceInCalendarDays(weddingDateObj, chartStartDate) >= 0 &&
                        differenceInCalendarDays(weddingDateObj, chartStartDate) <= totalRange && (
                          <>
                            <div
                              className="absolute inset-y-0 w-px bg-blue-500 z-10"
                              style={{
                                left: `${(differenceInCalendarDays(weddingDateObj, chartStartDate) / totalRange) * 100}%`,
                              }}
                            />
                            <Heart
                              className="absolute -top-3 h-4 w-4 text-blue-500 z-10"
                              style={{
                                left: `${(differenceInCalendarDays(weddingDateObj, chartStartDate) / totalRange) * 100}%`,
                                transform: 'translateX(-50%)',
                              }}
                            />
                          </>
                      )}
                  </div>
                      <div className="relative space-y-1">
                        {ganttData.map((task, idx) => (
                          <div key={task.id} className="flex items-center h-6 text-sm">
                            <div
                              className="flex-1 relative h-4 bg-muted rounded"
                              style={{ minWidth: containerWidth }}
                            >
                          <Rnd
                            bounds="parent"
                            default={{
                              x: (task.offset / totalRange) * containerWidth,
                              y: 0,
                              width: (task.durationDays / totalRange) * containerWidth,
                              height: 16,
                            }}
                            enableResizing={{ left: true, right: true }}
                            dragAxis="x"
                            onDragStop={(_, d) => {
                              const newStart =
                                Math.round((d.x / containerWidth) * totalRange) + baseStart;
                              setGanttTasks(prev =>
                                prev.map((t, i) =>
                                  i === idx ? { ...t, startDays: newStart } : t
                                )
                              );
                            }}
                            onResizeStop={(_, __, ref, ___, pos) => {
                              const newStart =
                                Math.round((pos.x / containerWidth) * totalRange) + baseStart;
                              const newDuration = Math.max(
                                1,
                                Math.round((ref.offsetWidth / containerWidth) * totalRange)
                              );
                              setGanttTasks(prev =>
                                prev.map((t, i) =>
                                  i === idx
                                    ? { ...t, startDays: newStart, durationDays: newDuration }
                                    : t
                                )
                              );
                            }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={
                                    cn(
                                      'h-full rounded cursor-grab',
                                      taskStatus[task.id] === 2
                                        ? 'bg-green-600'
                                        : taskStatus[task.id] === 1
                                        ? 'bg-blue-500'
                                        : task.critical
                                        ? 'bg-destructive'
                                        : task.softCritical
                                        ? 'bg-orange-500'
                                        : 'bg-primary'
                                    )
                                  }
                                  style={{ width: '100%', height: '100%' }}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="z-50">
                                <p>{task.name}</p>
                                <p>Duration: {task.durationDays} day{task.durationDays > 1 ? 's' : ''}</p>
                                <p>Starts: {format(addDays(weddingDateObj, task.startDays), 'MMM d, yyyy')}</p>
                                <p>Ends: {format(addDays(weddingDateObj, task.startDays + task.durationDays -1), 'MMM d, yyyy')}</p>
                                {notes[task.id] && (
                                  <p className="whitespace-pre-line mt-1">{notes[task.id]}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </Rnd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </TabsContent>
            <TabsContent value="todo" className="flex-1 overflow-y-auto mt-4">
              {Object.entries(groupedTasks).map(([phase, tasks]) => (
                <Card key={phase} className="mb-4">
                  <CardHeader>
                    <CardTitle>{phase}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasks.map((task) => {
                      const status = taskStatus[task.id] ?? 0;
                      const isOpen = openNote === task.id;
                      return (
                        <div key={task.id} className="space-y-1">
                          <label className="flex items-start space-x-2 p-2 hover:bg-secondary rounded-md cursor-pointer">
                            <Checkbox
                              id={`task-${task.id}`}
                              checked={status === 2 ? true : status === 1 ? 'indeterminate' : false}
                              onCheckedChange={() => cycleTaskStatus(task.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <span
                                className={
                                  status === 2
                                    ? 'line-through text-muted-foreground'
                                    : status === 1
                                    ? 'text-blue-500'
                                    : ''
                                }
                              >
                                {task.name}
                                {status === 1 && (
                                  <span className="ml-2 text-xs italic text-blue-500">(Started)</span>
                                )}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {task.critical ? '(Critical) ' : task.softCritical ? '(Important) ' : ''}
                                Due around: {format(addDays(weddingDateObj, task.startDays + Math.floor(task.durationDays / 2)), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setOpenNote(isOpen ? null : task.id)}>
                              Notes
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => startEditTask(task)}>
                              Edit
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                              Delete
                            </Button>
                          </label>
                          {isOpen && (
                            <textarea
                              className="w-full border rounded p-1 text-sm"
                              value={notes[task.id] ?? ''}
                              onChange={(e) => updateNote(task.id, e.target.value)}
                              onBlur={(e) => updateNote(task.id, e.target.value)}
                              rows={2}
                            />
                          )}
                          {editTaskId === task.id && (
                            <div className="flex gap-2 mt-1">
                              <input
                                className="flex-1 border rounded p-1 text-sm"
                                value={editTaskName}
                                onChange={(e) => setEditTaskName(e.target.value)}
                              />
                              <Button type="button" size="sm" onClick={saveEditTask}>Save</Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold">Add Task</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Task name"
                  className="flex-1 border rounded p-1 text-sm"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
                <input
                  type="date"
                  className="border rounded p-1 text-sm"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Optional note"
                  className="flex-1 border rounded p-1 text-sm"
                  value={newTaskNote}
                  onChange={(e) => setNewTaskNote(e.target.value)}
                />
                <Button type="button" onClick={handleAddTask}>
                  Add
                </Button>
              </div>
              </div>
            </TabsContent>
          </Tabs>
        </TooltipProvider> 
      )}
    </div>
  );
}

