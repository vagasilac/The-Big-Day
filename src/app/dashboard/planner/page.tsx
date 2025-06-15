'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GanttChart, Heart, PlusCircle } from 'lucide-react';

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

  const totalTasks = plannerTasks.length;
  const completedCount = plannerTasks.filter(t => completed[t.id]).length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);
  const nextTask = plannerTasks.find(t => !completed[t.id]);

  const baseStart = Math.min(...plannerTasks.map(t => t.startDays));
  const ganttData = plannerTasks.map(t => ({
    ...t,
    offset: t.startDays - baseStart,
  }));

  const groupedTasks: Record<string, PlannerTask[]> = {};
  plannerTasks.forEach(task => {
    groupedTasks[task.phase] = groupedTasks[task.phase] || [];
    groupedTasks[task.phase].push(task);
  });

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
        <>
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
              <div className="overflow-x-auto">
                <div style={{ minWidth: 600 }}>
                  <div className="relative space-y-1">
                    {ganttData.map((task) => (
                      <div key={task.id} className="flex items-center h-6 text-sm">
                        <span className="w-48 pr-2 truncate">{task.name}</span>
                        <div className="flex-1 relative h-2 bg-muted">
                          <div
                            className={
                              task.critical
                                ? 'absolute h-2 bg-destructive'
                                : task.softCritical
                                ? 'absolute h-2 bg-orange-500'
                                : 'absolute h-2 bg-primary'
                            }
                            style={{
                              left: `${(task.offset / 500) * 100}%`,
                              width: `${(task.durationDays / 500) * 100}%`,
                            }}
                          />
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
                      <label key={task.id} className="flex items-start space-x-2">
                        <Checkbox checked={!!completed[task.id]} onCheckedChange={() => toggleTask(task.id)} />
                        <span className="flex-1">
                          {task.name}
                          {task.critical ? ' (critical)' : task.softCritical ? ' (important)' : ''}
                        </span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
