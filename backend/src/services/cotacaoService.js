const yahooFinance = require("yahoo-finance2").default;
const NodeCache = require("node-cache");
const fallbackRepo = require("../repositories/fallbackRepository");

// Cache com TTL de 1 hora (3600 segundos)
const quoteCache = new NodeCache({ stdTTL: 3600 });

async function getQuote(symbol) {
    if (!symbol) {
        throw new Error("O símbolo do ativo é obrigatório.");
    }

    const cachedQuote = quoteCache.get(symbol);
    if (cachedQuote) {
        return { ...cachedQuote, source: "cache" };
    }

    try {
        const queryOptions = { modules: ["price", "summaryDetail"] };
        const result = await yahooFinance.quote(symbol, queryOptions);

        if (!result || !result.price) {
            // Tentar fallback se o resultado da API for inválido
            const fallback = await fallbackRepo.getFallbackQuote(symbol);
            if (fallback) {
                quoteCache.set(symbol, fallback); // Atualiza o cache com o fallback para evitar buscas repetidas
                return { ...fallback, source: "fallback (API error)" };
            }
            throw new Error(`Não foi possível obter a cotação para ${symbol} da API e não há fallback.`);
        }

        const currentPrice = result.price?.regularMarketPrice;
        const previousClose = result.summaryDetail?.previousClose;
        const currency = result.price?.currency;
        const marketState = result.price?.marketState;
        const displayName = result.price?.displayName || result.price?.shortName;

        if (typeof currentPrice !== "number") {
            const fallback = await fallbackRepo.getFallbackQuote(symbol);
            if (fallback) {
                quoteCache.set(symbol, fallback);
                return { ...fallback, source: "fallback (invalid price from API)" };
            }
            throw new Error(`Preço inválido retornado pela API para ${symbol} e não há fallback.`);
        }

        const quoteData = {
            symbol: symbol,
            displayName: displayName,
            price: currentPrice,
            previousClose: previousClose,
            currency: currency,
            marketState: marketState,
            lastUpdated: new Date().toISOString(),
            isFallback: false
        };

        quoteCache.set(symbol, quoteData);
        await fallbackRepo.saveFallbackQuote(symbol, quoteData); // Salva a cotação bem-sucedida como fallback

        return { ...quoteData, source: "api" };

    } catch (error) {
        console.error(`Erro ao buscar cotação para ${symbol} na API:`, error.message);
        const fallback = await fallbackRepo.getFallbackQuote(symbol);
        if (fallback) {
            quoteCache.set(symbol, fallback); // Atualiza o cache com o fallback
            return { ...fallback, source: "fallback (API request failed)" };
        }
        // Se chegou aqui, a API falhou e não há fallback.
        // Lançar um erro mais específico ou retornar um objeto de erro.
        throw new Error(`Falha ao obter cotação para ${symbol}. Serviço indisponível e sem dados de fallback.`);
    }
}

// Função para validar se o ticker é reconhecido pelo yahoo-finance2
async function validateTicker(symbol) {
    if (!symbol) {
        return { valid: false, error: "Símbolo não fornecido." };
    }
    try {
        // Uma forma simples de validar é tentar buscar um módulo básico.
        // Se não lançar erro e retornar algo, consideramos válido.
        const result = await yahooFinance.quote(symbol, { modules: ["price"] });
        if (result && result.price) {
            return { valid: true, data: result };
        } else {
            return { valid: false, error: "Símbolo não encontrado ou resposta inválida da API." };
        }
    } catch (error) {
        // Erros comuns podem ser 404 (não encontrado) ou outros problemas de rede/API
        // console.error(`Erro ao validar ticker ${symbol}:`, error.message);
        return { valid: false, error: error.message || "Erro desconhecido ao validar ticker." };
    }
}

module.exports = {
    getQuote,
    validateTicker
};
