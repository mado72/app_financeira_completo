FROM mongo:8.0

# Expor a porta padrão do MongoDB
EXPOSE 27017

# Definir volume para persistência de dados
VOLUME ["/data/db"]

# Configurações de inicialização
CMD ["mongod", "--bind_ip_all"]
