const mongoose = require("mongoose");

const auditLogSchema =  mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      description: "Usuario que ejecutó la acción",
    },

    action: {
      type: String,
      required: true,
      description: "Tipo de acción realizada (create, update, delete, login, simulate, etc.)",
    },

    targetModel: {
      type: String,
      required: true,
      description: "Nombre del modelo afectado (User, LoanSimulation, BusinessRule, etc.)",
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      description: "ID del documento afectado",
    },

    description: {
      type: String,
      maxlength: 900,
      description: "Descripción detallada del evento o cambio realizado",
    },

    metadata: {
      type: Object,
      description: "Información adicional, como valores anteriores o nuevos, IP, headers, etc.",
    },

    ipAddress: {
      type: String,
      description: "Dirección IP del cliente que realizó la acción",
    },

    userAgent: {
      type: String,
      description: "Información del dispositivo o navegador",
    },

    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
  },
  {
    timestamps: true, // Guarda createdAt y updatedAt
  }
);

const auditLog = mongoose.model("auditLog", auditLogSchema);
module.exports = auditLog;