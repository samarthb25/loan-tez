import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.REGION;
const accessKeyId = process.env.ACCESSKEYID;
const secretAccessKey = process.env.SECRATEACCESSKEY;

AWS.config.update({ region, credentials: { accessKeyId, secretAccessKey } });

module.exports = { AWS };
