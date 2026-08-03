/**
 * Parser/serializador CSV mínimo — sem dependência externa.
 * Detecta o separador (";" , "," ou tab) e respeita aspas duplas.
 */

const BOM = "﻿";
const DELIMS = [";", "\t", ","] as const;

function detectDelim(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  let best = ";";
  let bestCount = 0;
  for (const d of DELIMS) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Converte texto CSV em matriz de células. Linhas totalmente vazias são descartadas.
 *
 * Tolera o caso comum de planilha salva com a linha inteira dentro de uma única
 * célula (texto colado no Excel sem "texto para colunas"): quando todas as linhas
 * têm 1 coluna e ainda contêm um separador, reprocessa o conteúdo já sem aspas.
 */
export function parseCSV(text: string): string[][] {
  const rows = parseLinhas(text);
  const colunaUnica =
    rows.length > 0 &&
    rows.every((r) => r.length === 1) &&
    DELIMS.some((d) => rows[0][0].includes(d));
  return colunaUnica ? parseLinhas(rows.map((r) => r[0]).join("\n")) : rows;
}

function parseLinhas(text: string): string[][] {
  const clean = text.startsWith(BOM) ? text.slice(1) : text;
  const delim = detectDelim(clean);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];

    if (quoted) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      quoted = true;
    } else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);

  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

/** Gera CSV com separador ";" e BOM — abre direto no Excel pt-BR. */
export function toCSV(rows: string[][]): string {
  const body = rows
    .map((r) =>
      r
        .map((cell) =>
          /[";\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell,
        )
        .join(";"),
    )
    .join("\r\n");
  return BOM + body;
}

/**
 * Lê o arquivo como texto tentando UTF-8 e caindo para UTF-16 (Bloco de Notas
 * "Unicode") ou Windows-1252 (Excel "CSV separado por vírgulas") quando os
 * acentos vêm quebrados.
 */
export async function readTextFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  if (bytes[0] === 0xff && bytes[1] === 0xfe)
    return new TextDecoder("utf-16le").decode(buf);
  if (bytes[0] === 0xfe && bytes[1] === 0xff)
    return new TextDecoder("utf-16be").decode(buf);

  const utf8 = new TextDecoder("utf-8").decode(buf);
  // U+FFFD = byte inválido em UTF-8 → provavelmente Windows-1252
  return utf8.includes("�")
    ? new TextDecoder("windows-1252").decode(buf)
    : utf8;
}

/** Dispara o download de um texto como arquivo. */
export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
