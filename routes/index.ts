import express from 'express';
import { 
    getProjectMembers, 
    addProjectMember, 
    updateMemberRole, 
    removeProjectMember
} from '../controllers/teamController.js';

const router = express.Router();

// Team Management Routes
router.get('/projects/:id/members', getProjectMembers);
router.post('/projects/:id/members', addProjectMember);
router.put('/projects/:projectId/members/:userId', updateMemberRole);
router.delete('/projects/:projectId/members/:userId', removeProjectMember);

export default router;