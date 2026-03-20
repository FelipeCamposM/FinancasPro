import { Router } from "express";
import {
  listUsers,
  getUser,
  updateUser,
  updatePassword,
  deleteUser,
} from "../controllers/users.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  updateUserSchema,
  updatePasswordSchema,
} from "../schemas/users.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestão de usuários (admin)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Listar todos os usuários (admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista paginada de usuários
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
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obter usuário por ID
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
 *       404: { description: Não encontrado }
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
 *     summary: Remover usuário
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Removido }
 *       404: { description: Não encontrado }
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
