import { Router } from "express";
import {
  authenticate,
  requireOpenFinance,
} from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  uuidParamsSchema,
  updateContaSchema,
  updateCartaoSchema,
  classificarSchema,
  updateGastoSchema,
  updateAssinaturaSchema,
} from "../schemas/openfinance.schema";
import { sincronizar } from "../controllers/openfinance-sync.controller";
import {
  listContas,
  listCartoes,
  listFaturas,
  listCompetencias,
  updateConta,
  updateCartao,
  listTransacoes,
  classificar,
  listGastos,
  updateGasto,
  listRenda,
} from "../controllers/openfinance.controller";
import {
  listAssinaturas,
  updateAssinatura,
  deleteAssinatura,
  previsaoProximoMes,
} from "../controllers/openfinance-assinaturas.controller";
import {
  dashboard,
  relatorios,
  exportarCsv,
} from "../controllers/openfinance-relatorios.controller";
import { listParcelamentos } from "../controllers/openfinance-parcelas.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Open Finance
 *   description: >
 *     Área Open Finance, restrita a contas com open_finance_habilitado.
 *     Tabelas of_* são independentes das do app comum; só categorias é
 *     compartilhada.
 */

// Toda a área exige login e a flag da conta.
router.use(authenticate, requireOpenFinance);

/**
 * @swagger
 * /openfinance/sync:
 *   post:
 *     tags: [Open Finance]
 *     summary: Importar dados das conexões Pluggy cadastradas
 *     description: >
 *       Atualiza contas e cartões, grava o extrato e materializa as saídas em
 *       of_gastos. Entradas ficam como 'a_classificar'. Idempotente.
 *     responses:
 *       200: { description: Resumo do que foi importado }
 *       400: { description: Nenhuma conexão Pluggy cadastrada }
 */
router.post("/sync", sincronizar);

/**
 * @swagger
 * /openfinance/dashboard:
 *   get:
 *     tags: [Open Finance]
 *     summary: Saldos, faturas, gasto por categoria, série mensal e assinaturas
 *     responses:
 *       200: { description: Dados do dashboard }
 */
router.get("/dashboard", dashboard);

/**
 * @swagger
 * /openfinance/relatorios:
 *   get:
 *     tags: [Open Finance]
 *     summary: Mês a mês por categoria, ranking de estabelecimentos e fluxo de caixa
 *     parameters:
 *       - in: query
 *         name: de
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: ate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Dados dos relatórios }
 */
router.get("/relatorios", relatorios);

/**
 * @swagger
 * /openfinance/relatorios/csv:
 *   get:
 *     tags: [Open Finance]
 *     summary: Exportar os gastos do período em CSV
 *     responses:
 *       200: { description: Arquivo CSV }
 */
router.get("/relatorios/csv", exportarCsv);

/**
 * @swagger
 * /openfinance/contas:
 *   get:
 *     tags: [Open Finance]
 *     summary: Listar contas bancárias importadas
 *     responses:
 *       200: { description: Lista de contas }
 */
router.get("/contas", listContas);

/**
 * @swagger
 * /openfinance/contas/{id}:
 *   patch:
 *     tags: [Open Finance]
 *     summary: Personalizar apelido e cor da conta
 *     responses:
 *       200: { description: Conta atualizada }
 *       404: { description: Conta não encontrada }
 */
router.patch(
  "/contas/:id",
  validate(uuidParamsSchema, "params"),
  validate(updateContaSchema),
  updateConta,
);

/**
 * @swagger
 * /openfinance/cartoes:
 *   get:
 *     tags: [Open Finance]
 *     summary: Listar cartões importados, com limite disponível
 *     responses:
 *       200: { description: Lista de cartões }
 */
router.get("/cartoes", listCartoes);

/**
 * @swagger
 * /openfinance/cartoes/{id}/faturas:
 *   get:
 *     tags: [Open Finance]
 *     summary: Competências disponíveis do cartão, com fatura e encargos
 *     responses:
 *       200: { description: Lista de competências, mais recente primeiro }
 */
router.get(
  "/cartoes/:id/faturas",
  validate(uuidParamsSchema, "params"),
  listFaturas,
);

/**
 * @swagger
 * /openfinance/cartoes/{id}:
 *   patch:
 *     tags: [Open Finance]
 *     summary: Personalizar apelido, cor e os dias de fechamento/vencimento
 *     description: >
 *       Nome, bandeira e limite vêm da Pluggy e não são editáveis. Os dias vão
 *       para colunas _manual próprias, que o sync não sobrescreve.
 *     responses:
 *       200: { description: Cartão atualizado }
 *       404: { description: Cartão não encontrado }
 */
router.patch(
  "/cartoes/:id",
  validate(uuidParamsSchema, "params"),
  validate(updateCartaoSchema),
  updateCartao,
);

/**
 * @swagger
 * /openfinance/transacoes:
 *   get:
 *     tags: [Open Finance]
 *     summary: Extrato Open Finance
 *     parameters:
 *       - in: query
 *         name: destino
 *         schema: { type: string, enum: [gasto, renda, ignorado, a_classificar] }
 *       - in: query
 *         name: tipo
 *         schema: { type: string, enum: [debito, credito] }
 *       - in: query
 *         name: busca
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista paginada }
 */
router.get("/transacoes", paginate, listTransacoes);

/**
 * @swagger
 * /openfinance/transacoes/classificar:
 *   post:
 *     tags: [Open Finance]
 *     summary: Mover transações entre gasto, renda e ignorado
 *     description: >
 *       Aceita lote. Trocar o destino cria ou remove a linha derivada em
 *       of_gastos / of_renda, então a transação nunca aparece nos dois.
 *     responses:
 *       200: { description: "{ classificadas }" }
 *       404: { description: Transação não encontrada }
 */
router.post("/transacoes/classificar", validate(classificarSchema), classificar);

/**
 * @swagger
 * /openfinance/parcelamentos:
 *   get:
 *     tags: [Open Finance]
 *     summary: Compras parceladas, com o que já caiu e o que falta
 *     description: >
 *       As parcelas que a Pluggy ainda não lançou vêm projetadas a partir da
 *       última parcela conhecida, marcadas com projecao=true.
 *     responses:
 *       200: { description: "{ itens, em_andamento, comprometido_mensal, falta_pagar }" }
 */
router.get("/parcelamentos", listParcelamentos);

/**
 * @swagger
 * /openfinance/competencias:
 *   get:
 *     tags: [Open Finance]
 *     summary: Meses disponíveis em of_gastos, para o seletor da página
 *     responses:
 *       200: { description: Competências com total e encargos }
 */
router.get("/competencias", listCompetencias);

/**
 * @swagger
 * /openfinance/gastos:
 *   get:
 *     tags: [Open Finance]
 *     summary: Listar gastos Open Finance
 *     parameters:
 *       - in: query
 *         name: competencia
 *         description: Mês da fatura (YYYY-MM-01). Uma compra de 28/08 na fatura de setembro conta em setembro.
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Lista paginada com soma do período }
 */
router.get("/gastos", paginate, listGastos);

/**
 * @swagger
 * /openfinance/gastos/{id}:
 *   patch:
 *     tags: [Open Finance]
 *     summary: Corrigir categoria ou observação do gasto
 *     responses:
 *       200: { description: Gasto atualizado }
 *       404: { description: Gasto não encontrado }
 */
router.patch(
  "/gastos/:id",
  validate(uuidParamsSchema, "params"),
  validate(updateGastoSchema),
  updateGasto,
);

/**
 * @swagger
 * /openfinance/renda:
 *   get:
 *     tags: [Open Finance]
 *     summary: Listar entradas classificadas como renda
 *     responses:
 *       200: { description: Lista paginada com soma do período }
 */
router.get("/renda", paginate, listRenda);

/**
 * @swagger
 * /openfinance/assinaturas:
 *   get:
 *     tags: [Open Finance]
 *     summary: Listar assinaturas (sugeridas, confirmadas e ignoradas)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [sugerida, confirmada, ignorada] }
 *     responses:
 *       200: { description: Lista de assinaturas }
 */
router.get("/assinaturas", listAssinaturas);

/**
 * @swagger
 * /openfinance/assinaturas/previsao:
 *   get:
 *     tags: [Open Finance]
 *     summary: Previsão de cobrança das assinaturas no próximo mês
 *     responses:
 *       200: { description: "{ itens, total }" }
 */
router.get("/assinaturas/previsao", previsaoProximoMes);

/**
 * @swagger
 * /openfinance/assinaturas/{id}:
 *   patch:
 *     tags: [Open Finance]
 *     summary: Confirmar, ignorar ou editar uma assinatura
 *     responses:
 *       200: { description: Assinatura atualizada }
 *       404: { description: Assinatura não encontrada }
 *   delete:
 *     tags: [Open Finance]
 *     summary: Remover a assinatura
 *     responses:
 *       204: { description: Removida }
 *       404: { description: Assinatura não encontrada }
 */
router.patch(
  "/assinaturas/:id",
  validate(uuidParamsSchema, "params"),
  validate(updateAssinaturaSchema),
  updateAssinatura,
);
router.delete(
  "/assinaturas/:id",
  validate(uuidParamsSchema, "params"),
  deleteAssinatura,
);

export default router;
