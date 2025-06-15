export interface PlannerTask {
  id: string;
  phase: string;
  name: string;
  startDays: number;
  durationDays: number;
  critical?: boolean;
  softCritical?: boolean;
}
