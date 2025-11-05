const userModel = require("../models/user.model");

exports.createUser = async (req, res) => {
  try {
    const data = req.body;

    // Buscar si existe ya un owner
    const ownerExists = await userModel.findOne({ role: "owner" });

    //  Si no hay owner, el primer usuario será el owner
    if (!ownerExists) {
      data.role = "owner";
    } else {
      // Si hay owner, verificamos si la petición viene autenticada (con token)
      const creator = req.decode; // viene del JWT si la ruta está protegida

      if (creator) {
        // El creador está autenticado → debe ser el owner para crear usuarios
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

        // Si es el owner, puede crear admin o customer según envíe
        if (!data.role) data.role = "customer";
      } else {
        // Registro público (sin token): crear cliente
        data.role = "customer";
      }
    }

    // Crear usuario
    const user = new userModel(data);
    const saved = await user.save();

    res.status(201).json(saved);
  } catch (error) {
    res
      .status(400)
      .json({ msj: "Error al crear usuario", error: error.message });
  }
};

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
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
      }

      let updateUser = await userModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      //   delete updatedUser.password;
      res.status(200).json({ msj: "usuario actualizado", data: updateUser });
    } else {
      res
        .status(403)
        .json({ msj: "no tienes permiso para actualizar este usuario" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

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
