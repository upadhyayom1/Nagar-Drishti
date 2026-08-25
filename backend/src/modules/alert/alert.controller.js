const { prisma } = require('../../lib/prisma');

exports.getAlerts = async (req, res) => {
  try {
    const { severity, type, limit } = req.query;
    
    const where = { status: 'ACTIVE' };
    if (severity && severity !== 'all') where.severity = String(severity).toUpperCase();
    if (type && type !== 'all') {
      const typeMap = { BLACKLIST_VEHICLE: 'BLACKLIST_MATCH', TRAFFIC_SURGE: 'CONGESTION', ROUTE_ANOMALY: 'ROUTE_ANOMALY' };
      const mappedType = typeMap[String(type).toUpperCase()];
      if (!mappedType) return res.status(200).json([]);
      where.type = mappedType;
    }
    const alerts = await prisma.alert.findMany({
      where,
      take: Math.min(Math.max(Number(limit) || 100, 1), 100),
      orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { plateNumber: true } }, camera: { select: { id: true, name: true, cameraCode: true, latitude: true, longitude: true } } },
    });
    res.status(200).json(alerts.map((alert) => ({
      id: alert.id,
      type: alert.type === 'BLACKLIST_MATCH' ? 'BLACKLIST_VEHICLE' : alert.type === 'CONGESTION' ? 'TRAFFIC_SURGE' : alert.type,
      severity: alert.severity.toLowerCase(),
      title: alert.type.replaceAll('_', ' '),
      description: alert.message,
      vehiclePlate: alert.vehicle?.plateNumber,
      cameraId: alert.camera?.id || '',
      cameraName: alert.camera?.name || alert.camera?.cameraCode || 'Unassigned camera',
      location: alert.camera ? `${alert.camera.latitude}, ${alert.camera.longitude}` : 'Unknown location',
      timestamp: alert.createdAt,
      isRead: alert.status !== 'ACTIVE',
      isResolved: alert.status === 'RESOLVED',
    })));
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActiveAlertCount = async (req, res) => {
  try {
    const count = await prisma.alert.count({ where: { status: 'ACTIVE' } });
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
