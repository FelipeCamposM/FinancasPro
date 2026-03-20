import { Router } from "express";
import {
  listGastos,
  getGasto,
  createGasto,
  updateGasto,
  deleteGasto,
} from "../controllers/gastos.controller";
import { listParcelasByGasto } from "../controllers/parcelas.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createGastoSchema, updateGastoSchema } from "../schemas/gastos.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Gastos
 *   description: Registro e gestão de despesas
 */

/**
 * @swagger
 * /gastos:
 *   get:
 *     tags: [Gastos]
 *     summary: Listar gastos do usuário
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pendente, pago, cancelado] }
 *       - in: query
 *         name: categoria_id
 *         schema: { type: integer }
 *       - in: query
 *         name: cartao_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: forma_pagamento
 *         schema: { type: string, enum: [dinheiro, cartao_credito, cartao_debito, pix, transferencia, outro] }
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
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Gasto' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Gastos]
 *     summary: Registrar novo gasto
 *     description: Ao registrar um gasto parcelado, as parcelas são geradas automaticamente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descricao, valor_total, forma_pagamento, data_gasto]
 *             properties:
 *               descricao:              { type: string, example: Supermercado }
 *               valor_total:            { type: number, example: 300.00 }
 *               categoria_id:           { type: integer }
 *               forma_pagamento:        { type: string, enum: [dinheiro, cartao_credito, cartao_debito, pix, transferencia, outro] }
 *               cartao_id:              { type: string, format: uuid }
 *               tipo_pagamento:         { type: string, enum: [a_vista, parcelado], default: a_vista }
 *               quantidade_parcelas:    { type: integer, example: 3 }
 *               recorrente:             { type: boolean, default: false }
 *               frequencia_recorrencia: { type: string, enum: [diario, semanal, quinzenal, mensal, bimestral, trimestral, semestral, anual] }
 *               data_fim_recorrencia:   { type: string, format: date }
 *               data_gasto:             { type: string, format: date, example: '2026-03-19' }
 *               observacoes:            { type: string }
 *               status:                 { type: string, enum: [pendente, pago, cancelado] }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Gasto' }
 *       422: { description: Dados inválidos }
 */
router.get("/", authenticate, paginate, listGastos);
router.post("/", authenticate, validate(createGastoSchema), createGasto);

/**
 * @swagger
 * /gastos/{id}:
 *   get:
 *     tags: [Gastos]
 *     summary: Obter gasto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Gasto' }
 *       404: { description: Não encontrado }
 *   put:
 *     tags: [Gastos]
 *     summary: Atualizar gasto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:   { type: string }
 *               valor_total: { type: number }
 *               status:      { type: string, enum: [pendente, pago, cancelado] }
 *               observacoes: { type: string, nullable: true }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Gasto' }
 *   delete:
 *     tags: [Gastos]
 *     summary: Remover gasto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Removido }
 */
router.get("/:id", authenticate, getGasto);
router.put("/:id", authenticate, validate(updateGastoSchema), updateGasto);
router.delete("/:id", authenticate, deleteGasto);

/**
 * @swagger
 * /gastos/{id}/parcelas:
 *   get:
 *     tags: [Gastos]
 *     summary: Listar parcelas de um gasto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
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
router.get("/:gastoId/parcelas", authenticate, paginate, listParcelasByGasto);

export default router;
