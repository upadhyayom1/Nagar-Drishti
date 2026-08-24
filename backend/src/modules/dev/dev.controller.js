const { prisma } = require('../../lib/prisma');

exports.createUser = async (req, res) => {
  try {
    const { id, username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    let bcryptLib;
    try {
      bcryptLib = require('bcryptjs');
    } catch {
      bcryptLib = require('bcrypt');
    }
    
    const passwordHash = await bcryptLib.hash(password, 10);
    
    const userData = {
      username,
      passwordHash,
      role: role || 'OPERATOR'
    };
    
    if (id && id.trim() !== '') {
      userData.id = id;
    }
    
    const user = await prisma.user.create({
      data: userData
    });
    
    // Remove the passwordHash from the response for security
    const { passwordHash: _, ...userResponse } = user;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (err) {
    console.error('Error creating user via Dev API:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error while creating user'
    });
  }
};

const blacklistService = require('../blacklist/blacklist.service');

exports.simulateDetection = async (req, res) => {
  try {
    const { plateNumber, cameraId, vehicleId } = req.body;
    
    if (!plateNumber || !cameraId || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'plateNumber, cameraId, and vehicleId are required'
      });
    }

    let vehicle = await prisma.vehicle.findUnique({ where: { plateNumber } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: { plateNumber }
      });
    }

    let camera = await prisma.camera.findFirst({ where: { cameraCode: cameraId } });
    if (!camera) {
      camera = await prisma.camera.findUnique({ where: { id: cameraId } });
    }
    
    if (!camera) {
      camera = await prisma.camera.create({
        data: {
          cameraCode: cameraId,
          name: 'Simulated Camera ' + cameraId,
          latitude: 28.6304,
          longitude: 77.2177,
        }
      });
    }

    const detection = await prisma.detection.create({
      data: {
        vehicleId: vehicle.id,
        cameraId: camera.id,
        plateText: plateNumber,
        timestamp: new Date(),
        ocrConfidence: 0.99,
        vehicleConfidence: 0.99,
        source: 'SIMULATION'
      }
    });

    const result = await blacklistService.processDetectionForBlacklist(detection);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error simulating detection:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
