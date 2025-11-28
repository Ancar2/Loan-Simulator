const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");

// ---------------------------------------------
// CREAR USUARIO
// ---------------------------------------------
exports.createUser = async (req, res) => {
  try {
    const data = req.body;

    const ownerExists = await userModel.findOne({ role: "owner" });

    if (!ownerExists) {
      data.role = "owner";
    } else {
      const creator = req.decode;

      if (creator) {
        const creatorUser = await userModel.findById(creator.id);

        if (!creatorUser) {
          return res
            .status(401)
            .json({ error: "Usuario autenticado no encontrado" });
        }

        if (creatorUser.role !== "owner") {
          return res
            .status(403)
            .json({ error: "Solo el owner puede crear usuarios internos" });
        }

        if (!data.role) data.role = "customer";
      } else {
        data.role = "customer";
      }
    }

    const user = new userModel(data);
    const saved = await user.save();

    res.status(201).json(saved);
  } catch (error) {
    res
      .status(400)
      .json({ msj: "Error al crear usuario", error: error.message });
  }
};

// ---------------------------------------------
// OBTENER USUARIOS
// ---------------------------------------------
exports.getUsers = async (req, res) => {
  try {
    let data = await userModel.find({}, "-password");
    res.status(200).json(data);
  } catch (error) {
    res
      .status(400)
      .json({ msj: "error al obtener usuarios", error: error.message });
  }
};

/// ---------------------------------------------
// OBTENER UN USUARIO
// ---------------------------------------------
exports.getOneUser = async (req, res) => {
  try {
    const id = req.params.id;
    let user = await userModel.findById(id, "-password");
    if (!user) {
      return res.status(404).json({ msj: "usuario no encontrado" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(400)
      .json({ msj: "error al obtener usuario", error: error.message });
  }
};

// ---------------------------------------------
// ACTUALIZAR USUARIO
// ---------------------------------------------
exports.updateUser = async (req, res) => {
  try {
    let id = req.params.id;
    let data = req.body;
    let userId = req.decode.id;
    let role = req.decode.role;

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ msj: "Usuario no encontrado" });

    if (userId == user._id || role == "owner") {
      if (data.password) {
         if (!data.oldPassword) {
          return res.status(400).json({ msj: "Debes ingresar tu contraseña actual para cambiarla" });
        }

        const isMatch = await bcrypt.compare(data.oldPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ msj: "Contraseña actual incorrecta" });
        }

        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
      }

      if (data.workProfile == "empleado") {
        if (
          !data.contractType ||
          !data.employmentYears ||
          !data.incomeMonthly
        ) {
          return res.status(400).json({
            msj: "Faltan datos para perfil de empleado contractType, incomeMonthly o employmentYears",
          });
        }
      }

      if (data.workProfile == "independiente") {
        if (!data.ocupacion || !data.incomeMonthly) {
          return res.status(400).json({
            msj: "Faltan datos para perfil de independiente ocupacion o incomeMonthly",
          });
        }
        if (data.ocupacion == "profesional independiente") {
          if (!data.profession) {
            return res.status(400).json({
              msj: "Faltan datos para profesion de profesional independiente",
            });
          }
        } else if (
          data.ocupacion == "comerciante" ||
          data.ocupacion == "rentista" ||
          data.ocupacion == "transportador"
        ) {
          if (!data.nit || data.hasRUT) {
            return res.status(400).json({
              msj: "Faltan datos para perfil",
            });
          }
        }
      }

      let updateUser = await userModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );

      if (!updateUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.status(200).json({ msj: "usuario actualizado", data: updateUser });
    } else {
      res
        .status(403)
        .json({ msj: "no tienes permiso para actualizar este usuario" });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// ---------------------------------------------
// ELIMINAR USUARIO
// ---------------------------------------------
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = req.query.deleted == "true";
    let userId = req.decode.id;
    let role = req.decode.role;

    const user = await userModel.findById(id);

    if (userId != user._id && role == "customer") {
      return res
        .status(403)
        .json({ msj: "no tienes permisos para eliminar otro usuario" });
    }

    if (user.role === "admin" && role !== "owner") {
      return res
        .status(403)
        .json({ msj: "Solo el owner puede eliminar administradores" });
    }

    if (user.role == "owner") {
      return res
        .status(403)
        .json({ msj: 'este usuario "owner" no se puede eliminar' });
    }

    if (deleted) {
      await userModel.findByIdAndDelete(id);
      return res.status(200).json({
        msj: "usuario permamentemente eliminado, no se puede recuperar",
      });
    } else {
      if (user.isActive == false) {
        return res
          .status(410)
          .json({ msj: "usuario ya fue eliminado, se puede recuperar!" });
      } else {
        user.isActive = false;
        user.inactiveAt = new Date();
        await user.save();

        return res
          .status(200)
          .json({ msj: "usuario eliminado, se puede recuperar", data: user });
      }
    }
  } catch (error) {
    res
      .status(500)
      .json({ msj: "error al actualizar usuario", error: error.message });
  }
};
