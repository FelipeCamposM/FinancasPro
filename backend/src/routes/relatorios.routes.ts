import { Router } from "express";
import { authenticateAny } from "../middlewares/auth.middleware";
import { relatorioMensal } from "../controllers/relatorios.controller";

const router = Router();

router.use(authenticateAny);

/**
 * @swagger
 * /relatorios/mensal:
 *   get:
 *     summary: Relatório mensal completo com KPIs, gráficos e filtros
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *           example: "2026-05"
 *         description: Mês no formato YYYY-MM
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         description: Filtrar por categoria
 *       - in: query
 *         name: cartao_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cartão
 *       - in: query
 *         name: forma_pagamento
 *         schema:
 *           type: string
 *         description: Filtrar por forma de pagamento
 *     responses:
 *       200:
 *         description: Relatório mensal
 */
router.get("/mensal", relatorioMensal);

export default router;
