// ============================================================
// Task Board — Shared task management system
// ============================================================

import { v4 as uuid } from 'uuid';
import type { AgentId, Task, TaskStatus, Priority, SubTask } from '../types/index.js';

/**
 * Centralized task board that all agents can read and update.
 * Acts as the single source of truth for project work items.
 */
export class TaskBoard {
  private tasks = new Map<string, Task>();

  /** Create a new task */
  createTask(params: {
    title: string;
    description: string;
    priority: Priority;
    assignedTo: AgentId;
    createdBy: AgentId;
    dependencies?: string[];
    deliverables?: string[];
    acceptanceCriteria?: string[];
  }): Task {
    const task: Task = {
      id: uuid(),
      title: params.title,
      description: params.description,
      status: 'backlog',
      priority: params.priority,
      assignedTo: params.assignedTo,
      createdBy: params.createdBy,
      dependencies: params.dependencies ?? [],
      deliverables: params.deliverables ?? [],
      acceptanceCriteria: params.acceptanceCriteria ?? [],
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  /** Update task status */
  updateStatus(taskId: string, status: TaskStatus): Task | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    task.status = status;
    task.updatedAt = new Date();
    if (status === 'done') task.completedAt = new Date();
    return task;
  }

  /** Set task output/deliverable */
  setOutput(taskId: string, output: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.output = output;
      task.updatedAt = new Date();
    }
  }

  /** Add a subtask */
  addSubtask(taskId: string, title: string): SubTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    const subtask: SubTask = { id: uuid(), title, status: 'backlog' };
    task.subtasks.push(subtask);
    task.updatedAt = new Date();
    return subtask;
  }

  /** Update subtask status */
  updateSubtask(taskId: string, subtaskId: string, status: TaskStatus, output?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;
    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) {
      sub.status = status;
      if (output) sub.output = output;
      task.updatedAt = new Date();
    }
  }

  /** Get all tasks */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /** Get tasks assigned to a specific agent */
  getTasksFor(agentId: AgentId): Task[] {
    return this.getAllTasks().filter(t => t.assignedTo === agentId);
  }

  /** Get tasks by status */
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.getAllTasks().filter(t => t.status === status);
  }

  /** Check if all dependencies of a task are done */
  areDependenciesMet(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    return task.dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep?.status === 'done';
    });
  }

  /** Get a task by ID */
  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) ?? null;
  }

  /** Summary for reporting */
  getSummary(): string {
    const all = this.getAllTasks();
    const byStatus = {
      backlog: all.filter(t => t.status === 'backlog').length,
      ready: all.filter(t => t.status === 'ready').length,
      in_progress: all.filter(t => t.status === 'in_progress').length,
      review: all.filter(t => t.status === 'review').length,
      done: all.filter(t => t.status === 'done').length,
      blocked: all.filter(t => t.status === 'blocked').length,
    };
    return [
      `Task Board: ${all.length} total`,
      `  Backlog: ${byStatus.backlog} | Ready: ${byStatus.ready} | In Progress: ${byStatus.in_progress}`,
      `  Review: ${byStatus.review} | Done: ${byStatus.done} | Blocked: ${byStatus.blocked}`,
    ].join('\n');
  }
}
