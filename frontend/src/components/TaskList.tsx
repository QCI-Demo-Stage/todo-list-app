import { useTasks } from '../hooks/useTasks'
import { EditTaskModal } from './EditTaskModal'
import { DeleteTaskButton } from './DeleteTaskButton'

export function TaskList() {
  const { tasks, loading, error } = useTasks()

  if (loading && tasks.length === 0) {
    return <p className="tasks-status">Loading tasks…</p>
  }

  if (error) {
    return (
      <p className="tasks-status tasks-error" role="alert">
        {error}
      </p>
    )
  }

  if (tasks.length === 0) {
    return <p className="tasks-status">No tasks yet. Add one above.</p>
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-row">
          <span className={task.completed ? 'task-title done' : 'task-title'}>
            {task.title}
          </span>
          <div className="task-actions">
            <EditTaskModal task={task} />
            <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
          </div>
        </li>
      ))}
    </ul>
  )
}
