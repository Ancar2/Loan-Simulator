// models/loan.model.js
const mongoose = require("mongoose");

const LoanSchema =  mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  simulationId: { type: mongoose.Schema.Types.ObjectId, ref: "LoanSimulation", required: true },
  amount: Number,
  termMonths: Number,
  interestRate: Number,
  amortizationType: String,
  approvalStatus: String,
  startDate: Date,
  profile: String,
  creditScore: Number,
  rulesApplied: Array,
  createdAt: { type: Date, default: Date.now },
});

const loanModel = mongoose.model("loan", LoanSchema);
module.exports = loanModel
