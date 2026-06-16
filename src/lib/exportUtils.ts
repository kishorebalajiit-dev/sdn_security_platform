export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function downloadText(filename: string, content: string, mime = "text/plain"): void {
  const blob = new Blob([content], { type: mime });
  triggerDownload(blob, filename);
}

export function downloadPDFReport(title: string, sections: { heading: string; lines: string[] }[]): void {
  const content = [
    `%PDF-1.4`,
    `% SecureNet AI Report`,
    `% Title: ${title}`,
    `% Generated: ${new Date().toISOString()}`,
    ...sections.flatMap((s) => [s.heading, ...s.lines]),
  ].join("\n");

  // Minimal text-based report file (opens as downloadable document)
  downloadText(
    `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`,
    content,
    "application/octet-stream"
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
