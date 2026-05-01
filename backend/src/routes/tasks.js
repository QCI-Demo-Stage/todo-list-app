'use strict';

const express = require('express');
const Joi = require('joi');
const { ok, fail } = require('../utils/responses');
const tasksDb = require('../db/tasks');

const router = express.Router();

const createBodySchema = Joi.object({
  title: Joi.string().trim().min(1).max(500).required(),
  completed: Joi.boolean().optional().default(false),
});

const updateBodySchema = Joi.object({
  title: Joi.string().trim().min(1).max(500),
  completed: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'At least one of title or completed must be provided',
  });

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

function validationDetails(err) {
  return err.details.map((d) => ({
    path: d.path,
    message: d.message,
  }));
}

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return fail(res, 400, 'VALIDATION_ERROR', 'Invalid request body', validationDetails(error));
    }
    req.validatedBody = value;
    next();
  };
}

function parseIdParam(req, res, next) {
  const raw = req.params.id;
  const num = Number(raw);
  const { error, value } = idParamSchema.validate({ id: Number.isNaN(num) ? raw : num });
  if (error) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Invalid task id', validationDetails(error));
  }
  req.taskId = value.id;
  next();
}

router.get('/', async (req, res, next) => {
  try {
    const tasks = await tasksDb.listTasks();
    return ok(res, tasks);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', parseIdParam, async (req, res, next) => {
  try {
    const task = await tasksDb.getTaskById(req.taskId);
    if (!task) {
      return fail(res, 404, 'NOT_FOUND', 'Task not found');
    }
    return ok(res, task);
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(createBodySchema), async (req, res, next) => {
  try {
    const task = await tasksDb.createTask(req.validatedBody);
    return ok(res, task, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', parseIdParam, validateBody(updateBodySchema), async (req, res, next) => {
  try {
    const task = await tasksDb.updateTask(req.taskId, req.validatedBody);
    if (!task) {
      return fail(res, 404, 'NOT_FOUND', 'Task not found');
    }
    return ok(res, task);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', parseIdParam, async (req, res, next) => {
  try {
    const removed = await tasksDb.deleteTask(req.taskId);
    if (!removed) {
      return fail(res, 404, 'NOT_FOUND', 'Task not found');
    }
    return ok(res, { deleted: true, id: req.taskId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
