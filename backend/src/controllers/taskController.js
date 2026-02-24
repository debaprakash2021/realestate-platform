const TaskService = require('../services/taskService');
const ResponseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

class TaskController {
  // Create task
  static async createTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }

      const task = await TaskService.createTask(req.body, req.user.id);
      return ResponseHandler.success(res, task, 'Task created successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Get all tasks
  static async getTasks(req, res) {
    try {
      const result = await TaskService.getUserTasks(req.user.id, req.query);
      return ResponseHandler.paginated(res, result.tasks, result.pagination);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // Get project tasks
  static async getProjectTasks(req, res) {
    try {
      const result = await TaskService.getProjectTasks(req.params.projectId, req.user.id, req.query);
      return ResponseHandler.paginated(res, result.tasks, result.pagination);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }

  // Get single task
  static async getTask(req, res) {
    try {
      const task = await TaskService.getTaskById(req.params.id, req.user.id);
      return ResponseHandler.success(res, task);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }

  // Update task
  static async updateTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }

      const task = await TaskService.updateTask(req.params.id, req.user.id, req.body);
      return ResponseHandler.success(res, task, 'Task updated successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Update task status
  static async updateTaskStatus(req, res) {
    try {
      const { status } = req.body;
      const task = await TaskService.updateTaskStatus(req.params.id, req.user.id, status);
      return ResponseHandler.success(res, task, 'Task status updated successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Delete task
  static async deleteTask(req, res) {
    try {
      const result = await TaskService.deleteTask(req.params.id, req.user.id);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Get task stats
  static async getTaskStats(req, res) {
    try {
      const stats = await TaskService.getTaskStats(req.user.id);
      return ResponseHandler.success(res, stats);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = TaskController;
