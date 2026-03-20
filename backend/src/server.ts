import "dotenv/config";
import app from "./app";
import pool from "./config/database";

const PORT = parseInt(process.env.PORT || "3001", 10);

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Conexão com o banco de dados estabelecida");
  } catch (err) {
    console.error("❌ Falha ao conectar ao banco de dados:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📄 Documentação da API: http://localhost:${PORT}/api/docs`);
    console.log(
      `📋 OpenAPI JSON:        http://localhost:${PORT}/api/docs-json`,
    );
  });
}

start();
