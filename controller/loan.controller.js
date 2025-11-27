const loanModel = require("../models/loans.model");


/* ===========================================================
   VER PRESTAMOS DEL USUARIO Y SI ES EL OWNER LOS PUEDE VER TODOS Y SE PUEDE FILTRAR POR USUARIO CON QUERY
=========================================================== */
exports.getLoansByUser = async (req, res) => {
  try {
    const userId = req.decode?.id; // ← tomado del token JWT  
    const role = req.decode?.role; // ← tomado del token JWT  
    const queryUserId = req.query.userId;

    let loans;
    if (role === "owner") {
      if (queryUserId) {
        loans = await loanModel.find({ userId: queryUserId });
      } else {
        loans = await loanModel.find();
      }
    } else {
      loans = await loanModel.find({ userId });
    }

    res.status(200).json(loans);
  } catch (error) {
    res.status(500).json({
      msj: "Error al obtener los prestamos",
      error: error.message,
    });
  }
};