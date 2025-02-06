import express from "express";
import {
    getModules
} from "../controllers/modulesController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { checkRole } from "../middlewares/authorization.js";

const moduleRouter = express.Router();

moduleRouter.get(
  "/getModules",
  authenticate,
  checkRole(["superAdmin","Admin"]),
  getModules
);

export default moduleRouter;
