const fs = require("fs").promises;
const path = require("path");

const FALLBACK_FILE_PATH = path.join(__dirname, "..", "config", "cotacoes_fallback.json");

async function readFallbackData() {
    try {
        await fs.access(FALLBACK_FILE_PATH);
        const data = await fs.readFile(FALLBACK_FILE_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is invalid JSON, return empty object
        if (error.code === "ENOENT") {
            await fs.writeFile(FALLBACK_FILE_PATH, JSON.stringify({}), "utf-8");
            return {};
        }
        console.error("Erro ao ler arquivo de fallback:", error);
        return {};
    }
}

async function writeFallbackData(data) {
    try {
        await fs.writeFile(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
        console.error("Erro ao escrever arquivo de fallback:", error);
    }
}

async function getFallbackQuote(symbol) {
    const fallbackData = await readFallbackData();
    return fallbackData[symbol];
}

async function saveFallbackQuote(symbol, quoteData) {
    const fallbackData = await readFallbackData();
    fallbackData[symbol] = {
        ...quoteData,
        lastUpdated: new Date().toISOString(),
        isFallback: true
    };
    await writeFallbackData(fallbackData);
}

module.exports = {
    getFallbackQuote,
    saveFallbackQuote,
    readFallbackData // Export for testing or direct use if needed
};
