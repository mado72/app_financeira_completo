const express = require("express");
const despesaRecorrenteController = require("../controllers/despesaRecorrenteController");

const router = express.Router();

router
    .route("/")
    .get(despesaRecorrenteController.getAllDespesasRecorrentes)
    .post(despesaRecorrenteController.createDespesaRecorrente);

router
    .route("/:id")
    .get(despesaRecorrenteController.getDespesaRecorrente)
    .patch(despesaRecorrenteController.updateDespesaRecorrente)
    .delete(despesaRecorrenteController.deleteDespesaRecorrente);

module.exports = router;
