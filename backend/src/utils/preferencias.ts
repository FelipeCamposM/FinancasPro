import pool from "../config/database";
import { PREFERENCIAS_PADRAO, Preferencias } from "../schemas/users.schema";

/**
 * Preferências do usuário mescladas com os padrões.
 * Usado pelos controllers que precisam respeitar a configuração (assinaturas,
 * faturas etc.). Falha de leitura cai nos padrões — preferência nunca deve
 * derrubar a operação principal.
 */
export async function getPreferenciasUsuario(
  userId: string,
): Promise<Preferencias> {
  try {
    const { rows } = await pool.query(
      "SELECT preferencias FROM users WHERE id = $1",
      [userId],
    );
    return { ...PREFERENCIAS_PADRAO, ...(rows[0]?.preferencias ?? {}) };
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}
