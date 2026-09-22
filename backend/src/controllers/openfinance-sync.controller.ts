import { Request, Response, NextFunction } from "express";
import { PoolClient } from "pg";
import pool from "../config/database";
import {
  listAccounts,
  listTransactions,
  PluggyAccount,
} from "../utils/pluggy-api";
import {
  dadosDoCartao,
  normalizar,
  corrigirParcelasSemFatura,
  TransacaoNormalizada,
} from "../utils/openfinance-regras";
import { detectarAssinaturas } from "./openfinance-assinaturas.controller";

// Transação PENDING muda depois de sincronizada, então cada rodada reprocessa
// uma janela anterior ao último sync em vez de só o que é novo.
const DIAS_SOBREPOSICAO = 7;
const LOTE = 200;

type Destinos = { contaId: string | null; cartaoId: string | null };

/** Cria ou atualiza of_contas / of_cartoes a partir do que o /accounts devolve. */
const upsertConta = async (
  db: PoolClient,
  userId: string,
  itemId: string,
  conta: PluggyAccount,
): Promise<Destinos> => {
  if (conta.type === "CREDIT") {
    const c = dadosDoCartao(conta);
    // apelido e cor ficam de fora do UPDATE: são personalização do usuário.
    const { rows } = await db.query(
      `INSERT INTO of_cartoes (
         user_id, pluggy_item_id, pluggy_account_id, nome, bandeira,
         ultimos_4_digitos, limite, limite_usado, dia_vencimento, dia_fechamento
       )
       VALUES ($1, $2, $3, $4, $5::bandeira_enum, $6, $7, $8, $9, $10)
       ON CONFLICT (pluggy_account_id) DO UPDATE SET
         nome           = EXCLUDED.nome,
         bandeira       = EXCLUDED.bandeira,
         limite         = EXCLUDED.limite,
         limite_usado   = EXCLUDED.limite_usado,
         dia_vencimento = COALESCE(EXCLUDED.dia_vencimento, of_cartoes.dia_vencimento),
         dia_fechamento = COALESCE(EXCLUDED.dia_fechamento, of_cartoes.dia_fechamento),
         updated_at     = NOW()
       RETURNING id`,
      [
        userId,
        itemId,
        conta.id,
        c.nome,
        c.bandeira,
        c.ultimos4,
        c.limite,
        c.limiteUsado,
        c.diaVencimento,
        c.diaFechamento,
      ],
    );
    return { contaId: null, cartaoId: rows[0].id };
  }

  const { rows } = await db.query(
    `INSERT INTO of_contas (
       user_id, pluggy_item_id, pluggy_account_id, nome, subtipo, numero, saldo, moeda
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (pluggy_account_id) DO UPDATE SET
       nome       = EXCLUDED.nome,
       saldo      = EXCLUDED.saldo,
       updated_at = NOW()
     RETURNING id`,
    [
      userId,
      itemId,
      conta.id,
      conta.name.trim().slice(0, 150),
      conta.subtype,
      conta.number,
      conta.balance,
      conta.currencyCode || "BRL",
    ],
  );
  return { contaId: rows[0].id, cartaoId: null };
};

const gravarTransacoes = async (
  db: PoolClient,
  userId: string,
  destinos: Destinos,
  linhas: TransacaoNormalizada[],
  categoriaPorPluggy: Map<string, number>,
): Promise<{ inseridas: number; atualizadas: number }> => {
  if (!linhas.length) return { inseridas: 0, atualizadas: 0 };

  const valores: unknown[] = [];
  const placeholders = linhas.map((l, i) => {
    const b = i * 21;
    valores.push(
      userId,
      destinos.contaId,
      destinos.cartaoId,
      l.pluggyTransactionId,
      l.descricao,
      l.descricaoRaw,
      l.valor,
      l.tipo,
      l.data,
      l.categoriaPluggy,
      l.categoriaPluggy ? (categoriaPorPluggy.get(l.categoriaPluggy) ?? null) : null,
      l.merchantNome,
      l.status,
      l.destino,
      l.competencia,
      l.encargo,
      l.purchaseDate,
      l.numeroParcela,
      l.totalParcelas,
      l.billId,
      l.operationType,
    );
    return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8}::of_tipo_transacao_enum, $${b + 9}, $${b + 10}, $${b + 11}, $${b + 12}, $${b + 13}::of_status_transacao_enum, $${b + 14}::of_destino_enum, $${b + 15}::date, $${b + 16}, $${b + 17}::date, $${b + 18}, $${b + 19}, $${b + 20}::uuid, $${b + 21})`;
  });

  // destino fica fora do UPDATE: pode ter sido movido à mão pelo usuário e
  // não deve voltar atrás a cada sync.
  const { rows } = await db.query(
    `INSERT INTO of_transacoes (
       user_id, of_conta_id, of_cartao_id, pluggy_transaction_id, descricao,
       descricao_raw, valor, tipo, data, categoria_pluggy, categoria_id,
       merchant_nome, status, destino, competencia, encargo,
       purchase_date, numero_parcela, total_parcelas, bill_id, operation_type
     )
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (pluggy_transaction_id) DO UPDATE SET
       descricao  = EXCLUDED.descricao,
       valor      = EXCLUDED.valor,
       data        = EXCLUDED.data,
       status      = EXCLUDED.status,
       competencia = EXCLUDED.competencia,
       encargo     = EXCLUDED.encargo,
       purchase_date  = EXCLUDED.purchase_date,
       numero_parcela = EXCLUDED.numero_parcela,
       total_parcelas = EXCLUDED.total_parcelas,
       bill_id        = EXCLUDED.bill_id,
       operation_type = EXCLUDED.operation_type,
       updated_at  = NOW()
     RETURNING id, (xmax = 0) AS inserida`,
    valores,
  );

  const inseridas = rows.filter((r) => r.inserida).length;
  return { inseridas, atualizadas: rows.length - inseridas };
};

/**
 * Cria of_gastos para as transações cujo destino é 'gasto' e que ainda não têm
 * gasto. Reexecutar é seguro: o UNIQUE em of_transacao_id segura a duplicata.
 * Também repassa a mudança de valor/data quando a transação saiu de PENDING.
 */
const materializarGastos = async (
  db: PoolClient,
  userId: string,
): Promise<number> => {
  const { rowCount } = await db.query(
    `INSERT INTO of_gastos (
       user_id, of_transacao_id, of_conta_id, of_cartao_id,
       descricao, valor, categoria_id, data_gasto, status, competencia, encargo,
       numero_parcela, total_parcelas
     )
     SELECT t.user_id, t.id, t.of_conta_id, t.of_cartao_id,
            t.descricao, t.valor, t.categoria_id, t.data, t.status,
            t.competencia, t.encargo, t.numero_parcela, t.total_parcelas
       FROM of_transacoes t
      WHERE t.user_id = $1 AND t.destino = 'gasto' AND t.valor > 0
     ON CONFLICT (of_transacao_id) DO UPDATE SET
       descricao   = EXCLUDED.descricao,
       valor       = EXCLUDED.valor,
       data_gasto  = EXCLUDED.data_gasto,
       status      = EXCLUDED.status,
       competencia = EXCLUDED.competencia,
       encargo     = EXCLUDED.encargo,
       numero_parcela = EXCLUDED.numero_parcela,
       total_parcelas = EXCLUDED.total_parcelas,
       updated_at  = NOW()`,
    [userId],
  );
  return rowCount ?? 0;
};

export const sincronizar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const db = await pool.connect();
  try {
    const userId = req.user!.userId;

    const [{ rows: items }, { rows: categorias }] = await Promise.all([
      db.query(
        "SELECT id, item_id, last_sync_at FROM pluggy_items WHERE user_id = $1",
        [userId],
      ),
      db.query(
        `SELECT id, pluggy_categorias FROM categorias
          WHERE (user_id = $1 OR user_id IS NULL)
            AND tipo = 'gasto' AND pluggy_categorias IS NOT NULL`,
        [userId],
      ),
    ]);

    if (!items.length) {
      res.status(400).json({ error: "Nenhuma conexão Pluggy cadastrada" });
      return;
    }

    const categoriaPorPluggy = new Map<string, number>();
    for (const c of categorias) {
      for (const nome of c.pluggy_categorias ?? []) {
        categoriaPorPluggy.set(nome, c.id);
      }
    }

    let inseridas = 0;
    let atualizadas = 0;
    let contasSincronizadas = 0;
    let parcelasCorrigidas = 0;

    // A busca na Pluggy fica fora da transação: é I/O lento e não deve
    // segurar conexão do pool em transação aberta.
    for (const item of items) {
      // Sem last_sync_at é carga inicial: puxa todo o histórico disponível.
      let desde: Date | undefined;
      if (item.last_sync_at) {
        desde = new Date(item.last_sync_at);
        desde.setDate(desde.getDate() - DIAS_SOBREPOSICAO);
      }

      const contas = await listAccounts(item.item_id);

      for (const conta of contas) {
        const transacoes = await listTransactions(conta.id, desde);

        await db.query("BEGIN");
        try {
          const destinos = await upsertConta(db, userId, item.id, conta);
          const linhas = transacoes
            .map(normalizar)
            .filter((l) => l.valor > 0);

          // Precisa do lote inteiro da conta: a competência da parcela sem
          // fatura é deduzida das parcelas irmãs da mesma compra.
          parcelasCorrigidas += corrigirParcelasSemFatura(linhas);

          for (let i = 0; i < linhas.length; i += LOTE) {
            const r = await gravarTransacoes(
              db,
              userId,
              destinos,
              linhas.slice(i, i + LOTE),
              categoriaPorPluggy,
            );
            inseridas += r.inseridas;
            atualizadas += r.atualizadas;
          }
          await db.query("COMMIT");
          contasSincronizadas++;
        } catch (err) {
          await db.query("ROLLBACK");
          throw err;
        }
      }

      await db.query(
        "UPDATE pluggy_items SET last_sync_at = NOW() WHERE id = $1",
        [item.id],
      );
    }

    const gastos = await materializarGastos(db, userId);
    const sugestoes = await detectarAssinaturas(db, userId);

    res.json({
      data: {
        contas: contasSincronizadas,
        transacoes_novas: inseridas,
        transacoes_atualizadas: atualizadas,
        parcelas_corrigidas: parcelasCorrigidas,
        gastos_materializados: gastos,
        assinaturas_sugeridas: sugestoes,
      },
    });
  } catch (err) {
    next(err);
  } finally {
    db.release();
  }
};
