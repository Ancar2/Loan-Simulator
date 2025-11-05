const AuditLog = require("../models/auditLog.model");

// Crear log (uso interno)
exports.createAuditLog = async (params) => {
  const log = new AuditLog(params);
  await log.save();
  return log;
};

// Consultar logs vía HTTP
exports.getAuditLogs = async (req, res) => {
  try {
    const { role } = req.decode;

    if (!["admin", "owner"].includes(role)) {
      return res.status(403).json({ msj: "No tienes permiso para ver los logs de auditoría" });
    }

    const { userId, action, targetModel, status, startDate, endDate } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (targetModel) query.targetModel = targetModel;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 });
    res.status(200).json({ total: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ msj: "Error al obtener logs", error: error.message });
  }
};