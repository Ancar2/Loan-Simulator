const RiskProfile = require("../models/riskProfile.model");

// ---------------------------------------------
// CREAR PERFIL DE RIESGO
// ---------------------------------------------
exports.createRiskProfile = async (req, res) => {
  try {
    const { role } = req.decode;

    if (!["owner", "admin"].includes(role)) {
      return res
        .status(403)
        .json({ msj: "No tienes permiso para crear perfiles de riesgo" });
    }

    const data = req.body;

    // Validar que los rangos no se superpongan
    const overlap = await RiskProfile.findOne({
      $or: [
        { minScore: { $lte: data.maxScore, $gte: data.minScore } },
        { maxScore: { $lte: data.maxScore, $gte: data.minScore } },
      ],
    });

    if (overlap) {
      return res.status(400).json({
        msj: "El rango de puntaje se superpone con otro perfil existente.",
      });
    }

    const profile = new RiskProfile(data);
    const saved = await profile.save();
    res.status(201).json({ msj: "Perfil de riesgo creado", data: saved });
  } catch (error) {
    res
      .status(500)
      .json({ msj: "Error al crear perfil de riesgo", error: error.message });
  }
};

// ---------------------------------------------
// OBTENER PERFILES DE RIESGO
// ---------------------------------------------
exports.getRiskProfiles = async (req, res) => {
  try {
    const profiles = await RiskProfile.find();
    res.status(200).json(profiles);
  } catch (error) {
    res
      .status(500)
      .json({
        msj: "Error al obtener perfiles de riesgo",
        error: error.message,
      });
  }
};

// ---------------------------------------------
// OBTENER PERFIL DE RIESGO POR ID
// ---------------------------------------------
exports.getRiskProfileById = async (req, res) => {
  try {
    const id = req.params.id;
    const profile = await RiskProfile.findById(id);
    if (!profile)
      return res.status(404).json({ msj: "Perfil de riesgo no encontrado" });

    res.status(200).json(profile);
  } catch (error) {
    res
      .status(500)
      .json({ msj: "Error al obtener perfil de riesgo", error: error.message });
  }
};

// ---------------------------------------------
// ACTUALIZAR PERFILE DE RIESGO
// ---------------------------------------------
exports.updateRiskProfile = async (req, res) => {
  try {
    const { role } = req.decode;

    if (!["owner", "admin"].includes(role)) {
      return res
        .status(403)
        .json({ msj: "No tienes permiso para actualizar perfiles de riesgo" });
    }

    const id = req.params.id;
    const data = req.body;

    const updated = await RiskProfile.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ msj: "Perfil de riesgo no encontrado" });

    res.status(200).json({ msj: "Perfil actualizado", data: updated });
  } catch (error) {
    res
      .status(500)
      .json({ msj: "Error al actualizar perfil", error: error.message });
  }
};

// ---------------------------------------------
// ELIMINAR PERFILES DE RIESGO
// ---------------------------------------------
exports.deleteRiskProfile = async (req, res) => {
  try {
    const { role } = req.decode;

    if (!["owner", "admin"].includes(role)) {
      return res
        .status(403)
        .json({ msj: "No tienes permiso para eliminar perfiles de riesgo" });
    }

    const id = req.params.id;
    const deleted = await RiskProfile.findByIdAndDelete(id);

    if (!deleted)
      return res.status(404).json({ msj: "Perfil de riesgo no encontrado" });

    res.status(200).json({ msj: "Perfil eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ msj: "Error al eliminar perfil", error: error.message });
  }
};
