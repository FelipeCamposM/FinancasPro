import { Router } from "express";
import {
  listCartoes,
  getCartao,
  createCartao,
  updateCartao,
  deleteCartao,
  listFormasPagamentoIphone,
} from "../controllers/cartoes.controller";
import {
  getFaturas,
  getFaturaDetail,
  pagarFatura,
} from "../controllers/faturas.controller";
import { authenticateAny } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createCartaoSchema,
  updateCartaoSchema,
} from "../schemas/cartoes.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cartões
 *   description: Gerenciamento de cartões de crédito e débito
 */

/**
 * @swagger
 * /cartoes:
 *   get:
 *     tags: [Cartões]
 *     summary: Listar cartões do usuário
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Cartao' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Cartões]
 *     summary: Cadastrar novo cartão
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [apelido, nome_no_cartao, ultimos_4_digitos, bandeira, tipo, cor, banco]
 *             properties:
 *               apelido:           { type: string, example: Nubank Roxo }
 *               nome_no_cartao:    { type: string, example: FELIPE C CAMPOS }
 *               ultimos_4_digitos: { type: string, example: '1234' }
 *               bandeira:          { type: string, enum: [visa, mastercard, elo, amex, hipercard, discover, outro] }
 *               tipo:              { type: string, enum: [credito, debito, credito_debito] }
 *               cor:               { type: string, example: '#8A05BE' }
 *               banco:             { type: string, example: Nubank }
 *               limite:            { type: number, example: 5000 }
 *               dia_fechamento:    { type: integer, example: 3 }
 *               dia_vencimento:    { type: integer, example: 10 }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cartao' }
 *       422: { description: Dados inválidos }
 */
router.get("/", authenticateAny, paginate, listCartoes);
router.post("/", authenticateAny, validate(createCartaoSchema), createCartao);
/**
 * @swagger
 * /cartoes/iphone:
 *   get:
 *     tags: [Cartoes]
 *     summary: Listar formas de pagamento para integração com iPhone
 *     description: Retorna lista plana com Pix, Dinheiro e cartões ativos do usuário, formatada para uso em atalhos do iPhone. Cartões com tipo credito_debito aparecem como duas entradas separadas.
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Lista de formas de pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:            { type: string, example: "Nubank (Crédito)" }
 *                       forma_pagamento:  { type: string, enum: [pix, dinheiro, cartao_credito, cartao_debito] }
 *                       cartao_id:        { type: string, format: uuid, nullable: true }
 *       401: { description: Token não fornecido ou inválido }
 */
router.get("/iphone", authenticateAny, listFormasPagamentoIphone);

/**
 * @swagger
 * /cartoes/{id}:
 *   get:
 *     tags: [Cartões]
 *     summary: Obter cartão por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cartao' }
 *       404: { description: Não encontrado }
 *   put:
 *     tags: [Cartões]
 *     summary: Atualizar cartão
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
 *               apelido:        { type: string }
 *               nome_no_cartao: { type: string }
 *               cor:            { type: string }
 *               banco:          { type: string }
 *               limite:         { type: number, nullable: true }
 *               dia_fechamento: { type: integer, nullable: true }
 *               dia_vencimento: { type: integer, nullable: true }
 *               ativo:          { type: boolean }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cartao' }
 *   delete:
 *     tags: [Cartões]
 *     summary: Remover cartão
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Removido }
 */
router.get("/:id", authenticateAny, getCartao);
router.put("/:id", authenticateAny, validate(updateCartaoSchema), updateCartao);
router.delete("/:id", authenticateAny, deleteCartao);

// Fatura endpoints
router.get("/:id/faturas", authenticateAny, getFaturas);
router.get("/:id/faturas/:mes", authenticateAny, getFaturaDetail);
router.post("/:id/faturas/:mes/pagar", authenticateAny, pagarFatura);

export default router;
