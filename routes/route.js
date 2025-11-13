const express = require("express");
const router = express.Router();

const { middlewareJWT } = require("../middleware/jwt");
const { login } = require("../controller/login.controller");
const userController = require("../controller/user.controller");
const riskProfileController = require("../controller/riskProfile.controller");
const businessRuleController = require("../controller/bussinessRule.controller");
const loanSimulationController = require("../controller/loanSimulation.controller");
const interestRateController = require("../controller/interestRate.controller");

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


//rutas de perfiles de riesgo   
router.get("/riskprofiles", riskProfileController.getRiskProfiles);// Consultar todos los perfiles
router.get("/riskprofiles/:id", riskProfileController.getRiskProfileById);// Consultar perfil por ID
router.get("/riskprofile/score/:score", riskProfileController.getProfileByCreditScore);// Consultar perfil por credit score
router.post("/riskprofiles/create", middlewareJWT, riskProfileController.createRiskProfile);
router.put("/riskprofiles/update/:id", middlewareJWT, riskProfileController.updateRiskProfile);
router.delete("/riskprofiles/delete/:id", middlewareJWT, riskProfileController.deleteRiskProfile);


// rutas de reglas de negocio
router.get("/businessrules", businessRuleController.getAllBusinessRules);
router.get("/businessrules/:id", businessRuleController.getBusinessRuleById);
router.post("/businessrules/evaluate", middlewareJWT, businessRuleController.evaluateRules);
router.post("/businessrules/create", middlewareJWT, businessRuleController.createBusinessRule);
router.put("/businessrules/update/:id", middlewareJWT, businessRuleController.updateBusinessRule);
router.delete("/businessrules/delete/:id", middlewareJWT, businessRuleController.deleteBusinessRule);

//rutas de simulaciones de préstamo
router.post('/simulate',middlewareJWT, loanSimulationController.simulate);
router.post("/calculateScore/:idSimulacion", middlewareJWT, loanSimulationController.calculateCreditScore);
router.post('/accept/loan/:idSimulacion',middlewareJWT, loanSimulationController.updateStatusSimulation);

//rutas de tasa de interés
router.post("/interest_rates/create", middlewareJWT, interestRateController.createInterestRate);
router.get("/interest_rates", middlewareJWT, interestRateController.getInterestRates);
router.get("/interest_rates/:id", middlewareJWT, interestRateController.getInterestRateById);
router.put("/interest_rates/update/:id", middlewareJWT, interestRateController.updateInterestRate);
router.delete("/interest_rates/delete/:id", middlewareJWT, interestRateController.deleteInterestRate);



module.exports = router;