import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export function validate(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    // its okay to send the client these errors, since express validator makes
    // them generic to the implementation, but specific to what the client should do to fix them
    res.status(400).json({ errors: errors.array() });
}