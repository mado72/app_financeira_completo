const mongoose = require("mongoose");

// Enum para os tipos de ativos, facilitando a validação e extensibilidade
const TIPOS_ATIVO = [
    "ACAO_NACIONAL", // B3
    "ACAO_INTERNACIONAL", // NASDAQ, NYSE
    "CRIPTOMOEDA",
    "MOEDA_ESTRANGEIRA",
    "FUNDO_IMOBILIARIO", // FII
    "REIT",
    "ETF_NACIONAL",
    "ETF_INTERNACIONAL",
    "BOND_NACIONAL", // Debêntures, Tesouro Direto
    "BOND_INTERNACIONAL",
    "LCA_LCI",
    "BDR",
    "OUTRO" // Para casos não cobertos
];

const ativoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, "O nome do ativo é obrigatório."],
        trim: true
    },
    ticker: {
        type: String,
        required: [true, "O ticker do ativo é obrigatório."],
        trim: true,
        uppercase: true,
        // Adicionar uma validação customizada para o formato do ticker, se necessário,
        // ou garantir que a validação com yahoo-finance2 seja feita antes de salvar.
    },
    tipo: {
        type: String,
        required: [true, "O tipo do ativo é obrigatório."],
        enum: TIPOS_ATIVO
    },
    quantidade: {
        type: Number,
        required: [true, "A quantidade do ativo é obrigatória."],
        min: [0, "A quantidade não pode ser negativa."]
    },
    precoMedioCompra: {
        type: Number,
        required: [true, "O preço médio de compra é obrigatório."],
        min: [0, "O preço médio de compra não pode ser negativo."]
    },
    dataAquisicao: {
        type: Date,
        default: Date.now
    },
    // Campos específicos podem ser adicionados aqui ou em um subdocumento/objeto "detalhes"
    // Exemplo: para ações, pode ter "setor", "empresa"
    // Exemplo: para FIIs, pode ter "administrador", "segmento"
    detalhes: {
        type: Map,
        of: String // Permite um mapa de strings para detalhes adicionais flexíveis
    },
    // Referência ao usuário (se houver autenticação no futuro)
    // usuarioId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Usuario",
    //     required: false // Tornar obrigatório quando a autenticação for implementada
    // },
    dataCriacao: {
        type: Date,
        default: Date.now
    },
    dataUltimaModificacao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: "dataCriacao", updatedAt: "dataUltimaModificacao" }
});

// Middleware para garantir que o ticker seja validado antes de salvar (exemplo)
// ativoSchema.pre("save", async function(next) {
//     if (this.isModified("ticker")) {
//         const { validateTicker } = require("../services/cotacaoService"); // Cuidado com dependência circular
//         const validation = await validateTicker(this.ticker);
//         if (!validation.valid) {
//             return next(new Error(`Ticker inválido ou não encontrado: ${this.ticker}. Erro: ${validation.error}`));
//         }
//     }
//     next();
// });

const Ativo = mongoose.model("Ativo", ativoSchema);

module.exports = {
    Ativo,
    TIPOS_ATIVO
};
