import { Request, Response } from 'express';
import { getDb } from '../mongodbConnector.js'; 

export const getProjects = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const projects = await db.collection('projects').find({}).toArray();
        res.status(200).json(projects);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const result = await db.collection('projects').insertOne(req.body);
        res.status(201).json({ _id: result.insertedId, ...req.body });
    } catch (err: any) {
        res.status(400).json({ message: "Database Error", error: err.message });
    }
};
