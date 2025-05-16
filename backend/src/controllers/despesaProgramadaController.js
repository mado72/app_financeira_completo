const DespesaProgramada = require("../models/despesaProgramadaModel");

// Criar nova despesa programada
exports.createDespesaProgramada = async (req, res) => {
    try {
        const novaDespesa = new DespesaProgramada(req.body);
        await novaDespesa.save();
        res.status(201).json({
            status: "success",
            data: {
                despesaProgramada: novaDespesa
            }
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message
        });
    }
};

// Obter todas as despesas programadas (com filtros básicos, ex: por mês/ano)
exports.getAllDespesasProgramadas = async (req, res) => {
    try {
        // Exemplo de filtro: ?mes=5&ano=2025
        const queryObj = { ...req.query };
        const excludedFields = ["page", "sort", "limit", "fields"];
        excludedFields.forEach(el => delete queryObj[el]);

        let query = DespesaProgramada.find(queryObj);

        // Adicionar ordenação, por exemplo, por data de vencimento
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("dataVencimento"); // Padrão
        }

        const despesas = await query;
        
        res.status(200).json({
            status: "success",
            results: despesas.length,
            data: {
                despesasProgramadas: despesas
            }
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error.message
        });
    }
};

// Obter uma despesa programada específica
exports.getDespesaProgramada = async (req, res) => {
    try {
        const despesa = await DespesaProgramada.findById(req.params.id);
        if (!despesa) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhuma despesa programada encontrada com este ID"
            });
        }
        res.status(200).json({
            status: "success",
            data: {
                despesaProgramada: despesa
            }
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error.message
        });
    }
};

// Atualizar uma despesa programada
exports.updateDespesaProgramada = async (req, res) => {
    try {
        const despesa = await DespesaProgramada.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!despesa) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhuma despesa programada encontrada com este ID para atualização"
            });
        }
        res.status(200).json({
            status: "success",
            data: {
                despesaProgramada: despesa
            }
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message
        });
    }
};

// Deletar uma despesa programada
exports.deleteDespesaProgramada = async (req, res) => {
    try {
        const despesa = await DespesaProgramada.findByIdAndDelete(req.params.id);
        if (!despesa) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhuma despesa programada encontrada com este ID para deleção"
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

