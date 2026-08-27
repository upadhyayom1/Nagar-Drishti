const { z } = require('zod');
const adminService = require('./admin.service');
const complaintsService = require('../complaints/complaints.service');
const incidentsService = require('../incidents/incidents.service');

const getDashboard = async (req, res) => {
  try {
    const summary = await adminService.getDashboardSummary();
    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getComplaints = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;

    const complaints = await complaintsService.getComplaints(filters);
    res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const patchComplaintStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
});

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = patchComplaintStatusSchema.parse(req.body);
    const updated = await complaintsService.updateComplaint(id, { status });
    res.status(200).json({ success: true, complaint: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const patchComplaintPrioritySchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

const updateComplaintPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = patchComplaintPrioritySchema.parse(req.body);
    const updated = await complaintsService.updateComplaint(id, { priority });
    res.status(200).json({ success: true, complaint: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getIncidents = async (req, res) => {
  try {
    const { status, severity, type } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (type) filters.type = type;

    const incidents = await incidentsService.getIncidents(filters);
    res.status(200).json({ success: true, incidents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getDashboard,
  getComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  getIncidents,
};
