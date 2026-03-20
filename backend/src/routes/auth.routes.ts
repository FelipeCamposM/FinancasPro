import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação e registro de usuários
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar novo usuário
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:       { type: string, example: Felipe Campos }
 *               email:      { type: string, format: email, example: felipe@email.com }
 *               password:   { type: string, minLength: 8, example: senha123! }
 *               avatar:     { type: string, format: uri, example: https://github.com/felipe.png }
 *               user_level: { type: string, enum: [admin, premium, free], default: free }
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:  { $ref: '#/components/schemas/User' }
 *                 token: { type: string }
 *       409: { description: E-mail já cadastrado }
 *       422: { description: Dados inválidos, $ref: '#/components/schemas/Error' }
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Autenticar usuário
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:  { $ref: '#/components/schemas/User' }
 *                 token: { type: string }
 *       401: { description: Credenciais inválidas }
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Retorna o usuário autenticado
 *     responses:
 *       200:
 *         description: Dados do usuário logado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { description: Não autorizado }
 */
router.get("/me", authenticate, me);

export default router;
