import { Handler, Request, Response, NextFunction } from "express";

export const safetyNet = (handler: Handler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            console.error(error);
            // @kyle: ISSUE - The response somehow still sends back a 200, but with the message "Internal Server Error"
            return res.set(500).send("Internal Server Error");
        }
    }
}