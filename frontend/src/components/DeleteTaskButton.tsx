import { useState } from 'react'
import { tasksClient } from '../api/tasksClient'
import { useTasks } from '../hooks/useTasks'

type Props = {
  taskId: number
  taskTitle: string
}

export function DeleteTaskButton({ taskId, taskTitle }: Props) {
  const { refreshTasks } = useTasks()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    const ok = window.confirm(`Delete “${taskTitle}”?`)
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      await tasksClient.deleteTask(taskId)
      await refreshTasks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete task')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="delete-task-wrap">
      <button
        type="button"
        className="btn-danger"
        onClick={() => void handleDelete()}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? 'Deleting…' : 'Delete'}
      </button>
      {error ? (
        <span className="inline-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
