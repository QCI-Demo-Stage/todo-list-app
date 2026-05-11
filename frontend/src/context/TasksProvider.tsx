import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { tasksClient } from '../api/tasksClient'
import { TasksContext, type TasksContextValue } from './tasksContext'

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TasksContextValue['tasks']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await tasksClient.getTasks()
      setTasks(list)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load tasks'
      setError(message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void refreshTasks()
    })
  }, [refreshTasks])

  const value = useMemo(
    () => ({
      tasks,
      loading,
      error,
      refreshTasks,
    }),
    [tasks, loading, error, refreshTasks],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
