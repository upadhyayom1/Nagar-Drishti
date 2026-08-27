const { z } = require('zod');
const tripsService = require('./trips.service');

const planTripSchema = z.object({
  start: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  destination: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

const plan = async (req, res) => {
  try {
    const data = planTripSchema.parse(req.body);
    const planResult = await tripsService.planTrip(data);
    res.status(200).json({ success: true, plan: planResult });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const saveTripSchema = z.object({
  name: z.string().optional(),
  startLatitude: z.number(),
  startLongitude: z.number(),
  destinationLatitude: z.number(),
  destinationLongitude: z.number(),
  distance: z.number(),
  estimatedTime: z.number(),
  routeGeometry: z.any(),
});

const create = async (req, res) => {
  try {
    const data = saveTripSchema.parse(req.body);
    const trip = await tripsService.saveTrip(req.user.id, data);
    res.status(201).json({ success: true, trip });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAll = async (req, res) => {
  try {
    const trips = await tripsService.getTrips(req.user.id);
    res.status(200).json({ success: true, trips });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await tripsService.deleteTrip(id, req.user.id);
    res.status(200).json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  plan,
  create,
  getAll,
  remove,
};
