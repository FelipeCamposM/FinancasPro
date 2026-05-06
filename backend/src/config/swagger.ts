import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Gerenciador de Gastos — API",
      version: "1.0.0",
      description:
        "API REST paginada para gerenciamento de gastos pessoais. Permite controlar despesas, rendas, cartões de crédito/débito, categorias e parcelamentos.",
      contact: { name: "Gerenciador de Gastos" },
    },
    servers: [
      { url: "http://localhost:3001/api", description: "Desenvolvimento" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
      schemas: {
        Pagination: {
          type: "object",
          properties: {
            total: { type: "integer", example: 100 },
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            totalPages: { type: "integer", example: 10 },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "array", items: { type: "string" } },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            avatar: { type: "string", nullable: true },
            user_level: { type: "string", enum: ["admin", "premium", "free"] },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Categoria: {
          type: "object",
          properties: {
            id: { type: "integer" },
            user_id: { type: "string", format: "uuid", nullable: true },
            nome: { type: "string" },
            cor: { type: "string", example: "#EF4444" },
            icone: { type: "string", example: "🍽️" },
            tipo: { type: "string", enum: ["gasto", "renda"] },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Cartao: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            apelido: { type: "string", example: "Nubank Roxo" },
            nome_no_cartao: { type: "string", example: "FELIPE C CAMPOS" },
            ultimos_4_digitos: { type: "string", example: "1234" },
            bandeira: {
              type: "string",
              enum: [
                "visa",
                "mastercard",
                "elo",
                "amex",
                "hipercard",
                "discover",
                "outro",
              ],
            },
            tipo: {
              type: "string",
              enum: ["credito", "debito", "credito_debito"],
            },
            cor: { type: "string", example: "#8A05BE" },
            banco: { type: "string", example: "Nubank" },
            limite: { type: "number", nullable: true, example: 5000.0 },
            dia_fechamento: { type: "integer", nullable: true, example: 3 },
            dia_vencimento: { type: "integer", nullable: true, example: 10 },
            ativo: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Gasto: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            descricao: { type: "string" },
            valor_total: { type: "number", example: 150.0 },
            categoria_id: { type: "integer", nullable: true },
            forma_pagamento: {
              type: "string",
              enum: [
                "dinheiro",
                "cartao_credito",
                "cartao_debito",
                "pix",
                "transferencia",
                "outro",
              ],
            },
            cartao_id: { type: "string", format: "uuid", nullable: true },
            tipo_pagamento: { type: "string", enum: ["a_vista", "parcelado"] },
            quantidade_parcelas: { type: "integer", example: 1 },
            recorrente: { type: "boolean" },
            frequencia_recorrencia: {
              type: "string",
              enum: [
                "diario",
                "semanal",
                "quinzenal",
                "mensal",
                "bimestral",
                "trimestral",
                "semestral",
                "anual",
              ],
              nullable: true,
            },
            data_fim_recorrencia: {
              type: "string",
              format: "date",
              nullable: true,
            },
            data_gasto: { type: "string", format: "date" },
            observacoes: { type: "string", nullable: true },
            status: { type: "string", enum: ["pendente", "pago", "cancelado"] },
            gasto_origem_id: { type: "string", format: "uuid", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Parcela: {
          type: "object",
          properties: {
            id: { type: "integer" },
            gasto_id: { type: "string", format: "uuid" },
            numero_parcela: { type: "integer", example: 1 },
            valor_parcela: { type: "number", example: 50.0 },
            data_vencimento: { type: "string", format: "date" },
            data_pagamento: { type: "string", format: "date", nullable: true },
            status: {
              type: "string",
              enum: ["pendente", "pago", "vencido", "cancelado"],
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Renda: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            descricao: { type: "string" },
            valor: { type: "number", example: 5000.0 },
            tipo: {
              type: "string",
              enum: [
                "salario",
                "freelance",
                "investimento",
                "aluguel",
                "bonus",
                "outro",
              ],
            },
            origem: { type: "string", example: "Empresa XYZ" },
            categoria_id: { type: "integer", nullable: true },
            mes_referencia: {
              type: "string",
              format: "date",
              example: "2026-03-01",
            },
            data_recebimento: { type: "string", format: "date" },
            recorrente: { type: "boolean" },
            frequencia_recorrencia: {
              type: "string",
              enum: [
                "diario",
                "semanal",
                "quinzenal",
                "mensal",
                "bimestral",
                "trimestral",
                "semestral",
                "anual",
              ],
              nullable: true,
            },
            data_fim_recorrencia: {
              type: "string",
              format: "date",
              nullable: true,
            },
            observacoes: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, "../routes/*.ts"),
    path.join(__dirname, "../routes/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
