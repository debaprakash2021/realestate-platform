const express = require('express');
const TaskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');
const { taskValidation } = require('../middlewares/validation');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.route('/')
  .post(taskValidation.create, TaskController.createTask)
  .get(TaskController.getTasks);

router.get('/stats', TaskController.getTaskStats);
router.get('/project/:projectId', TaskController.getProjectTasks);

router.route('/:id')
  .get(TaskController.getTask)
  .put(taskValidation.update, TaskController.updateTask)
  .delete(TaskController.deleteTask);

router.patch('/:id/status', taskValidation.updateStatus, TaskController.updateTaskStatus);

module.exports = router;
