import { useContext } from 'react'
import { TasksContext } from '../context/tasksContext'

/** Task list state; must be used inside `TasksProvider`. */
export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) {
    throw new Error('useTasks must be used within TasksProvider')
  }
  return ctx
}
