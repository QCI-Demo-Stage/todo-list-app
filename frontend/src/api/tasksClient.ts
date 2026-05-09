export type Task = {
  id: number
  title: string
  completed: boolean
  created_at?: string
  updated_at?: string
}

type ApiSuccess<T> = { success: true; data: T }
type ApiFailure = {
  success: false
  error: { code: string; message: string; details?: unknown }
}

export class TasksApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'TasksApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw === undefined || raw === '') return ''
  return raw.replace(/\/$/, '')
}

async function readBody(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      return await res.json()
    } catch {
      return null
    }
  }
  return res.text()
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase()}${path}`
  const headers = new Headers(init?.headers)
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...init, headers })
  const body = await readBody(res)

  if (!res.ok) {
    const fail = body as ApiFailure
    const err =
      fail && typeof fail === 'object' && 'success' in fail && fail.success === false
        ? fail.error
        : undefined
    throw new TasksApiError(
      res.status,
      err?.code ?? 'ERROR',
      err?.message ?? res.statusText,
      err?.details,
    )
  }

  const ok = body as ApiSuccess<T>
  if (!ok || typeof ok !== 'object' || !('success' in ok) || ok.success !== true) {
    throw new TasksApiError(res.status, 'ERROR', 'Unexpected response shape')
  }
  return ok.data
}

export type CreateTaskInput = { title: string; completed?: boolean }
export type UpdateTaskInput = { title?: string; completed?: boolean }

export const tasksClient = {
  getTasks: (): Promise<Task[]> => request<Task[]>('/api/tasks'),

  getTaskById: (id: number): Promise<Task> => request<Task>(`/api/tasks/${id}`),

  createTask: (body: CreateTaskInput): Promise<Task> =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateTask: (id: number, body: UpdateTaskInput): Promise<Task> =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteTask: (id: number): Promise<{ deleted: boolean; id: number }> =>
    request<{ deleted: boolean; id: number }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),
}
