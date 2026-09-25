import { parseCsv, parseCsvToObjects } from "./csv"

describe("parseCsv", () => {
  it("reads a plain grid", () => {
    expect(parseCsv("a,b\n1,2\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ])
  })

  it("keeps a comma that is inside quotes", () => {
    // The whole reason this is not `split(",")`: an address or a note
    // routinely contains a comma, and shifting every later column only on
    // those rows is the kind of corruption nobody notices until it is in
    // production data.
    expect(parseCsv('name,note\nRohit,"Sharma, Andheri branch"')).toEqual([
      ["name", "note"],
      ["Rohit", "Sharma, Andheri branch"],
    ])
  })

  it("unescapes a doubled quote", () => {
    expect(parseCsv('note\n"He said ""go"""')).toEqual([["note"], ['He said "go"']])
  })

  it("keeps a newline that is inside quotes", () => {
    expect(parseCsv('a\n"one\ntwo"')).toEqual([["a"], ["one\ntwo"]])
  })

  it("handles CRLF", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ])
  })

  it("does not emit a row for a trailing newline", () => {
    expect(parseCsv("a\n1\n")).toHaveLength(2)
  })

  it("strips the BOM a spreadsheet writes", () => {
    // Left in place it becomes part of the first header, so every lookup
    // of that column silently misses.
    expect(parseCsv("﻿firstName,lastName\nA,B")[0][0]).toBe("firstName")
  })

  it("keeps empty trailing fields", () => {
    expect(parseCsv("a,b,c\n1,,3")).toEqual([
      ["a", "b", "c"],
      ["1", "", "3"],
    ])
  })
})

describe("parseCsvToObjects", () => {
  it("keys rows by the header and trims", () => {
    expect(parseCsvToObjects("firstName, lastName\n Rohit , Sharma ")).toEqual([
      { firstName: "Rohit", lastName: "Sharma" },
    ])
  })

  it("fills a short row rather than dropping the column", () => {
    expect(parseCsvToObjects("a,b,c\n1,2")).toEqual([{ a: "1", b: "2", c: "" }])
  })

  it("returns nothing for a header with no data rows", () => {
    expect(parseCsvToObjects("a,b\n")).toEqual([])
  })
})
