const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { Ativo, TIPOS_ATIVO } = require("../src/models/ativoModel");
const ativoController = require("../src/controllers/ativoController");
const cotacaoService = require("../src/services/cotacaoService");

let mongoServer;

// Mock cotacaoService
jest.mock("../src/services/cotacaoService", () => ({
    getQuote: jest.fn(),
    validateTicker: jest.fn(),
}));

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Ativo.deleteMany({});
    jest.clearAllMocks(); // Limpa todos os mocks após cada teste
});

describe("Ativo Controller", () => {
    describe("createAtivo", () => {
        it("deve criar um novo ativo com sucesso se o ticker for válido", async () => {
            cotacaoService.validateTicker.mockResolvedValue({ valid: true });
            const req = {
                body: {
                    nome: "Petrobras PN",
                    ticker: "PETR4.SA",
                    tipo: "ACAO_NACIONAL",
                    quantidade: 100,
                    precoMedioCompra: 30.50
                }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.createAtivo(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    ativo: expect.objectContaining({ nome: "Petrobras PN", ticker: "PETR4.SA" })
                })
            }));            
            const ativoSalvo = await Ativo.findOne({ ticker: "PETR4.SA" });
            expect(ativoSalvo).not.toBeNull();
        });

        it("não deve criar um ativo se o ticker for inválido", async () => {
            cotacaoService.validateTicker.mockResolvedValue({ valid: false, error: "Ticker não encontrado" });
            const req = { body: { nome: "Invalido", ticker: "INVALID.SA", tipo: "ACAO_NACIONAL", quantidade: 10, precoMedioCompra: 1 } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.createAtivo(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "fail",
                message: "Ticker inválido ou não encontrado: INVALID.SA. Detalhes: Ticker não encontrado"
            }));
        });

        it("deve retornar erro 400 se campos obrigatórios estiverem faltando", async () => {
            cotacaoService.validateTicker.mockResolvedValue({ valid: true }); // Supondo ticker válido para focar no erro do modelo
            const req = { body: { nome: "Faltando Campos", ticker: "PETR4.SA" } }; // Faltando tipo, quantidade, precoMedioCompra
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await ativoController.createAtivo(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "fail",
                // A mensagem exata pode variar dependendo de qual validação falha primeiro
                message: expect.stringContaining("obrigatório"), 
            }));
        });
    });

    describe("getAllAtivos", () => {
        it("deve retornar todos os ativos", async () => {
            await Ativo.create([
                { nome: "Vale ON", ticker: "VALE3.SA", tipo: "ACAO_NACIONAL", quantidade: 50, precoMedioCompra: 70 },
                { nome: "Bitcoin", ticker: "BTC-USD", tipo: "CRIPTOMOEDA", quantidade: 0.1, precoMedioCompra: 300000 }
            ]);
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.getAllAtivos(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                results: 2,
                data: expect.objectContaining({ ativos: expect.any(Array) })
            }));
            expect(res.json.mock.calls[0][0].data.ativos.length).toBe(2);
        });
    });

    describe("getAtivo", () => {
        let ativoTeste;
        beforeEach(async () => {
            ativoTeste = await Ativo.create({ nome: "Magalu ON", ticker: "MGLU3.SA", tipo: "ACAO_NACIONAL", quantidade: 200, precoMedioCompra: 2.50 });
        });

        it("deve retornar um ativo e sua cotação", async () => {
            cotacaoService.getQuote.mockResolvedValue({ price: 2.80, source: "api" });
            const req = { params: { id: ativoTeste._id.toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.getAtivo(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    ativo: expect.objectContaining({ ticker: "MGLU3.SA" }),
                    cotacao: expect.objectContaining({ price: 2.80 })
                })
            }));
            expect(cotacaoService.getQuote).toHaveBeenCalledWith("MGLU3.SA");
        });

        it("deve retornar ativo mesmo se cotação falhar, com erro na cotação", async () => {
            cotacaoService.getQuote.mockRejectedValue(new Error("Falha na API de cotação"));
            const req = { params: { id: ativoTeste._id.toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.getAtivo(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    ativo: expect.objectContaining({ ticker: "MGLU3.SA" }),
                    cotacao: expect.objectContaining({ error: "Falha na API de cotação", price: null, source: "error" })
                })
            }));
        });

        it("deve retornar 404 se ativo não for encontrado", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() } }; // ID inválido
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.getAtivo(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("updateAtivo", () => {
        let ativoParaAtualizar;
        beforeEach(async () => {
            ativoParaAtualizar = await Ativo.create({ nome: "Itausa PN", ticker: "ITSA4.SA", tipo: "ACAO_NACIONAL", quantidade: 100, precoMedioCompra: 9.00 });
        });

        it("deve atualizar um ativo com sucesso", async () => {
            cotacaoService.validateTicker.mockResolvedValue({ valid: true }); // Se for atualizar o ticker
            const req = {
                params: { id: ativoParaAtualizar._id.toString() },
                body: { quantidade: 150, precoMedioCompra: 9.20 }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.updateAtivo(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    ativo: expect.objectContaining({ quantidade: 150, precoMedioCompra: 9.20 })
                })
            }));
            const ativoAtualizado = await Ativo.findById(ativoParaAtualizar._id);
            expect(ativoAtualizado.quantidade).toBe(150);
        });

        it("não deve atualizar se novo ticker for inválido", async () => {
            cotacaoService.validateTicker.mockResolvedValue({ valid: false, error: "Novo ticker inválido" });
            const req = {
                params: { id: ativoParaAtualizar._id.toString() },
                body: { ticker: "INVALIDNEW.SA" }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.updateAtivo(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Novo ticker inválido ou não encontrado: INVALIDNEW.SA. Detalhes: Novo ticker inválido" }));
        });

        it("deve retornar 404 se ativo a ser atualizado não for encontrado", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() }, body: { quantidade: 1 } }; 
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.updateAtivo(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("deleteAtivo", () => {
        it("deve deletar um ativo com sucesso", async () => {
            const ativoParaDeletar = await Ativo.create({ nome: "Weg ON", ticker: "WEGE3.SA", tipo: "ACAO_NACIONAL", quantidade: 30, precoMedioCompra: 35 });
            const req = { params: { id: ativoParaDeletar._id.toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.deleteAtivo(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            const ativoDeletado = await Ativo.findById(ativoParaDeletar._id);
            expect(ativoDeletado).toBeNull();
        });

        it("deve retornar 404 se ativo a ser deletado não for encontrado", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() } }; 
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await ativoController.deleteAtivo(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("getTiposAtivo", () => {
        it("deve retornar a lista de tipos de ativo", () => {
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            ativoController.getTiposAtivo(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: { tipos: TIPOS_ATIVO }
            }));
        });
    });
});

