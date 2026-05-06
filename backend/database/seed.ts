import * as path from "path";
import { Pool, PoolClient } from "pg";
import * as dotenv from "dotenv";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TEST_EMAIL = "teste@dev.com";
const TODAY = "2026-05-04";

async function insertGasto(
  client: PoolClient,
  uid: string,
  catMap: Record<string, number>,
  params: {
    descricao: string;
    valor: number;
    cat: string;
    forma: string;
    cartaoId?: string;
    tipo: "a_vista" | "parcelado";
    parcelas?: number;
    data: string;
    status?: string;
  }
) {
  const gId = crypto.randomUUID();
  const status = params.status ?? "pago";
  const qtd = params.parcelas ?? 1;

  await client.query(
    `INSERT INTO gastos
       (id, user_id, descricao, valor_total, categoria_id, forma_pagamento,
        cartao_id, tipo_pagamento, quantidade_parcelas, data_gasto, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      gId,
      uid,
      params.descricao,
      params.valor,
      catMap[params.cat],
      params.forma,
      params.cartaoId ?? null,
      params.tipo,
      qtd,
      params.data,
      status,
    ]
  );

  if (params.tipo === "parcelado" && qtd > 1) {
    const valorParcela = +(params.valor / qtd).toFixed(2);
    const [ano, mes, dia] = params.data.split("-").map(Number);
    for (let i = 1; i <= qtd; i++) {
      const d = new Date(ano, mes - 1 + i, dia);
      const venc = d.toISOString().split("T")[0];
      const pStatus = venc <= TODAY ? "pago" : "pendente";
      await client.query(
        `INSERT INTO parcelas (gasto_id, numero_parcela, valor_parcela, data_vencimento, status)
         VALUES ($1,$2,$3,$4,$5)`,
        [gId, i, valorParcela, venc, pStatus]
      );
    }
  }
}

async function insertRenda(
  client: PoolClient,
  uid: string,
  catMap: Record<string, number>,
  params: {
    descricao: string;
    valor: number;
    tipo: string;
    origem?: string;
    cat: string;
    mesRef: string;
    dataRec: string;
  }
) {
  await client.query(
    `INSERT INTO renda
       (id, user_id, descricao, valor, tipo, origem, categoria_id, mes_referencia, data_recebimento)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      crypto.randomUUID(),
      uid,
      params.descricao,
      params.valor,
      params.tipo,
      params.origem ?? params.descricao,
      catMap[params.cat],
      params.mesRef,
      params.dataRec,
    ]
  );
}

async function insertAssinatura(
  client: PoolClient,
  uid: string,
  catMap: Record<string, number>,
  params: {
    descricao: string;
    valor: number;
    cat: string;
    forma: string;
    cartaoId?: string;
    dia: number;
    inicio: string;
  }
) {
  await client.query(
    `INSERT INTO assinaturas
       (id, user_id, descricao, valor, categoria_id, forma_pagamento,
        cartao_id, dia_cobranca, data_inicio)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      crypto.randomUUID(),
      uid,
      params.descricao,
      params.valor,
      catMap[params.cat],
      params.forma,
      params.cartaoId ?? null,
      params.dia,
      params.inicio,
    ]
  );
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Remove test user (CASCADE limpa tudo relacionado)
    await client.query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);

    // Usuário de teste
    const uid = crypto.randomUUID();
    const passwordHash = await bcrypt.hash("senha123", 10);
    await client.query(
      `INSERT INTO users (id, name, email, password_hash, user_level, api_key)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [uid, "Felipe Teste", TEST_EMAIL, passwordHash, "premium", crypto.randomUUID()]
    );
    console.log(`[seed] user criado: ${TEST_EMAIL} / senha123`);

    // Categorias globais
    const { rows: cats } = await client.query(
      "SELECT id, nome FROM categorias WHERE user_id IS NULL"
    );
    const cat: Record<string, number> = Object.fromEntries(
      cats.map((c: { nome: string; id: number }) => [c.nome, c.id])
    );

    // Cartões
    const cnId = crypto.randomUUID();
    const ciId = crypto.randomUUID();

    await client.query(
      `INSERT INTO cartoes
         (id, user_id, apelido, nome_no_cartao, ultimos_4_digitos,
          bandeira, tipo, cor, banco, limite, dia_fechamento, dia_vencimento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [cnId, uid, "Nubank", "FELIPE C MACEDO", "4521", "mastercard", "credito", "#8A05BE", "Nubank", 5000, 3, 10]
    );
    await client.query(
      `INSERT INTO cartoes
         (id, user_id, apelido, nome_no_cartao, ultimos_4_digitos,
          bandeira, tipo, cor, banco, dia_fechamento, dia_vencimento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [ciId, uid, "Inter Débito", "FELIPE C MACEDO", "7834", "mastercard", "debito", "#FF6B00", "Banco Inter", 5, 5]
    );
    console.log("[seed] cartoes: Nubank crédito, Inter débito");

    // ── Gastos março 2026 ──────────────────────────────────────
    await insertGasto(client, uid, cat, {
      descricao: "Mercado Pão de Açúcar",
      valor: 312.50,
      cat: "Mercado",
      forma: "cartao_debito",
      cartaoId: ciId,
      tipo: "a_vista",
      data: "2026-03-08",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Almoço restaurante",
      valor: 58.90,
      cat: "Alimentação",
      forma: "dinheiro",
      tipo: "a_vista",
      data: "2026-03-12",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Uber",
      valor: 34.50,
      cat: "Transporte",
      forma: "pix",
      tipo: "a_vista",
      data: "2026-03-15",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Farmácia",
      valor: 67.80,
      cat: "Farmácia",
      forma: "cartao_debito",
      cartaoId: ciId,
      tipo: "a_vista",
      data: "2026-03-20",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Cinema",
      valor: 56.00,
      cat: "Lazer",
      forma: "cartao_credito",
      cartaoId: cnId,
      tipo: "a_vista",
      data: "2026-03-22",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Notebook Dell",
      valor: 4800.00,
      cat: "Tecnologia",
      forma: "cartao_credito",
      cartaoId: cnId,
      tipo: "parcelado",
      parcelas: 10,
      data: "2026-03-05",
    });

    // ── Gastos abril 2026 ──────────────────────────────────────
    await insertGasto(client, uid, cat, {
      descricao: "Mercado Carrefour",
      valor: 287.30,
      cat: "Mercado",
      forma: "cartao_debito",
      cartaoId: ciId,
      tipo: "a_vista",
      data: "2026-04-05",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Delivery iFood",
      valor: 89.90,
      cat: "Alimentação",
      forma: "pix",
      tipo: "a_vista",
      data: "2026-04-10",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Gasolina",
      valor: 180.00,
      cat: "Transporte",
      forma: "cartao_debito",
      cartaoId: ciId,
      tipo: "a_vista",
      data: "2026-04-12",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Jantar restaurante",
      valor: 156.00,
      cat: "Lazer",
      forma: "cartao_credito",
      cartaoId: cnId,
      tipo: "a_vista",
      data: "2026-04-20",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Academia",
      valor: 99.90,
      cat: "Saúde",
      forma: "pix",
      tipo: "a_vista",
      data: "2026-04-02",
    });

    // ── Gastos maio 2026 ───────────────────────────────────────
    await insertGasto(client, uid, cat, {
      descricao: "Mercado Extra",
      valor: 265.40,
      cat: "Mercado",
      forma: "cartao_debito",
      cartaoId: ciId,
      tipo: "a_vista",
      data: "2026-05-02",
      status: "pago",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Café",
      valor: 28.50,
      cat: "Alimentação",
      forma: "pix",
      tipo: "a_vista",
      data: "2026-05-04",
      status: "pago",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Uber",
      valor: 42.00,
      cat: "Transporte",
      forma: "pix",
      tipo: "a_vista",
      data: "2026-05-03",
      status: "pago",
    });
    await insertGasto(client, uid, cat, {
      descricao: "Conta de luz",
      valor: 187.60,
      cat: "Moradia",
      forma: "pix",
      tipo: "a_vista",
      data: "2026-05-04",
      status: "pendente",
    });
    console.log("[seed] gastos inseridos (mar/abr/mai 2026)");

    // ── Renda ──────────────────────────────────────────────────
    await insertRenda(client, uid, cat, {
      descricao: "Salário",
      valor: 8500.00,
      tipo: "salario",
      cat: "Salário",
      mesRef: "2026-03-01",
      dataRec: "2026-03-05",
    });
    await insertRenda(client, uid, cat, {
      descricao: "Freelance - App Mobile",
      valor: 1800.00,
      tipo: "freelance",
      cat: "Freelance",
      mesRef: "2026-03-01",
      dataRec: "2026-03-20",
    });
    await insertRenda(client, uid, cat, {
      descricao: "Salário",
      valor: 8500.00,
      tipo: "salario",
      cat: "Salário",
      mesRef: "2026-04-01",
      dataRec: "2026-04-05",
    });
    await insertRenda(client, uid, cat, {
      descricao: "Freelance - Dashboard",
      valor: 2400.00,
      tipo: "freelance",
      cat: "Freelance",
      mesRef: "2026-04-01",
      dataRec: "2026-04-25",
    });
    await insertRenda(client, uid, cat, {
      descricao: "Salário",
      valor: 8500.00,
      tipo: "salario",
      cat: "Salário",
      mesRef: "2026-05-01",
      dataRec: "2026-05-05",
    });
    console.log("[seed] renda inserida");

    // ── Assinaturas ────────────────────────────────────────────
    await insertAssinatura(client, uid, cat, {
      descricao: "Netflix",
      valor: 45.90,
      cat: "Assinaturas",
      forma: "cartao_credito",
      cartaoId: cnId,
      dia: 5,
      inicio: "2025-01-05",
    });
    await insertAssinatura(client, uid, cat, {
      descricao: "Spotify",
      valor: 21.90,
      cat: "Assinaturas",
      forma: "pix",
      dia: 10,
      inicio: "2024-06-10",
    });
    await insertAssinatura(client, uid, cat, {
      descricao: "iCloud 50GB",
      valor: 9.90,
      cat: "Assinaturas",
      forma: "cartao_credito",
      cartaoId: cnId,
      dia: 15,
      inicio: "2025-03-15",
    });
    console.log("[seed] assinaturas inseridas");

    await client.query("COMMIT");

    console.log("\n[seed] concluído!");
    console.log("  email : teste@dev.com");
    console.log("  senha : senha123");
    console.log("  dados : mar/abr/mai 2026 — gastos, renda, cartoes, assinaturas");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[seed] erro:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
