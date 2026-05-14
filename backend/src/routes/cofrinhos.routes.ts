import { Router } from "express";
import {
  createCofrinho,
  deleteCofrinho,
  getCofrinho,
  getCofrinhosSummary,
  listCofrinhos,
  updateCofrinho,
} from "../controllers/cofrinhos.controller";
import { authenticateAny } from "../middlewares/auth.middleware";
import { paginate } from "../middlewares/pagination.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createCofrinhoSchema,
  updateCofrinhoSchema,
} from "../schemas/cofrinhos.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cofrinhos
 *   description: Planejamento manual de acoes, contas e objetivos
 */
router.get("/", authenticateAny, paginate, listCofrinhos);
router.get("/summary", authenticateAny, getCofrinhosSummary);
router.post("/", authenticateAny, validate(createCofrinhoSchema), createCofrinho);
router.get("/:id", authenticateAny, getCofrinho);
router.put("/:id", authenticateAny, validate(updateCofrinhoSchema), updateCofrinho);
router.delete("/:id", authenticateAny, deleteCofrinho);

export default router;
