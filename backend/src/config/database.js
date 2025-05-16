const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Usando MongoDB local por padrão
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/app_financeira';
    
    const conn = await mongoose.connect(mongoURI, {
      // As opções abaixo são padrão no Mongoose 6+
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    // Não encerrar o processo em ambiente de produção
    // process.exit(1);
    throw error;
  }
};

module.exports = connectDB;
