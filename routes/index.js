const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const projectController = require('../controllers/projectController'); 

router.get('/health', healthController.getHealth);
router.get('/projects', projectController.getProjects);
router.post('/projects', projectController.createProject);

module.exports = router;