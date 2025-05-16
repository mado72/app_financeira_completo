// const cotacaoService = require("../src/services/cotacaoService"); // Movido para dentro do describe
const fallbackRepo = require("../src/repositories/fallbackRepository");
// const NodeCache = require("node-cache");
const yahooFinance = require("yahoo-finance2").default;

jest.mock("yahoo-finance2");
jest.mock("../src/repositories/fallbackRepository");

const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();

jest.mock("node-cache", () => {
    return jest.fn().mockImplementation(() => {
        return {
            get: mockCacheGet,
            set: mockCacheSet,
        };
    });
});

describe("CotacaoService", () => {
    let cotacaoService; // Declarar aqui

    beforeAll(() => {
        // O require é feito aqui, APÓS os mocks serem configurados globalmente
        cotacaoService = require("../src/services/cotacaoService");
    });

    beforeEach(() => {
        yahooFinance.quote.mockClear();
        fallbackRepo.getFallbackQuote.mockClear();
        fallbackRepo.saveFallbackQuote.mockClear();
        mockCacheGet.mockClear();
        mockCacheSet.mockClear();
    });

    describe("getQuote", () => {
        it("deve retornar cotação do cache se disponível", async () => {
            const mockCachedData = { symbol: "PETR4.SA", price: 30, source: "cache", lastUpdated: new Date().toISOString(), isFallback: false };
            mockCacheGet.mockReturnValue(mockCachedData);

            const quote = await cotacaoService.getQuote("PETR4.SA");
            expect(quote).toEqual(mockCachedData);
            expect(mockCacheGet).toHaveBeenCalledWith("PETR4.SA");
            expect(yahooFinance.quote).not.toHaveBeenCalled();
        });

        it("deve buscar na API se não estiver no cache e salvar no cache e fallback", async () => {
            mockCacheGet.mockReturnValue(undefined);
            const mockApiResult = {
                price: { regularMarketPrice: 32.50, currency: "BRL", shortName: "PETROBRAS PN" },
                summaryDetail: { previousClose: 32.00 }
            };
            yahooFinance.quote.mockResolvedValue(mockApiResult);
            fallbackRepo.saveFallbackQuote.mockResolvedValue();

            const quote = await cotacaoService.getQuote("PETR4.SA");

            expect(yahooFinance.quote).toHaveBeenCalledWith("PETR4.SA", { modules: ["price", "summaryDetail"] });
            expect(mockCacheSet).toHaveBeenCalledWith("PETR4.SA", expect.objectContaining({ price: 32.50 }));
            expect(fallbackRepo.saveFallbackQuote).toHaveBeenCalledWith("PETR4.SA", expect.objectContaining({ price: 32.50 }));
            expect(quote.price).toBe(32.50);
            expect(quote.source).toBe("api");
        });

        it("deve usar fallback se API falhar e fallback existir", async () => {
            mockCacheGet.mockReturnValue(undefined);
            yahooFinance.quote.mockRejectedValue(new Error("API Error"));
            const mockFallbackData = { symbol: "PETR4.SA", price: 29, lastUpdated: new Date().toISOString(), isFallback: true };
            fallbackRepo.getFallbackQuote.mockResolvedValue(mockFallbackData);

            const quote = await cotacaoService.getQuote("PETR4.SA");

            expect(quote.price).toBe(29);
            expect(quote.source).toBe("fallback (API request failed)");
            expect(mockCacheSet).toHaveBeenCalledWith("PETR4.SA", mockFallbackData);
        });

        it("deve lançar erro se API falhar e não houver fallback", async () => {
            mockCacheGet.mockReturnValue(undefined);
            yahooFinance.quote.mockRejectedValue(new Error("API Error"));
            fallbackRepo.getFallbackQuote.mockResolvedValue(undefined);

            await expect(cotacaoService.getQuote("PETR4.SA")).rejects.toThrow(
                "Falha ao obter cotação para PETR4.SA. Serviço indisponível e sem dados de fallback."
            );
        });

        it("deve usar fallback se API retornar dados inválidos (sem preço)", async () => {
            mockCacheGet.mockReturnValue(undefined);
            const mockApiResultInvalid = { price: { currency: "BRL" } };
            yahooFinance.quote.mockResolvedValue(mockApiResultInvalid);
            const mockFallbackData = { symbol: "PETR4.SA", price: 28.50, lastUpdated: new Date().toISOString(), isFallback: true };
            fallbackRepo.getFallbackQuote.mockResolvedValue(mockFallbackData);

            const quote = await cotacaoService.getQuote("PETR4.SA");
            expect(quote.price).toBe(28.50);
            expect(quote.source).toBe("fallback (invalid price from API)");
            expect(mockCacheSet).toHaveBeenCalledWith("PETR4.SA", mockFallbackData);
        });

         it("deve lançar erro se símbolo não for fornecido", async () => {
            await expect(cotacaoService.getQuote(null)).rejects.toThrow("O símbolo do ativo é obrigatório.");
        });
    });

    describe("validateTicker", () => {
        it("deve retornar válido se API encontrar o ticker", async () => {
            yahooFinance.quote.mockResolvedValue({ price: { regularMarketPrice: 150 } });
            const result = await cotacaoService.validateTicker("AAPL");
            expect(result.valid).toBe(true);
            expect(result.data).toBeDefined();
        });

        it("deve retornar inválido se API não encontrar o ticker (erro)", async () => {
            yahooFinance.quote.mockRejectedValue(new Error("Not Found"));
            const result = await cotacaoService.validateTicker("INVALIDTICKER");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Not Found");
        });

        it("deve retornar inválido se API retornar resultado sem preço", async () => {
            yahooFinance.quote.mockResolvedValue({});
            const result = await cotacaoService.validateTicker("WEIRDTICKER");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Símbolo não encontrado ou resposta inválida da API.");
        });

        it("deve retornar inválido se símbolo não for fornecido", async () => {
            const result = await cotacaoService.validateTicker(null);
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Símbolo não fornecido.");
        });
    });
});
