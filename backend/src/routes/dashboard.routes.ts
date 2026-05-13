import { Router } from "express";
import {
  summary as getSummary,
  gastosPorCategoria as getGastosPorCategoria,
  rendaVsGastos as getRendaVsGastos,
  gastosPorFormaPagamento as getGastosPorFormaPagamento,
  periodSummary as getPeriodSummary,
  relatorioMensal as getRelatorioMensal,
  projecoes as getProjecoes,
  relatorioAnual as getRelatorioAnual,
} from "../controllers/dashboard.controller";
import { authenticateAny } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dados agregados para o painel de controle
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Resumo financeiro de um mês
 *     parameters:
 *       - in: query
 *         name: mes
 *         description: Mês de referência (YYYY-MM). Default é o mês atual.
 *         schema: { type: string, example: '2025-06' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_renda:         { type: number, example: 5000.00 }
 *                 total_gastos:        { type: number, example: 3200.00 }
 *                 saldo:               { type: number, example: 1800.00 }
 *                 parcelas_pendentes:
 *                   type: object
 *                   properties:
 *                     count: { type: integer, example: 4 }
 *                     total: { type: number,  example: 450.00 }
 */
router.get("/summary", authenticateAny, getSummary);

/**
 * @swagger
 * /dashboard/gastos-por-categoria:
 *   get:
 *     tags: [Dashboard]
 *     summary: Gastos agrupados por categoria no mês
 *     parameters:
 *       - in: query
 *         name: mes
 *         description: Mês de referência (YYYY-MM). Default é o mês atual.
 *         schema: { type: string, example: '2025-06' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   categoria_id:   { type: integer }
 *                   nome:           { type: string }
 *                   cor:            { type: string }
 *                   icone:          { type: string }
 *                   quantidade:     { type: integer }
 *                   total:          { type: number }
 */
router.get("/gastos-por-categoria", authenticateAny, getGastosPorCategoria);

/**
 * @swagger
 * /dashboard/renda-vs-gastos:
 *   get:
 *     tags: [Dashboard]
 *     summary: Comparativo renda x gastos por mês
 *     parameters:
 *       - in: query
 *         name: meses
 *         description: Quantidade de meses retroativos. Default 6.
 *         schema: { type: integer, default: 6, maximum: 24 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   mes:          { type: string, example: '2025-06' }
 *                   total_renda:  { type: number }
 *                   total_gastos: { type: number }
 */
router.get("/renda-vs-gastos", authenticateAny, getRendaVsGastos);

/**
 * @swagger
 * /dashboard/gastos-por-forma-pagamento:
 *   get:
 *     tags: [Dashboard]
 *     summary: Gastos agrupados por forma de pagamento no mês
 *     parameters:
 *       - in: query
 *         name: mes
 *         description: Mês de referência (YYYY-MM). Default é o mês atual.
 *         schema: { type: string, example: '2025-06' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   forma_pagamento: { type: string }
 *                   quantidade:      { type: integer }
 *                   total:           { type: number }
 */
router.get(
  "/gastos-por-forma-pagamento",
  authenticateAny,
  getGastosPorFormaPagamento,
);

/**
 * @swagger
 * /dashboard/period-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Total de gastos e renda em um período arbitrário
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: data_fim
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_gastos: { type: number }
 *                 total_renda:  { type: number }
 *                 diferenca:    { type: number }
 */
router.get("/period-summary", authenticateAny, getPeriodSummary);

router.get("/relatorio-mensal", authenticateAny, getRelatorioMensal);

router.get("/projecoes", authenticateAny, getProjecoes);

/**
 * @swagger
 * /dashboard/relatorio-anual:
 *   get:
 *     tags: [Dashboard]
 *     summary: Relatório consolidado de um ano
 *     parameters:
 *       - in: query
 *         name: ano
 *         description: Ano (YYYY). Default é o ano atual.
 *         schema: { type: integer, example: 2026 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ano:           { type: integer }
 *                 resumo:        { type: object }
 *                 meses:         { type: array }
 *                 categorias:    { type: array }
 *                 formas_pagamento: { type: array }
 */
router.get("/relatorio-anual", authenticateAny, getRelatorioAnual);

export default router;
