import { Router } from "express";
import { addLead,getBankLoanList,updateLead } from "../controllers/leadController.js";
const leadRouter = Router();

leadRouter.post("/addLead", addLead);
leadRouter.get("/getBankList",getBankLoanList);
leadRouter.patch("/editLead/:id",updateLead);

export default leadRouter;
