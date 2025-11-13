const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ---------------------------------------------
// CONTROLADOR DE LOGIN
// ---------------------------------------------

exports.login = async (req, res) => {
  try {
    let data = req.body;
    let user = await userModel.findOne({ email: data.email });

    if (user) {
      const isValid = await bcrypt.compare(data.password, user.password);

      if (isValid) {
        let token = jwt.sign(
          {
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            id: user._id,
            role: user.role,
          },
          process.env.SECRET_JWT_KEY,
          {
            expiresIn: process.env.TOKEN_EXPIRE,
          }
        );

        res.cookie("token", token, {
          httpOnly: true,
          secure: false, // cambiar a true en producción con HTTPS
          sameSite: "lax",
          //   maxAge: 1000 * 60 * 60, //1H
          maxAge: 1000 * 60 * 60 * 24, // 24 horas
        });

        res
          .status(200)
          .json({ Welcome: `${user.name + " " + user.lastName}`, token });
      } else {
        return res.status(401).json({ error: "password incorrecto" });
      }
    } else {
      return res.status(401).json({ error: "Correo no existe!" });
    }
  } catch (error) {
    res.status(500).json({ error: "login error", detalle: error.message });
  }
};
