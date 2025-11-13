const mongoose = require('mongoose');

const interestRateSchema = mongoose.Schema({
  type: { 
    type: String, 
    enum: ['fixed', 'variable'], 
    required: true 
  },
  baseRate: 
  { type: Number, 
    required: true 
  },
  spread: { 
    type: Number, 
    default: 0 
  },
  volatility: { 
    type: Number, 
    required: function() { 
      return this.type === 'variable'; 
    } 
  },
  minRate: { 
    type: Number, 
    required: function() { 
      return this.type === 'variable'; 
    } 
  },
  maxRate: { 
    type: Number, 
    required: function() { 
      return this.type === 'variable'; 
    } 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date 
  },
  sure: { 
    type: Number, 
    default: 0 
  }
});
const InterestRateModel = mongoose.model('InterestRate', interestRateSchema);
module.exports = InterestRateModel;
