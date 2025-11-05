const BusinessRule = require("../models/businessRule.model");

/* CREAR REGLA */
exports.createBusinessRule = async (req, res) => {
  try {
    const rule = new BusinessRule({
      ...req.body,
      createdBy: req.decode?.id || null,
    });

    await rule.save();
    res.status(201).json({
      msj: "Regla creada exitosamente",
      data: rule,
    });
  } catch (error) {
    res.status(500).json({
      msj: "Error al crear la regla de negocio",
      error: error.message,
    });
  }
};

/* LISTAR REGLAS */
exports.getAllBusinessRules = async (req, res) => {
  try {
    const rules = await BusinessRule.find();
    res.status(200).json({
      msj: "Lista de reglas de negocio",
      total: rules.length,
      data: rules,
    });
  } catch (error) {
    res.status(500).json({
      msj: "Error al obtener las reglas de negocio",
      error: error.message,
    });
  }
};

/*  OBTENER REGLA POR ID */
exports.getBusinessRuleById = async (req, res) => {
  try {
    const rule = await BusinessRule.findById(req.params.id);
    if (!rule)
      return res.status(404).json({ msj: "Regla no encontrada" });

    res.status(200).json(rule);
  } catch (error) {
    res.status(500).json({
      msj: "Error al obtener la regla",
      error: error.message,
    });
  }
};

/*  ACTUALIZAR REGLA */
exports.updateBusinessRule = async (req, res) => {
  try {
    const updated = await BusinessRule.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.decode?.id || null,
      },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ msj: "Regla no encontrada" });

    res.status(200).json({
      msj: "Regla actualizada correctamente",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      msj: "Error al actualizar la regla",
      error: error.message,
    });
  }
};

/* ELIMINAR (lógico)*/
exports.deleteBusinessRule = async (req, res) => {
  try {
    const deleted = await BusinessRule.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!deleted)
      return res.status(404).json({ msj: "Regla no encontrada" });

    res.status(200).json({
      msj: "Regla desactivada correctamente",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      msj: "Error al eliminar la regla",
      error: error.message,
    });
  }
};

/* EVALUAR SIMULACIÓN */
exports.evaluateRules = async (req, res) => {
  try {
    // Datos de la simulación enviados por el frontend
    const simulation = req.body; 
    // Ejemplo esperado:
    // { creditScore: 720, incomeMonthly: 4000000, amount: 5000000 }

    // Buscar reglas activas y aplicables
    const rules = await BusinessRule.find({ isActive: true });

    const results = rules.map(rule => {
      let passed = false;
      try {
        // Evaluar condición con los datos de la simulación
        // ⚠️ Seguridad: eval se usa aquí solo como ejemplo.
        // En producción, debe reemplazarse por un parser seguro o librería tipo "expr-eval".
        const fn = new Function(
          ...Object.keys(simulation),
          `return (${rule.condition});`
        );
        passed = fn(...Object.values(simulation));
      } catch (e) {
        passed = false;
      }

      return {
        ruleName: rule.name,
        description: rule.description,
        passed,
        category: rule.riskCategory,
        adjustment: rule.interestRateAdjustment,
      };
    });

    const passedRules = results.filter(r => r.passed);
    const failedRules = results.filter(r => !r.passed);

    // Ajuste de tasa acumulado
    const totalAdjustment = passedRules.reduce(
      (acc, r) => acc + (r.adjustment || 0),
      0
    );

    res.status(200).json({
      msj: "Evaluación completada",
      totalRules: rules.length,
      passed: passedRules.length,
      failed: failedRules.length,
      totalAdjustment,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      msj: "Error al evaluar las reglas",
      error: error.message,
    });
  }

//  body
// {
//   "creditScore": 720,
//   "incomeMonthly": 4000000
// }
};