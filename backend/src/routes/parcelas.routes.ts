import { Router } from "express";
import {
  listMinhasParcelas,
  updateParcela,
} from "../controllers/parcelas.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateParcelaSchema } from "../schemas/parcelas.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Parcelas
 *   description: Gestão de parcelas de gastos
 */

/**
 * @swagger
 * /parcelas:
 *   get:
 *     tags: [Parcelas]
 *     summary: Listar todas as parcelas do usuário
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pendente, pago, vencido, cancelado] }
 *       - in: query
 *         name: cartao_id
 *         schema: { type: string, format: uuid }
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
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Parcela' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get("/", authenticate, paginate, listMinhasParcelas);

/**
 * @swagger
 * /parcelas/{id}:
 *   patch:
 *     tags: [Parcelas]
 *     summary: Atualizar status de uma parcela
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:          { type: string, enum: [pendente, pago, vencido, cancelado] }
 *               data_pagamento:  { type: string, format: date, nullable: true }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Parcela' }
 *       404: { description: Não encontrado }
 */
router.patch(
  "/:id",
  authenticate,
  validate(updateParcelaSchema),
  updateParcela,
);

export default router;
