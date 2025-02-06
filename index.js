import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import morgan from "morgan";
import connectToDatabase from "./src/configs/db.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./src/middlewares/swagger.js";
import adminRouter from "./src/routes/adminRoutes.js";
import leadRouter from "./src/routes/leadRoutes.js";
import moduleRouter from "./src/routes/modulesRouter.js";
import { errorResponse } from "./src/helpers/successAndError.js"; 

const app = express();
const PORT = process.env.PORT || 1111;
app.use(
  cors({
    allowedHeaders: ["Content-Type", "token", "authorization"],
    exposedHeaders: ["token", "authorization"],
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
  })
);

app.use(express.json({ limit: "50mb" }));
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: "Too many requests, please try again after some time.",
});

app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
const dailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1500,
  message: "Daily request limit exceeded, please try again tomorrow.",
});
app.use("/gemini", limiter);
app.use("/gemini", dailyLimiter);

app.get("/", async (req, res) => {
  try {
    res.status(200).json({
      success: "Hello from the server",
      message: "Server is running perfectly fine",
    });
  } catch (error) {
    res.status(500).json(
      errorResponse(500, "Internal server error at home route", error.message)
    );
  }
});

import "./src/models/userModel.js";
import "./src/models/leadModel.js";
import "./src/models/modules.js"

app.use("/", adminRouter);
app.use("/", leadRouter);
app.use("/", moduleRouter);

app.use("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, async () => {
  try {
    await connectToDatabase();
    console.log({ message: `Server is listening on port ${PORT}` });
  } catch (error) {
    console.log(error.message);
  }
});
