import { type FormEvent, useState } from 'react'
import { tasksClient } from '../api/tasksClient'
import { useTasks } from '../hooks/useTasks'

export function AddTaskForm() {
  const { refreshTasks } = useTasks()
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setFormError('Title is required')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await tasksClient.createTask({ title: trimmed })
      setTitle('')
      await refreshTasks()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="add-task-form" onSubmit={(e) => void handleSubmit(e)}>
      <label htmlFor="new-task-title">New task</label>
      <div className="add-task-row">
        <input
          id="new-task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          disabled={submitting}
          autoComplete="off"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add'}
        </button>
      </div>
      {formError ? <p className="field-error" role="alert">{formError}</p> : null}
    </form>
  )
}
