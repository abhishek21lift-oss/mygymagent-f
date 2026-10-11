import { validate } from "./add-member-form"

const BASE: Parameters<typeof validate>[0] = {
  lead: null,
  branchId: "b1",
  firstName: "Rahul",
  lastName: "Sharma",
  phone: "9876543210",
  alternatePhone: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  photo: null,
  planId: "",
  startDate: "2026-10-11",
  discount: "",
  paid: null,
  paymentMethod: "CASH",
  memberType: "GYM",
  trainerId: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  emergencyContactEmail: "",
  fitnessGoal: "",
  leadSource: "",
  referrerMemberId: "",
  referrerMemberName: "",
  heightCm: "",
  weightKg: "",
  injuries: "",
  medicalNotes: "",
  parq: {
    heartCondition: false,
    chestPain: false,
    dizziness: false,
    jointProblems: false,
    onMedication: false,
    pregnant: false,
    otherConcerns: false,
  },
  waiver: true,
}

describe("AddMemberForm new-field validation", () => {
  it("accepts a blank optional set", () => {
    expect(validate(BASE, undefined)).toEqual({})
  })

  it("rejects a bad alternate number and a same-as-primary number", () => {
    expect(validate({ ...BASE, alternatePhone: "123" }, undefined).alternatePhone).toBeDefined()
    expect(
      validate({ ...BASE, alternatePhone: "98765 43210" }, undefined).alternatePhone,
    ).toBeDefined()
  })

  it("rejects a bad emergency email and a bad PIN", () => {
    expect(
      validate({ ...BASE, emergencyContactEmail: "not-an-email" }, undefined).emergencyContactEmail,
    ).toBeDefined()
    expect(validate({ ...BASE, postalCode: "12" }, undefined).postalCode).toBeDefined()
    expect(validate({ ...BASE, postalCode: "560038" }, undefined).postalCode).toBeUndefined()
  })
})
