const express = require('express');
const ProjectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/authMiddleware');
const { projectValidation } = require('../middlewares/validation');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.route('/')
  .post(projectValidation.create, ProjectController.createProject)
  .get(ProjectController.getProjects);

router.route('/:id')
  .get(ProjectController.getProject)
  .put(projectValidation.update, ProjectController.updateProject)
  .delete(ProjectController.deleteProject);

router.get('/:id/stats', ProjectController.getProjectStats);
router.post('/:id/members', ProjectController.addMember);
router.delete('/:id/members', ProjectController.removeMember);

module.exports = router;
