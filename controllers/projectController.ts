import { Request, Response } from 'express';
import { getDb } from '../server/mongodbConnector.js'; 

export const getProjects = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const projects = await db.collection('projects').find({}).toArray();
        res.status(200).json(projects);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message: errorMessage });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const users = await db.collection('users').find({}).toArray();
        res.status(200).json(users);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message: errorMessage });
    }
};

export const getProjectUsers = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const projectId = req.params.projectId;
        const projectUsers = await db.collection('project_users').find({ project_id: projectId }).toArray();
        res.status(200).json(projectUsers);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message: errorMessage });
    };
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const result = await db.collection('projects').insertOne(req.body);
        res.status(201).json({ 
            message: 'Project created successfully',
            projectId: result.insertedId 
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(400).json({ message: "Database Error", error: errorMessage });
    }
};

export const createFeature = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const result = await db.collection('features').insertOne(req.body);
        res.status(201).json({ 
            message: 'Feature created successfully',
            featureId: result.insertedId 
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(400).json({ message: "Database Error", error: errorMessage });
    }  
};
