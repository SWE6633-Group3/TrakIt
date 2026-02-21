import express from 'express';
import { getHealth } from '../controllers/healthController.js';
import { getProjects, createProject } from '../controllers/projectController.js';

const router = express.Router();

router.get('/health', getHealth);
router.get('/projects', getProjects);
router.post('/projects', createProject);

export default router;
