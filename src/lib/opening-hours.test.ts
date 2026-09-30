import { readableTime, readableWeek, slotProblem } from "./opening-hours";

describe("readableWeek", () => {
  it("joins days with the same hours and names closed days", () => {
    const slots = [0, 1, 2, 3, 4, 5].flatMap((day) => [
      { day, open: "16:00", close: "22:00" },
      { day, open: "05:00", close: "11:00" },
    ]);
    expect(readableWeek(slots)).toEqual([
      "Mon–Sat: 5:00 am – 11:00 am, 4:00 pm – 10:00 pm",
      "Sun: Closed",
    ]);
  });

  it("is empty when nothing is set", () => {
    expect(readableWeek(null)).toEqual([]);
  });
});

describe("readableTime", () => {
  it.each([
    ["24:00", "midnight"],
    ["05:30", "5:30 am"],
    ["12:00", "12:00 pm"],
    ["21:15", "9:15 pm"],
  ])("%s -> %s", (time, text) => expect(readableTime(time)).toBe(text));
});

describe("slotProblem", () => {
  it("accepts morning and evening shifts", () => {
    expect(
      slotProblem([
        { open: "16:00", close: "22:00" },
        { open: "05:00", close: "11:00" },
      ]),
    ).toBeNull();
  });

  it("names a slot that closes before it opens, and an overlap", () => {
    expect(slotProblem([{ open: "22:00", close: "06:00" }])).toMatch(
      /before it opens/,
    );
    expect(
      slotProblem([
        { open: "05:00", close: "12:00" },
        { open: "11:00", close: "20:00" },
      ]),
    ).toBe("Two times overlap.");
  });
});
