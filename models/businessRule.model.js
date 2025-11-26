const mongoose = require("mongoose");

const businessRuleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      description: "Nombre identificador de la regla, por ejemplo: 'CREDIT_SCORE_MINIMO_A'",
    },

    description: {
      type: String,
      maxlength: 300,
      description: "Descripción detallada de la regla de negocio",
    },

    type: {
      type: String,
      enum: ["creditScore", "approval", "interestRate", "incomeValidation"],
      required: true,
      description: "Tipo de regla (para agrupación lógica)",
    },

    // condition: {
    //   type: String,
    //   required: true,
    //   description: "Expresión lógica en formato texto o fórmula, por ejemplo: 'creditScore >= 700 && incomeMonthly > 3000000'",
    // },
    condition: [
    {
      logic: { type: String, enum: ["AND", "OR", ""], default: "" },
      field: String,
      operator: String,
      value: String,
    }
  ],

    parameters: {
      type: Object,
      description: "Valores variables que pueden influir en la regla (por ejemplo, límites de ingreso, tasa mínima, etc.)",
    },

    riskCategory: {
      type: String,
      enum: ["A", "B", "C", "general"],
      default: "general",
      description: "Categoría de riesgo a la que aplica la regla",
    },

    interestRateAdjustment: {
      type: Number,
      default: 0,
      description: "Ajuste de tasa de interés que aplica la regla (por ejemplo +0.02 o -0.01)",
    },

    isActive: {
      type: Boolean,
      default: true,
      description: "Indica si la regla está activa o no",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      description: "Usuario que creó la regla",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      description: "Usuario que actualizó la regla",
    },
  },
  {
    timestamps: true,
  }
);

const businessRule = mongoose.model("businessRule", businessRuleSchema);
module.exports = businessRule;

// {
//   "name": "CREDIT_SCORE_MINIMO_A",
//   "description": "El usuario debe tener un puntaje mayor o igual a 750 para aplicar a categoría A",
//   "type": "creditScore",
//   "condition": "creditScore >= 750",
//   "parameters": {
//     "minScore": 750
//   },
//   "riskCategory": "A",
//   "interestRateAdjustment": -0.02,
//   "isActive": true
// }