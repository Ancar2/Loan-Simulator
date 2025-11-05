// const LoanSimulation = require("../models/loanSimulation.model");
const riskProfile = require("../models/riskProfile.model");
// const BusinessRule = require("../models/businessRule.model");
// const { createAuditLog } = require("./auditLog.controller");
const userModel = require("../models/user.model");

const InterestRateModel = require("../models/InterestRate.model");

// /* ===========================================================
//    FUNCIÓN AUXILIAR: CALCULAR CUOTA Y TABLA DE AMORTIZACIÓN
// =========================================================== */
// const calculateLoanDetails = (amount, annualInterestRate, termMonths) => {
//   const monthlyRate = annualInterestRate / 12;
//   const monthlyPayment =
//     (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

//   let balance = amount;
//   const amortizationTable = [];

//   for (let i = 1; i <= termMonths; i++) {
//     const interest = balance * monthlyRate;
//     const principal = monthlyPayment - interest;
//     balance -= principal;

//     amortizationTable.push({
//       month: i,
//       payment: Math.round(monthlyPayment),
//       principal: Math.round(principal),
//       interest: Math.round(interest),
//       remainingBalance: Math.round(balance > 0 ? balance : 0),
//     });
//   }

//   const totalPayment = monthlyPayment * termMonths;
//   const totalInterest = totalPayment - amount;

//   return {
//     monthlyPayment: Math.round(monthlyPayment),
//     totalPayment: Math.round(totalPayment),
//     totalInterest: Math.round(totalInterest),
//     amortizationTable,
//   };
// };

// /* ===========================================================
//    FUNCIÓN AUXILIAR: OBTENER PERFIL DE RIESGO
// =========================================================== */
// const getRiskProfileByScore = async (creditScore) => {
//   const profiles = await riskProfile.find().sort({ minScore: 1 });

//   for (const profile of profiles) {
//     if (creditScore >= profile.minScore && creditScore <= profile.maxScore) {
//       return profile;
//     }
//   }
//   return null;
// };

// /* ===========================================================
//    FUNCIÓN AUXILIAR: EVALUAR REGLAS DE NEGOCIO
// =========================================================== */
// const evaluateBusinessRules = async (contextData) => {
//   const rules = await BusinessRule.find({ isActive: true });

//   const appliedRules = [];
//   let approvalStatus = "aprobado";

//   for (const rule of rules) {
//     try {
//       const fn = new Function(...Object.keys(contextData), `return (${rule.condition});`);
//       const passed = fn(...Object.values(contextData));

//       if (passed) {
//         appliedRules.push(rule.name);
//       } else {
//         if (rule.type === "approval") {
//           approvalStatus = "rechazado";
//         }
//       }
//     } catch (error) {
//       console.error(`Error evaluando regla ${rule.name}:`, error.message);
//     }
//   }

//   return { appliedRules, approvalStatus };
// };



exports.calculateCreditScore = async (req, res) => {
  try {
    const userId = req.decode.id;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ msj: "Usuario no encontrado" });

    // Datos base del usuario
    const income = user.incomeMonthly || 0;
    if (income < 1000000) {
        return res.status(400).json({ msj: "El ingreso mensual es insuficiente para calcular el puntaje crediticio, debe ser mayor a $1.000.000" });
    }
    const age = user.age || 30;
    const activeLoans = user.activeLoans || 0;
    const paymentHistory = user.paymentHistory || [];
    const employmentYears = user.employmentYears || 0;
    const totalDebt = user.totalDebt || 0;

    const employmentType = user.employmentType || "empleado"; // "empleado" o "independiente"
    const contractType = user.contractType || null; // "indefinido", "fijo", "otro"
    const profession = user.profession || null; // si independiente profesional
    const nit = user.nit || null;
    const idNumber = user.idNumber || null;
    const hasRUT = user.hasRUT || false;

    // Ponderadores base
    const weights = {
      income: 0.25,
      paymentHistory: 0.3,
      debtRatio: 0.2,
      stability: 0.1,
      age: 0.1,
      activeLoans: 0.05,
    };

    // Normalización
    const normalizedIncome = Math.min(income / 10000000, 1);
    const onTimePayments = paymentHistory.filter((p) => p.onTime).length;
    const paymentScore =
      paymentHistory.length > 0 ? onTimePayments / paymentHistory.length : 0.5;
      const debtRatio =
  income > 0 ? totalDebt / (income * 12) : 0; // evita dividir por cero

  console.log(debtRatio);
  

    const normalizedDebtRatio = 1 - Math.min(debtRatio, 1);
    const ageScore = age < 21 ? 0.3 : age > 60 ? 0.6 : 0.8;
    const loanPenalty = activeLoans > 3 ? 0.5 : 1 - activeLoans * 0.1;

    // ==========================
    // Calcular stabilityScore según empleo y contrato
    // ==========================
    let stabilityScore = 0;

    if (employmentType === "empleado") {
      if (contractType === "indefinido") {
        stabilityScore = employmentYears >= 0.5 ? 1 : employmentYears / 0.5; // min 6 meses
      } else if (contractType === "fijo" || contractType === "otro") {
        stabilityScore = employmentYears >= 2 ? 1 : employmentYears / 2; // min 2 años
      } else {
        stabilityScore = Math.min(employmentYears / 5, 1); // fallback
      }
    } else if (employmentType === "independiente") {
      if (profession) {
        stabilityScore = 1; // profesional independiente pesa igual que empleado indefinido
      } else if (nit || idNumber) {
        stabilityScore = 1; // independiente validado con NIT o cédula
      } else {
        stabilityScore = 0.5; // independiente sin validación
      }

      // Ajuste adicional si tiene RUT
      if (hasRUT) stabilityScore = Math.min(stabilityScore + 0.1, 1);
    }

    // Score base
    const baseScore =
      normalizedIncome * weights.income +
      paymentScore * weights.paymentHistory +
      normalizedDebtRatio * weights.debtRatio +
      stabilityScore * weights.stability +
      ageScore * weights.age +
      loanPenalty * weights.activeLoans;
      
      

    // Escalar a rango 300–900
    const finalScore = Math.round(300 + baseScore * 600);
    if (isNaN(finalScore)) {
  return res.status(400).json({ msj: "El puntaje final no es numérico" });
}
    // Buscar perfil de riesgo correspondiente
    const RiskProfile = await riskProfile.findOne({
      minScore: { $lte: finalScore },
      maxScore: { $gte: finalScore },
      isActive: true,
    });

    // Asignar categoría o default
    user.creditScore = finalScore;
    user.profile = RiskProfile ? RiskProfile.category : "C";

    await user.save();

    res.status(200).json({
      msj: "Credit score calculado exitosamente",
      creditScore: finalScore,
      perfilAsignado: RiskProfile ? RiskProfile.category : "Sin perfil definido",
      detalles: {
        ingreso: normalizedIncome.toFixed(2),
        historialPago: paymentScore.toFixed(2),
        deuda: normalizedDebtRatio.toFixed(2),
        estabilidad: stabilityScore.toFixed(2),
        edad: ageScore.toFixed(2),
        penalizaciónPorPréstamos: loanPenalty.toFixed(2),
        employmentType,
        contractType,
        profession,
        nit,
        idNumber,
        hasRUT,
      },
    });
  } catch (error) {
    res.status(500).json({
      msj: "Error al calcular credit score",
      error: error.message,
    });
  }
};




function calculateAnnuityPayment(principal, monthlyRate, n) {
  if (monthlyRate === 0) return principal / n;
  return principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));
}

// Genera array de tasas variables
function generateVariableRates(baseRate, termMonths, spread = 0, volatility = 0.5, minRate = 0, maxRate = 100) {
  const rates = [];
  let currentRate = baseRate + spread;

  for (let i = 0; i < termMonths; i++) {
    const variation =  0.5 * volatility;
    currentRate = Math.min(Math.max(currentRate + variation, minRate), maxRate);
    rates.push(parseFloat(currentRate.toFixed(2)));
  }

  return rates;
}

function buildAmortizationSchedule({ principal, termMonths, annualRate, amortizationType = 'annuity', startDate = null, fixedPayment = false, sure }) {
  const schedule = [];
  let remaining = principal;
  let totalInterest = 0;
  let totalPaid = 0;
  

  // 1️⃣ calcular cuota fija inicial si corresponde
  let fixedMonthlyPayment = null;
  if (amortizationType === 'annuity' && fixedPayment) {
    const firstRate = Array.isArray(annualRate) ? annualRate[0]/12/100 : annualRate/12/100;
    fixedMonthlyPayment = calculateAnnuityPayment(principal, firstRate, termMonths);
  }

  for (let i = 0; i < termMonths; i++) {
    let monthlyRate = Array.isArray(annualRate) ? annualRate[i]/12.935/100 : annualRate/12/100;

    let payment, principalPaid, interest;

    if (amortizationType === 'annuity') {
      if (fixedPayment) {
        // 2️⃣ cuota fija (tasa fija o variable)
       payment = Math.round(fixedMonthlyPayment + sure);
        interest = parseFloat((remaining * monthlyRate).toFixed(2));
        
        principalPaid = parseFloat((payment - interest).toFixed(2));
    } else {
        // 3️⃣ cuota variable (tasa variable)
        payment = calculateAnnuityPayment(remaining, monthlyRate, termMonths - i);
        interest = parseFloat((remaining * monthlyRate).toFixed(2));
        principalPaid = parseFloat((payment - interest).toFixed(2));
    }
} else if (amortizationType === 'linear') {
    principalPaid = parseFloat((principal / termMonths).toFixed(2));
    interest = parseFloat((remaining * monthlyRate).toFixed(2));
    

      payment = parseFloat((principalPaid + interest + sure).toFixed(2));
    } else {
      throw new Error('amortizationType must be annuity or linear');
    }

    // Guardar el saldo antes de pagar principal
    const balanceBeforePayment = remaining;

    // Actualizar remaining
    remaining = parseFloat(Math.max(0, remaining - principalPaid).toFixed(2));

    totalInterest += interest;
    totalPaid += payment;

    schedule.push({
      period: i + 1,
      dueDate: startDate ? new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + (i + 1))).toISOString().slice(0,10) : null,
      payment,
      principal: principalPaid,
      interest,
      balance: balanceBeforePayment,
      sure: sure
    });
  }

  const totalPayments = schedule.reduce((sum, item) => sum + item.payment, 0);
  const averagePayment = totalPayments / schedule.length;

  const maxPayment = schedule.reduce((max, item) => {
  return item.payment > max ? item.payment : max;
}, 0);

  return {
    schedule,
    totals: {
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      monthlyPaymentApprox: maxPayment
    },
    promedio: parseFloat(averagePayment.toFixed(2)),
  };
}


exports.simulate = async (req, res) => {
  try {
    let { amount, termMonths, rateType, amortizationType = 'annuity', startDate } = req.body;

    if (!amount || !termMonths) {
      return res.status(400).json({ error: 'Faltan parámetros: amount o termMonths' });
    }

    const principal = Number(amount);
    const n = parseInt(termMonths, 10);

    if (isNaN(principal) || principal <= 0 || isNaN(n) || n <= 0) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    // Obtener tasa vigente desde DB
    const today = new Date();
    const interestRate = await InterestRateModel.findOne({
        type: rateType,
      startDate: { $lte: today },
      $or: [{ endDate: { $gte: today } }, { endDate: null }]
    }).sort({ startDate: -1 });

    if (!interestRate) return res.status(404).json({ error: 'No hay tasa activa' });

    let annualRate;
    if (interestRate.type === 'fixed') {
      annualRate = interestRate.baseRate + interestRate.spread;
      rateType = 'fixed';
    } else {
      annualRate = generateVariableRates(
        interestRate.baseRate,
        n,
        interestRate.spread,
        interestRate.volatility,
        interestRate.minRate,
        interestRate.maxRate
      );
      rateType = 'variable';
    }

    // const result = buildAmortizationSchedule({ principal, termMonths: n, annualRate, amortizationType, startDate });
    let result;

if (amortizationType === 'annuity') {
    if (rateType === 'fixed') {
        // cuota fija, tasa fija
        result = buildAmortizationSchedule({ principal, termMonths: n, annualRate, amortizationType, fixedPayment: true, startDate, sure: interestRate.sure });
    } else if (rateType === 'variable') {
        // cuota fija, tasa variable
        result = buildAmortizationSchedule({ principal, termMonths: n, annualRate, amortizationType, fixedPayment: true, startDate, sure: interestRate.sure });
        // si quieres cuota variable + tasa variable → fixedPayment: false
        // result = buildAmortizationSchedule({ principal, termMonths: n, annualRate, amortizationType, fixedPayment: false, startDate });
    }
} else if (amortizationType === 'linear') {
    // siempre cuota variable, aunque la tasa sea fija o variable
    console.log(interestRate.sure);
    
    result = buildAmortizationSchedule({ principal, termMonths: n, annualRate, amortizationType, fixedPayment: false, startDate, sure: interestRate.sure });
}

    return res.json({
      requested: { amount: principal, termMonths: n, amortizationType, rateType, annualRate },
      ...result
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
