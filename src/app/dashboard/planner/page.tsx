
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GanttChart, Heart, PlusCircle } from 'lucide-react';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { Rnd } from 'react-rnd';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

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
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem('planner-completed');
    if (stored) {
      try { setCompleted(JSON.parse(stored)); } catch (_) {}
    }
  }, []);

  const toggleTask = (id: string) => {
    setCompleted(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('planner-completed', JSON.stringify(next));
      return next;
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

  const [ganttTasks, setGanttTasks] = useState<PlannerTask[]>(plannerTasks);

  const totalTasks = ganttTasks.length;
  const completedCount = ganttTasks.filter(t => completed[t.id]).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const nextTask = ganttTasks.find(t => !completed[t.id]);

  const baseStart = ganttTasks.length > 0 ? Math.min(...ganttTasks.map(t => t.startDays)) : 0;
  const maxEnd = ganttTasks.length > 0 ? Math.max(...ganttTasks.map(t => t.startDays + t.durationDays)) : 500;
  const totalRange = Math.max(1, maxEnd - baseStart); // Ensure totalRange is at least 1 to avoid division by zero
  
  const ganttData = ganttTasks.map(t => ({
    ...t,
    offset: t.startDays - baseStart,
  }));

  const groupedTasks: Record<string, PlannerTask[]> = {};
  ganttTasks.forEach(task => {
    groupedTasks[task.phase] = groupedTasks[task.phase] || [];
    groupedTasks[task.phase].push(task);
  });

  const ganttRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const LABEL_WIDTH = 192; // width of the task label column (w-48)
  const [containerWidth, setContainerWidth] = useState(Math.max(600, totalRange * 10));

  useEffect(() => {
    const update = () => {
      if (ganttRef.current) {
        setContainerWidth(Math.max(0, ganttRef.current.offsetWidth - LABEL_WIDTH));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const todayOffset = differenceInCalendarDays(new Date(), chartStartDate);
      const target = (todayOffset / totalRange) * containerWidth;
      scrollRef.current.scrollLeft = Math.max(0, target + LABEL_WIDTH - scrollRef.current.clientWidth / 2);
    }
  }, [containerWidth, chartStartDate, totalRange]);

  const weddingDateObj = weddingData?.date ? weddingData.date.toDate() : new Date();
  const chartStartDate = addDays(weddingDateObj, baseStart);
  const headerTicks: Date[] = [];
  if (totalRange > 0) {
    for (let i = 0; i <= totalRange; i += Math.max(1, Math.floor(totalRange / 10))) { // Adjust tick frequency
      headerTicks.push(addDays(chartStartDate, i));
    }
     if (!headerTicks.find(d => differenceInCalendarDays(d, addDays(chartStartDate, totalRange)) === 0)) {
        headerTicks.push(addDays(chartStartDate, totalRange));
    }
  }


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
    <div className="flex flex-col gap-6 md:gap-8">
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
        <TooltipProvider> {/* Added TooltipProvider here */}
          <div className="flex items-center gap-3">
            <GanttChart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Wedding Planner</h1>
              <p className="text-muted-foreground mt-1">
                Track every step leading up to the big day.
              </p>
            </div>
          </div>

          <Card className="shadow-lg">
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

          <Tabs defaultValue="gantt">
            <TabsList>
              <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
              <TabsTrigger value="todo">To-Do List</TabsTrigger>
            </TabsList>
            <TabsContent value="gantt" className="mt-4">
              <div ref={scrollRef} className="overflow-x-auto">
                <div
                  style={{ width: Math.max(600 + LABEL_WIDTH, totalRange * 10 + LABEL_WIDTH) }}
                  ref={ganttRef}
                >
                  <div
                    className="relative mb-4 h-6 text-xs sticky top-0 bg-background z-20"
                    style={{ marginLeft: LABEL_WIDTH, width: containerWidth }}
                  >
                    {headerTicks.map((d, i) => (
                      <div
                        key={i}
                        className="absolute top-0 border-r border-border/50 text-center whitespace-nowrap"
                        style={{
                          left: `${(differenceInCalendarDays(d, chartStartDate) / totalRange) * 100}%`,
                           width: i < headerTicks.length -1 ? `${(differenceInCalendarDays(headerTicks[i+1], d) / totalRange) * 100}%` : `${(differenceInCalendarDays(addDays(chartStartDate, totalRange), d) / totalRange) * 100}%`,
                        }}
                      >
                        {format(d, 'MMM d, yyyy')}
                      </div>
                    ))}
                    {differenceInCalendarDays(weddingDateObj, chartStartDate) >=0 && differenceInCalendarDays(weddingDateObj, chartStartDate) <= totalRange && (
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
                    {differenceInCalendarDays(new Date(), chartStartDate) >=0 && differenceInCalendarDays(new Date(), chartStartDate) <= totalRange && (
                        <div
                        className="absolute inset-y-0 w-px bg-green-600 z-10"
                        style={{
                            left: `${(differenceInCalendarDays(new Date(), chartStartDate) / totalRange) * 100}%`,
                        }}
                        />
                    )}
                  </div>
                  <div className="relative space-y-1">
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ marginLeft: LABEL_WIDTH }}
                    >
                      {headerTicks.map((d, i) => (
                        <div
                          key={i}
                          className="absolute inset-y-0 border-r border-border/30"
                          style={{
                            left: `${(differenceInCalendarDays(d, chartStartDate) / totalRange) * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                    {ganttData.map((task, idx) => (
                      <div key={task.id} className="flex items-center h-6 text-sm">
                        <span className="w-48 pr-2 truncate sticky left-0 bg-background z-10" title={task.name}>{task.name}</span>
                        <div className="flex-1 relative h-4 bg-muted rounded"> {/* Bar container */}
                          <Rnd
                            bounds="parent"
                            size={{
                              width: (task.durationDays / totalRange) * containerWidth,
                              height: 16, // Full height of parent bar container
                            }}
                            position={{
                              x: (task.offset / totalRange) * containerWidth,
                              y: 0,
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
                                    task.critical
                                      ? 'h-full bg-destructive rounded'
                                      : task.softCritical
                                      ? 'h-full bg-orange-500 rounded'
                                      : 'h-full bg-primary rounded'
                                  }
                                  style={{ width: '100%', height: '100%', cursor: 'grab' }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{task.name}</p>
                                <p>Duration: {task.durationDays} day{task.durationDays > 1 ? 's' : ''}</p>
                                <p>Starts: {format(addDays(weddingDateObj, task.startDays), 'MMM d, yyyy')}</p>
                                <p>Ends: {format(addDays(weddingDateObj, task.startDays + task.durationDays -1), 'MMM d, yyyy')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </Rnd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="todo" className="mt-4">
              {Object.entries(groupedTasks).map(([phase, tasks]) => (
                <Card key={phase} className="mb-4">
                  <CardHeader>
                    <CardTitle>{phase}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasks.map((task) => (
                      <label key={task.id} className="flex items-start space-x-2 p-2 hover:bg-secondary rounded-md cursor-pointer">
                        <Checkbox id={`task-${task.id}`} checked={!!completed[task.id]} onCheckedChange={() => toggleTask(task.id)} className="mt-1"/>
                        <div className="flex-1">
                          <span className={`${completed[task.id] ? 'line-through text-muted-foreground' : ''}`}>
                            {task.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {task.critical ? '(Critical) ' : task.softCritical ? '(Important) ' : ''}
                            Due around: {format(addDays(weddingDateObj, task.startDays + Math.floor(task.durationDays / 2)), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </TooltipProvider> 
      )}
    </div>
  );
}

