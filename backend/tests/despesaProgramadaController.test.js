const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const DespesaProgramada = require("../src/models/despesaProgramadaModel");
const despesaProgramadaController = require("../src/controllers/despesaProgramadaController");

let mongoServer;

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
    await DespesaProgramada.deleteMany({});
    jest.clearAllMocks();
});

describe("DespesaProgramada Controller", () => {
    describe("createDespesaProgramada", () => {
        it("deve criar uma nova despesa programada com sucesso", async () => {
            const req = {
                body: {
                    descricao: "Conta de Luz",
                    valor: 150.75,
                    dataVencimento: new Date("2025-06-10"),
                    categoria: "Casa"
                }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaProgramadaController.createDespesaProgramada(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    despesaProgramada: expect.objectContaining({ descricao: "Conta de Luz" })
                })
            }));
            const despesaSalva = await DespesaProgramada.findOne({ descricao: "Conta de Luz" });
            expect(despesaSalva).not.toBeNull();
        });

        it("deve retornar erro 400 se campos obrigatórios estiverem faltando", async () => {
            const req = { body: { descricao: "Faltando Valor" } }; // Faltando valor e dataVencimento
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await despesaProgramadaController.createDespesaProgramada(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "fail",
                message: expect.stringContaining("obrigatório"), 
            }));
        });
    });

    describe("getAllDespesasProgramadas", () => {
        it("deve retornar todas as despesas programadas", async () => {
            await DespesaProgramada.create([
                { descricao: "Aluguel", valor: 1200, dataVencimento: new Date("2025-06-05") },
                { descricao: "Internet", valor: 99.90, dataVencimento: new Date("2025-06-15") }
            ]);
            const req = { query: {} }; // Sem query para pegar todos
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaProgramadaController.getAllDespesasProgramadas(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                results: 2,
                data: expect.objectContaining({ despesasProgramadas: expect.any(Array) })
            }));
            expect(res.json.mock.calls[0][0].data.despesasProgramadas.length).toBe(2);
        });
    });

    describe("getDespesaProgramada", () => {
        let despesaTeste;
        beforeEach(async () => {
            despesaTeste = await DespesaProgramada.create({ descricao: "Condomínio", valor: 300, dataVencimento: new Date("2025-06-08") });
        });

        it("deve retornar uma despesa programada específica", async () => {
            const req = { params: { id: despesaTeste._id.toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaProgramadaController.getDespesaProgramada(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    despesaProgramada: expect.objectContaining({ descricao: "Condomínio" })
                })
            }));
        });

        it("deve retornar 404 se despesa não for encontrada", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaProgramadaController.getDespesaProgramada(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("updateDespesaProgramada", () => {
        let despesaParaAtualizar;
        beforeEach(async () => {
            despesaParaAtualizar = await DespesaProgramada.create({ descricao: "Seguro Carro", valor: 200, dataVencimento: new Date("2025-06-20"), pago: false });
        });

        it("deve atualizar uma despesa programada com sucesso", async () => {
            const req = {
                params: { id: despesaParaAtualizar._id.toString() },
                body: { valor: 210, pago: true }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaProgramadaController.updateDespesaProgramada(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    despesaProgramada: expect.objectContaining({ valor: 210, pago: true })
                })
            }));
            const despesaAtualizada = await DespesaProgramada.findById(despesaParaAtualizar._id);
            expect(despesaAtualizada.pago).toBe(true);
        });

        it("deve retornar 404 se despesa a ser atualizada não for encontrada", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() }, body: { valor: 1 } }; 
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaProgramadaController.updateDespesaProgramada(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("deleteDespesaProgramada", () => {
        it("deve deletar uma despesa programada com sucesso", async () => {
            const despesaParaDeletar = await DespesaProgramada.create({ descricao: "IPTU Parcela", valor: 180, dataVencimento: new Date("2025-06-25") });
            const req = { params: { id: despesaParaDeletar._id.toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaProgramadaController.deleteDespesaProgramada(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            const despesaDeletada = await DespesaProgramada.findById(despesaParaDeletar._id);
            expect(despesaDeletada).toBeNull();
        });

        it("deve retornar 404 se despesa a ser deletada não for encontrada", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() } }; 
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaProgramadaController.deleteDespesaProgramada(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
