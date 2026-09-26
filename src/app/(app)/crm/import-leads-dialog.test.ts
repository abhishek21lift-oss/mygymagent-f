import { toLead } from "./import-leads-dialog"

describe("toLead", () => {
 it("maps a plain row", () => {
  expect(
   toLead({ firstName: "Asha", lastName: "Rao", phone: "9000000000" }),
  ).toEqual({
   firstName: "Asha",
   lastName: "Rao",
   phone: "9000000000",
   email: undefined,
   source: undefined,
   notes: undefined,
  })
 })

 it("accepts the headers a spreadsheet export actually produces", () => {
  // "First Name" out of Excel, "last_name" out of a database dump.
  expect(toLead({ "First Name": "Asha", last_name: "Rao" })).toMatchObject({
   firstName: "Asha",
   lastName: "Rao",
  })
 })

 it("drops a row with no name rather than sending it to be rejected", () => {
  expect(toLead({ phone: "9000000000" })).toBeNull()
  expect(toLead({ firstName: "Asha" })).toBeNull()
  // Whitespace is not a name.
  expect(toLead({ firstName: "  ", lastName: "Rao" })).toBeNull()
 })

 it("sends an empty optional field as undefined, not as an empty string", () => {
  // "" would fail @IsEmail on the API and reject the whole batch.
  const lead = toLead({ firstName: "Asha", lastName: "Rao", email: "  " })
  expect(lead?.email).toBeUndefined()
 })

 it("trims the values it keeps", () => {
  expect(toLead({ firstName: " Asha ", lastName: " Rao " })).toMatchObject({
   firstName: "Asha",
   lastName: "Rao",
  })
 })
})
