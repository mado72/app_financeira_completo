const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const ativoRoutes = require("./routes/ativoRoutes");
const despesaProgramadaRoutes = require("./routes/despesaProgramadaRoutes"); // Importar rotas de despesas programadas
const despesaRecorrenteRoutes = require("./routes/despesaRecorrenteRoutes"); // Importar rotas de despesas recorrentes
const cors = require("cors");

const app = express();

// Middleware para CORS
app.use(cors());

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware para parsing de JSON
app.use(express.json());

// Middleware para logging de corpo das requisições
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Corpo da requisição:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Conectar ao MongoDB e só iniciar o servidor após a conexão
connectDB()
  .then(() => {
    console.log("Conexão com o MongoDB estabelecida com sucesso");
    
    // Rotas
    app.get("/", (req, res) => {
      res.send("Backend da Aplicação Financeira está no ar!");
    });

    app.use("/api/ativos", ativoRoutes);
    app.use("/api/despesas-programadas", despesaProgramadaRoutes); // Usar rotas de despesas programadas
    app.use("/api/despesas-recorrentes", despesaRecorrenteRoutes); // Usar rotas de despesas recorrentes

    // Middleware para tratamento de rotas não encontradas
    app.use((req, res, next) => {
      console.error(`Rota não encontrada: ${req.originalUrl}`);
      res.status(404).json({
        status: "error",
        message: `Não foi possível encontrar ${req.originalUrl} neste servidor!`
      });
    });

    // Middleware para tratamento global de erros
    app.use((err, req, res, next) => {
      console.error('Erro global capturado:', err);
      console.error(err.stack);
      
      // Tratamento específico para erros de validação do Mongoose
      if (err.name === 'ValidationError') {
        console.error('Erro de validação do Mongoose:', JSON.stringify(err.errors, null, 2));
        return res.status(400).json({
          status: "error",
          message: "Erro de validação dos dados",
          errors: Object.keys(err.errors).reduce((acc, key) => {
            acc[key] = err.errors[key].message;
            return acc;
          }, {})
        });
      }
      
      // Tratamento específico para erros de cast do Mongoose (tipo incorreto)
      if (err.name === 'CastError') {
        console.error('Erro de cast do Mongoose:', err);
        return res.status(400).json({
          status: "error",
          message: `Valor inválido para o campo ${err.path}: ${err.value}`,
          error: err.message
        });
      }
      
      res.status(500).json({
        status: "error",
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
      });
    });

    // Iniciar o servidor apenas após a conexão com o MongoDB
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error("Erro ao conectar ao MongoDB:", err);
    process.exit(1); // Encerrar o processo se não conseguir conectar ao MongoDB
  });

// Tratamento de exceções não capturadas
process.on('uncaughtException', (err) => {
  console.error('ERRO NÃO CAPTURADO:', err);
  console.error(err.stack);
});

// Tratamento de rejeições de promessas não capturadas
process.on('unhandledRejection', (err) => {
  console.error('REJEIÇÃO NÃO CAPTURADA:', err);
  console.error(err.stack);
});

module.exports = app;
