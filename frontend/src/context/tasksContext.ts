import { createContext } from 'react'
import type { Task } from '../api/tasksClient'

export type TasksContextValue = {
  tasks: Task[]
  loading: boolean
  error: string | null
  refreshTasks: () => Promise<void>
}

export const TasksContext = createContext<TasksContextValue | null>(null)
