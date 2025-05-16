const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const DespesaRecorrente = require("../src/models/despesaRecorrenteModel");
const despesaRecorrenteController = require("../src/controllers/despesaRecorrenteController");

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
    await DespesaRecorrente.deleteMany({});
    jest.clearAllMocks();
});

describe("DespesaRecorrente Controller", () => {
    describe("createDespesaRecorrente", () => {
        it("deve criar uma nova despesa recorrente com sucesso", async () => {
            const req = {
                body: {
                    descricao: "Assinatura Streaming",
                    valorEstimado: 49.90,
                    frequencia: "Mensal",
                    diaDoMesVencimento: 10,
                    categoria: "Entretenimento"
                }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaRecorrenteController.createDespesaRecorrente(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    despesaRecorrente: expect.objectContaining({ descricao: "Assinatura Streaming" })
                })
            }));
            const despesaSalva = await DespesaRecorrente.findOne({ descricao: "Assinatura Streaming" });
            expect(despesaSalva).not.toBeNull();
        });

        it("deve retornar erro 400 se campos obrigatórios estiverem faltando", async () => {
            const req = { body: { descricao: "Faltando Valor" } }; // Faltando valorEstimado e frequencia
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            
            await despesaRecorrenteController.createDespesaRecorrente(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "fail",
                message: expect.stringContaining("obrigatório"), 
            }));
        });
    });

    describe("getAllDespesasRecorrentes", () => {
        it("deve retornar todas as despesas recorrentes", async () => {
            await DespesaRecorrente.create([
                { descricao: "Academia", valorEstimado: 120, frequencia: "Mensal", diaDoMesVencimento: 5 },
                { descricao: "Seguro Anual", valorEstimado: 1500, frequencia: "Anual", mesVencimento: 7 }
            ]);
            const req = { query: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaRecorrenteController.getAllDespesasRecorrentes(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                results: 2,
                data: expect.objectContaining({ despesasRecorrentes: expect.any(Array) })
            }));
            expect(res.json.mock.calls[0][0].data.despesasRecorrentes.length).toBe(2);
        });
    });

    describe("getDespesaRecorrente", () => {
        let despesaTeste;
        beforeEach(async () => {
            despesaTeste = await DespesaRecorrente.create({ descricao: "Plano Celular", valorEstimado: 70, frequencia: "Mensal", diaDoMesVencimento: 12 });
        });

        it("deve retornar uma despesa recorrente específica", async () => {
            const req = { params: { id: despesaTeste._id.toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaRecorrenteController.getDespesaRecorrente(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    despesaRecorrente: expect.objectContaining({ descricao: "Plano Celular" })
                })
            }));
        });

        it("deve retornar 404 se despesa não for encontrada", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaRecorrenteController.getDespesaRecorrente(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("updateDespesaRecorrente", () => {
        let despesaParaAtualizar;
        beforeEach(async () => {
            despesaParaAtualizar = await DespesaRecorrente.create({ descricao: "Software Assinatura", valorEstimado: 30, frequencia: "Mensal", diaDoMesVencimento: 1, ativa: true });
        });

        it("deve atualizar uma despesa recorrente com sucesso", async () => {
            const req = {
                params: { id: despesaParaAtualizar._id.toString() },
                body: { valorEstimado: 35, ativa: false }
            };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaRecorrenteController.updateDespesaRecorrente(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: "success",
                data: expect.objectContaining({
                    despesaRecorrente: expect.objectContaining({ valorEstimado: 35, ativa: false })
                })
            }));
            const despesaAtualizada = await DespesaRecorrente.findById(despesaParaAtualizar._id);
            expect(despesaAtualizada.ativa).toBe(false);
        });

        it("deve retornar 404 se despesa a ser atualizada não for encontrada", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() }, body: { valorEstimado: 1 } }; 
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaRecorrenteController.updateDespesaRecorrente(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("deleteDespesaRecorrente", () => {
        it("deve deletar uma despesa recorrente com sucesso", async () => {
            const despesaParaDeletar = await DespesaRecorrente.create({ descricao: "Curso Online", valorEstimado: 99, frequencia: "Mensal", diaDoMesVencimento: 15 });
            const req = { params: { id: despesaParaDeletar._id.toString() } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaRecorrenteController.deleteDespesaRecorrente(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            const despesaDeletada = await DespesaRecorrente.findById(despesaParaDeletar._id);
            expect(despesaDeletada).toBeNull();
        });

        it("deve retornar 404 se despesa a ser deletada não for encontrada", async () => {
            const req = { params: { id: new mongoose.Types.ObjectId().toString() } }; 
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await despesaRecorrenteController.deleteDespesaRecorrente(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
