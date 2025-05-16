const express = require("express");
const despesaProgramadaController = require("../controllers/despesaProgramadaController");

const router = express.Router();

router
    .route("/")
    .get(despesaProgramadaController.getAllDespesasProgramadas)
    .post(despesaProgramadaController.createDespesaProgramada);

router
    .route("/:id")
    .get(despesaProgramadaController.getDespesaProgramada)
    .patch(despesaProgramadaController.updateDespesaProgramada)
    .delete(despesaProgramadaController.deleteDespesaProgramada);

module.exports = router;
