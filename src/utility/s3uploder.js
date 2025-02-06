import AWS from 'aws-sdk';
import fs from 'fs';

const s3 = new AWS.S3();

export async function uploadToS3(tempFilePath, fileName) {
  const fileContent = fs.readFileSync(tempFilePath);

  const params = {
    Bucket: 'tezzloan-profile',
    Key: fileName,
    Body: fileContent,
    ContentType: 'image/png',
  };

  return s3.upload(params).promise();
}
