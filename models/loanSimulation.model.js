const mongoose = require("mongoose");

const loanSimulationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      description: "Referencia al usuario que realiza la simulación",
    },

    riskProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "riskProfile",
      description:
        "Referencia al perfil de riesgo que aplicó a esta simulación",
    },

    interestRateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "interestRate",
      description: "Referencia a la tasa de interés utilizada en la simulación",
    },

    amount: {
      type: Number,
      required: true,
      min: 100000,
      description: "Monto solicitado para el préstamo",
    },

    termMonths: {
      type: Number,
      required: true,
      min: 1,
      description: "Plazo del préstamo en meses",
    },

    rateType: {
      type: String,
      enum: ["fixed", "variable"],
      required: true,
      description: "Tipo de tasa de interés (fija o variable)",
    },

    amortizationType: {
      type: String,
      enum: ["annuity", "fixed"],
      required: true,
      description: "Tipo de amortización (annuity o fixed)",
    },
    annualInterestRate: {
      type: Number,
      required: true,
      min: 0,
      description: "Tasa de interés anual utilizada en la simulación",
    },

    monthlyPayment: {
      type: Number,
      description: "Valor estimado de la cuota mensual",
    },

    totalPayment: {
      type: Number,
      description: "Monto total pagado al final del préstamo",
    },

    totalInterest: {
      type: Number,
      description: "Interés total pagado durante el préstamo",
    },

    amortizationTable: {
      type: Array,
      description: "Tabla de amortización mensual (opcional)",
    },

    category: {
      type: String,
      enum: ["A", "B", "C"],
      description: "Categoría de riesgo del usuario en esta simulación",
    },

    approvalStatus: {
      type: String,
      enum: ["aprobado", "rechazado", "pendiente"],
      default: "pendiente",
      description: "Resultado de la simulación según las reglas de negocio",
    },

    rulesApplied: [
      {
        name: { type: String },
        description: { type: String },
        type: { type: String },
      },
    ],

    notes: {
      type: String,
      maxlength: 300,
      description: "Comentarios o justificación de la simulación",
    },

    statusForUser: {
      type: String,
      enum: ["aprobado", "rechazado", "pendiente"],
      default: "pendiente",
      description: "decision del usuario",
    },
    startDate: {
      type: Date,
      description: "Fecha de inicio del préstamo",
    },
    result: {
      type: Array,
      description: "Resultado de la simulación",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const loanSimulation = mongoose.model("loanSimulation", loanSimulationSchema);
module.exports = loanSimulation;

// {
//   "userId": "67304f7d12a8b9c56fce67d2",
//   "amount": 5000000,
//   "termMonths": 24,
//   "annualInterestRate": 0.12,
//   "monthlyPayment": 235000,
//   "totalPayment": 5640000,
//   "totalInterest": 640000,
//   "category": "B",
//   "riskProfileId": "6730504f76baab5f54ff45a9",
//   "approvalStatus": "aprobado",
//   "rulesApplied": ["INGRESO_SUFFICIENTE", "CREDIT_SCORE_OK"],
//   "notes": "Cliente con buen comportamiento crediticio."
// }
