const BusinessRule = require("../models/businessRule.model");

// ---------------------------------------------
// CREAR REGLA
// ---------------------------------------------

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

// ---------------------------------------------
// LISTAR REGLAS
// ---------------------------------------------

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

// ---------------------------------------------
//  OBTENER REGLA POR ID
// ---------------------------------------------

exports.getBusinessRuleById = async (req, res) => {
  try {
    const rule = await BusinessRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ msj: "Regla no encontrada" });

    res.status(200).json(rule);
  } catch (error) {
    res.status(500).json({
      msj: "Error al obtener la regla",
      error: error.message,
    });
  }
};

// ---------------------------------------------
//  ACTUALIZAR REGLA POR ID
// ---------------------------------------------
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

    if (!updated) return res.status(404).json({ msj: "Regla no encontrada" });

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

// ---------------------------------------------
//  ELIMINAR REGLA POR ID
// ---------------------------------------------
exports.deleteBusinessRule = async (req, res) => {
  try {
   
    let deleted = await BusinessRule.findById(req.params.id);

    if (!deleted) {
      return res.status(404).json({ msj: "Regla no encontrada" });
    }

    if (deleted.isActive === true) {
      deleted = await BusinessRule.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      return res.status(200).json({
        msj: "Regla desactivada correctamente",
        data: deleted,
      });
    }

    await BusinessRule.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      msj: "Regla eliminada permanentemente",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      msj: "Error al eliminar la regla",
      error: error.message,
    });
  }
};
