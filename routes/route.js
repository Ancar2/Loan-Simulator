const express = require("express");
const router = express.Router();

const userController = require("../controller/user.controller");

const { middlewareJWT } = require("../middleware/jwt");
const { login } = require("../controller/login.controller");

// Ruta pública (clientes se registran)
router.post("/register", userController.createUser);
// Ruta pública (login)
router.post("/login", login)


//rutas de usuario
router.post("/users/create", middlewareJWT, userController.createUser);
router.get('/users', userController.getUsers)
router.get('/users/:id', userController.getOneUser)
router.put('/users/update/:id',middlewareJWT, userController.updateUser)
router.delete('/users/delete/:id',middlewareJWT, userController.deleteUser)

module.exports = router;