const mongoose = require("mongoose");

const riskProfileSchema = mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["A", "B", "C"],
      required: true,
      description: "Categoría de riesgo: A = bajo, B = medio, C = alto",
    },

    minScore: {
      type: Number,
      required: true,
      min: 0,
      description: "Puntaje mínimo de creditScore que entra en esta categoría",
    },

    maxScore: {
      type: Number,
      required: true,
      min: 0,
      description: "Puntaje máximo de creditScore que entra en esta categoría",
    },

    interestRate: {
      type: Number,
      required: true,
      description: "Tasa de interés asignada según el riesgo",
    },

    description: {
      type: String,
      maxlength: 200,
      description: "Descripción breve del perfil de riesgo",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const riskProfile = mongoose.model("riskProfile", riskProfileSchema);
module.exports = riskProfile;

// [
//   {
//     "category": "A",
//     "minScore": 750,
//     "maxScore": 900,
//     "interestRate": 0.05,
//     "description": "Riesgo bajo, excelente historial crediticio."
//   },
//   {
//     "category": "B",
//     "minScore": 600,
//     "maxScore": 749,
//     "interestRate": 0.10,
//     "description": "Riesgo medio, comportamiento aceptable."
//   },
//   {
//     "category": "C",
//     "minScore": 0,
//     "maxScore": 599,
//     "interestRate": 0.18,
//     "description": "Riesgo alto, historial irregular o escaso."
//   }
// ]