import express from "express";
import {
  AdminCreate,
  getAllAdmins,
  deleteAdmin,
  updateAdmin,
  SuperAdminLogin,
  salesPersonCreate,
  updateSalesPerson,
  getAdmin,
  getProfile,
  getAllSalesperson,
  uploadImage,
  deleteSalesPerson,
  getSalesPerson,
  blockUnblock
} from "../controllers/adminController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { checkRole } from "../middlewares/authorization.js";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

const adminRouter = express.Router();

adminRouter.post("/superAdminLogin", SuperAdminLogin);
adminRouter.get(
  "/getAllAdmins",
  authenticate,
  checkRole(["superAdmin"]),
  getAllAdmins
);

adminRouter.post(
  "/AdminCreate",
  authenticate,
  checkRole(["superAdmin"]),
  AdminCreate
);

adminRouter.delete(
  "/deleteAdmin/:id",
  authenticate,
  checkRole(["superAdmin"]),
  deleteAdmin
);
adminRouter.get(
  "/getProfile",
  authenticate,
  checkRole(["superAdmin", "Admin", "Salesperson"]),
  getProfile
);
adminRouter.patch(
  "/blockUnblock/:id",
  authenticate,
  checkRole(["superAdmin", "Admin"]),
  blockUnblock
);
adminRouter.get(
  "/getAdmin/:id",
  authenticate,
  checkRole(["superAdmin"]),
  getAdmin
);
adminRouter.put(
  "/updateAdmin/:id",
  authenticate,
  checkRole(["superAdmin"]),
  updateAdmin
);

adminRouter.post(
  "/salesPersonCreate",
  authenticate,
  checkRole(["superAdmin", "Admin"]),
  salesPersonCreate
);

adminRouter.put(
  "/updateSalesPerson/:id",
  authenticate,
  checkRole(["superAdmin", "Admin"]),
  updateSalesPerson
);

adminRouter.get(
  "/getAllSalesperson",
  authenticate,
  checkRole(["superAdmin", "Admin"]),
  getAllSalesperson
);

adminRouter.delete(
  "/deleteSalesPerson/:id",
  authenticate,
  checkRole(["superAdmin","Admin"]),
  deleteSalesPerson
);

adminRouter.get(
  "/getSalesPerson/:id",
  authenticate,
  checkRole(["superAdmin","Admin"]),
  getSalesPerson
);


adminRouter.post("/uploadImage", upload.single("image"), uploadImage);
export default adminRouter;
