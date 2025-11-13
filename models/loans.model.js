const mongoose = require('mongoose');

const loanSchema = mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
  },

  simulationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "loanSimulation", 
    required: true 
  },

  amount: { 
    type: Number, 
    required: true 
  },

  termMonths: { 
    type: Number, 
    required: true 
  },

  interestRate: { 
    type: Number, 
    required: true 
  },

  amortizationType: { 
    type: String, 
    enum: ["annuity", "german", "american"], 
    required: true 
  },

  approvalStatus: { 
    type: String, 
    enum: ["aprobado", "rechazado", "pendiente"], 
    default: "pendiente" 
  },

  startDate: { 
    type: Date, 
    default: Date.now 
  },

  profile: { 
    type: String 
  },

  creditScore: { 
    type: Number 
  },

  rulesApplied: { 
    type: Array, 
    default: [] 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const LoanModel = mongoose.model('loan', loanSchema);
module.exports = LoanModel;
