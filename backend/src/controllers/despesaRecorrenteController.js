const DespesaRecorrente = require("../models/despesaRecorrenteModel");

// Criar nova despesa recorrente
exports.createDespesaRecorrente = async (req, res) => {
    try {
        const novaDespesa = new DespesaRecorrente(req.body);
        await novaDespesa.save();
        res.status(201).json({
            status: "success",
            data: {
                despesaRecorrente: novaDespesa
            }
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message
        });
    }
};

// Obter todas as despesas recorrentes
exports.getAllDespesasRecorrentes = async (req, res) => {
    try {
        const despesas = await DespesaRecorrente.find(); // Adicionar filtros se necessário
        res.status(200).json({
            status: "success",
            results: despesas.length,
            data: {
                despesasRecorrentes: despesas
            }
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error.message
        });
    }
};

// Obter uma despesa recorrente específica
exports.getDespesaRecorrente = async (req, res) => {
    try {
        const despesa = await DespesaRecorrente.findById(req.params.id);
        if (!despesa) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhuma despesa recorrente encontrada com este ID"
            });
        }
        res.status(200).json({
            status: "success",
            data: {
                despesaRecorrente: despesa
            }
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error.message
        });
    }
};

// Atualizar uma despesa recorrente
exports.updateDespesaRecorrente = async (req, res) => {
    try {
        const despesa = await DespesaRecorrente.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!despesa) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhuma despesa recorrente encontrada com este ID para atualização"
            });
        }
        res.status(200).json({
            status: "success",
            data: {
                despesaRecorrente: despesa
            }
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message
        });
    }
};

// Deletar uma despesa recorrente
exports.deleteDespesaRecorrente = async (req, res) => {
    try {
        const despesa = await DespesaRecorrente.findByIdAndDelete(req.params.id);
        if (!despesa) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhuma despesa recorrente encontrada com este ID para deleção"
            });
        }
        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error.message
        });
    }
};

