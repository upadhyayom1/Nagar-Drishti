const {
  Router,
} = require('express');

const multer =
  require('multer');

const ocrController =
  require('./ocr.controller');


const router =
  Router();


// --------------------------------------------------
// Multer memory storage
//
// No permanent temporary image files.
// --------------------------------------------------

const storage =
  multer.memoryStorage();


// --------------------------------------------------
// File filter
// --------------------------------------------------

const fileFilter = (
  req,
  file,
  cb
) => {

  const allowedTypes = [

    'image/jpeg',

    'image/jpg',

    'image/png',

    'image/webp',
  ];


  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {

    cb(null, true);

  } else {

    cb(
      new Error(
        'Only JPG, JPEG, PNG and WEBP images are allowed'
      ),
      false
    );
  }
};


// --------------------------------------------------
// Upload configuration
// --------------------------------------------------

const upload =
  multer({

    storage,

    fileFilter,

    limits: {

      // Backend accepts up to 10 MB
      // per uploaded image.
      //
      // Note:
      // Plate Recognizer itself may
      // impose a smaller provider-side
      // limit.

      fileSize:
        10 * 1024 * 1024,

      // Maximum number of files
      files: 20,
    },
  });


// --------------------------------------------------
// POST /api/ocr
//
// Can receive:
//
// 1 cropped plate
// many cropped plates
// 1 full camera image
// many full camera images
// --------------------------------------------------

router.post(

  '/',

  upload.array(
    'plateImages',
    20
  ),

  ocrController
    .recognizePlates
);


module.exports =
  router;