import { apiClient, USE_MOCK } from '../api-client';

export type TodoPriority = 'low' | 'medium' | 'high';
export type NoteColor = 'slate' | 'amber' | 'green' | 'blue' | 'purple' | 'rose';

export interface PersonalTodo {
  id: number;
  title: string;
  description: string | null;
  priority: TodoPriority;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalTodoInput {
  title: string;
  description?: string | null;
  priority: TodoPriority;
  due_at?: string | null;
}

export interface PersonalNote {
  id: number;
  title: string;
  content: string;
  color: NoteColor;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalNoteInput {
  title: string;
  content: string;
  color: NoteColor;
  is_pinned: boolean;
}

const mockTodos: PersonalTodo[] = [];
const mockNotes: PersonalNote[] = [];

export const personalProductivityApi = {
  async listTodos(): Promise<PersonalTodo[]> {
    if (USE_MOCK) return [...mockTodos];
    const response = await apiClient.get<{ todos: PersonalTodo[] }>('/personal/todos', undefined, false);
    return response.todos;
  },

  async createTodo(payload: PersonalTodoInput): Promise<PersonalTodo> {
    if (USE_MOCK) {
      const now = new Date().toISOString();
      const item = { ...payload, description: payload.description ?? null, due_at: payload.due_at ?? null, id: Date.now(), completed_at: null, created_at: now, updated_at: now };
      mockTodos.unshift(item);
      return item;
    }
    return apiClient.post<PersonalTodo>('/personal/todos', payload, false);
  },

  async updateTodo(id: number, payload: PersonalTodoInput): Promise<PersonalTodo> {
    if (USE_MOCK) {
      const index = mockTodos.findIndex(item => item.id === id);
      mockTodos[index] = { ...mockTodos[index], ...payload, updated_at: new Date().toISOString() };
      return mockTodos[index];
    }
    return apiClient.put<PersonalTodo>(`/personal/todos/${id}`, payload, false);
  },

  async completeTodo(id: number, completed: boolean): Promise<PersonalTodo> {
    if (USE_MOCK) {
      const item = mockTodos.find(todo => todo.id === id)!;
      item.completed_at = completed ? new Date().toISOString() : null;
      item.updated_at = new Date().toISOString();
      return item;
    }
    return apiClient.put<PersonalTodo>(`/personal/todos/${id}/complete`, { completed }, false);
  },

  async deleteTodo(id: number): Promise<void> {
    if (USE_MOCK) {
      const index = mockTodos.findIndex(item => item.id === id);
      if (index >= 0) mockTodos.splice(index, 1);
      return;
    }
    await apiClient.delete(`/personal/todos/${id}`, false);
  },

  async listNotes(): Promise<PersonalNote[]> {
    if (USE_MOCK) return [...mockNotes];
    const response = await apiClient.get<{ notes: PersonalNote[] }>('/personal/notes', undefined, false);
    return response.notes;
  },

  async createNote(payload: PersonalNoteInput): Promise<PersonalNote> {
    if (USE_MOCK) {
      const now = new Date().toISOString();
      const item = { ...payload, id: Date.now(), created_at: now, updated_at: now };
      mockNotes.unshift(item);
      return item;
    }
    return apiClient.post<PersonalNote>('/personal/notes', payload, false);
  },

  async updateNote(id: number, payload: PersonalNoteInput): Promise<PersonalNote> {
    if (USE_MOCK) {
      const index = mockNotes.findIndex(item => item.id === id);
      mockNotes[index] = { ...mockNotes[index], ...payload, updated_at: new Date().toISOString() };
      return mockNotes[index];
    }
    return apiClient.put<PersonalNote>(`/personal/notes/${id}`, payload, false);
  },

  async deleteNote(id: number): Promise<void> {
    if (USE_MOCK) {
      const index = mockNotes.findIndex(item => item.id === id);
      if (index >= 0) mockNotes.splice(index, 1);
      return;
    }
    await apiClient.delete(`/personal/notes/${id}`, false);
  },
};
