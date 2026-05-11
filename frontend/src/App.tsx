import { AddTaskForm } from './components/AddTaskForm'
import { TaskList } from './components/TaskList'
import { TasksProvider } from './context/TasksProvider'
import './App.css'

function App() {
  return (
    <TasksProvider>
      <div className="app">
        <header className="app-header">
          <h1>Todo list</h1>
          <p className="tagline">Tasks stay in sync with the API.</p>
        </header>
        <main>
          <AddTaskForm />
          <TaskList />
        </main>
      </div>
    </TasksProvider>
  )
}

export default App
