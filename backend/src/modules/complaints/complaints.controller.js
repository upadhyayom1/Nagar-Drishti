const { z } = require('zod');
const complaintsService = require('./complaints.service');

const createComplaintSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['POTHOLE', 'ACCIDENT', 'ROAD_DAMAGE', 'TRAFFIC_SIGNAL', 'STREETLIGHT', 'WATERLOGGING', 'ROAD_BLOCKAGE', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  latitude: z.number(),
  longitude: z.number(),
  roadId: z.string().optional(),
  nearestCameraId: z.string().optional(),
});

const create = async (req, res) => {
  try {
    const data = createComplaintSchema.parse(req.body);
    const complaint = await complaintsService.createComplaint(req.user.id, data);
    res.status(201).json({ success: true, complaint });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await complaintsService.getComplaints({ userId: req.user.id });
    res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAll = async (req, res) => {
  try {
    const complaints = await complaintsService.getComplaints({});
    res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['POTHOLE', 'ACCIDENT', 'ROAD_DAMAGE', 'TRAFFIC_SIGNAL', 'STREETLIGHT', 'WATERLOGGING', 'ROAD_BLOCKAGE', 'OTHER']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await complaintsService.getComplaintById(id);
    
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = updateSchema.parse(req.body);
    const updated = await complaintsService.updateComplaint(id, data);
    res.status(200).json({ success: true, complaint: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMapComplaints = async (req, res) => {
  try {
    const filters = {};
    if (req.user.role !== 'ADMIN') {
      // Normal users might only see certain complaints or all public ones, for now show all public
      // Assuming all are public unless we have a specific privacy flag
    }
    const complaints = await complaintsService.getComplaints(filters);
    const mapped = complaints.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category,
      latitude: c.latitude,
      longitude: c.longitude,
      status: c.status,
      timestamp: c.createdAt,
    }));
    res.status(200).json({ success: true, complaints: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  create,
  getMyComplaints,
  getAll,
  update,
  getMapComplaints,
};
