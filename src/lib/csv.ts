/**
 * A small CSV reader, for the import dialog.
 *
 * Deliberately not a dependency: the one thing it has to get right is the
 * quoting, because a member's address or a note routinely contains a
 * comma, and a naive `split(",")` silently shifts every later column on
 * exactly the rows a person cares about. It handles quoted fields,
 * doubled quotes inside them, embedded newlines and CRLF, which is what
 * a spreadsheet export actually produces.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  let i = 0

  // Excel writes a BOM; left in place it becomes part of the first header.
  if (text.charCodeAt(0) === 0xfeff) i = 1

  const endField = () => {
    row.push(field)
    field = ""
  }
  const endRow = () => {
    endField()
    // A trailing newline should not produce a row of one empty string.
    if (row.length > 1 || row[0] !== "") rows.push(row)
    row = []
  }

  while (i < text.length) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i += 1
        continue
      }
      field += c
      i += 1
      continue
    }
    if (c === '"') {
      quoted = true
      i += 1
      continue
    }
    if (c === ",") {
      endField()
      i += 1
      continue
    }
    if (c === "\r") {
      if (text[i + 1] === "\n") i += 1
      endRow()
      i += 1
      continue
    }
    if (c === "\n") {
      endRow()
      i += 1
      continue
    }
    field += c
    i += 1
  }
  if (field !== "" || row.length) endRow()
  return rows
}

/** Rows keyed by the header line, which is what the import endpoints take. */
export function parseCsvToObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text)
  if (rows.length < 2) return []
  const header = rows[0].map((h) => h.trim())
  return rows.slice(1).map((r) =>
    Object.fromEntries(header.map((h, idx) => [h, (r[idx] ?? "").trim()])),
  )
}

/** Hand the browser a file without a round trip through the server. */
export function downloadTextFile(filename: string, contents: string, mime = "text/csv") {
  const url = URL.createObjectURL(new Blob([contents], { type: `${mime};charset=utf-8` }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
