const NODES = Object.freeze({
  // Core
  HIGH_COURT: [81.8321, 25.4509],
  MG_CIVIL: [81.8407, 25.4501],
  CIVIL_LINES: [81.8468, 25.4516],
  BALSON: [81.8534, 25.4542],
  KATRA: [81.8565, 25.4655],
  LOHIA: [81.8382, 25.4468],
  PRAYAGRAJ_JN: [81.8265, 25.4430],
  ZERO_ROAD: [81.8299, 25.4376],
  
  // University / Katra
  UNIVERSITY: [81.8644, 25.4586],
  GEORGE_TOWN: [81.8716, 25.4624],
  ALLAHPUR: [81.8707, 25.4470],
  
  // Sangam / East
  BAIRHANA: [81.8778, 25.4408],
  DARAGANJ: [81.8862, 25.4310],
  SANGAM: [81.8822, 25.4165],
  MINTO_PARK: [81.8500, 25.4271],
  
  // Yamuna Bridge
  YAMUNA_NORTH: [81.8598, 25.4253],
  YAMUNA_MID: [81.8624, 25.4192],
  YAMUNA_SOUTH: [81.8650, 25.4120],
  
  // Naini
  NAINI_CHUNGI: [81.8692, 25.4025],
  NAINI_MARKET: [81.8770, 25.3943],
  MIRZAPUR_GATE: [81.8880, 25.3867],
  
  // North
  TELIYARGANJ: [81.8654, 25.4874],
  PHAPHAMAU: [81.8820, 25.5403],
  
  // Shastri / Jhunsi
  SHASTRI_WEST: [81.8950, 25.4365],
  SHASTRI_MID: [81.9040, 25.4378],
  SHASTRI_EAST: [81.9130, 25.4388],
  JHUNSI_CHOWKI: [81.9250, 25.4360],
  JHUNSI: [81.9360, 25.4345],

  // NEW NODES (Expanded Network)
  SUBEDARGANJ: [81.8023, 25.4421],
  BAMRAULI: [81.7450, 25.4390],
  AIRPORT_GATE: [81.7350, 25.4400],
  JHALWA_CHOURAHA: [81.7850, 25.4320],
  IIIT_GATE: [81.7700, 25.4300],
  
  SOHBATIABAGH: [81.8550, 25.4500],
  ALLENKGANJ: [81.8600, 25.4680],
  GOVINDPUR: [81.8700, 25.4800],
  
  OLD_YAMUNA_NORTH: [81.8500, 25.4230],
  OLD_YAMUNA_SOUTH: [81.8550, 25.4100],
  
  NAINI_INDUSTRIAL: [81.8650, 25.3850],
  NAINI_STATION: [81.8600, 25.3900],
  ARAI_GATE: [81.8500, 25.3700],
  DANDI: [81.8400, 25.3650],
  
  RAJAPUR: [81.8450, 25.4700],
  MEERAPUR: [81.8350, 25.4300],
  CHOWK: [81.8350, 25.4400],
  JOHNSTON_GANJ: [81.8300, 25.4450],
  
  PHAPHAMAU_BRIDGE: [81.8750, 25.5200],
  SHANTIPURAM: [81.8700, 25.5450],
  
  SANGAM_TENT_CITY: [81.8850, 25.4200],
  ALOPAL_BAGH: [81.8750, 25.4500],
  
  GHOORPUR: [81.8200, 25.3500],
  KARAMCHHARI_NAGAR: [81.8100, 25.4200],
  RAMBAGH: [81.8450, 25.4400],
});

const zones = [
  { zoneCode: 'PRY-CENTRAL', name: 'Civil Lines and Railway Core' },
  { zoneCode: 'PRY-KATRA', name: 'Katra, University and Allapur' },
  { zoneCode: 'PRY-SANGAM', name: 'Sangam and Daraganj' },
  { zoneCode: 'PRY-NAINI', name: 'Naini and Yamuna Crossing' },
  { zoneCode: 'PRY-NORTH', name: 'Teliarganj and Phaphamau' },
  { zoneCode: 'PRY-JHUNSI', name: 'Shastri Bridge and Jhunsi' },
  // New Zones
  { zoneCode: 'PRY-WEST', name: 'Subedarganj, Jhalwa, Bamrauli' },
  { zoneCode: 'PRY-SOUTH', name: 'Dandi, Ghoorpur, Industrial' },
  { zoneCode: 'PRY-OLD_CITY', name: 'Chowk, Meerapur, Rambagh' }
];

const roadSpecs = [
  ['PRY-RD-MG', 'Mahatma Gandhi Marg', 40, ['HIGH_COURT', 'MG_CIVIL', 'CIVIL_LINES', 'BALSON', 'KATRA']],
  ['PRY-RD-STATION', 'Civil Lines Station Approach', 30, ['CIVIL_LINES', 'LOHIA', 'PRAYAGRAJ_JN', 'ZERO_ROAD']],
  ['PRY-RD-KATRA', 'Katra Road and University Corridor', 30, ['KATRA', 'UNIVERSITY', 'GEORGE_TOWN', 'ALLAHPUR']],
  ['PRY-RD-NORTH', 'Katra–Teliarganj–Phaphamau Corridor', 50, ['KATRA', 'TELIYARGANJ', 'PHAPHAMAU']],
  ['PRY-RD-DARAGANJ', 'Allapur–Bairhana–Daraganj Road', 30, ['ALLAHPUR', 'BAIRHANA', 'DARAGANJ']],
  ['PRY-RD-SANGAM', 'Sangam and Parade Approach', 20, ['DARAGANJ', 'SANGAM']],
  ['PRY-RD-MINTO', 'Minto Road and Bridge Approach', 30, ['CIVIL_LINES', 'MINTO_PARK', 'YAMUNA_NORTH']],
  ['PRY-RD-YAMUNA', 'New Yamuna Bridge', 50, ['YAMUNA_NORTH', 'YAMUNA_MID', 'YAMUNA_SOUTH', 'NAINI_CHUNGI']],
  ['PRY-RD-MIRZAPUR', 'Mirzapur Road, Naini', 40, ['NAINI_CHUNGI', 'NAINI_MARKET', 'MIRZAPUR_GATE']],
  ['PRY-RD-SHASTRI', 'Shastri Bridge', 40, ['ALLAHPUR', 'SHASTRI_WEST', 'SHASTRI_MID', 'SHASTRI_EAST']],
  ['PRY-RD-JHUNSI', 'Jhunsi Road', 40, ['SHASTRI_EAST', 'JHUNSI_CHOWKI', 'JHUNSI']],
  ['PRY-RD-MELA', 'Sangam–New Yamuna Link', 20, ['SANGAM', 'MINTO_PARK', 'YAMUNA_NORTH']],
  // New Roads
  ['PRY-RD-AIRPORT', 'Bamrauli Airport Road', 60, ['PRAYAGRAJ_JN', 'SUBEDARGANJ', 'BAMRAULI', 'AIRPORT_GATE']],
  ['PRY-RD-JHALWA', 'Jhalwa IT Corridor', 40, ['SUBEDARGANJ', 'KARAMCHHARI_NAGAR', 'JHALWA_CHOURAHA', 'IIIT_GATE']],
  ['PRY-RD-OLD_CITY', 'Chowk - Meerapur Road', 30, ['JOHNSTON_GANJ', 'CHOWK', 'MEERAPUR', 'ZERO_ROAD']],
  ['PRY-RD-INDUSTRIAL', 'Naini Industrial Highway', 50, ['NAINI_CHUNGI', 'NAINI_STATION', 'NAINI_INDUSTRIAL', 'ARAI_GATE', 'DANDI']],
  ['PRY-RD-OLD_YAMUNA', 'Old Yamuna Bridge', 40, ['MEERAPUR', 'OLD_YAMUNA_NORTH', 'OLD_YAMUNA_SOUTH', 'NAINI_STATION']],
  ['PRY-RD-ALLENKGANJ', 'Allen Ganj & Govindpur', 30, ['KATRA', 'ALLENKGANJ', 'GOVINDPUR', 'TELIYARGANJ']],
  ['PRY-RD-HIGHWAY_SOUTH', 'Rewa Highway', 70, ['DANDI', 'GHOORPUR']],
];

const cameraSpecs = [
  // Original
  ['PRY-CAM-001', 'High Court — MG Marg', 'HIGH_COURT', 'PRY-RD-MG', 'PRY-CENTRAL', 'EASTBOUND'],
  ['PRY-CAM-002', 'MG Marg — Civil Lines', 'MG_CIVIL', 'PRY-RD-MG', 'PRY-CENTRAL', 'EASTBOUND'],
  ['PRY-CAM-003', 'Civil Lines Bus Stand', 'CIVIL_LINES', 'PRY-RD-MG', 'PRY-CENTRAL', 'EASTBOUND'],
  ['PRY-CAM-004', 'Lohia Marg — Station Approach', 'LOHIA', 'PRY-RD-STATION', 'PRY-CENTRAL', 'SOUTHBOUND'],
  ['PRY-CAM-005', 'Prayagraj Junction Entry', 'PRAYAGRAJ_JN', 'PRY-RD-STATION', 'PRY-CENTRAL', 'WESTBOUND'],
  ['PRY-CAM-006', 'Zero Road Junction', 'ZERO_ROAD', 'PRY-RD-STATION', 'PRY-CENTRAL', 'SOUTHBOUND'],
  ['PRY-CAM-007', 'Katra Crossing', 'KATRA', 'PRY-RD-MG', 'PRY-KATRA', 'NORTHBOUND'],
  ['PRY-CAM-008', 'Allahabad University Gate', 'UNIVERSITY', 'PRY-RD-KATRA', 'PRY-KATRA', 'EASTBOUND'],
  ['PRY-CAM-009', 'George Town Junction', 'GEORGE_TOWN', 'PRY-RD-KATRA', 'PRY-KATRA', 'SOUTHBOUND'],
  ['PRY-CAM-010', 'Allapur Junction', 'ALLAHPUR', 'PRY-RD-KATRA', 'PRY-KATRA', 'SOUTHBOUND'],
  ['PRY-CAM-011', 'Bairhana Junction', 'BAIRHANA', 'PRY-RD-DARAGANJ', 'PRY-SANGAM', 'EASTBOUND'],
  ['PRY-CAM-012', 'Daraganj Junction', 'DARAGANJ', 'PRY-RD-DARAGANJ', 'PRY-SANGAM', 'SOUTHBOUND'],
  ['PRY-CAM-013', 'Sangam Parade Approach', 'SANGAM', 'PRY-RD-SANGAM', 'PRY-SANGAM', 'SOUTHBOUND'],
  ['PRY-CAM-014', 'Minto Park Approach', 'MINTO_PARK', 'PRY-RD-MINTO', 'PRY-SANGAM', 'SOUTHEASTBOUND'],
  ['PRY-CAM-015', 'New Yamuna Bridge North', 'YAMUNA_NORTH', 'PRY-RD-YAMUNA', 'PRY-NAINI', 'SOUTHBOUND'],
  ['PRY-CAM-016', 'New Yamuna Bridge Pylon', 'YAMUNA_MID', 'PRY-RD-YAMUNA', 'PRY-NAINI', 'SOUTHBOUND'],
  ['PRY-CAM-017', 'New Yamuna Bridge South', 'YAMUNA_SOUTH', 'PRY-RD-YAMUNA', 'PRY-NAINI', 'SOUTHBOUND'],
  ['PRY-CAM-018', 'Naini Chungi', 'NAINI_CHUNGI', 'PRY-RD-YAMUNA', 'PRY-NAINI', 'SOUTHBOUND'],
  ['PRY-CAM-019', 'Naini Market', 'NAINI_MARKET', 'PRY-RD-MIRZAPUR', 'PRY-NAINI', 'SOUTHEASTBOUND'],
  ['PRY-CAM-020', 'Mirzapur Road Exit', 'MIRZAPUR_GATE', 'PRY-RD-MIRZAPUR', 'PRY-NAINI', 'SOUTHEASTBOUND'],
  ['PRY-CAM-021', 'Teliarganj Crossing', 'TELIYARGANJ', 'PRY-RD-NORTH', 'PRY-NORTH', 'NORTHBOUND'],
  ['PRY-CAM-022', 'Phaphamau Entry', 'PHAPHAMAU', 'PRY-RD-NORTH', 'PRY-NORTH', 'NORTHBOUND'],
  ['PRY-CAM-023', 'Shastri Bridge West', 'SHASTRI_WEST', 'PRY-RD-SHASTRI', 'PRY-JHUNSI', 'EASTBOUND'],
  ['PRY-CAM-024', 'Shastri Bridge Deck', 'SHASTRI_MID', 'PRY-RD-SHASTRI', 'PRY-JHUNSI', 'EASTBOUND'],
  ['PRY-CAM-025', 'Shastri Bridge East', 'SHASTRI_EAST', 'PRY-RD-SHASTRI', 'PRY-JHUNSI', 'EASTBOUND'],
  ['PRY-CAM-026', 'Jhunsi Police Chowki', 'JHUNSI_CHOWKI', 'PRY-RD-JHUNSI', 'PRY-JHUNSI', 'EASTBOUND'],
  ['PRY-CAM-027', 'Jhunsi Entry', 'JHUNSI', 'PRY-RD-JHUNSI', 'PRY-JHUNSI', 'EASTBOUND'],
  // New Cameras
  ['PRY-CAM-028', 'Subedarganj Crossing', 'SUBEDARGANJ', 'PRY-RD-AIRPORT', 'PRY-WEST', 'WESTBOUND'],
  ['PRY-CAM-029', 'Bamrauli Approach', 'BAMRAULI', 'PRY-RD-AIRPORT', 'PRY-WEST', 'WESTBOUND'],
  ['PRY-CAM-030', 'Airport Main Gate', 'AIRPORT_GATE', 'PRY-RD-AIRPORT', 'PRY-WEST', 'WESTBOUND'],
  ['PRY-CAM-031', 'Karamchari Nagar', 'KARAMCHHARI_NAGAR', 'PRY-RD-JHALWA', 'PRY-WEST', 'SOUTHBOUND'],
  ['PRY-CAM-032', 'Jhalwa Chouraha', 'JHALWA_CHOURAHA', 'PRY-RD-JHALWA', 'PRY-WEST', 'SOUTHBOUND'],
  ['PRY-CAM-033', 'IIIT Allahabad Gate', 'IIIT_GATE', 'PRY-RD-JHALWA', 'PRY-WEST', 'SOUTHBOUND'],
  ['PRY-CAM-034', 'Johnston Ganj', 'JOHNSTON_GANJ', 'PRY-RD-OLD_CITY', 'PRY-OLD_CITY', 'SOUTHBOUND'],
  ['PRY-CAM-035', 'Chowk Market', 'CHOWK', 'PRY-RD-OLD_CITY', 'PRY-OLD_CITY', 'SOUTHBOUND'],
  ['PRY-CAM-036', 'Meerapur Junction', 'MEERAPUR', 'PRY-RD-OLD_CITY', 'PRY-OLD_CITY', 'SOUTHBOUND'],
  ['PRY-CAM-037', 'Old Yamuna Bridge North', 'OLD_YAMUNA_NORTH', 'PRY-RD-OLD_YAMUNA', 'PRY-OLD_CITY', 'SOUTHBOUND'],
  ['PRY-CAM-038', 'Old Yamuna Bridge South', 'OLD_YAMUNA_SOUTH', 'PRY-RD-OLD_YAMUNA', 'PRY-NAINI', 'SOUTHBOUND'],
  ['PRY-CAM-039', 'Naini Station', 'NAINI_STATION', 'PRY-RD-INDUSTRIAL', 'PRY-NAINI', 'SOUTHBOUND'],
  ['PRY-CAM-040', 'Naini Industrial Hub', 'NAINI_INDUSTRIAL', 'PRY-RD-INDUSTRIAL', 'PRY-NAINI', 'SOUTHBOUND'],
  ['PRY-CAM-041', 'ARAI Gate', 'ARAI_GATE', 'PRY-RD-INDUSTRIAL', 'PRY-SOUTH', 'SOUTHBOUND'],
  ['PRY-CAM-042', 'Dandi Crossing', 'DANDI', 'PRY-RD-INDUSTRIAL', 'PRY-SOUTH', 'SOUTHBOUND'],
  ['PRY-CAM-043', 'Ghoorpur Toll Plaza', 'GHOORPUR', 'PRY-RD-HIGHWAY_SOUTH', 'PRY-SOUTH', 'SOUTHBOUND'],
  ['PRY-CAM-044', 'Sohbatiabagh', 'SOHBATIABAGH', 'PRY-RD-MG', 'PRY-KATRA', 'EASTBOUND'],
  ['PRY-CAM-045', 'Allen Ganj', 'ALLENKGANJ', 'PRY-RD-ALLENKGANJ', 'PRY-KATRA', 'NORTHBOUND'],
  ['PRY-CAM-046', 'Govindpur', 'GOVINDPUR', 'PRY-RD-ALLENKGANJ', 'PRY-KATRA', 'NORTHBOUND'],
  ['PRY-CAM-047', 'Rajapur', 'RAJAPUR', 'PRY-RD-MG', 'PRY-CENTRAL', 'EASTBOUND'],
  ['PRY-CAM-048', 'Rambagh Station', 'RAMBAGH', 'PRY-RD-OLD_CITY', 'PRY-OLD_CITY', 'EASTBOUND'],
  ['PRY-CAM-049', 'Sangam Tent City Area', 'SANGAM_TENT_CITY', 'PRY-RD-SANGAM', 'PRY-SANGAM', 'SOUTHBOUND'],
  ['PRY-CAM-050', 'Alopi Bagh', 'ALOPAL_BAGH', 'PRY-RD-DARAGANJ', 'PRY-SANGAM', 'EASTBOUND'],
  ['PRY-CAM-051', 'Phaphamau Bridge Mid', 'PHAPHAMAU_BRIDGE', 'PRY-RD-NORTH', 'PRY-NORTH', 'NORTHBOUND'],
  ['PRY-CAM-052', 'Shantipuram Highway', 'SHANTIPURAM', 'PRY-RD-NORTH', 'PRY-NORTH', 'NORTHBOUND'],
];

function getRoadRecords() {
  return roadSpecs.map(([roadCode, name, speedLimit, nodeKeys]) => ({
    roadCode,
    name,
    speedLimit,
    geometry: { type: 'LineString', coordinates: nodeKeys.map((nodeKey) => NODES[nodeKey]) },
  }));
}

function getCameraRecords(zoneByCode, roadByCode) {
  return cameraSpecs.map(([cameraCode, name, nodeKey, roadCode, zoneCode, direction]) => {
    const coords = NODES[nodeKey];
    if (!coords) throw new Error(`Node coords missing for ${nodeKey}`);
    const [longitude, latitude] = coords;
    
    const roadId = roadByCode.get(roadCode);
    const zoneId = zoneByCode.get(zoneCode);
    if (!roadId || !zoneId) throw new Error(`Network dependencies missing for ${cameraCode}`);

    return {
      cameraCode,
      name,
      latitude,
      longitude,
      direction,
      roadId,
      zoneId,
      status: 'ONLINE',
    };
  });
}

module.exports = { NODES, zones, getRoadRecords, getCameraRecords };
