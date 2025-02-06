import mongoose from "mongoose";

const modulesSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    modules: [
      {
        name: { type: String, required: true },
        title: { type: String, required: true },
        hasAccess: { type: Boolean, default: false },
        submodules: [
          {
            name: { type: String, required: true },
            title: { type: String, required: true },
            hasAccess: { type: Boolean, default: false },
            submodules: [
              {
                name: { type: String, required: true },
                title: { type: String, required: true },
                hasAccess: { type: Boolean, default: false },
                submodules: [
                  {
                    name: { type: String, required: true },
                    title: { type: String, required: true },
                    hasAccess: { type: Boolean, default: false },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    createdOn: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);

const ModulesModel = mongoose.model("Modules", modulesSchema);

export const createDefaultModules = async () => {
  try {
    const defaultId = 1;
    const moduleExists = await ModulesModel.findOne({ id: defaultId });

    if (!moduleExists) {
      const defaultModule = new ModulesModel({
        id: defaultId,
        modules: [
          {
            name: "Loan Service",
            title: "loanService",
            hasAccess: false,
            submodules: [
              {
                name: "Personal Loan",
                title: "personalLoan",
                hasAccess: false,
                submodules: [
                  {
                    name: "Home Loan",
                    title: "homeLoan",
                    hasAccess: false,
                    submodules: [],
                  },
                  {
                    name: "Loan Against Property / Mortgage loan",
                    title: "loanAgainstProperty",
                    hasAccess: false,
                    submodules: [],
                  },
                  {
                    name: "Commercial property loan",
                    title: "commercialPropertyLoan",
                    hasAccess: false,
                    submodules: [],
                  },
                ],
              },
              {
                name: "Business Loan",
                title: "businessLoan",
                hasAccess: false,
                submodules: [],
              },
              {
                name: "Takeover",
                title: "takeover",
                hasAccess: false,
                submodules: [
                  {
                    name: "Personal",
                    title: "personal",
                    hasAccess: false,
                    submodules: [
                      {
                        name: "HL",
                        title: "hl",
                        hasAccess: false,
                        submodules: [],
                      },
                      {
                        name: "LAP / Mortgage loan",
                        title: "lap",
                        hasAccess: false,
                        submodules: [],
                      },
                    ],
                  },
                  {
                    name: "Business Loan",
                    title: "takeoverBusinessLoan",
                    hasAccess: false,
                    submodules: [],
                  },
                ],
              },
            ],
          },
          {
            name: "Financial analysis services",
            title: "financialAnalysisServices",
            hasAccess: false,
            submodules: [
              {
                name: "Interest rate calculator",
                title: "interestRateCalculator",
                hasAccess: false,
                submodules: [],
              },
              {
                name: "Bank Statement Analyser",
                title: "bankStatementAnalyser",
                hasAccess: false,
                submodules: [],
              },
              {
                name: "Check Credit Score",
                title: "checkCreditScore",
                hasAccess: false,
                submodules: [],
              },
            ],
          },
        ],
      });

      await defaultModule.save();
      console.log("Default modules created successfully.");
    } else {
      console.log("Default modules already exist.");
    }
  } catch (error) {
    console.error("Error creating default modules:", error);
  }
};
createDefaultModules();

export default ModulesModel;
