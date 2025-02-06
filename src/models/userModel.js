import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    otpVerified: { type: String },
    gender: { type: String, default: "NA" },
    password: { type: String, required: true },
    phoneNumber: { type: Number, default: 0 },
    profileImage: { type: String, default: "NA" },
    paymentDone: { type: Boolean, default: false },
    modules: [
      {
        name: { type: String },
        title: { type: String},
        hasAccess: { type: Boolean, default: false },
        submodules: [
          {
            name: { type: String },
            title: { type: String},
            hasAccess: { type: Boolean, default: false },
            submodules: [
              {
                name: { type: String },
                title: { type: String},
                hasAccess: { type: Boolean, default: false },
                submodules: [
                  {
                    name: { type: String },
                    title: { type: String},
                    hasAccess: { type: Boolean, default: false },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    status: {
      type: String,
      enum: ["block", "unblock"],
      default: "unblock",
    },
    role: {
      type: String,
      enum: ["Salesperson", "user", "Admin", "superAdmin"],
      default: "user",
    },
    createdOn: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  }
);
const UserModel = mongoose.model("User", userSchema);

export const createDefaultAdmin = async () => {
  try {
    const adminExists = await UserModel.findOne({ role: "superAdmin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("Codestrup@2024@", 10);
      const admin = new UserModel({
        name: "Codeadmin",
        email: "codestrupinfotech@gmail.com",
        password: hashedPassword,
        role: "superAdmin",
        phoneNumber:9923291455,
        avatarUrl:
          "https://keenthemes.com/static/metronic/tailwind/dist/assets/media/avatars/gray/5.png",
        paymentDone: true,
        modules: [
          {
            name: "Loan Service",
            title:"loanService",
            hasAccess: true,  
            submodules: [
              {
                name: "Personal Loan",
                title:"personalLoan",
                hasAccess: true,
                submodules: [
                  {
                    name: "Home Loan",
                    title:"homeLoan",
                    hasAccess: true,
                    submodules: [],
                  },
                  {
                    name: "Loan Against Property  / Mortgage loan",
                    title:"loanAgainstProperty",
                    hasAccess: true,
                    submodules: [],
                  },
                  {
                    name: "Commercial property loan",
                    title:"commercialPropertyLoan",
                    hasAccess: true,
                    submodules: [],
                  },
                ],
              },
              {
                name: "Business Loan",
                title:"businessLoan",
                hasAccess: true,
                submodules: [],
              },
              {
                name: "Takeover",
                title:"takeover",
                hasAccess: true,
                submodules: [
                  {
                    name: "Personal",
                    title:"personal",
                    hasAccess: true,
                    submodules: [
                      {
                        name: "HL",
                        title:"hl",
                        hasAccess: true,
                        submodules: [],
                      },
                      {
                        name: "LAP / Mortgage loan",
                        title:"lap",
                        hasAccess: true,
                        submodules: [],
                      },
                    ],
                  },
                  {
                    name: "Business Loan",
                    title:"takeoverBusinessLoan",
                    hasAccess: true,
                    submodules: [],
                  },
                ],
              },
            ],
          },
          {
            name: "Financial analysis services",
            title:"financialAnalysisServices",
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
      await admin.save();
      console.log("Default admin created 😎🧐🤓");
    } else {
      console.log("Default admin already created 😛😁😄.");
    }
  } catch (error) {
    console.error("Error creating default admin user:", error);
  }
};

createDefaultAdmin();

export default UserModel;
