const FormData = require('form-data');
const axios = require('axios');
const sharp = require('sharp');
const { GoogleGenAI } = require('@google/genai');


// --------------------------------------------------
// Normalize plate text
// --------------------------------------------------

const normalizePlate = (plate) => {
  if (!plate) return '';

  return plate
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};


// --------------------------------------------------
// OCR confusion helpers
// --------------------------------------------------

const toDigit = (char) => {
  const map = {
    O: '0',
    Q: '0',
    D: '0',
    I: '1',
    L: '1',
    Z: '2',
    S: '5',
    G: '6',
    B: '8',
  };

  return map[char] || char;
};


const toLetter = (char) => {
  const map = {
    '0': 'O',
    '1': 'I',
    '2': 'Z',
    '5': 'S',
    '6': 'G',
    '8': 'B',
  };

  return map[char] || char;
};


// --------------------------------------------------
// Indian plate validation
// --------------------------------------------------

const isValidIndianPlate = (plate) => {
  if (!plate) return false;

  // Examples:
  // UP80BB9347
  // DL8CAF5031
  // HR26DK8337
  const normalPlateRegex =
    /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

  // Bharat Series:
  // 22BH1234AA
  const bharatSeriesRegex =
    /^[0-9]{2}BH[0-9]{4}[A-Z]{2}$/;

  return (
    normalPlateRegex.test(plate) ||
    bharatSeriesRegex.test(plate)
  );
};


// --------------------------------------------------
// Correct Indian plate according to expected format
// --------------------------------------------------

const correctIndianPlate = (rawPlate) => {
  const plate = normalizePlate(rawPlate);

  if (!plate) {
    return '';
  }

  if (isValidIndianPlate(plate)) {
    return plate;
  }


  // ------------------------------------------
  // Bharat Series
  //
  // 22BH1234AA
  // ------------------------------------------

  if (plate.length === 10) {
    let candidate = '';

    candidate += toDigit(plate[0]);
    candidate += toDigit(plate[1]);

    candidate += toLetter(plate[2]);
    candidate += toLetter(plate[3]);

    for (let i = 4; i < 8; i++) {
      candidate += toDigit(plate[i]);
    }

    candidate += toLetter(plate[8]);
    candidate += toLetter(plate[9]);

    if (isValidIndianPlate(candidate)) {
      return candidate;
    }
  }


  // ------------------------------------------
  // Normal Indian registration
  //
  // UP32AB1234
  //
  // UP    -> letters
  // 32    -> digits
  // AB    -> letters
  // 1234  -> digits
  // ------------------------------------------

  for (const districtLength of [2, 1]) {

    const seriesLength =
      plate.length - 2 - districtLength - 4;

    if (
      seriesLength < 1 ||
      seriesLength > 3
    ) {
      continue;
    }

    let candidate = '';

    // State
    candidate += toLetter(plate[0]);
    candidate += toLetter(plate[1]);

    // District
    const districtStart = 2;
    const districtEnd =
      districtStart + districtLength;

    for (
      let i = districtStart;
      i < districtEnd;
      i++
    ) {
      candidate += toDigit(plate[i]);
    }

    // Series
    const seriesStart = districtEnd;
    const seriesEnd =
      seriesStart + seriesLength;

    for (
      let i = seriesStart;
      i < seriesEnd;
      i++
    ) {
      candidate += toLetter(plate[i]);
    }

    // Final 4 digits
    for (
      let i = seriesEnd;
      i < plate.length;
      i++
    ) {
      candidate += toDigit(plate[i]);
    }

    if (isValidIndianPlate(candidate)) {
      return candidate;
    }
  }

  return plate;
};


// --------------------------------------------------
// Compress / resize image for Plate Recognizer
// --------------------------------------------------

const prepareForPlateRecognizer = async (
  imageBuffer
) => {
  /*
    Keep image below provider limit.

    We use 2.5 MB as a safer target
    instead of going very close to 3 MB.
  */

  const MAX_SIZE =
    2.5 * 1024 * 1024;


  // Already small enough
  if (
    imageBuffer.length <= MAX_SIZE
  ) {
    return {
      buffer: imageBuffer,
      mimeType: null,
      compressed: false,
    };
  }


  console.log(
    `Large image detected: ${(
      imageBuffer.length /
      (1024 * 1024)
    ).toFixed(2)} MB`
  );


  // ------------------------------------------
  // First compression attempt
  // ------------------------------------------

  let compressedBuffer =
    await sharp(imageBuffer)
      .rotate()
      .resize({
        width: 1600,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();


  // ------------------------------------------
  // If still too large, compress further
  // ------------------------------------------

  if (
    compressedBuffer.length > MAX_SIZE
  ) {

    compressedBuffer =
      await sharp(imageBuffer)
        .rotate()
        .resize({
          width: 1280,
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 65,
          mozjpeg: true,
        })
        .toBuffer();
  }


  console.log(
    `Compressed image: ${(
      compressedBuffer.length /
      (1024 * 1024)
    ).toFixed(2)} MB`
  );


  return {
    buffer: compressedBuffer,
    mimeType: 'image/jpeg',
    compressed: true,
  };
};


// --------------------------------------------------
// Plate Recognizer
// --------------------------------------------------

const recognizeWithPlateRecognizer = async (
  imageBuffer,
  originalName,
  mimeType
) => {

  const prepared =
    await prepareForPlateRecognizer(
      imageBuffer
    );


  const finalBuffer =
    prepared.buffer;


  const finalMimeType =
    prepared.mimeType ||
    mimeType;


  const finalFilename =
    prepared.compressed
      ? 'plate-image.jpg'
      : originalName;


  const form =
    new FormData();


  form.append(
    'upload',
    finalBuffer,
    {
      filename:
        finalFilename,

      contentType:
        finalMimeType,
    }
  );


  // India-specific recognition
  form.append(
    'regions',
    'in'
  );


  const response =
    await axios.post(

      'https://api.platerecognizer.com/v1/plate-reader/',

      form,

      {
        headers: {

          ...form.getHeaders(),

          Authorization:
            `Token ${process.env.PLATE_RECOGNIZER_API_KEY}`,
        },

        maxContentLength:
          Infinity,

        maxBodyLength:
          Infinity,
      }
    );


  const results =
    response.data.results || [];


  return results.map(
    (result) => {

      const candidates =
        (
          result.candidates || []
        ).map(
          (candidate) => {

            const raw =
              normalizePlate(
                candidate.plate
              );

            const corrected =
              correctIndianPlate(
                raw
              );

            return {

              plateNumber:
                corrected,

              rawPlate:
                raw,

              score:
                candidate.score || 0,

              validIndianPlate:
                isValidIndianPlate(
                  corrected
                ),
            };
          }
        );


      const rawPrimary =
        normalizePlate(
          result.plate
        );


      const primary =
        correctIndianPlate(
          rawPrimary
        );


      return {

        plateNumber:
          primary,

        rawPlate:
          rawPrimary,

        confidence:
          result.score || 0,

        validIndianPlate:
          isValidIndianPlate(
            primary
          ),

        candidates,

        boundingBox:
          result.box || null,
      };
    }
  );
};


// --------------------------------------------------
// Gemini Vision
// --------------------------------------------------

const recognizeWithGemini = async (
  imageBuffer,
  mimeType
) => {

  if (
    !process.env.GEMINI_API_KEY
  ) {
    throw new Error(
      'GEMINI_API_KEY is missing'
    );
  }


  const ai =
    new GoogleGenAI({
      apiKey:
        process.env.GEMINI_API_KEY,
    });


  const base64Image =
    imageBuffer.toString(
      'base64'
    );


  const interaction =
    await ai.interactions.create({

      model:
        'gemini-3.6-flash',

      input: [

        {
          type: 'image',

          data:
            base64Image,

          mime_type:
            mimeType,
        },

        {
          type: 'text',

          text: `
Read every visible Indian vehicle registration plate in this image.

Rules:
- Return ONLY plate numbers.
- Use uppercase letters.
- Remove spaces and hyphens.
- Do not explain anything.
- Do not guess if unreadable.
- If multiple plates are visible, separate them using commas.

Examples:
UP80BB9347
DL8CAF5031
MH43D3193

If multiple:
UP80BB9347,DL8CAF5031
          `.trim(),
        },
      ],
    });


  const text =
    interaction.output_text || '';


  const plates =
    text
      .split(',')
      .map(
        (plate) =>
          correctIndianPlate(
            plate.trim()
          )
      )
      .filter(Boolean);


  return plates;
};


// --------------------------------------------------
// Search Plate Recognizer candidate list
// --------------------------------------------------

const findMatchingCandidate = (
  plateRecognizerResult,
  targetPlate
) => {

  const normalizedTarget =
    normalizePlate(
      targetPlate
    );


  return (
    plateRecognizerResult
      .candidates || []
  ).find(
    (candidate) =>
      normalizePlate(
        candidate.plateNumber
      ) ===
      normalizedTarget
  );
};


// --------------------------------------------------
// Fusion logic
//
// One final answer
// --------------------------------------------------

const chooseFinalPlate = (
  plateRecognizerResult,
  geminiPlates
) => {

  const prPlate =
    normalizePlate(
      plateRecognizerResult
        .plateNumber
    );


  const prValid =
    isValidIndianPlate(
      prPlate
    );


  // Get Gemini valid Indian plates
  const validGeminiPlates =
    geminiPlates
      .map(normalizePlate)
      .filter(
        isValidIndianPlate
      );


  const geminiPlate =
    validGeminiPlates[0] ||
    null;


  // ------------------------------------------
  // Case 1:
  // Both agree exactly
  // ------------------------------------------

  if (
    geminiPlate &&
    geminiPlate === prPlate
  ) {

    return {

      plateNumber:
        prPlate,

      confidence:
        plateRecognizerResult
          .confidence,
    };
  }


  // ------------------------------------------
  // Case 2:
  // Gemini result appears inside
  // Plate Recognizer candidate list
  //
  // Strong evidence for Gemini
  // ------------------------------------------

  if (geminiPlate) {

    const matchingCandidate =
      findMatchingCandidate(
        plateRecognizerResult,
        geminiPlate
      );


    if (matchingCandidate) {

      return {

        plateNumber:
          geminiPlate,

        confidence:
          matchingCandidate.score,
      };
    }
  }


  // ------------------------------------------
  // Case 3:
  // Both outputs are valid Indian plates
  // but disagree
  // ------------------------------------------

  if (
    prValid &&
    geminiPlate
  ) {

    /*
      Your tests showed Plate Recognizer
      can still be wrong at ~0.92 confidence.

      Only give PR priority if extremely
      confident.
    */

    if (
      plateRecognizerResult
        .confidence >= 0.97
    ) {

      return {

        plateNumber:
          prPlate,

        confidence:
          plateRecognizerResult
            .confidence,
      };
    }


    // Otherwise Gemini gets priority
    return {

      plateNumber:
        geminiPlate,

      /*
        This is a fusion score,
        not Gemini's native confidence.
      */

      confidence:
        0.9,
    };
  }


  // ------------------------------------------
  // Case 4:
  // PR invalid, Gemini valid
  // ------------------------------------------

  if (
    !prValid &&
    geminiPlate
  ) {

    return {

      plateNumber:
        geminiPlate,

      confidence:
        0.9,
    };
  }


  // ------------------------------------------
  // Case 5:
  // PR valid, Gemini failed
  // ------------------------------------------

  if (prValid) {

    return {

      plateNumber:
        prPlate,

      confidence:
        plateRecognizerResult
          .confidence,
    };
  }


  // ------------------------------------------
  // Final fallback
  // ------------------------------------------

  return {

    plateNumber:
      geminiPlate ||
      prPlate ||
      null,

    confidence:
      geminiPlate
        ? 0.8
        : (
            plateRecognizerResult
              .confidence || 0
          ),
  };
};


// --------------------------------------------------
// Main OCR function
// --------------------------------------------------

const recognizePlates = async (
  imageBuffer,
  originalName,
  mimeType
) => {

  try {

    // ------------------------------------------
    // Checks
    // ------------------------------------------

    if (!imageBuffer) {

      throw new Error(
        'Image buffer is missing'
      );
    }


    if (
      !process.env
        .PLATE_RECOGNIZER_API_KEY
    ) {

      throw new Error(
        'Plate Recognizer API key is missing'
      );
    }


    const allowedTypes = [

      'image/jpeg',

      'image/jpg',

      'image/png',

      'image/webp',
    ];


    if (
      !allowedTypes.includes(
        mimeType
      )
    ) {

      throw new Error(
        `Unsupported image type: ${mimeType}`
      );
    }


    // ------------------------------------------
    // Plate Recognizer
    //
    // Failure should NOT stop Gemini.
    // ------------------------------------------

    let plateRecognizerResults =
      [];


    try {

      plateRecognizerResults =
        await recognizeWithPlateRecognizer(

          imageBuffer,

          originalName,

          mimeType
        );

    } catch (error) {

      console.error(
        'Plate Recognizer Error:',
        error.response?.data ||
        error.message
      );
    }


    // ------------------------------------------
    // Gemini
    //
    // Failure should NOT stop PR.
    // ------------------------------------------

    let geminiPlates =
      [];


    try {

      geminiPlates =
        await recognizeWithGemini(

          imageBuffer,

          mimeType
        );

    } catch (error) {

      console.error(
        'Gemini OCR Error:',
        error.response?.data ||
        error.message
      );
    }


    // Debugging
    console.log(
      'Plate Recognizer Results:',
      plateRecognizerResults
    );

    console.log(
      'Gemini Results:',
      geminiPlates
    );


    // ------------------------------------------
    // Neither found anything
    // ------------------------------------------

    if (
      plateRecognizerResults.length === 0 &&
      geminiPlates.length === 0
    ) {

      return [];
    }


    // ------------------------------------------
    // Only Gemini worked
    // ------------------------------------------

    if (
      plateRecognizerResults.length === 0
    ) {

      return geminiPlates

        .filter(
          isValidIndianPlate
        )

        .map(
          (plateNumber) => ({

            plateNumber,

            confidence:
              0.8,
          })
        );
    }


    // ------------------------------------------
    // Fuse every detected PR plate
    // with Gemini
    // ------------------------------------------

    const finalResults =
      plateRecognizerResults
        .map(
          (prResult) =>

            chooseFinalPlate(
              prResult,
              geminiPlates
            )
        );


    return finalResults;

  } catch (error) {

    console.error(
      'OCR Service Error:',
      error.response?.data ||
      error.message
    );


    throw new Error(
      'OCR processing failed'
    );
  }
};


module.exports = {
  recognizePlates,
};