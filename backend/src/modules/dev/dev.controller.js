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
