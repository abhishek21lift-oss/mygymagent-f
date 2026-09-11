"use client"

import * as React from "react"
import { MapPin, PhoneCall } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContactEmergencyData {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

interface ContactEmergencyStepProps {
  data: ContactEmergencyData
  onUpdate: (data: ContactEmergencyData) => void
  onContinue: () => void
  onBack: () => void
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir",
  "Ladakh", "Chandigarh", "Puducherry", "Andaman & Nicobar Islands",
  "Dadra & Nagar Haveli", "Daman & Diu", "Lakshadweep"
]

const inputClass = "h-11 rounded-2xl border-stone-200/80 bg-white/80 focus-visible:ring-violet-500/20"

export function ContactEmergencyStep({ data, onUpdate, onContinue, onBack }: ContactEmergencyStepProps) {
  const [form, setForm] = React.useState<ContactEmergencyData>(data)

  function updateField<K extends keyof ContactEmergencyData>(key: K, value: ContactEmergencyData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  const isValid = form.emergencyContactName && form.emergencyContactPhone

  return (
    <div className="flex flex-col gap-5">
      {/* Address Section */}
      <section aria-labelledby="contact-address-heading" className="overflow-hidden rounded-[22px] border border-cyan-100/70 bg-white/60">
        <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-blue-50/60 px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25">
            <MapPin className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h3 id="contact-address-heading" className="font-serif text-lg font-semibold tracking-tight text-stone-950">Address</h3>
            <p className="text-xs font-medium text-stone-600">Where should bills and updates go?</p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input
              id="addressLine1"
              value={form.addressLine1}
              onChange={(e) => updateField("addressLine1", e.target.value)}
              placeholder="House/Flat no., Street"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              value={form.addressLine2}
              onChange={(e) => updateField("addressLine2", e.target.value)}
              placeholder="Area, Landmark"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Mumbai"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Pincode</Label>
              <Input
                id="postalCode"
                value={form.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                placeholder="400001"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={form.state} onValueChange={(v) => updateField("state", v)}>
                <SelectTrigger id="state" className={inputClass}>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country || "India"}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="India"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact Section */}
      <section aria-labelledby="contact-emergency-heading" className="overflow-hidden rounded-[22px] border border-rose-100/70 bg-white/60">
        <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-rose-50/90 via-white to-orange-50/60 px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25">
            <PhoneCall className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h3 id="contact-emergency-heading" className="font-serif text-lg font-semibold tracking-tight text-stone-950">Emergency Contact</h3>
            <p className="text-xs font-medium text-stone-600">Someone we can reach when it matters most.</p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact name *</Label>
              <Input
                id="emergencyContactName"
                value={form.emergencyContactName}
                onChange={(e) => updateField("emergencyContactName", e.target.value)}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Contact phone *</Label>
              <Input
                id="emergencyContactPhone"
                value={form.emergencyContactPhone}
                onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelationship">Relationship</Label>
            <Select value={form.emergencyContactRelationship} onValueChange={(v) => updateField("emergencyContactRelationship", v)}>
              <SelectTrigger id="emergencyContactRelationship" className={inputClass}>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPOUSE">Spouse</SelectItem>
                <SelectItem value="PARENT">Parent</SelectItem>
                <SelectItem value="SIBLING">Sibling</SelectItem>
                <SelectItem value="CHILD">Child</SelectItem>
                <SelectItem value="FRIEND">Friend</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex justify-between border-t border-stone-100 pt-5">
        <Button variant="outline" onClick={onBack} className="min-h-11 rounded-2xl px-5">Back</Button>
        <Button onClick={onContinue} disabled={!isValid} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-6 font-extrabold shadow-lg shadow-violet-500/25 disabled:opacity-50">Continue</Button>
      </div>
    </div>
  )
}
