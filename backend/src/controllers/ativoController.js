const { Ativo, TIPOS_ATIVO } = require("../models/ativoModel");
const { getQuote, validateTicker } = require("../services/cotacaoService");

// Criar novo ativo
exports.createAtivo = async (req, res) => {
    try {
        console.log('Recebido payload para criação de ativo:', JSON.stringify(req.body));
        
        // Verificar formato da data de aquisição
        if (req.body.dataAquisicao) {
            try {
                // Tentar converter para Date válido
                const dataAquisicao = new Date(req.body.dataAquisicao);
                if (isNaN(dataAquisicao.getTime())) {
                    throw new Error('Data de aquisição inválida');
                }
                req.body.dataAquisicao = dataAquisicao;
            } catch (dateError) {
                console.error(`Erro ao processar data de aquisição: ${dateError.message}`);
                // Remover campo com problema para usar o default
                delete req.body.dataAquisicao;
            }
        }
        
        const { ticker } = req.body;
        // Validar ticker antes de criar o ativo, mas tornar a validação opcional
        try {
            const tickerValidation = await validateTicker(ticker);
            if (!tickerValidation.valid) {
                console.warn(`Aviso: Ticker possivelmente inválido: ${ticker}. Detalhes: ${tickerValidation.error}. Criando ativo mesmo assim.`);
                // Continuamos com a criação mesmo com ticker inválido
            }
        } catch (validationError) {
            console.warn(`Erro ao validar ticker ${ticker}: ${validationError.message}. Criando ativo mesmo assim.`);
            // Continuamos com a criação mesmo com erro na validação
        }

        // Garantir que os campos obrigatórios estejam presentes e com tipos corretos
        if (!req.body.nome) {
            throw new Error('O nome do ativo é obrigatório');
        }
        if (!req.body.tipo) {
            throw new Error('O tipo do ativo é obrigatório');
        }
        if (!req.body.quantidade) {
            throw new Error('A quantidade do ativo é obrigatória');
        }
        if (!req.body.precoMedioCompra) {
            throw new Error('O preço médio de compra é obrigatório');
        }

        // Converter campos numéricos para garantir tipo correto
        req.body.quantidade = Number(req.body.quantidade);
        req.body.precoMedioCompra = Number(req.body.precoMedioCompra);

        const novoAtivo = new Ativo(req.body);
        console.log('Novo ativo criado (antes de salvar):', novoAtivo);
        
        await novoAtivo.save();
        console.log('Ativo salvo com sucesso:', novoAtivo);
        
        res.status(201).json({
            status: "success",
            data: {
                ativo: novoAtivo
            }
        });
    } catch (error) {
        console.error(`Erro ao criar ativo: ${error.message}`);
        console.error(error.stack);
        res.status(400).json({
            status: "fail",
            message: error.message
        });
    }
};

// Obter todos os ativos
exports.getAllAtivos = async (req, res) => {
    try {
        const ativos = await Ativo.find();
        res.status(200).json({
            status: "success",
            results: ativos.length,
            data: {
                ativos
            }
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error.message
        });
    }
};

// Obter um ativo específico e sua cotação atual
exports.getAtivo = async (req, res) => {
    try {
        const ativo = await Ativo.findById(req.params.id);
        if (!ativo) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhum ativo encontrado com este ID"
            });
        }

        let cotacao = null;
        try {
            cotacao = await getQuote(ativo.ticker);
        } catch (cotacaoError) {
            console.warn(`Não foi possível obter a cotação para ${ativo.ticker} ao buscar o ativo: ${cotacaoError.message}`);
            // Continuar mesmo se a cotação falhar, mas informar no resultado
            cotacao = { error: cotacaoError.message, price: null, source: "error" };
        }

        res.status(200).json({
            status: "success",
            data: {
                ativo,
                cotacao
            }
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error.message
        });
    }
};

// Atualizar um ativo
exports.updateAtivo = async (req, res) => {
    try {
        if (req.body.ticker) {
            const tickerValidation = await validateTicker(req.body.ticker);
            if (!tickerValidation.valid) {
                return res.status(400).json({ 
                    status: "fail", 
                    message: `Novo ticker inválido ou não encontrado: ${req.body.ticker}. Detalhes: ${tickerValidation.error}` 
                });
            }
        }

        const ativo = await Ativo.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!ativo) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhum ativo encontrado com este ID para atualização"
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                ativo
            }
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message
        });
    }
};

// Deletar um ativo
exports.deleteAtivo = async (req, res) => {
    try {
        const ativo = await Ativo.findByIdAndDelete(req.params.id);

        if (!ativo) {
            return res.status(404).json({
                status: "fail",
                message: "Nenhum ativo encontrado com este ID para deleção"
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

// Endpoint para listar os tipos de ativos disponíveis
exports.getTiposAtivo = (req, res) => {
    res.status(200).json({
        status: "success",
        data: {
            tipos: TIPOS_ATIVO
        }
    });
};
