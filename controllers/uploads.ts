/** Express router providing uploads related routes
 * @module controllers/uploads
 * @requires express
 */

/**
 * Express router to mount file upload related functions on.
 * @type {object}
 * @const
 * @namespace uploadsRouter
*/

import express from 'express'
import config from "../utils/config"

const uploadsRouter = express.Router()

let aws = require('aws-sdk')

// Configure dotenv to load in the .env file
require('dotenv').config()

// AWS S3 bucket name
const S3_BUCKET = config.AWS_BUCKET

// Configure AWS with your accessKeyId and your secretAccessKey
aws.config.update({
    region: config.AWS_REGION,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
})


uploadsRouter.post("/", async (req: any, res: any) => {
    // Create a new instance of S3
    const s3 = new aws.S3();
    const file = req.body.file;
    //const fileName = req.body.fileName;
    const fileType = req.body.fileType;

    // Setting up S3 upload parameters
    const params = {
        Bucket: S3_BUCKET,
        Key: file, // File name you want to save as in S3
        Expires: 500,
        ContentType: fileType,
      };

    // Make a request to the S3 API to get a signed URL which we can use to upload our file
    s3.getSignedUrl('putObject', params, (err: any, data: any) => {
      if(err){
       console.log(err);
       res.json({success: false, error: err})
    }
    // Data payload of what we are sending back, the url of the signedRequest and a URL where we can access the content after its saved.
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${file}`,
    };
    // Send it all back
    res.json({success:true, data:{returnData}});

  });

})

export default uploadsRouter


