import { afterEach, describe, expect, it, vi } from 'vitest'
import { tasksClient } from './tasksClient'

const originalEnv = import.meta.env

afterEach(() => {
  vi.restoreAllMocks()
  Object.assign(import.meta.env, originalEnv)
})

describe('tasksClient', () => {
  it('getTasks unwraps success payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: [{ id: 1, title: 'a', completed: false }],
        }),
      }),
    )

    const tasks = await tasksClient.getTasks()
    expect(tasks).toEqual([{ id: 1, title: 'a', completed: false }])
    expect(fetch).toHaveBeenCalledWith('/api/tasks', expect.any(Object))
  })

  it('createTask sends JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: { id: 2, title: 'new', completed: false },
        }),
      }),
    )

    const created = await tasksClient.createTask({ title: 'new' })
    expect(created.id).toBe(2)
    expect(fetch).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'new' }),
      }),
    )
  })

  it('throws TasksApiError on API failure body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: [] },
        }),
      }),
    )

    await expect(tasksClient.getTasks()).rejects.toMatchObject({
      name: 'TasksApiError',
      status: 400,
      code: 'VALIDATION_ERROR',
    })
  })
})
