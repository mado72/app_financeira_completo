const express = require("express");
const ativoController = require("../controllers/ativoController");

const router = express.Router();

router
    .route("/")
    .get(ativoController.getAllAtivos)
    .post(ativoController.createAtivo);

router
    .route("/:id")
    .get(ativoController.getAtivo)
    .patch(ativoController.updateAtivo)
    .delete(ativoController.deleteAtivo);

router.route("/config/tipos").get(ativoController.getTiposAtivo);

module.exports = router;
