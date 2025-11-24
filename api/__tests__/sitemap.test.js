import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../sitemap.js";

describe("parseFrontmatter", () => {
  it("extrae y normaliza el frontmatter con fechas, comillas y campos opcionales", () => {
    const markdown = `---
      title: "Ejemplo de noticia"
      date: "2024-05-10"
      author: Autor Destacado
    ---

    Este es el contenido principal con "comillas" y más texto.
    `;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter).toEqual({
      title: "Ejemplo de noticia",
      date: "2024-05-10",
      author: "Autor Destacado"
    });
    expect(result.frontmatter.summary).toBeUndefined();
    expect(result.content).toBe("Este es el contenido principal con \"comillas\" y más texto.");
  });

  it("devuelve frontmatter vacío y contenido intacto cuando no hay bloque", () => {
    const markdown = "# Sin frontmatter\\nSolo contenido";
    const result = parseFrontmatter(markdown);

    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe(markdown);
  });
});
