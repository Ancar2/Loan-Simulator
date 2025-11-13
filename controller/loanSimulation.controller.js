const LoanSimulationModel = require("../models/loanSimulation.model");
const riskProfile = require("../models/riskProfile.model");
const BusinessRule = require("../models/businessRule.model");
// const { createAuditLog } = require("./auditLog.controller");
const userModel = require("../models/user.model");

const InterestRateModel = require("../models/InterestRate.model");
const loanModel = require("../models/loans.model");

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

// ===========================================================
// FUNCIÓN AUXILIAR: EVALUAR REGLAS DE NEGOCIO
// ===========================================================
const evaluateBusinessRules = async (contextData) => {
  const rules = await BusinessRule.find({ isActive: true });

  const appliedRules = [];
  const failedApprovalRules = [];
  let approvalStatus = "aprobado";

  for (const rule of rules) {
    try {
      // Combinar contextData con los parámetros de la regla
      const data = { ...contextData, ...(rule.parameters || {}) };

      // 🔍 Extraer solo las variables usadas en la condición
      const usedVariables = [...new Set(rule.condition.match(/\b[A-Za-z_]\w*\b/g))].filter(
        (key) => Object.keys(data).includes(key)
      );

      // Crear un subconjunto solo con las variables usadas
      const relevantData = {};
      usedVariables.forEach((v) => (relevantData[v] = data[v]));

      // Crear función dinámica usando solo las variables necesarias
      const fn = new Function(...usedVariables, `return (${rule.condition});`);
      const passed = fn(...usedVariables.map((v) => relevantData[v]));

      // Generar texto con los valores reales de comparación
      const evaluatedCondition = rule.condition.replace(
        /\b[A-Za-z_]\w*\b/g,
        (key) =>
          relevantData.hasOwnProperty(key)
            ? typeof relevantData[key] === "string"
              ? `"${relevantData[key]}"`
              : relevantData[key]
            : key
      );

      const dataPreview = Object.entries(relevantData)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");

      const ruleResult = {
        name: rule.name,
        condition: rule.condition,
        evaluated: `${evaluatedCondition} → ${passed}`,
        description: rule.description,
        type: rule.type,
        data: dataPreview,
      };

      if (passed) {
        appliedRules.push(ruleResult);
      } else if (rule.type === "approval") {
        failedApprovalRules.push(ruleResult);
        approvalStatus = "rechazado";
      }
    } catch (error) {
      console.error(`Error evaluando regla ${rule.name}:`, error.message);
    }
  }

  return {
    reglasEvaluadas: rules.length,
    reglasAplicadas: appliedRules,
    reglasFallidas: failedApprovalRules,
    approvalStatus,
  };
};


// ===========================================================
// CONTROLADOR: CALCULAR CREDIT SCORE Y ACTUALIZAR SIMULACIÓN
// ===========================================================
exports.calculateCreditScore = async (req, res) => {
  try {
    const userId = req.decode?.id;
    const { idSimulacion } = req.params;

    // 1️⃣ Buscar la simulación existente
    const simulacion = await LoanSimulationModel.findById(idSimulacion);
    if (!simulacion)
      return res.status(404).json({ msj: "Simulación de préstamo no encontrada" });

    // 2️⃣ Buscar usuario asociado
    const user = await userModel.findById(userId);
    if (!user)
      return res.status(404).json({ msj: "Usuario no encontrado" });

    // ------------------------------
    // Datos base del usuario
    // ------------------------------
    const income = user.incomeMonthly || 0;
    if (income < 1000000) {
      return res.status(400).json({ msj: "Ingreso mensual insuficiente" });
    }

    const age = user.age || 30;
    const activeLoans = user.activeLoans || 0;
    const paymentHistory = user.paymentHistory || [];
    const employmentYears = user.employmentYears || 0;
    const totalDebt = user.totalDebt || 0;
    const employmentType = user.employmentType || "empleado";
    const contractType = user.contractType || null;
    const profession = user.profession || null;
    const nit = user.nit || null;
    const idNumber = user.idNumber || null;
    const hasRUT = user.hasRUT || false;

    // ------------------------------
    // Normalización y puntajes parciales
    // ------------------------------
    const normalizedIncome = Math.min(income / 10000000, 1);
    const onTimePayments = paymentHistory.filter((p) => p.onTime).length;
    const paymentScore = paymentHistory.length
      ? onTimePayments / paymentHistory.length
      : 0.5;
    const debtRatio = income > 0 ? totalDebt / (income * 12) : 0;
    const normalizedDebtRatio = 1 - Math.min(debtRatio, 1);
    const ageScore = age < 21 ? 0.3 : age > 60 ? 0.6 : 0.8;
    const loanPenalty = activeLoans > 3 ? 0.5 : 1 - activeLoans * 0.1;

    // ------------------------------
    // Calcular estabilidad laboral
    // ------------------------------
    let stabilityScore = 0;
    if (employmentType === "empleado") {
      if (contractType === "indefinido")
        stabilityScore = employmentYears >= 0.5 ? 1 : employmentYears / 0.5;
      else if (contractType === "fijo" || contractType === "otro")
        stabilityScore = employmentYears >= 2 ? 1 : employmentYears / 2;
      else stabilityScore = Math.min(employmentYears / 5, 1);
    } else if (employmentType === "independiente") {
      stabilityScore = profession || nit || idNumber ? 1 : 0.5;
      if (hasRUT) stabilityScore = Math.min(stabilityScore + 0.1, 1);
    }

    // ------------------------------
    // Calcular score final
    // ------------------------------
    const weights = {
      income: 0.25,
      paymentHistory: 0.3,
      debtRatio: 0.2,
      stability: 0.1,
      age: 0.1,
      activeLoans: 0.05,
    };

    const baseScore =
      normalizedIncome * weights.income +
      paymentScore * weights.paymentHistory +
      normalizedDebtRatio * weights.debtRatio +
      stabilityScore * weights.stability +
      ageScore * weights.age +
      loanPenalty * weights.activeLoans;

    const finalScore = Math.round(300 + baseScore * 600);

    // ------------------------------
    // Buscar perfil de riesgo
    // ------------------------------
    const RiskProfile = await riskProfile.findOne({
      minScore: { $lte: finalScore },
      maxScore: { $gte: finalScore },
      isActive: true,
    });

    user.creditScore = finalScore;
    user.riskProfile =  RiskProfile._id
    user.profile = RiskProfile ? RiskProfile.category : "C";
    await user.save();

    // ------------------------------
    // Evaluar reglas de negocio
    // ------------------------------
    const contextData = {
      creditScore: user.creditScore,
      incomeMonthly: user.incomeMonthly,
      activeLoans: user.activeLoans,
      employmentYears: user.employmentYears,
      contractType: user.contractType,
      employmentType: user.employmentType,
      profession: user.profession,
      nit: user.nit,
      idNumber: user.idNumber,
      hasRUT: user.hasRUT,
      expensesMonthly: user.expensesMonthly,
      monthlyPayment: simulacion.result[0].monthlyPaymentApprox,
      profile: user.profile,
      academicLevel: user.academicLevel,
      age: user.age,
      maritalStatus: user.maritalStatus,
      housingType: user.housingType,
      amount: simulacion.amount,
      termMonths: simulacion.termMonths,
    };

    const rulesEvaluation = await evaluateBusinessRules(contextData);

    // ------------------------------
    // Guardar resultados en simulación
    // ------------------------------
    simulacion.creditScore = finalScore;
    simulacion.profile = user.profile;
    simulacion.riskProfileId = RiskProfile._id;
    simulacion.approvalStatus = rulesEvaluation.approvalStatus;
    simulacion.rulesApplied = rulesEvaluation.reglasAplicadas;
    simulacion.rulesFailed = rulesEvaluation.reglasFallidas;
    await simulacion.save();

    // ------------------------------
    // 🔴 Si la simulación fue rechazada, eliminarla
    // ------------------------------
    if (rulesEvaluation.approvalStatus === "rechazado") {
      await LoanSimulationModel.findByIdAndDelete(simulacion._id);
      return res.status(200).json({
        msj: "Simulación rechazada y eliminada del sistema",
        creditScore: finalScore,
        perfilAsignado: user.profile,
        approvalStatus: "rechazado",
        reglasFallidas: rulesEvaluation.reglasFallidas,
      });
    }

    // ------------------------------
    // Respuesta final si fue aprobada
    // ------------------------------
    res.status(200).json({
      msj: "Credit score calculado, reglas evaluadas y simulación actualizada",
      creditScore: finalScore,
      perfilAsignado: user.profile,
      approvalStatus: rulesEvaluation.approvalStatus,
      reglasEvaluadas: rulesEvaluation.reglasEvaluadas,
      reglasAplicadas: rulesEvaluation.reglasAplicadas,
      reglasFallidas: rulesEvaluation.reglasFallidas,
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
function generateVariableRates(
  baseRate,
  termMonths,
  spread = 0,
  volatility = 0.5,
  minRate = 0,
  maxRate = 100
) {
  const rates = [];
  let currentRate = baseRate + spread;

  for (let i = 0; i < termMonths; i++) {
    const variation = 0.5 * volatility;
    currentRate = Math.min(Math.max(currentRate + variation, minRate), maxRate);
    rates.push(parseFloat(currentRate.toFixed(2)));
  }

  return rates;
}

function buildAmortizationSchedule({
  principal,
  termMonths,
  annualRate,
  amortizationType = "annuity",
  startDate = null,
  fixedPayment = false,
  sure,
}) {
  const schedule = [];
  let remaining = principal;
  let totalInterest = 0;
  let totalPaid = 0;

  // 1️⃣ calcular cuota fija inicial si corresponde
  let fixedMonthlyPayment = null;
  if (amortizationType === "annuity" && fixedPayment) {
    const firstRate = Array.isArray(annualRate)
      ? annualRate[0] / 12 / 100
      : annualRate / 12 / 100;
    fixedMonthlyPayment = calculateAnnuityPayment(
      principal,
      firstRate,
      termMonths
    );
  }

  for (let i = 0; i < termMonths; i++) {
    let monthlyRate = Array.isArray(annualRate)
      ? annualRate[i] / 12.935 / 100
      : annualRate / 12 / 100;

    let payment, principalPaid, interest;

    if (amortizationType === "annuity") {
      if (fixedPayment) {
        // 2️⃣ cuota fija (tasa fija o variable)
        payment = Math.round(fixedMonthlyPayment + sure);
        interest = parseFloat((remaining * monthlyRate).toFixed(2));

        principalPaid = parseFloat((payment - interest).toFixed(2));
      } else {
        // 3️⃣ cuota variable (tasa variable)
        payment = calculateAnnuityPayment(
          remaining,
          monthlyRate,
          termMonths - i
        );
        interest = parseFloat((remaining * monthlyRate).toFixed(2));
        principalPaid = parseFloat((payment - interest).toFixed(2));
      }
    } else if (amortizationType === "linear") {
      principalPaid = parseFloat((principal / termMonths).toFixed(2));
      interest = parseFloat((remaining * monthlyRate).toFixed(2));

      payment = parseFloat((principalPaid + interest + sure).toFixed(2));
    } else {
      throw new Error("amortizationType must be annuity or linear");
    }

    // Guardar el saldo antes de pagar principal
    const balanceBeforePayment = remaining;

    // Actualizar remaining
    remaining = parseFloat(Math.max(0, remaining - principalPaid).toFixed(2));

    totalInterest += interest;
    totalPaid += payment;

    schedule.push({
      period: i + 1,
      dueDate: startDate
        ? new Date(
            new Date(startDate).setMonth(
              new Date(startDate).getMonth() + (i + 1)
            )
          )
            .toISOString()
            .slice(0, 10)
        : null,
      payment,
      principal: principalPaid,
      interest,
      balance: balanceBeforePayment,
      sure: sure,
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
      monthlyPaymentApprox: maxPayment,
    },
    promedio: parseFloat(averagePayment.toFixed(2)),
  };
}

exports.simulate = async (req, res) => {
  try {
    let {
      amount,
      termMonths,
      rateType,
      amortizationType = "annuity",
      startDate,
    } = req.body;

    if (!amount || !termMonths) {
      return res
        .status(400)
        .json({ error: "Faltan parámetros: amount o termMonths" });
    }

    const principal = Number(amount);
    const n = parseInt(termMonths, 10);

    if (isNaN(principal) || principal <= 0 || isNaN(n) || n <= 0) {
      return res.status(400).json({ error: "Parámetros inválidos" });
    }

    // Obtener tasa vigente desde DB
    const today = new Date();
    const interestRate = await InterestRateModel.findOne({
      type: rateType,
      startDate: { $lte: today },
      $or: [{ endDate: { $gte: today } }, { endDate: null }],
    }).sort({ startDate: -1 });

    if (!interestRate)
      return res.status(404).json({ error: "No hay tasa activa" });

    let annualRate;
    if (interestRate.type === "fixed") {
      annualRate = interestRate.baseRate + interestRate.spread;
      rateType = "fixed";
    } else {
      annualRate = generateVariableRates(
        interestRate.baseRate,
        n,
        interestRate.spread,
        interestRate.volatility,
        interestRate.minRate,
        interestRate.maxRate
      );
      rateType = "variable";
    }

    // const result = buildAmortizationSchedule({ principal, termMonths: n, annualRate, amortizationType, startDate });
    let result;

    if (amortizationType === "annuity") {
      if (rateType === "fixed") {
        // cuota fija, tasa fija
        result = buildAmortizationSchedule({
          principal,
          termMonths: n,
          annualRate,
          amortizationType,
          fixedPayment: true,
          startDate,
          sure: interestRate.sure,
        });
      } else if (rateType === "variable") {
        // cuota fija, tasa variable
        result = buildAmortizationSchedule({
          principal,
          termMonths: n,
          annualRate,
          amortizationType,
          fixedPayment: true,
          startDate,
          sure: interestRate.sure,
        });
        // si quieres cuota variable + tasa variable → fixedPayment: false
        // result = buildAmortizationSchedule({ principal, termMonths: n, annualRate, amortizationType, fixedPayment: false, startDate });
      }
    } else if (amortizationType === "linear") {
      // siempre cuota variable, aunque la tasa sea fija o variable
      console.log(interestRate.sure);

      result = buildAmortizationSchedule({
        principal,
        termMonths: n,
        annualRate,
        amortizationType,
        fixedPayment: false,
        startDate,
        sure: interestRate.sure,
      });
    }

    const responseData = {
      requested: {
        amount: principal,
        termMonths: n,
        amortizationType,
        rateType,
        annualRate,
      },
      ...result,
    };
    
   // Solo guardar si hay sesión activa
    if (req.decode || req.cookies?.token) {
      const userId = req.decode ? req.decode.id : null;

      const savedSimulation = new LoanSimulationModel({
        userId,
        amount: principal,
        termMonths: n,
        rateType,
        amortizationType,
        result: result.totals,
        amortizationTable: result.schedule,
        annualInterestRate: interestRate.baseRate
      });

      await savedSimulation.save();
      responseData.saved = true;
    } else {
      responseData.saved = false;
      responseData.note = "Simulación no guardada — requiere sesión iniciada";
    }

    return res.json(responseData);
  } catch (err) {
    console.error("Error en simulación:", err);
    return res.status(500).json({ error: err.message });
  }
};


// ===========================================================
// CONTROLADOR: ACTUALIZAR ESTADO DE SIMULACIÓN Y CREAR PRÉSTAMO
// ===========================================================
exports.updateStatusSimulation = async (req, res) => {
  try {
    const { idSimulacion } = req.params;
    const { statusForUser } = req.body;
    const userId = req.decode?.id; // ← tomado del token JWT

    // 1️⃣ Buscar simulación
    const simulacion = await LoanSimulationModel.findById(idSimulacion);
    if (!simulacion)
      return res
        .status(404)
        .json({ msj: "Simulación de préstamo no encontrada" });

    // 2️⃣ Actualizar estado en simulación
    simulacion.statusForUser = statusForUser;

    // ✅ Si el usuario aprueba → guardar fecha y crear nuevo préstamo
    let newLoan = null;
    if (statusForUser === "aprobado") {
      simulacion.startDate = new Date();
      await simulacion.save();

      // 3️⃣ Crear préstamo en la colección Loan
      newLoan = await loanModel.create({
        userId,
        simulationId: simulacion._id,
        amount: simulacion.amount,
        termMonths: simulacion.termMonths,
        interestRate: simulacion.annualInterestRate,
        amortizationType: simulacion.amortizationType,
        approvalStatus: simulacion.approvalStatus,
        startDate: simulacion.startDate,
        profile: simulacion.profile,
        creditScore: simulacion.creditScore,
        rulesApplied: simulacion.rulesApplied,
      });
    } else {
      // Si no es aprobado, solo guardar el nuevo estado
      await simulacion.save();
    }

    // 4️⃣ Respuesta final
    res.status(200).json({
      msj:
        statusForUser === "aprobado"
          ? "Simulación aprobada y préstamo creado exitosamente"
          : "Estado de simulación actualizado correctamente",
      statusForUser: simulacion.statusForUser,
      startDate: simulacion.startDate || null,
      loan: newLoan,
    });
  } catch (error) {
    res.status(500).json({
      msj: "Error al actualizar el estado de la simulación",
      error: error.message,
    });
  }
};