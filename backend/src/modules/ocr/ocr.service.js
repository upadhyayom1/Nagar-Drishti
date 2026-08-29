const FormData = require('form-data');
const axios = require('axios');
const sharp = require('sharp');

const PLATE_API_URL =
  'https://api.platerecognizer.com/v1/plate-reader/';

const MAX_PR_SIZE = 2.5 * 1024 * 1024;

const REQUEST_DELAY = 1100;


// ==================================================
// UTILITIES
// ==================================================

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );


const normalizePlate = (plate) => {
  if (!plate) return '';

  return plate
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};


// ==================================================
// OCR CHARACTER CORRECTIONS
// ==================================================

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


// ==================================================
// INDIAN STATE CODES
// ==================================================

const INDIAN_STATE_CODES = new Set([
  'AN',
  'AP',
  'AR',
  'AS',
  'BR',
  'CG',
  'CH',
  'DD',
  'DL',
  'DN',
  'GA',
  'GJ',
  'HP',
  'HR',
  'JH',
  'JK',
  'KA',
  'KL',
  'LA',
  'LD',
  'MH',
  'ML',
  'MN',
  'MP',
  'MZ',
  'NL',
  'OD',
  'OR',
  'PB',
  'PY',
  'RJ',
  'SK',
  'TN',
  'TR',
  'TS',
  'UK',
  'UA',
  'UP',
  'WB',
]);


// ==================================================
// INDIAN PLATE VALIDATION
// ==================================================

const isValidIndianPlate = (plate) => {
  if (!plate) return false;


  // Normal plate
  // UP32AB1234
  // MH43D3193

  const normalMatch = plate.match(
    /^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/
  );

  if (normalMatch) {
    return INDIAN_STATE_CODES.has(
      normalMatch[1]
    );
  }


  // Bharat Series
  //
  // 22BH7071A
  // 22BH7071RS
  //
  // I and O are excluded from suffix.

  const bharatRegex =
    /^[0-9]{2}BH[0-9]{4}[A-HJ-NP-Z]{1,2}$/;

  return bharatRegex.test(plate);
};


// ==================================================
// CORRECT ACCORDING TO INDIAN STRUCTURE
// ==================================================

const correctIndianPlate = (rawPlate) => {
  const plate = normalizePlate(rawPlate);

  if (!plate) {
    return '';
  }


  if (isValidIndianPlate(plate)) {
    return plate;
  }


  // ------------------------------------------------
  // BH SERIES
  //
  // 22 BH 7071 RS
  // ------------------------------------------------

  if (
    plate.length === 9 ||
    plate.length === 10
  ) {

    let candidate = '';

    // Year
    candidate += toDigit(plate[0]);
    candidate += toDigit(plate[1]);


    // BH
    candidate += toLetter(plate[2]);
    candidate += toLetter(plate[3]);


    // 4-digit random number
    for (let i = 4; i < 8; i++) {
      candidate += toDigit(
        plate[i]
      );
    }


    // 1 or 2 suffix letters
    for (
      let i = 8;
      i < plate.length;
      i++
    ) {
      candidate += toLetter(
        plate[i]
      );
    }


    if (
      isValidIndianPlate(candidate)
    ) {
      return candidate;
    }
  }


  // ------------------------------------------------
  // NORMAL INDIAN PLATE
  // ------------------------------------------------

  for (
    const districtLength of [2, 1]
  ) {

    const seriesLength =
      plate.length -
      2 -
      districtLength -
      4;


    if (
      seriesLength < 1 ||
      seriesLength > 3
    ) {
      continue;
    }


    let candidate = '';


    // State letters
    candidate += toLetter(
      plate[0]
    );

    candidate += toLetter(
      plate[1]
    );


    // District digits
    const districtEnd =
      2 + districtLength;

    for (
      let i = 2;
      i < districtEnd;
      i++
    ) {
      candidate += toDigit(
        plate[i]
      );
    }


    // Series letters
    const seriesEnd =
      districtEnd +
      seriesLength;

    for (
      let i = districtEnd;
      i < seriesEnd;
      i++
    ) {
      candidate += toLetter(
        plate[i]
      );
    }


    // Last four digits
    for (
      let i = seriesEnd;
      i < plate.length;
      i++
    ) {
      candidate += toDigit(
        plate[i]
      );
    }


    if (
      isValidIndianPlate(candidate)
    ) {
      return candidate;
    }
  }


  return plate;
};


// ==================================================
// IMAGE SIZE PREPARATION
// ==================================================

const prepareBaseImage = async (
  imageBuffer
) => {

  if (
    imageBuffer.length <= MAX_PR_SIZE
  ) {
    return imageBuffer;
  }


  let buffer =
    await sharp(imageBuffer)
      .rotate()
      .resize({
        width: 1600,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 82,
        mozjpeg: true,
      })
      .toBuffer();


  if (
    buffer.length > MAX_PR_SIZE
  ) {

    buffer =
      await sharp(imageBuffer)
        .rotate()
        .resize({
          width: 1280,
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 68,
          mozjpeg: true,
        })
        .toBuffer();
  }


  return buffer;
};


// ==================================================
// CALL PLATE RECOGNIZER
// ==================================================

const callPlateRecognizer = async (
  buffer,
  name
) => {

  const form =
    new FormData();


  form.append(
    'upload',
    buffer,
    {
      filename:
        `${name}.jpg`,

      contentType:
        'image/jpeg',
    }
  );


  form.append(
    'regions',
    'in'
  );


  const response =
    await axios.post(
      PLATE_API_URL,
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


  return (
    response.data.results || []
  );
};


// ==================================================
// CROP DETECTED PLATE
// ==================================================

const cropDetectedPlate = async (
  imageBuffer,
  box
) => {

  if (!box) {
    return imageBuffer;
  }


  const metadata =
    await sharp(imageBuffer)
      .metadata();


  const imageWidth =
    metadata.width;

  const imageHeight =
    metadata.height;


  if (
    !imageWidth ||
    !imageHeight
  ) {
    return imageBuffer;
  }


  const plateWidth =
    box.xmax - box.xmin;

  const plateHeight =
    box.ymax - box.ymin;


  // Add around 8% padding
  const paddingX =
    Math.round(
      plateWidth * 0.08
    );

  const paddingY =
    Math.round(
      plateHeight * 0.12
    );


  const left =
    Math.max(
      0,
      box.xmin - paddingX
    );


  const top =
    Math.max(
      0,
      box.ymin - paddingY
    );


  const right =
    Math.min(
      imageWidth,
      box.xmax + paddingX
    );


  const bottom =
    Math.min(
      imageHeight,
      box.ymax + paddingY
    );


  const width =
    Math.max(
      1,
      right - left
    );


  const height =
    Math.max(
      1,
      bottom - top
    );


  return sharp(imageBuffer)
    .extract({
      left,
      top,
      width,
      height,
    })

    // Enlarge plate for OCR
    .resize({
      width: Math.max(
        700,
        width * 2
      ),

      withoutEnlargement:
        false,
    })

    .jpeg({
      quality: 94,
    })

    .toBuffer();
};


// ==================================================
// CREATE CROPPED PLATE VARIANTS
// ==================================================

const createPlateVariants = async (
  plateBuffer
) => {

  const variants = [];


  // ----------------------------------------------
  // 1. Normal enlarged crop
  // ----------------------------------------------

  variants.push({
    name:
      'plate-original',

    buffer:
      plateBuffer,

    weight:
      1.0,
  });


  // ----------------------------------------------
  // 2. Contrast + sharpen
  // ----------------------------------------------

  const enhanced =
    await sharp(plateBuffer)
      .normalize()
      .sharpen({
        sigma: 1.1,
      })
      .jpeg({
        quality: 94,
      })
      .toBuffer();


  variants.push({
    name:
      'plate-enhanced',

    buffer:
      enhanced,

    weight:
      1.15,
  });


  // ----------------------------------------------
  // 3. Slight left rotation
  // ----------------------------------------------

  const rotateLeft =
    await sharp(plateBuffer)
      .rotate(-6, {
        background: {
          r: 255,
          g: 255,
          b: 255,
        },
      })
      .sharpen()
      .jpeg({
        quality: 92,
      })
      .toBuffer();


  variants.push({
    name:
      'plate-rotate-left',

    buffer:
      rotateLeft,

    weight:
      0.95,
  });


  // ----------------------------------------------
  // 4. Slight right rotation
  // ----------------------------------------------

  const rotateRight =
    await sharp(plateBuffer)
      .rotate(6, {
        background: {
          r: 255,
          g: 255,
          b: 255,
        },
      })
      .sharpen()
      .jpeg({
        quality: 92,
      })
      .toBuffer();


  variants.push({
    name:
      'plate-rotate-right',

    buffer:
      rotateRight,

    weight:
      0.95,
  });


  // ----------------------------------------------
  // 5. Side-angle left correction
  // ----------------------------------------------

  try {

    const sideLeft =
      await sharp(plateBuffer)
        .affine(
          [
            [1, -0.12],
            [0, 1],
          ],
          {
            background: {
              r: 255,
              g: 255,
              b: 255,
            },
          }
        )
        .sharpen()
        .jpeg({
          quality: 92,
        })
        .toBuffer();


    variants.push({
      name:
        'plate-side-left',

      buffer:
        sideLeft,

      weight:
        1.0,
    });

  } catch (error) {

    console.log(
      'Side-left preprocessing skipped'
    );
  }


  // ----------------------------------------------
  // 6. Side-angle right correction
  // ----------------------------------------------

  try {

    const sideRight =
      await sharp(plateBuffer)
        .affine(
          [
            [1, 0.12],
            [0, 1],
          ],
          {
            background: {
              r: 255,
              g: 255,
              b: 255,
            },
          }
        )
        .sharpen()
        .jpeg({
          quality: 92,
        })
        .toBuffer();


    variants.push({
      name:
        'plate-side-right',

      buffer:
        sideRight,

      weight:
        1.0,
    });

  } catch (error) {

    console.log(
      'Side-right preprocessing skipped'
    );
  }


  return variants;
};


// ==================================================
// EXTRACT OCR CANDIDATES
// ==================================================

const extractCandidates = (
  apiResults,
  source,
  weight
) => {

  const candidates = [];


  for (
    const result of apiResults
  ) {

    const primary =
      correctIndianPlate(
        result.plate
      );


    if (primary) {

      candidates.push({
        plateNumber:
          primary,

        score:
          result.score || 0,

        weightedScore:
          (result.score || 0) *
          weight,

        valid:
          isValidIndianPlate(
            primary
          ),

        source,
      });
    }


    for (
      const item
      of (
        result.candidates || []
      )
    ) {

      const plate =
        correctIndianPlate(
          item.plate
        );


      if (!plate) {
        continue;
      }


      candidates.push({
        plateNumber:
          plate,

        score:
          item.score || 0,

        weightedScore:
          (item.score || 0) *
          weight,

        valid:
          isValidIndianPlate(
            plate
          ),

        source,
      });
    }
  }


  return candidates;
};


// ==================================================
// VOTE FOR EXACT PLATE STRING
// ==================================================

const chooseFinalPlate = (
  candidates
) => {

  if (
    candidates.length === 0
  ) {
    return null;
  }


  // Prefer valid Indian plates.
  let usable =
    candidates.filter(
      (candidate) =>
        candidate.valid
    );


  if (
    usable.length === 0
  ) {
    usable = candidates;
  }


  const votes = {};


  for (
    const candidate
    of usable
  ) {

    const plate =
      candidate.plateNumber;


    if (!votes[plate]) {

      votes[plate] = {
        score: 0,
        count: 0,
        bestConfidence: 0,
        sources: new Set(),
      };
    }


    votes[plate].score +=
      candidate.weightedScore;


    votes[plate].count++;


    votes[plate]
      .sources
      .add(
        candidate.source
      );


    votes[plate]
      .bestConfidence =
        Math.max(
          votes[plate]
            .bestConfidence,

          candidate.score
        );
  }


  const sorted =
    Object.entries(votes)
      .sort(
        (a, b) => {

          const scoreA =
            a[1].score +
            a[1].count *
              0.35 +
            a[1].sources.size *
              0.6;


          const scoreB =
            b[1].score +
            b[1].count *
              0.35 +
            b[1].sources.size *
              0.6;


          return (
            scoreB -
            scoreA
          );
        }
      );


  const [
    plateNumber,
    stats,
  ] = sorted[0];


  return {
    plateNumber,

    confidence:
      stats.bestConfidence,
  };
};


// ==================================================
// PROCESS ONE DETECTED PLATE
// ==================================================

const processDetectedPlate = async (
  baseBuffer,
  detection,
  index
) => {

  const crop =
    await cropDetectedPlate(
      baseBuffer,
      detection.box
    );


  const variants =
    await createPlateVariants(
      crop
    );


  let allCandidates = [];


  for (
    let i = 0;
    i < variants.length;
    i++
  ) {

    const variant =
      variants[i];


    if (i > 0) {
      await sleep(
        REQUEST_DELAY
      );
    }


    try {

      console.log(
        `Plate ${index + 1}: ${variant.name}`
      );


      const results =
        await callPlateRecognizer(
          variant.buffer,
          variant.name
        );


      const candidates =
        extractCandidates(
          results,
          variant.name,
          variant.weight
        );


      allCandidates.push(
        ...candidates
      );

    } catch (error) {

      console.error(
        `${variant.name} OCR failed:`,

        error.response?.data ||
        error.message
      );
    }
  }


  return chooseFinalPlate(
    allCandidates
  );
};


// ==================================================
// MAIN OCR
// ==================================================

const recognizePlates = async (
  imageBuffer,
  originalName,
  mimeType
) => {

  try {

    if (!imageBuffer) {
      throw new Error(
        'Image buffer missing'
      );
    }


    if (
      !process.env
        .PLATE_RECOGNIZER_API_KEY
    ) {
      throw new Error(
        'Plate Recognizer API key missing'
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


    const baseBuffer =
      await prepareBaseImage(
        imageBuffer
      );


    // ----------------------------------------------
    // FIRST PASS:
    // detect plate locations in full image
    // ----------------------------------------------

    let detections = [];


    try {

      detections =
        await callPlateRecognizer(
          baseBuffer,
          'detection-pass'
        );

    } catch (error) {

      console.error(
        'Initial detection failed:',

        error.response?.data ||
        error.message
      );
    }


    if (
      detections.length === 0
    ) {

      return [];
    }


    // ----------------------------------------------
    // SECOND PASS:
    // crop each plate and OCR it carefully
    // ----------------------------------------------

    const finalResults = [];


    for (
      let i = 0;
      i < detections.length;
      i++
    ) {

      // Prevent rate-limit between plates
      if (i > 0) {
        await sleep(
          REQUEST_DELAY
        );
      }


      const result =
        await processDetectedPlate(
          baseBuffer,
          detections[i],
          i
        );


      if (result) {

        finalResults.push(
          result
        );
      }
    }


    console.log(
      'Final OCR results:',
      finalResults
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