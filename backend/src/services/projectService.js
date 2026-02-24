const Project = require('../models/Project');
const Task = require('../models/Task');
const logger = require('../utils/logger');

class ProjectService {
  // Create new project
  static async createProject(projectData, userId) {
    try {
      const project = await Project.create({
        ...projectData,
        owner: userId,
        members: [userId] // Owner is automatically a member
      });

      await project.populate('owner members', 'name email avatar');

      logger.info(`Project created: ${project.name} by user: ${userId}`);
      return project;
    } catch (error) {
      logger.error(`Create project error: ${error.message}`);
      throw error;
    }
  }

  // Get all projects for user (owned or member)
  static async getUserProjects(userId, query = {}) {
    try {
      const { page = 1, limit = 10, status, search } = query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build filter
      const filter = {
        $or: [
          { owner: userId },
          { members: userId }
        ]
      };

      if (status) {
        filter.status = status;
      }

      if (search) {
        filter.$and = [
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }
        ];
      }

      const projects = await Project.find(filter)
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Project.countDocuments(filter);

      return {
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      };
    } catch (error) {
      logger.error(`Get user projects error: ${error.message}`);
      throw error;
    }
  }

  // Get single project
  static async getProjectById(projectId, userId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        $or: [
          { owner: userId },
          { members: userId }
        ]
      })
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar');

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      return project;
    } catch (error) {
      logger.error(`Get project error: ${error.message}`);
      throw error;
    }
  }

  // Update project
  static async updateProject(projectId, userId, updateData) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId
      });

      if (!project) {
        throw new Error('Project not found or not authorized');
      }

      const allowedUpdates = ['name', 'description', 'status', 'priority', 'endDate'];
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          project[key] = updateData[key];
        }
      });

      await project.save();
      await project.populate('owner members', 'name email avatar');

      logger.info(`Project updated: ${project.name}`);
      return project;
    } catch (error) {
      logger.error(`Update project error: ${error.message}`);
      throw error;
    }
  }

  // Delete project
  static async deleteProject(projectId, userId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId
      });

      if (!project) {
        throw new Error('Project not found or not authorized');
      }

      // Delete all tasks associated with project
      await Task.deleteMany({ project: projectId });

      await project.deleteOne();

      logger.info(`Project deleted: ${project.name}`);
      return { message: 'Project deleted successfully' };
    } catch (error) {
      logger.error(`Delete project error: ${error.message}`);
      throw error;
    }
  }

  // Add member to project
  static async addMember(projectId, ownerId, memberId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: ownerId
      });

      if (!project) {
        throw new Error('Project not found or not authorized');
      }

      // Check if member already exists
      if (project.members.includes(memberId)) {
        throw new Error('User is already a member of this project');
      }

      project.members.push(memberId);
      await project.save();
      await project.populate('members', 'name email avatar');

      logger.info(`Member added to project: ${project.name}`);
      return project;
    } catch (error) {
      logger.error(`Add member error: ${error.message}`);
      throw error;
    }
  }

  // Remove member from project
  static async removeMember(projectId, ownerId, memberId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: ownerId
      });

      if (!project) {
        throw new Error('Project not found or not authorized');
      }

      project.members = project.members.filter(
        member => member.toString() !== memberId
      );

      await project.save();

      logger.info(`Member removed from project: ${project.name}`);
      return project;
    } catch (error) {
      logger.error(`Remove member error: ${error.message}`);
      throw error;
    }
  }

  // Get project statistics
  static async getProjectStats(projectId, userId) {
    try {
      const project = await this.getProjectById(projectId, userId);

      const taskStats = await Task.aggregate([
        { $match: { project: project._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalTasks = await Task.countDocuments({ project: projectId });

      return {
        project: {
          id: project._id,
          name: project.name,
          status: project.status
        },
        stats: {
          total: totalTasks,
          todo: taskStats.find(s => s._id === 'todo')?.count || 0,
          inProgress: taskStats.find(s => s._id === 'in-progress')?.count || 0,
          done: taskStats.find(s => s._id === 'done')?.count || 0
        }
      };
    } catch (error) {
      logger.error(`Get project stats error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ProjectService;
