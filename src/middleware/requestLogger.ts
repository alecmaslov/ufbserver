import { Handler } from "express";

const requestLogger: Handler = (req, _res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    console.log("Headers:");
    console.log(req.headers);
    console.log(req.body);
    next();
};

export default requestLogger;