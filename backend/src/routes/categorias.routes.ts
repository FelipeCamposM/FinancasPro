import { Router } from "express";
import {
  listCategorias,
  listCategoriasIphone,
  getCategoria,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  importCategorias,
} from "../controllers/categorias.controller";
import { authenticateAny } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createCategoriaSchema,
  updateCategoriaSchema,
  importCategoriasSchema,
} from "../schemas/categorias.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: Categorias de gastos e rendas (globais + personalizadas)
 */

/**
 * @swagger
 * /categorias:
 *   get:
 *     tags: [Categorias]
 *     summary: Listar categorias (globais + do usuário)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Categoria' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Categorias]
 *     summary: Criar categoria personalizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, tipo]
 *             properties:
 *               nome:  { type: string, example: Pets }
 *               cor:   { type: string, example: '#A78BFA' }
 *               icone: { type: string, example: '🐾' }
 *               tipo:  { type: string, enum: [gasto, renda] }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Categoria' }
 */
router.get("/", authenticateAny, paginate, listCategorias);
router.post(
  "/",
  authenticateAny,
  validate(createCategoriaSchema),
  createCategoria,
);

/**
 * @swagger
 * /categorias/import:
 *   post:
 *     tags: [Categorias]
 *     summary: Importar múltiplas categorias em lote
 *     description: Cria até 200 categorias de uma vez para o usuário autenticado. Operação atômica — falha reverte tudo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categorias]
 *             properties:
 *               categorias:
 *                 type: array
 *                 maxItems: 200
 *                 items:
 *                   type: object
 *                   required: [nome, tipo]
 *                   properties:
 *                     nome:  { type: string, example: Alimentação }
 *                     cor:   { type: string, example: '#F59E0B' }
 *                     icone: { type: string, example: '🍔' }
 *                     tipo:  { type: string, enum: [gasto, renda] }
 *           example:
 *             categorias:
 *               - { nome: Alimentação, cor: '#F59E0B', icone: '🍔', tipo: gasto }
 *               - { nome: Transporte, cor: '#3B82F6', icone: '🚗', tipo: gasto }
 *               - { nome: Salário, cor: '#10B981', icone: '💼', tipo: renda }
 *     responses:
 *       201:
 *         description: Categorias criadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created: { type: integer, example: 3 }
 *                 data:    { type: array, items: { $ref: '#/components/schemas/Categoria' } }
 *       400: { description: Dados inválidos }
 */
router.post(
  "/import",
  authenticateAny,
  validate(importCategoriasSchema),
  importCategorias,
);

/**
 * @swagger
 * /categorias/iphone:
 *   get:
 *     tags: [Categorias]
 *     summary: Listar categorias para integracao com iPhone
 *     description: Retorna uma lista simples de categorias globais e categorias do usuario vinculado ao JWT ou API Key informada.
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Lista simples de categorias para consumo por atalhos/listas do iPhone
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
 *                       id:    { type: integer }
 *                       nome:  { type: string, example: Alimentacao }
 *                       cor:   { type: string, nullable: true, example: '#F59E0B' }
 *                       icone: { type: string, nullable: true, example: 'burger' }
 *                       tipo:  { type: string, enum: [gasto, renda] }
 *       401: { description: Token nao fornecido ou invalido }
 */
router.get("/iphone", authenticateAny, listCategoriasIphone);

/**
 * @swagger
 * /categorias/{id}:
 *   get:
 *     tags: [Categorias]
 *     summary: Obter categoria por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Categoria' }
 *       404: { description: Não encontrada }
 *   put:
 *     tags: [Categorias]
 *     summary: Atualizar categoria (somente do usuário)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:  { type: string }
 *               cor:   { type: string }
 *               icone: { type: string }
 *               tipo:  { type: string, enum: [gasto, renda] }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Categoria' }
 *   delete:
 *     tags: [Categorias]
 *     summary: Remover categoria personalizada
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Removida }
 */
router.get("/:id", authenticateAny, getCategoria);
router.put(
  "/:id",
  authenticateAny,
  validate(updateCategoriaSchema),
  updateCategoria,
);
router.delete("/:id", authenticateAny, deleteCategoria);

export default router;
