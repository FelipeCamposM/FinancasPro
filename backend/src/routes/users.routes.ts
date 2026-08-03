import { Router } from "express";
import {
  listUsers,
  getUser,
  updateUser,
  updatePassword,
  deleteUser,
  getApiKey,
  rotateApiKey,
  getPreferencias,
  updatePreferencias,
  exportarDados,
  apagarLancamentos,
} from "../controllers/users.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  updateUserSchema,
  updatePasswordSchema,
  preferenciasSchema,
} from "../schemas/users.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestao de usuarios
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Listar todos os usuarios (admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:       { type: array, items: { $ref: '#/components/schemas/User' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       403: { description: Acesso negado }
 */
router.get("/", authenticate, paginate, listUsers);

/**
 * @swagger
 * /users/me/api-key:
 *   get:
 *     tags: [Users]
 *     summary: Obter API Key permanente do usuario logado
 *     description: Retorna a API Key usada em integracoes externas, como iPhone Shortcuts.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 api_key: { type: string, format: uuid }
 *
 * /users/me/api-key/rotate:
 *   post:
 *     tags: [Users]
 *     summary: Rotacionar API Key
 *     description: Gera uma nova API Key, invalidando imediatamente a anterior.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 api_key: { type: string, format: uuid }
 */
router.get("/me/api-key", authenticate, getApiKey);
router.post("/me/api-key/rotate", authenticate, rotateApiKey);

/**
 * @swagger
 * /users/me/preferencias:
 *   get:
 *     tags: [Users]
 *     summary: Preferências do usuário (já mescladas com os padrões)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Preferencias' }
 *   put:
 *     tags: [Users]
 *     summary: Atualizar preferências (merge parcial)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Preferencias' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Preferencias' }
 *       422: { description: Dados inválidos }
 *
 * components:
 *   schemas:
 *     Preferencias:
 *       type: object
 *       properties:
 *         limite_gastos_percentual:  { type: integer, minimum: 10, maximum: 300, example: 90 }
 *         alerta_gastos_ativo:       { type: boolean }
 *         alerta_fatura_ativo:       { type: boolean }
 *         abrir_mes_apos_fechamento: { type: boolean }
 */
/**
 * @swagger
 * /users/me/export:
 *   get:
 *     tags: [Users]
 *     summary: Exportar todos os lançamentos do usuário (para CSV)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: de
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: ate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     gastos: { type: array, items: { type: object } }
 *                     renda:  { type: array, items: { type: object } }
 *
 * /users/me/lancamentos:
 *   delete:
 *     tags: [Users]
 *     summary: Apagar todos os gastos, rendas e assinaturas do usuário
 *     description: Destrutivo e irreversível. Mantém a conta, categorias e cartões.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     gastos:      { type: integer }
 *                     renda:       { type: integer }
 *                     assinaturas: { type: integer }
 */
router.get("/me/export", authenticate, exportarDados);
router.delete("/me/lancamentos", authenticate, apagarLancamentos);

router.get("/me/preferencias", authenticate, getPreferencias);
router.put(
  "/me/preferencias",
  authenticate,
  validate(preferenciasSchema),
  updatePreferencias,
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obter usuario por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       404: { description: Nao encontrado }
 *   put:
 *     tags: [Users]
 *     summary: Atualizar nome ou avatar
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
 *               name:   { type: string }
 *               avatar: { type: string, format: uri, nullable: true }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *   delete:
 *     tags: [Users]
 *     summary: Remover usuario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Removido }
 *       404: { description: Nao encontrado }
 */
router.get("/:id", authenticate, getUser);
router.put("/:id", authenticate, validate(updateUserSchema), updateUser);
router.delete("/:id", authenticate, deleteUser);

/**
 * @swagger
 * /users/{id}/password:
 *   patch:
 *     tags: [Users]
 *     summary: Alterar senha
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password: { type: string }
 *               new_password:     { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Senha atualizada }
 *       401: { description: Senha atual incorreta }
 */
router.patch(
  "/:id/password",
  authenticate,
  validate(updatePasswordSchema),
  updatePassword,
);

export default router;
