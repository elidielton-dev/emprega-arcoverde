function toWinAnsi(text) {
  return String(text || "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (ch === "\\" || ch === "(" || ch === ")") return `\\${ch}`;
      if (code === 10 || code === 13) return " ";
      if (code >= 32 && code <= 126) return ch;
      if (code >= 128 && code <= 255) return `\\${code.toString(8).padStart(3, "0")}`;
      return "?";
    })
    .join("");
}

function wrapLine(text, max = 92) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function createSimplePdf(title, bodyLines) {
  const all = [title, "", ...bodyLines.flatMap((line) => wrapLine(line))];
  const ops = ["BT", "/F1 18 Tf", "50 800 Td", `(${toWinAnsi(all[0])}) Tj`, "/F1 11 Tf", "0 -24 Td"];
  for (let i = 1; i < all.length; i++) {
    ops.push(`(${toWinAnsi(all[i])}) Tj`);
    ops.push("0 -14 Td");
  }
  ops.push("ET");
  const stream = ops.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

function resumePdfBuffer(candidate) {
  const lines = [
    candidate.headline || "Curriculo",
    `${candidate.city || "Arcoverde"} - ${candidate.state || "PE"}`,
    candidate.phone ? `Telefone: ${candidate.phone}` : "",
    candidate.email ? `E-mail: ${candidate.email}` : "",
    "",
    "Resumo",
    candidate.summary || "Profissional de Arcoverde em busca de oportunidade de trabalho.",
    "",
    "Formacao",
    candidate.education || "Ensino Medio",
    "",
    "Experiencia",
    ...(candidate.experiences?.length
      ? candidate.experiences
      : ["Experiencia profissional registrada no portal Emprega Arcoverde."]),
    "",
    "Habilidades",
    candidate.skills || "Organizacao, pontualidade e trabalho em equipe",
    "",
    "Documento gerado pelo portal Emprega Arcoverde para demonstracao.",
  ].filter((line) => line !== undefined);

  return createSimplePdf(candidate.name, lines);
}

module.exports = { createSimplePdf, resumePdfBuffer };
