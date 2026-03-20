import { Router } from "express";
import {
  listCategorias,
  getCategoria,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../controllers/categorias.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createCategoriaSchema,
  updateCategoriaSchema,
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
router.get("/", authenticate, paginate, listCategorias);
router.post(
  "/",
  authenticate,
  validate(createCategoriaSchema),
  createCategoria,
);

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
router.get("/:id", authenticate, getCategoria);
router.put(
  "/:id",
  authenticate,
  validate(updateCategoriaSchema),
  updateCategoria,
);
router.delete("/:id", authenticate, deleteCategoria);

export default router;
