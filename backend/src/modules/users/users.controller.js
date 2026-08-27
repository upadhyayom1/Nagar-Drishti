const usersService = require('./users.service');
const { z } = require('zod');

const me = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
});

const updateMe = async (req, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updatedUser = await usersService.updateUser(req.user.id, data);
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyTrips = async (req, res) => {
  try {
    const trips = await usersService.getUserTrips(req.user.id);
    res.status(200).json({ success: true, trips });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await usersService.getUserComplaints(req.user.id);
    res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyIncidents = async (req, res) => {
  try {
    // Only return incidents linked to the user's complaints
    const incidents = await usersService.getUserIncidents(req.user.id);
    res.status(200).json({ success: true, incidents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  me,
  updateMe,
  getMyTrips,
  getMyComplaints,
  getMyIncidents,
};
