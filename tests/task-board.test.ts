import { describe, it, expect } from 'vitest';
import { TaskBoard } from '../src/core/task-board.js';

describe('TaskBoard', () => {
  it('creates tasks with unique IDs and backlog status', () => {
    const board = new TaskBoard();
    const task = board.createTask({
      title: 'Build auth system',
      description: 'Implement Supabase auth',
      priority: 'high',
      assignedTo: 'developer',
      createdBy: 'cto',
    });

    expect(task.id).toBeDefined();
    expect(task.status).toBe('backlog');
    expect(task.title).toBe('Build auth system');
    expect(task.assignedTo).toBe('developer');
    expect(task.createdBy).toBe('cto');
    expect(task.subtasks).toHaveLength(0);
  });

  it('updates task status', () => {
    const board = new TaskBoard();
    const task = board.createTask({
      title: 'Task',
      description: 'Desc',
      priority: 'medium',
      assignedTo: 'developer',
      createdBy: 'ceo',
    });

    const updated = board.updateStatus(task.id, 'in_progress');
    expect(updated?.status).toBe('in_progress');

    const done = board.updateStatus(task.id, 'done');
    expect(done?.status).toBe('done');
    expect(done?.completedAt).toBeDefined();
  });

  it('returns null when updating non-existent task', () => {
    const board = new TaskBoard();
    expect(board.updateStatus('fake-id', 'done')).toBeNull();
  });

  it('sets task output', () => {
    const board = new TaskBoard();
    const task = board.createTask({
      title: 'Task',
      description: 'Desc',
      priority: 'low',
      assignedTo: 'cto',
      createdBy: 'ceo',
    });

    board.setOutput(task.id, 'Generated architecture doc');
    const retrieved = board.getTask(task.id);
    expect(retrieved?.output).toBe('Generated architecture doc');
  });

  it('manages subtasks', () => {
    const board = new TaskBoard();
    const task = board.createTask({
      title: 'Parent',
      description: 'Desc',
      priority: 'high',
      assignedTo: 'developer',
      createdBy: 'cto',
    });

    const sub = board.addSubtask(task.id, 'Setup database');
    expect(sub).not.toBeNull();
    expect(sub!.status).toBe('backlog');

    board.updateSubtask(task.id, sub!.id, 'done', 'Tables created');
    const updated = board.getTask(task.id);
    const updatedSub = updated?.subtasks.find(s => s.id === sub!.id);
    expect(updatedSub?.status).toBe('done');
    expect(updatedSub?.output).toBe('Tables created');
  });

  it('returns null when adding subtask to non-existent task', () => {
    const board = new TaskBoard();
    expect(board.addSubtask('fake', 'sub')).toBeNull();
  });

  it('filters tasks by agent', () => {
    const board = new TaskBoard();
    board.createTask({ title: 'T1', description: 'D', priority: 'high', assignedTo: 'developer', createdBy: 'ceo' });
    board.createTask({ title: 'T2', description: 'D', priority: 'medium', assignedTo: 'cto', createdBy: 'ceo' });
    board.createTask({ title: 'T3', description: 'D', priority: 'low', assignedTo: 'developer', createdBy: 'cto' });

    expect(board.getTasksFor('developer')).toHaveLength(2);
    expect(board.getTasksFor('cto')).toHaveLength(1);
    expect(board.getTasksFor('marketing')).toHaveLength(0);
  });

  it('filters tasks by status', () => {
    const board = new TaskBoard();
    const t1 = board.createTask({ title: 'T1', description: 'D', priority: 'high', assignedTo: 'developer', createdBy: 'ceo' });
    const t2 = board.createTask({ title: 'T2', description: 'D', priority: 'medium', assignedTo: 'cto', createdBy: 'ceo' });
    board.createTask({ title: 'T3', description: 'D', priority: 'low', assignedTo: 'developer', createdBy: 'cto' });

    board.updateStatus(t1.id, 'in_progress');
    board.updateStatus(t2.id, 'done');

    expect(board.getTasksByStatus('backlog')).toHaveLength(1);
    expect(board.getTasksByStatus('in_progress')).toHaveLength(1);
    expect(board.getTasksByStatus('done')).toHaveLength(1);
  });

  it('checks dependency resolution', () => {
    const board = new TaskBoard();
    const dep1 = board.createTask({ title: 'Dep1', description: 'D', priority: 'high', assignedTo: 'cto', createdBy: 'ceo' });
    const dep2 = board.createTask({ title: 'Dep2', description: 'D', priority: 'high', assignedTo: 'developer', createdBy: 'ceo' });
    const main = board.createTask({
      title: 'Main',
      description: 'D',
      priority: 'high',
      assignedTo: 'developer',
      createdBy: 'ceo',
      dependencies: [dep1.id, dep2.id],
    });

    expect(board.areDependenciesMet(main.id)).toBe(false);

    board.updateStatus(dep1.id, 'done');
    expect(board.areDependenciesMet(main.id)).toBe(false);

    board.updateStatus(dep2.id, 'done');
    expect(board.areDependenciesMet(main.id)).toBe(true);
  });

  it('generates summary', () => {
    const board = new TaskBoard();
    board.createTask({ title: 'T1', description: 'D', priority: 'high', assignedTo: 'developer', createdBy: 'ceo' });
    const t2 = board.createTask({ title: 'T2', description: 'D', priority: 'medium', assignedTo: 'cto', createdBy: 'ceo' });
    board.updateStatus(t2.id, 'done');

    const summary = board.getSummary();
    expect(summary).toContain('2 total');
    expect(summary).toContain('Done: 1');
  });
});
