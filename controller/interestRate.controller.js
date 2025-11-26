const InterestRateModel = require("../models/InterestRate.model");

/* ===========================================================
   CREAR UNA NUEVA TASA DE INTERÉS
=========================================================== */
exports.createInterestRate = async (req, res) => {
  try {
    const {
      type,
      baseRate,
      spread,
      volatility,
      minRate,
      maxRate,
      startDate,
      endDate,
      sure
    } = req.body;

    let tasas = await InterestRateModel.find({type: type});
    if (tasas) {
      return res.status(400).json({ error: `ya existe una tasa de interes de tipo ${type}` });
    }

    if (!type || !["fixed", "variable"].includes(type)) {
      return res
        .status(400)
        .json({ error: 'type debe ser "fixed" o "variable"' });
    }
    if (typeof baseRate !== "number" || baseRate <= 0) {
      return res.status(400).json({ error: "baseRate inválido" });
    }
    if (typeof spread !== "number")
      return res.status(400).json({ error: "spread inválido" });
    if (!startDate)
      return res.status(400).json({ error: "startDate requerido" });

    const newRateData = {
      type,
      baseRate,
      spread,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      sure
    };

    // Solo para tasa variable
    if (type === "variable") {
      if (typeof volatility !== "number")
        return res.status(400).json({ error: "volatility inválido" });
      newRateData.volatility = volatility || 0.5;
      newRateData.minRate = minRate || 0;
      newRateData.maxRate = maxRate || 100;
    }

    const newRate = new InterestRateModel(newRateData);
    await newRate.save();

    res
      .status(201)
      .json({ message: "Tasa de interés creada", interestRate: newRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================================================
   OBTENER TODAS LAS TASAS DE INTERÉS
=========================================================== */
exports.getInterestRates = async (req, res) => {
  try {
    const rates = await InterestRateModel.find().sort({ startDate: -1 });
    res.status(200).json(rates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================================================
   OBTENER TASA POR ID
=========================================================== */
exports.getInterestRateById = async (req, res) => {
  try {
    const rate = await InterestRateModel.findById(req.params.id);
    if (!rate) return res.status(404).json({ error: "Tasa no encontrada" });
    res.status(200).json(rate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================================================
   ACTUALIZAR UNA TASA DE INTERÉS
=========================================================== */
exports.updateInterestRate = async (req, res) => {
  try {
    const {
      type,
      baseRate,
      spread,
      volatility,
      minRate,
      maxRate,
      startDate,
      endDate,
      sure
    } = req.body;

    const updatedRate = await InterestRateModel.findByIdAndUpdate(
      req.params.id,
      {
        ...(type && { type }),
        ...(baseRate !== undefined && { baseRate }),
        ...(spread !== undefined && { spread }),
        ...(volatility !== undefined && { volatility }),
        ...(minRate !== undefined && { minRate }),
        ...(maxRate !== undefined && { maxRate }),
        ...(sure !== undefined && { sure }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedRate)
      return res.status(404).json({ error: "Tasa no encontrada" });

    res
      .status(200)
      .json({ message: "Tasa actualizada", interestRate: updatedRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ===========================================================
   ELIMINAR UNA TASA DE INTERÉS
=========================================================== */
exports.deleteInterestRate = async (req, res) => {
  try {
    const deleted = await InterestRateModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Tasa no encontrada" });
    res.status(200).json({ message: "Tasa eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
