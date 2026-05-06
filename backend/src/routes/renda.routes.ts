import { Router } from "express";
import {
  listRenda,
  getRenda,
  createRenda,
  updateRenda,
  deleteRenda,
  autoLancarMes,
} from "../controllers/renda.controller";
import { authenticateAny } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createRendaSchema, updateRendaSchema } from "../schemas/renda.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Renda
 *   description: Registros de entradas financeiras
 */

/**
 * @swagger
 * /renda:
 *   get:
 *     tags: [Renda]
 *     summary: Listar entradas de renda do usuário
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: tipo
 *         schema: { type: string, enum: [salario, freelance, investimento, aluguel, bonus, outro] }
 *       - in: query
 *         name: categoria_id
 *         schema: { type: integer }
 *       - in: query
 *         name: mes
 *         description: Filtrar por mês de referência (formato YYYY-MM)
 *         schema: { type: string, example: '2025-06' }
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
 *                 data:       { type: array, items: { $ref: '#/components/schemas/Renda' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Renda]
 *     summary: Registrar nova entrada de renda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descricao, valor, tipo, origem, mes_referencia, data_recebimento]
 *             properties:
 *               descricao:              { type: string, example: Salário Maio }
 *               valor:                  { type: number, example: 5000.00 }
 *               tipo:                   { type: string, enum: [salario, freelance, investimento, aluguel, bonus, outro] }
 *               origem:                 { type: string, example: Empresa XYZ }
 *               categoria_id:           { type: integer }
 *               mes_referencia:         { type: string, format: date, example: '2025-06-01' }
 *               data_recebimento:       { type: string, format: date, example: '2025-06-05' }
 *               recorrente:             { type: boolean, default: false }
 *               frequencia_recorrencia: { type: string, enum: [diario, semanal, quinzenal, mensal, bimestral, trimestral, semestral, anual] }
 *               data_fim_recorrencia:   { type: string, format: date }
 *               observacoes:            { type: string }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Renda' }
 *       422: { description: Dados inválidos }
 */
router.get("/", authenticateAny, paginate, listRenda);
router.post("/", authenticateAny, validate(createRendaSchema), createRenda);
router.post("/auto-lancar-mes", authenticateAny, autoLancarMes);

router.get("/:id", authenticateAny, getRenda);
router.put("/:id", authenticateAny, validate(updateRendaSchema), updateRenda);
router.delete("/:id", authenticateAny, deleteRenda);

export default router;
