import Joi from "joi";
import mongoose from "mongoose";
import { leadModel, loanData } from "../models/leadModel.js";
import connectToDatabase from "../configs/db.js";

/**
 * @swagger
 * /addLead:
 *   post:
 *     summary: Add a new loan lead
 *     tags:
 *       - Loan Leads
 *     description: This endpoint allows the creation of a new loan lead after validating the loan type, purpose, and details.
 *     consumes:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loanType
 *               - purpose
 *               - details
 *               - isVerified
 *             properties:
 *               loanType:
 *                 type: string
 *                 enum:
 *                   - homeLoan
 *                   - propertyMortgageLoan
 *                   - commercialPropertyLoan
 *                 description: The type of loan being requested. Valid values are 'homeLoan', 'propertyMortgageLoan', 'commercialPropertyLoan'.
 *               purpose:
 *                 type: string
 *                 description: The purpose for which the loan is being taken.
 *               details:
 *                 type: object
 *                 description: Detailed information required based on the loan type and purpose.
 *                 additionalProperties: true
 *               isVerified:
 *                 type: boolean
 *                 description: Indicates whether the user is verified. Must be true to save the lead.
 *     responses:
 *       '201':
 *         description: Loan lead created successfully
 *       '400':
 *         description: Bad Request - Missing or invalid fields in the request body
 *       '500':
 *         description: Internal Server Error
 */

export const addLead = async (req, res) => {
  const { loanType, purpose, details, isVerified } = req.body;
  //validation
  const schema = Joi.object({
    loanType: Joi.string()
      .valid("homeLoan", "propertyMortgageLoan", "commercialPropertyLoan")
      .required()
      .messages({
        "any.required": "Loan type is required!",
        "any.invalid": "Invalid loan type!",
      }),

    purpose: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (
          !loanData[req.body.loanType] ||
          !loanData[req.body.loanType].purposes[value]
        ) {
          return helpers.error("any.invalid", {
            message: `Invalid purpose for the selected loan type: ${value}`,
          });
        }
        return value;
      })
      .messages({
        "any.required": "Purpose is required!",
      }),

    details: Joi.object()
      .custom((value, helpers) => {
        const requiredFields =
          loanData[req.body.loanType].purposes[req.body.purpose];
        const missingFields = requiredFields.filter(
          (field) => !value || !value[field]
        );

        if (missingFields.length > 0) {
          return helpers.error("any.invalid", {
            message: `Missing required fields: ${missingFields.join(", ")}`,
          });
        }

        return value;
      })
      .required()
      .messages({
        "any.required": "Details are required!",
      }),
    isVerified: Joi.boolean().required().messages({
      "any.required": "User must be verified!",
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }
  //verfication check
  if (!isVerified) {
    return res.status(400).json({
      message: "User is not verified, lead data can't saved!",
    });
  }

  try {
    const lead = new leadModel({ loanType, purpose, details, isVerified });
    await lead.save();

    res.status(201).json({
      message: "Loan lead saved successfully!",
      lead,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /getBankList:
 *   get:
 *     summary: Get the list of bank loans
 *     tags:
 *       - Loan Leads
 *     description: Fetches the list of bank loans from the `bankloanlist` collection.
 *     responses:
 *       '200':
 *         description: Successfully retrieved the bank loan list
 *       '404':
 *         description: No bank loan list found
 *       '500':
 *         description: Internal server error
 */

export const getBankLoanList = async (req, res) => {
  try {
    //check db connection
    await connectToDatabase();
    //get list direct from collection
    const bankLoanList = await mongoose.connection.db
      .collection("bankloanlist")
      .find({})
      .toArray();
    if (!bankLoanList || bankLoanList.length === 0) {
      return res.status(404).json({ messages: "Bank loan list not found!" });
    }
    return res.status(200).json({
      message: "Bank loan list fetched successfully!",
      data: bankLoanList,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /editLead/{id}:
 *   patch:
 *     summary: Update an existing loan lead
 *     tags:
 *       - Loan Leads
 *     description: This endpoint allows the updating of an existing loan lead after validating the user's verification status and required fields.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the loan lead to be updated.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incomeSource
 *             properties:
 *               incomeSource:
 *                 type: string
 *                 description: The source of income for the lead.
 *               hasCoApplicant:
 *                 type: boolean
 *                 description: Indicates if there is a co-applicant.
 *               coApplicant:
 *                 type: object
 *                 description: Details of the co-applicant (required if hasCoApplicant is true).
 *                 properties:
 *                   relation:
 *                     type: string
 *                     enum:
 *                       - husband
 *                       - wife
 *                       - father
 *                       - mother
 *                       - brother
 *                       - sister
 *                       - other
 *                     description: The relationship of the co-applicant to the lead.
 *                   monthIncomeOfCoApplicant:
 *                     type: number
 *                     description: Monthly income of the co-applicant.
 *                   monthEmiOfCoApplicant:
 *                     type: number
 *                     description: Monthly EMI of the co-applicant.
 *             additionalProperties: false
 *     responses:
 *       '200':
 *         description: Loan lead updated successfully
 *       '400':
 *         description: Bad Request - Missing or invalid fields in the request body
 *       '404':
 *         description: Not Found - Loan lead not found
 *       '500':
 *         description: Internal Server Error
 */

export const updateLead = async (req, res) => {
  const leadId = req.params.id;
  let { incomeSource, hasCoApplicant, coApplicant } = req.body;

  try {
    const existingLead = await leadModel.findById(leadId);
    if (!existingLead) {
      return res.status(404).json({ message: "Loan lead not found!" });
    }

    if (!existingLead.isVerified) {
      return res.status(400).json({ message: "User is not verified!" });
    }

    if (!incomeSource) {
      return res
        .status(400)
        .json({ message: "Income source is required to proceed!" });
    }

    const updateFields = {};
    if (incomeSource) updateFields.incomeSource = incomeSource;

    updateFields.hasCoApplicant = hasCoApplicant;

    if (hasCoApplicant) {
      if (
        !coApplicant ||
        !coApplicant.relation ||
        !coApplicant.monthIncomeOfCoApplicant ||
        !coApplicant.monthEmiOfCoApplicant
      ) {
        return res.status(400).json({
          message:
            "Co-applicant details are required when hasCoApplicant is true!",
        });
      }

      const { relation, monthIncomeOfCoApplicant, monthEmiOfCoApplicant } =
        coApplicant;
      const validRelations = [
        "husband",
        "wife",
        "father",
        "mother",
        "brother",
        "sister",
        "other",
      ];

      if (!validRelations.includes(relation)) {
        return res
          .status(400)
          .json({ message: "Invalid co-applicant relation!" });
      }

      updateFields.coApplicant = {
        relation,
        monthIncomeOfCoApplicant,
        monthEmiOfCoApplicant,
      };
    } else {
      updateFields.coApplicant = null;
    }

    const updatedLead = await leadModel.findByIdAndUpdate(
      leadId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    return res
      .status(200)
      .json({ message: "Loan lead updated successfully!", data: updatedLead });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: error.message });
  }
};
