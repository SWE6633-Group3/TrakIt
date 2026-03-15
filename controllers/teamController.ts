import { Request, Response } from 'express';
import { getDb } from '../server/sqliteConnector.js';

/** Create: Add a member to the project by email */
export const addProjectMember = async (req: Request, res: Response) => {
    const projectId = Number(req.params.id); 
    const { email, role } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const db = getDb();

        // 1. Look up the user by email to get their ID
        const user = await db.get<{ id: number }>(
            'SELECT id FROM users WHERE email = ?',
            email
        );

        if (!user) {
            // Matches the "user not found" message in your UI screenshot
            return res.status(404).json({ error: 'user not found' });
        }

        // 2. Insert into project_users
        await db.run(
            'INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?)',
            projectId, 
            user.id, 
            role || 'Member'
        );

        res.status(201).json({ message: 'Member added successfully' });
    } catch (error: any) {
        console.error('Error adding member:', error);
        
        // Specific check for existing members (preventing duplicates)
        if (error.message?.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'User is already a member of this project' });
        }
        
        res.status(500).json({ error: 'Failed to add member' });
    }
};

/** Read: Get a list of members for a specific project */
export const getProjectMembers = async (req: Request, res: Response) => {
    const projectId = Number(req.params.id); 
    try {
        const db = getDb();
        const members = await db.all(
            `SELECT u.id, u.name, u.email, pu.role 
             FROM project_users pu 
             JOIN users u ON pu.user_id = u.id 
             WHERE pu.project_id = ?
             ORDER BY u.name ASC`,
            projectId
        );
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
};

/** Update: Change a member's role */
export const updateMemberRole = async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    try {
        const db = getDb();
        await db.run(
            'UPDATE project_users SET role = ? WHERE project_id = ? AND user_id = ?',
            role, 
            Number(projectId), 
            Number(userId)
        );
        res.json({ message: 'Member updated successfully' });
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: 'Failed to update member' });
    }
};

/** Delete: Remove a member from the project */
export const removeProjectMember = async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;

    try {
        const db = getDb();
        await db.run(
            'DELETE FROM project_users WHERE project_id = ? AND user_id = ?',
            Number(projectId), 
            Number(userId)
        );
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
};