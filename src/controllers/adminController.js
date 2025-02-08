import { successResponse, errorResponse } from "../helpers/successAndError.js";
import UserModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadToS3 } from "../utility/s3uploder.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

/**
 * @swagger
 * /superAdminLogin:
 *   post:
 *     summary: Login as Super Admin
 *     description: Authenticate a super admin with email and password and get a JWT token.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/adminLogin'
 *     responses:
 *       '200':
 *         description: Successfully authenticated
 *       '400':
 *         description: Bad Request - Missing or invalid credentials
 *       '500':
 *         description: Internal Server Error
 */
export const SuperAdminLogin = async (req, res) => {
  const validationSchema = Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required(),
  });

  try {
    const validatedBody = await validationSchema.validateAsync(req.body);
    const { identifier, password } = validatedBody;

    if (!identifier || !password) {
      return res
        .status(400)
        .json(errorResponse(400, "All fields are required"));
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    const query = isEmail
      ? { email: identifier }
      : { phoneNumber: Number(identifier) };

    const superAdmin = await UserModel.findOne({
      ...query,
      role: { $in: ["Admin", "superAdmin", "Salesperson"] },
    });

    if (!superAdmin) {
      return res
        .status(400)
        .json(errorResponse(400, "Email/Phone or password is incorrect"));
    }
    if (superAdmin.status === "block") {
      return res
        .status(400)
        .json(
          errorResponse(400, "Your account is blocked. Please contact support.")
        );
    }
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);

    if (!isPasswordValid) {
      return res
        .status(400)
        .json(errorResponse(400, "Email/Phone or password is incorrect"));
    }
    const token = jwt.sign({ userId: superAdmin._id }, ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json(
      successResponse(200, "Login successful", {
        token,
      })
    );
  } catch (error) {
    console.error("Error logging in super admin:", error);
    res.status(500).json(errorResponse(500, error.message, error));
  }
};

/**
 * @swagger
 * /AdminCreate:
 *   post:
 *     summary: Create a new admin user
 *     tags:
 *       - Admin
 *     description: This endpoint allows the creation of a new admin user. Requires a valid super admin authentication token.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phoneNumber
 *               - profileImage
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the new admin user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the new admin user
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the new admin user
 *               phoneNumber:
 *                 type: number
 *                 format: phoneNumber
 *                 description: phoneNumber for the new admin user
 *               profileImage:
 *                 type: string
 *                 description: profileImage for the new admin user
 *     responses:
 *       '201':
 *         description: Admin user created successfully
 *       '400':
 *         description: Bad Request - Missing or invalid fields, or email already in use
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const AdminCreate = async (req, res) => {
  const validationSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.number().min(10).required(),
    profileImage: Joi.string().required(),
  });

  try {
    const validatedBody = await validationSchema.validateAsync(req.body);
    const { name, email, password, phoneNumber, profileImage } = validatedBody;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json(errorResponse(400, "Email is already in use."));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new UserModel({
      name,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      profileImage,
      role: "Admin",
      paymentDone: true,
      modules: [
        {
          name: "Loan Service",
          title: "loanService",
          hasAccess: true,
          submodules: [
            {
              name: "Personal Loan",
              title: "personalLoan",
              hasAccess: true,
              submodules: [
                {
                  name: "Home Loan",
                  title: "homeLoan",
                  hasAccess: true,
                  submodules: [],
                },
                {
                  name: "Loan Against Property  / Mortgage loan",
                  title: "loanAgainstProperty",
                  hasAccess: true,
                  submodules: [],
                },
                {
                  name: "Commercial property loan",
                  title: "commercialPropertyLoan",
                  hasAccess: true,
                  submodules: [],
                },
              ],
            },
            {
              name: "Business Loan",
              title: "businessLoan",
              hasAccess: true,
              submodules: [],
            },
            {
              name: "Takeover",
              title: "takeover",
              hasAccess: true,
              submodules: [
                {
                  name: "Personal",
                  title: "personal",
                  hasAccess: true,
                  submodules: [
                    {
                      name: "HL",
                      title: "hl",
                      hasAccess: true,
                      submodules: [],
                    },
                    {
                      name: "LAP / Mortgage loan",
                      title: "lap",
                      hasAccess: true,
                      submodules: [],
                    },
                  ],
                },
                {
                  name: "Takeover",
                  title: "takeover",
                  hasAccess: true,
                  submodules: [],
                },
              ],
            },
          ],
        },
        {
          name: "Financial analysis services",
          title: "financialAnalysisServices",
          hasAccess: true,
          submodules: [
            {
              name: "Interest rate calculator",
              title: "interestRateCalculator",
              hasAccess: true,
              submodules: [],
            },
            {
              name: "Bank Statement Analyser",
              title: "bankStatementAnalyser",
              hasAccess: true,
              submodules: [],
            },
            {
              name: "Check Credit Score",
              title: "checkCreditScore",
              hasAccess: true,
              submodules: [],
            },
          ],
        },
      ],
    });

    await newAdmin.save();
    res
      .status(200)
      .json(errorResponse(200, "Admin created successfully.", newAdmin));
  } catch (error) {
    console.error("Error creating SellPerson:", error);
    res
      .status(500)
      .json(errorResponse(500, "Internal Server Error", error.message));
  }
};

/**
 * @swagger
 * /getProfile:
 *   get:
 *     summary: get an admin user
 *     tags:
 *       - Admin
 *     description: get an admin user by their ID. Requires super admin authentication token.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Admin get successfully
 *       '404':
 *         description: Admin not found
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const getProfile = async (req, res) => {
  try {
    const admin = await UserModel.findById(req.userId).select("-password");
    if (!admin) {
      return res.status(404).json(errorResponse(404, "Admin not found"));
    }

    res
      .status(200)
      .json(successResponse(200, "Admin successfully retrived", admin));
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json(errorResponse(500, error.message));
  }
};

/**
 * @swagger
 * /getAllAdmins:
 *   get:
 *     summary: Fetch all admin users
 *     tags:
 *       - Admin
 *     description: This endpoint allows the retrieval of all admin users with pagination, search, and sorting. Requires a valid super admin authentication token.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         description: Page number for pagination (default is 1)
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         description: Number of items per page (default is 10)
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         description: Search term to filter admins by name
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         description: Field to sort by name
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         description: Sort order (asc for ascending, desc for descending)
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       '200':
 *         description: Admins fetched successfully
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const getAllAdmins = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdOn",
    sortOrder = "asc",
  } = req.query;
  const skip = (page - 1) * limit;

  try {
    const query = {
      role: "Admin",
      ...(search && {
        $or: [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
        ],
      }),
    };
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const admins = await UserModel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalAdmins = await UserModel.countDocuments(query);
    const totalPages = Math.ceil(totalAdmins / limit);

    if (admins.length === 0) {
      return res.status(404).json(errorResponse(404, "No admins found."));
    }

    res.status(200).json({
      statusCode: 200,
      message: "Admins fetched successfully",
      data: admins,
      pagination: {
        totalAdmins,
        totalPages,
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json(errorResponse(500, "Internal Server Error"));
  }
};

/**
 * @swagger
 * /deleteAdmin/{id}:
 *   delete:
 *     summary: Delete an admin user
 *     tags:
 *       - Admin
 *     description: Deletes an admin user by their ID. Requires super admin authentication token.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: ID of the admin to be deleted
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Admin deleted successfully
 *       '404':
 *         description: Admin not found
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminToDelete = await UserModel.findOneAndDelete({
      _id: id,
      role: "Admin",
    });
    if (!adminToDelete) {
      return res.status(404).json(errorResponse(404, "Admin not found."));
    }

    res.status(200).json(successResponse(200, "Admin deleted successfully."));
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json(errorResponse(500, "Error deleting admin"));
  }
};

/**
 * @swagger
 * /getAdmin/{id}:
 *   get:
 *     summary: get an admin user
 *     tags:
 *       - Admin
 *     description: get an admin user by their ID. Requires super admin authentication token.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: ID of the admin to be get
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Admin get successfully
 *       '404':
 *         description: Admin not found
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const getAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await UserModel.findById({
      _id: id,
      role: { $in: ["Admin"] },
    });
    if (!admin) {
      return res.status(404).json(errorResponse(404, "Admin not found."));
    }

    res
      .status(200)
      .json(successResponse(200, "Admin get successfully.", admin));
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json(errorResponse(500, "Error deleting admin:", error));
  }
};

/**
 * @swagger
 * /updateAdmin/{id}:
 *   put:
 *     summary: Update an admin user's details
 *     tags:
 *       - Admin
 *     description: Updates an admin user's information by their ID. Requires super admin authentication token.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: ID of the admin to be updated
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the admin user
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the admin user
 *                 example: "johndoe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password for the admin user (if updating)
 *                 example: "NewPassword123"
 *     responses:
 *       '200':
 *         description: Admin updated successfully
 *       '404':
 *         description: Admin not found
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...otherFields } = req.body;
    if (Object.keys(otherFields).length === 0 && !password) {
      return res
        .status(400)
        .json(errorResponse(400, "No fields provided for update."));
    }

    let updatedFields = { ...otherFields };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updatedFields.password = hashedPassword;
    }

    const updatedAdmin = await UserModel.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedAdmin) {
      return res.status(404).json(errorResponse(404, "Admin not found."));
    }

    res
      .status(200)
      .json(successResponse(200, "Admin updated successfully.", updatedAdmin));
  } catch (error) {
    console.error("Error updating admin:", error);
    res
      .status(500)
      .json(errorResponse(500, "Error updating admin", error.message));
  }
};

/**
 * @swagger
 * /salesPersonCreate:
 *   post:
 *     summary: Create a new salesperson with specific module access
 *     tags:
 *       - Salesperson
 *     description: Allows a super admin to create a salesperson user with specific access to modules and nested submodules.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phoneNumber
 *               - modules
 *               - profileImage
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the salesperson
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the salesperson
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the salesperson
 *               phoneNumber:
 *                 type: number
 *                 description: Phone number of the salesperson
 *               profileImage:
 *                 type: string
 *                 description: profileImage of the salesperson
 *               modules:
 *                 type: array
 *                 description: List of modules with access details
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the module
 *                     hasAccess:
 *                       type: boolean
 *                       description: Whether access is granted for this module
 *                     submodules:
 *                       type: array
 *                       description: List of submodules with access details
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Name of the submodule
 *                           hasAccess:
 *                             type: boolean
 *                             description: Whether access is granted for this submodule
 *                           submodules:
 *                             type: array
 *                             description: Nested submodules
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   description: Name of the nested submodule
 *                                 hasAccess:
 *                                   type: boolean
 *                                   description: Whether access is granted for this nested submodule
 *     responses:
 *       '201':
 *         description: Salesperson created successfully
 *       '400':
 *         description: Bad Request - Missing or invalid fields
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const salesPersonCreate = async (req, res) => {
  const validationSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.number().min(10).required(),
    modules: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().optional(),
          title: Joi.string().optional(),
          hasAccess: Joi.boolean().optional(),
          submodules: Joi.array().items(
            Joi.object({
              name: Joi.string().optional(),
              title: Joi.string().optional(),
              hasAccess: Joi.boolean().optional(),
              submodules: Joi.array().items(
                Joi.object({
                  name: Joi.string().optional(),
                  title: Joi.string().optional(),
                  hasAccess: Joi.boolean().optional(),
                  submodules: Joi.array().items(
                    Joi.object({
                      name: Joi.string().optional(),
                      title: Joi.string().optional(),
                      hasAccess: Joi.boolean().optional(),
                      submodules: Joi.array().items(
                        Joi.object({
                          name: Joi.string().optional(),
                          title: Joi.string().optional(),
                          hasAccess: Joi.boolean().optional(),
                        })
                      ),
                    })
                  ),
                })
              ),
            })
          ),
        })
      )
      .optional(),
    profileImage: Joi.string().required(),
  });

  try {
    const validatedBody = await validationSchema.validateAsync(req.body);
    const { name, email, password, phoneNumber, modules, profileImage } =
      validatedBody;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json(errorResponse(400, "Email is already in use."));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new UserModel({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: "Salesperson",
      paymentDone: true,
      modules: modules,
      profileImage,
    });

    await newAdmin.save();

    res
      .status(200)
      .json(
        successResponse(200, "sales person created successfully.", newAdmin)
      );
  } catch (error) {
    res
      .status(500)
      .json(errorResponse(500, "error creating sales person", error));
  }
};

/**
 * @swagger
 * /getAllSalesperson:
 *   get:
 *     summary: Fetch all Salesperson users
 *     tags:
 *       - Salesperson
 *     description: This endpoint allows the retrieval of all admin users with pagination, search, and sorting. Requires a valid super admin authentication token.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         description: Page number for pagination (default is 1)
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         description: Number of items per page (default is 10)
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         description: Search term to filter admins by name
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         description: Field to sort by name
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         description: Sort order (asc for ascending, desc for descending)
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       '200':
 *         description: Admins fetched successfully
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const getAllSalesperson = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdOn",
    sortOrder = "asc",
  } = req.query;
  const skip = (page - 1) * limit;

  try {
    const query = {
      role: "Salesperson",
      ...(search && {
        $or: [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
        ],
      }),
    };

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const admins = await UserModel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalAdmins = await UserModel.countDocuments(query);
    const totalPages = Math.ceil(totalAdmins / limit);

    if (admins.length === 0) {
      return res.status(404).json(errorResponse(404, "No Sales person found."));
    }

    res.status(200).json({
      statusCode: 200,
      message: "Sales person fetched successfully",
      data: admins,
      pagination: {
        totalAdmins,
        totalPages,
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res
      .status(500)
      .json(
        errorResponse(500, "Error fetching all sales person", error.message)
      );
  }
};

/**
 * @swagger
 * /updateSalesPerson/{id}:
 *   put:
 *     tags:
 *       - Salesperson
 *     summary: Update a salesperson
 *     description: Update one or more fields of a salesperson based on the provided data. Fields not included in the request body remain unchanged.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the salesperson to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the salesperson.
 *                 example: Updated Name
 *               email:
 *                 type: string
 *                 description: Email of the salesperson.
 *                 example: updatedemail@example.com
 *               password:
 *                 type: string
 *                 description: Password of the salesperson. This will be hashed before saving.
 *                 example: newpassword123
 *               phoneNumber:
 *                 type: number
 *                 description: Phone number of the salesperson.
 *                 example: 9876543210
 *               modules:
 *                 type: array
 *                 description: Modules and their access permissions.
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Name of the module.
 *                       example: Loan Services
 *                     hasAccess:
 *                       type: boolean
 *                       description: Whether the module is accessible.
 *                       example: true
 *                     submodules:
 *                       type: array
 *                       description: Submodules under this module.
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Name of the submodule.
 *                             example: Personal Loan
 *                           hasAccess:
 *                             type: boolean
 *                             description: Whether the submodule is accessible.
 *                             example: true
 *     responses:
 *       '200':
 *         description: Salesperson updated successfully.
 *       '404':
 *         description: Salesperson not found.
 *       '500':
 *         description: Internal Server Error.
 */
export const updateSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const salesperson = await UserModel.findById(id);
    if (!salesperson) {
      return res.status(404).json(errorResponse(404, "Salesperson not found."));
    }
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const updatedSalesperson = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    res
      .status(200)
      .json(
        successResponse(
          200,
          "Salesperson updated successfully.",
          updatedSalesperson
        )
      );
  } catch (error) {
    console.error("Error updating salesperson:", error);
    res
      .status(500)
      .json(errorResponse(500, "Error updating salesperson", error.message));
  }
};

/**
 * @swagger
 * /deleteSalesPerson/{id}:
 *   delete:
 *     summary: Delete an Salesperson user
 *     tags:
 *       - Salesperson
 *     description: Deletes an Salesperson user by their ID. Requires super admin authentication token.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: ID of the Salesperson to be deleted
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Salesperson deleted successfully
 *       '404':
 *         description: Salesperson not found
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const deleteSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const adminToDelete = await UserModel.findOneAndDelete({
      _id: id,
      role: "Salesperson",
    });
    if (!adminToDelete) {
      return res.status(404).json(errorResponse(404, "Salesperson not found."));
    }

    res
      .status(200)
      .json(successResponse(200, "Salesperson deleted successfully."));
  } catch (error) {
    console.error("Error deleting Salesperson:", error);
    res.status(500).json(errorResponse(500, "Error deleting Salesperson"));
  }
};

/**
 * @swagger
 * /getSalesPerson/{id}:
 *   get:
 *     summary: get an Salesperson user
 *     tags:
 *       - Salesperson
 *     description: get an Salesperson user by their ID. Requires super admin authentication token.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super Salesperson authentication
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: ID of the Salesperson to be get
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Salesperson get successfully
 *       '404':
 *         description: Salesperson not found
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const getSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await UserModel.findById({
      _id: id,
      role: { $in: ["Salesperson"] },
    });
    if (!admin) {
      return res.status(404).json(errorResponse(404, "Salesperson not found."));
    }

    res
      .status(200)
      .json(successResponse(200, "Salesperson get successfully.", admin));
  } catch (error) {
    console.error("Error deleting Salesperson:", error);
    res.status(500).json(errorResponse(500, "error getting Salesperson"));
  }
};

/**
 * @swagger
 * /blockUnblock/{id}:
 *   patch:
 *     summary: Block or Unblock a Salesperson user
 *     tags:
 *       - Admin
 *     description: Blocks or unblocks a Salesperson user by their ID. The status will toggle between "block" and "unblock" with each request. Requires super admin authentication token.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         description: ID of the Salesperson whose status is to be toggled
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Salesperson status toggled successfully
 *       '404':
 *         description: Salesperson not found
 *       '403':
 *         description: Forbidden - Invalid or missing token
 *       '500':
 *         description: Internal Server Error
 */
export const blockUnblock = async (req, res) => {
  try {
    const { id } = req.params;
    const salesperson = await UserModel.findById({
      _id: id,
      role: { $in: ["Salesperson", "Admin"] },
    });
    if (!salesperson) {
      return res.status(404).json(errorResponse(404, "Salesperson not found"));
    }
    if (salesperson.status === "block") {
      salesperson.status = "unblock";
    } else {
      salesperson.status = "block";
    }
    await salesperson.save();

    res.status(200).json({
      statusCode: 200,
      message: `Salesperson has been ${salesperson.status}ed successfully.`,
      data: {
        id: salesperson._id,
        name: salesperson.name,
        status: salesperson.status,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json(errorResponse(500, "Error blocking and unblocking", error.message));
  }
};

/**
 * @swagger
 * /uploadImage:
 *   post:
 *     summary: Upload an image to S3
 *     tags:
 *       - Uploads
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *     responses:
 *       '200':
 *         description: Image uploaded successfully
 *       '400':
 *         description: No file provided
 *       '500':
 *         description: Internal server error
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse(400, "Uploading image failed"));
    }

    const fileName = `images/${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    const tempFilePath = path.join(rootDir, "uploads", fileName);
    const uploadDir = path.dirname(tempFilePath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(tempFilePath, req.file.buffer);
    const s3Response = await uploadToS3(tempFilePath, fileName);
    fs.unlinkSync(tempFilePath);

    res.status(200).json({
      statusCode: 200,
      message: "Image uploaded successfully",
      url: s3Response.Location,
    });
  } catch (error) {
    res
      .status(500)
      .json(errorResponse(500, "Error uploading image", error.message));
  }
};
