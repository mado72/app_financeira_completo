const mongoose = require("mongoose");

const despesaProgramadaSchema = new mongoose.Schema({
    descricao: {
        type: String,
        required: [true, "A descrição da despesa programada é obrigatória."],
        trim: true
    },
    valor: {
        type: Number,
        required: [true, "O valor da despesa programada é obrigatório."],
        min: [0, "O valor não pode ser negativo."]
    },
    dataVencimento: {
        type: Date,
        required: [true, "A data de vencimento é obrigatória."]
    },
    categoria: {
        type: String,
        trim: true,
        default: "Outras"
    },
    pago: {
        type: Boolean,
        default: false
    },
    observacao: {
        type: String,
        trim: true
    }
    // usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" } // Futuro
}, {
    timestamps: { createdAt: "dataCriacao", updatedAt: "dataUltimaModificacao" }
});

const DespesaProgramada = mongoose.model("DespesaProgramada", despesaProgramadaSchema);

module.exports = DespesaProgramada;
