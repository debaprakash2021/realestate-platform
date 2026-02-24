const ProjectService = require('../services/projectService');
const ResponseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

class ProjectController {
  // Create project
  static async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }

      const project = await ProjectService.createProject(req.body, req.user.id);
      return ResponseHandler.success(res, project, 'Project created successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Get all user projects
  static async getProjects(req, res) {
    try {
      const result = await ProjectService.getUserProjects(req.user.id, req.query);
      return ResponseHandler.paginated(res, result.projects, result.pagination);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // Get single project
  static async getProject(req, res) {
    try {
      const project = await ProjectService.getProjectById(req.params.id, req.user.id);
      return ResponseHandler.success(res, project);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }

  // Update project
  static async updateProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }

      const project = await ProjectService.updateProject(req.params.id, req.user.id, req.body);
      return ResponseHandler.success(res, project, 'Project updated successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Delete project
  static async deleteProject(req, res) {
    try {
      const result = await ProjectService.deleteProject(req.params.id, req.user.id);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Add member
  static async addMember(req, res) {
    try {
      const { userId } = req.body;
      const project = await ProjectService.addMember(req.params.id, req.user.id, userId);
      return ResponseHandler.success(res, project, 'Member added successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Remove member
  static async removeMember(req, res) {
    try {
      const { userId } = req.body;
      const project = await ProjectService.removeMember(req.params.id, req.user.id, userId);
      return ResponseHandler.success(res, project, 'Member removed successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Get project stats
  static async getProjectStats(req, res) {
    try {
      const stats = await ProjectService.getProjectStats(req.params.id, req.user.id);
      return ResponseHandler.success(res, stats);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }
}

module.exports = ProjectController;
