"use client"

import * as React from "react"
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

export function ContactEmergencyStep({ data, onUpdate, onContinue, onBack }: ContactEmergencyStepProps) {
  const [form, setForm] = React.useState<ContactEmergencyData>(data)

  function updateField<K extends keyof ContactEmergencyData>(key: K, value: ContactEmergencyData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  const isValid = form.emergencyContactName && form.emergencyContactPhone

  return (
    <div className="flex flex-col gap-6">
      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="font-medium">Address</h3>
        <div className="space-y-2">
          <Label htmlFor="addressLine1">Address line 1</Label>
          <Input
            id="addressLine1"
            value={form.addressLine1}
            onChange={(e) => updateField("addressLine1", e.target.value)}
            placeholder="House/Flat no., Street"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input
            id="addressLine2"
            value={form.addressLine2}
            onChange={(e) => updateField("addressLine2", e.target.value)}
            placeholder="Area, Landmark"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Mumbai"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Pincode</Label>
            <Input
              id="postalCode"
              value={form.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
              placeholder="400001"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select value={form.state} onValueChange={(v) => updateField("state", v)}>
              <SelectTrigger>
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
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className="space-y-4">
        <h3 className="font-medium">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact name *</Label>
            <Input
              id="emergencyContactName"
              value={form.emergencyContactName}
              onChange={(e) => updateField("emergencyContactName", e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Contact phone *</Label>
            <Input
              id="emergencyContactPhone"
              value={form.emergencyContactPhone}
              onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactRelationship">Relationship</Label>
          <Select value={form.emergencyContactRelationship} onValueChange={(v) => updateField("emergencyContactRelationship", v)}>
            <SelectTrigger>
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

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onContinue} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  )
}