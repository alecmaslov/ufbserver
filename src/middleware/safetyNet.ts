import { Handler, Request, Response, NextFunction } from "express";

export const safetyNet = (handler: Handler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            console.error(error);
            res.set(500).send("Internal Server Error");
        }
    }
}