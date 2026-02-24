const Task = require('../models/Task');
const Project = require('../models/Project');
const logger = require('../utils/logger');

class TaskService {
  // Create new task
  static async createTask(taskData, userId) {
    try {
      // Verify user has access to project
      const project = await Project.findOne({
        _id: taskData.project,
        $or: [
          { owner: userId },
          { members: userId }
        ]
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const task = await Task.create({
        ...taskData,
        createdBy: userId
      });

      await task.populate([
        { path: 'assignedTo', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email avatar' },
        { path: 'project', select: 'name' }
      ]);

      logger.info(`Task created: ${task.title} in project: ${project.name}`);
      return task;
    } catch (error) {
      logger.error(`Create task error: ${error.message}`);
      throw error;
    }
  }

  // Get all tasks for user
  static async getUserTasks(userId, query = {}) {
    try {
      const { page = 1, limit = 10, status, priority, projectId, assignedToMe } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build filter
      const filter = {};

      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (projectId) filter.project = projectId;
      if (assignedToMe === 'true') filter.assignedTo = userId;

      // Get projects user has access to
      const userProjects = await Project.find({
        $or: [
          { owner: userId },
          { members: userId }
        ]
      }).select('_id');

      const projectIds = userProjects.map(p => p._id);

      if (!filter.project) {
        filter.project = { $in: projectIds };
      } else {
        // Verify user has access to specified project
        if (!projectIds.some(id => id.toString() === filter.project)) {
          throw new Error('Access denied to this project');
        }
      }

      const tasks = await Task.find(filter)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Task.countDocuments(filter);

      return {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      };
    } catch (error) {
      logger.error(`Get user tasks error: ${error.message}`);
      throw error;
    }
  }

  // Get tasks by project
  static async getProjectTasks(projectId, userId, query = {}) {
    try {
      // Verify access
      const project = await Project.findOne({
        _id: projectId,
        $or: [
          { owner: userId },
          { members: userId }
        ]
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const { status, priority, page = 1, limit = 10 } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = { project: projectId };
      if (status) filter.status = status;
      if (priority) filter.priority = priority;

      const tasks = await Task.find(filter)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Task.countDocuments(filter);

      return {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      };
    } catch (error) {
      logger.error(`Get project tasks error: ${error.message}`);
      throw error;
    }
  }

  // Get single task
  static async getTaskById(taskId, userId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('project', 'name owner members');

      if (!task) {
        throw new Error('Task not found');
      }

      // Verify user has access to the project
      const project = task.project;
      const hasAccess = project.owner.toString() === userId || 
                       project.members.some(m => m.toString() === userId);

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      return task;
    } catch (error) {
      logger.error(`Get task error: ${error.message}`);
      throw error;
    }
  }

  // Update task
  static async updateTask(taskId, userId, updateData) {
    try {
      const task = await Task.findById(taskId).populate('project');

      if (!task) {
        throw new Error('Task not found');
      }

      // Verify access
      const project = await Project.findById(task.project);
      const hasAccess = project.owner.toString() === userId || 
                       project.members.some(m => m.toString() === userId);

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo'];
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          task[key] = updateData[key];
        }
      });

      await task.save();
      await task.populate([
        { path: 'assignedTo', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email avatar' },
        { path: 'project', select: 'name' }
      ]);

      logger.info(`Task updated: ${task.title}`);
      return task;
    } catch (error) {
      logger.error(`Update task error: ${error.message}`);
      throw error;
    }
  }

  // Update task status
  static async updateTaskStatus(taskId, userId, status) {
    try {
      const task = await Task.findById(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      // Verify access
      const project = await Project.findById(task.project);
      const hasAccess = project.owner.toString() === userId || 
                       project.members.some(m => m.toString() === userId);

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      task.status = status;
      await task.save();

      logger.info(`Task status updated: ${task.title} -> ${status}`);
      return task;
    } catch (error) {
      logger.error(`Update task status error: ${error.message}`);
      throw error;
    }
  }

  // Delete task
  static async deleteTask(taskId, userId) {
    try {
      const task = await Task.findById(taskId).populate('project');

      if (!task) {
        throw new Error('Task not found');
      }

      // Only project owner or task creator can delete
      const project = await Project.findById(task.project);
      const canDelete = project.owner.toString() === userId || 
                       task.createdBy.toString() === userId;

      if (!canDelete) {
        throw new Error('Not authorized to delete this task');
      }

      await task.deleteOne();

      logger.info(`Task deleted: ${task.title}`);
      return { message: 'Task deleted successfully' };
    } catch (error) {
      logger.error(`Delete task error: ${error.message}`);
      throw error;
    }
  }

  // Get task statistics for user
  static async getTaskStats(userId) {
    try {
      // Get projects user has access to
      const userProjects = await Project.find({
        $or: [
          { owner: userId },
          { members: userId }
        ]
      }).select('_id');

      const projectIds = userProjects.map(p => p._id);

      const stats = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const priorityStats = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await Task.countDocuments({ project: { $in: projectIds } });

      return {
        total,
        byStatus: {
          todo: stats.find(s => s._id === 'todo')?.count || 0,
          inProgress: stats.find(s => s._id === 'in-progress')?.count || 0,
          done: stats.find(s => s._id === 'done')?.count || 0
        },
        byPriority: {
          low: priorityStats.find(s => s._id === 'low')?.count || 0,
          medium: priorityStats.find(s => s._id === 'medium')?.count || 0,
          high: priorityStats.find(s => s._id === 'high')?.count || 0
        }
      };
    } catch (error) {
      logger.error(`Get task stats error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TaskService;
