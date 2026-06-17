import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateRouter from "./generate";
import meetingsRouter from "./meetings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generateRouter);
router.use(meetingsRouter);

export default router;
