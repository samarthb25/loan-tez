import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, { 
    });
    console.log(`Connected to Database.`);
  } catch (error) {
    console.error("Connection with DB failed");
    console.error(error);
  }
};

export default connectToDatabase;
