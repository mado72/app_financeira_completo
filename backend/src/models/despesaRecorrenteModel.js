const mongoose = require("mongoose");

const despesaRecorrenteSchema = new mongoose.Schema({
    descricao: {
        type: String,
        required: [true, "A descrição da despesa recorrente é obrigatória."],
        trim: true
    },
    valorEstimado: {
        type: Number,
        required: [true, "O valor estimado da despesa recorrente é obrigatório."],
        min: [0, "O valor não pode ser negativo."]
    },
    frequencia: {
        type: String, // Ex: "Mensal", "Anual", "Semanal"
        required: [true, "A frequência é obrigatória."],
        trim: true
    },
    diaDoMesVencimento: { // Para despesas mensais, por exemplo
        type: Number,
        min: 1,
        max: 31
    },
    mesVencimento: { // Para despesas anuais
        type: Number,
        min: 1, // Janeiro
        max: 12 // Dezembro
    },
    categoria: {
        type: String,
        trim: true,
        default: "Outras"
    },
    ativa: {
        type: Boolean,
        default: true
    },
    observacao: {
        type: String,
        trim: true
    }
    // usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" } // Futuro
}, {
    timestamps: { createdAt: "dataCriacao", updatedAt: "dataUltimaModificacao" }
});

const DespesaRecorrente = mongoose.model("DespesaRecorrente", despesaRecorrenteSchema);

module.exports = DespesaRecorrente;
