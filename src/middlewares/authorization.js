import { errorResponse } from "../helpers/successAndError.js";
import UserModel from "../models/userModel.js";

const checkRole = (role) => {
  return async (req, res, next) => {
    const user = await UserModel.findById(req.userId);
    req.user = user;

    if (req.user && role.includes(req.user.role)) {
      return next();
    } else {
      return res
        .status(404)
        .json(
          errorResponse(
            404,
            "You are not authorized."
          )
        );
    }
  };
};

export { checkRole };
