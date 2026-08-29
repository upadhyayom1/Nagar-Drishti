const { prisma } = require('../../lib/prisma');

async function getDeduplicatedActiveAlerts({ severity, type } = {}) {
    const where = { status: 'ACTIVE' };
    if (severity && severity !== 'all') where.severity = String(severity).toUpperCase();
    if (type && type !== 'all') {
      const typeMap = { BLACKLIST_VEHICLE: 'BLACKLIST_MATCH', TRAFFIC_SURGE: 'CONGESTION', ROUTE_ANOMALY: 'ROUTE_ANOMALY' };
      const mappedType = typeMap[String(type).toUpperCase()];
      if (!mappedType) return [];
      where.type = mappedType;
    }
    const alerts = await prisma.alert.findMany({
      where,
      take: 200,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { plateNumber: true } },
        camera: { select: { id: true, name: true, cameraCode: true, latitude: true, longitude: true, zone: { select: { name: true } } } }
      },
    });

    // Deduplicate: Keep only the most recent alert per camera for CONGESTION, and per vehicle for BLACKLIST
    const seenKeys = new Set();
    const deduplicatedAlerts = [];

    for (const alert of alerts) {
      let key;
      if (alert.type === 'CONGESTION') {
        key = `CONGESTION_${alert.cameraId}`;
      } else if (alert.type === 'BLACKLIST_MATCH') {
        key = `BLACKLIST_${alert.vehicleId || alert.vehicle?.plateNumber}`;
      } else {
        key = `${alert.type}_${alert.id}`;
      }

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deduplicatedAlerts.push(alert);
      }
    }

    return deduplicatedAlerts.map((alert) => ({
      id: alert.id,
      type: alert.type === 'BLACKLIST_MATCH' ? 'BLACKLIST_VEHICLE' : alert.type === 'CONGESTION' ? 'TRAFFIC_SURGE' : alert.type,
      severity: alert.severity.toLowerCase(),
      title: alert.type === 'BLACKLIST_MATCH' ? 'Blacklisted Threat Detected' : alert.type === 'CONGESTION' ? 'Traffic Congestion Spike' : alert.type.replaceAll('_', ' '),
      description: alert.message,
      vehiclePlate: alert.vehicle?.plateNumber,
      cameraId: alert.camera?.id || '',
      cameraCode: alert.camera?.cameraCode || 'CAM',
      cameraName: alert.camera?.name || alert.camera?.cameraCode || 'Prayagraj Optical Node',
      location: alert.camera ? `${alert.camera.name || alert.camera.cameraCode}${alert.camera.zone?.name ? ` (${alert.camera.zone.name})` : ''}` : 'Prayagraj Network',
      timestamp: alert.createdAt,
      isRead: alert.status !== 'ACTIVE',
      isResolved: alert.status === 'RESOLVED',
    }));
}

exports.getAlerts = async (req, res) => {
  try {
    const { severity, type, limit } = req.query;
    const alerts = await getDeduplicatedActiveAlerts({ severity, type });
    res.status(200).json(alerts.slice(0, Math.min(Math.max(Number(limit) || 100, 1), 100)));
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActiveAlertCount = async (req, res) => {
  try {
    const alerts = await getDeduplicatedActiveAlerts();
    const simulationAlerts = global.simulationEngine?.running ? global.simulationEngine.getLiveAlerts() : [];
    res.status(200).json(alerts.length + simulationAlerts.length);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getNotificationSummary = async (req, res) => {
  try {
    const databaseAlerts = await getDeduplicatedActiveAlerts();
    const simulationAlerts = global.simulationEngine?.running ? global.simulationEngine.getLiveAlerts() : [];
    const alerts = [...simulationAlerts, ...databaseAlerts]
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 100);
    res.status(200).json({ success: true, data: { items: alerts.slice(0, limit), total: alerts.length } });
  } catch (error) {
    console.error('Error fetching notification summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body.status || '').toUpperCase();
    if (!['ACKNOWLEDGED', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be ACKNOWLEDGED or RESOLVED' });
    }
    const alert = await prisma.alert.update({
      where: { id },
      data: { status, ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}) },
    });
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Alert not found' });
    console.error('Error updating alert:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.acknowledgeAllAlerts = async (req, res) => {
  try {
    const result = await prisma.alert.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'ACKNOWLEDGED' }
    });
    res.status(200).json({ success: true, message: `Acknowledged ${result.count} alerts` });
  } catch (error) {
    console.error('Error acknowledging all alerts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

