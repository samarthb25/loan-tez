import jwt from "jsonwebtoken";
import { errorResponse } from "../helpers/successAndError.js";
import UserModel from "../models/userModel.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const authenticate = async (req, res, next) => {
  const token = req.header("Authorization") || req.header("authorization") || req.header("token");
  if (!token) {
    return res
      .status(401)
      .json(errorResponse(401, "Unauthorized - No token provided", null));
  }
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const userId = decoded.userId;
    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json(errorResponse(401, error.message));
  }
};
