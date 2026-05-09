import { type FormEvent, useState } from 'react'
import { tasksClient, type Task } from '../api/tasksClient'
import { useTasks } from '../hooks/useTasks'

type Props = {
  task: Task
}

export function EditTaskModal({ task }: Props) {
  const { refreshTasks } = useTasks()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [completed, setCompleted] = useState(task.completed)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function openModal() {
    setTitle(task.title)
    setCompleted(task.completed)
    setFormError(null)
    setOpen(true)
  }

  function closeModal() {
    if (!saving) setOpen(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setFormError('Title is required')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await tasksClient.updateTask(task.id, { title: trimmed, completed })
      await refreshTasks()
      setOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not update task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button type="button" className="btn-secondary" onClick={openModal}>
        Edit
      </button>
      {open ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-task-${task.id}-title`}
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 id={`edit-task-${task.id}-title`}>Edit task</h2>
            <form onSubmit={(e) => void handleSubmit(e)}>
              <label htmlFor={`edit-title-${task.id}`}>Title</label>
              <input
                id={`edit-title-${task.id}`}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  disabled={saving}
                />
                Completed
              </label>
              {formError ? <p className="field-error" role="alert">{formError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
