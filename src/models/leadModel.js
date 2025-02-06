import mongoose from "mongoose";

const loanData = {
  homeLoan: {
    purposes: {
      plotPurchase: ["plotValue", "propertyGuidelineValue"],
      plotPurchaseAndconstruction: [
        "plotWithConstructionValue",
        "propertyGuidelineValue",
      ],
      construction: ["constructionValue", "propertyGuidelineValue"],
      flatOrHousePurchase: ["propertyValue", "propertyGuidelineValue"],
    },
  },
  propertyMortgageLoan: {
    purposes: {
      land: ["valueOfLandCollateral", "propertyGuidelineValue"],
      house: ["valueOfHouseCollateral", "propertyGuidelineValue"],
      flatOrPlot: ["valueOfPropertyCollateral", "propertyGuidelineValue"],
    },
  },
  commercialPropertyLoan: {
    purposes: {
      plotPurchase: ["plotValue", "propertyGuidelineValue"],
      plotPurchaseAndconstruction: [
        "plotWithConstructionValue",
        "propertyGuidelineValue",
      ],
      construction: ["constructionValue", "propertyGuidelineValue"],
      flatOrHousePurchase: ["propertyValue", "propertyGuidelineValue"],
    },
  },
};

const leadSchema = new mongoose.Schema({
  loanType: {
    type: String,
    required: true,
    enum: ["homeLoan", "propertyMortgageLoan", "commercialPropertyLoan"],
  },
  purpose: {
    type: String,
    required: true,
  },
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  incomeSource: {
    type: String,
    enum: ["salary", "selfEmployed"],
  },
  hasCoApplicant: {
    type: Boolean,
    default: false,
  },
  coApplicant: {
    relation: {
      type: String,
      enum: [
        "husband",
        "wife",
        "father",
        "mother",
        "brother",
        "sister",
        "other",
      ],
      required: false,
    },
    monthIncomeOfCoApplicant: {
      type: Number,
    },
    monthEmiOfCoApplicant: {
      type: Number,
    },
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

export const leadModel = mongoose.model("Lead", leadSchema);
export { loanData };
