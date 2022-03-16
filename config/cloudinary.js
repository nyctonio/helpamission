const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
require("dotenv").config();
cloudinary.config({
  cloud_name: `${process.env.cloudinary_cloud_name}`,
  api_key: `${process.env.cloudinary_api_key}`,
  api_secret: `${process.env.cloudinary_api_secret}`,
  secure: true,
});

let streamUpload = (req) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream((error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  });
};

async function uploadImage(req) {
  try {
    let result = await streamUpload(req);
    console.log(result);
    return result;
  } catch (error) {
    return { message: "image not uploaded", error };
  }
}

module.exports = uploadImage;
