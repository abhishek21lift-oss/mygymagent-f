import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type {
  Member,
  MemberAddress,
  MemberConsent,
  MemberEmergencyContact,
  MemberNote,
  Membership,
} from "@/lib/types/gym"

/**
 * One member, assembled server-side.
 *
 * `/client-360/:memberId` returns the profile, the memberships, and the
 * four detail lists in a single round trip. The overview panel was
 * fetching four of those separately -- member, addresses, emergency
 * contacts, consents -- which is the exact set this endpoint exists to
 * collapse, and it is throttled at 40/min precisely because it is meant
 * to be the one call a profile screen makes.
 *
 * The editable sub-tabs keep their individual hooks: they mutate, and a
 * list you can add to wants its own cache entry rather than a slice of a
 * shared aggregate.
 */
export interface Client360 {
  profile: Member
  /** The first membership, which the server treats as the current one. */
  membership: Membership | null
  memberships: Membership[]
  details: {
    addresses: MemberAddress[]
    emergencyContacts: MemberEmergencyContact[]
    notes: MemberNote[]
    consents: MemberConsent[]
  }
  summary: {
    activeMembership: string | null
    assignedTrainer: Member["assignedTrainer"]
    branch: Member["primaryBranch"]
    notesCount: number
    consentCount: number
  }
}

export const CLIENT_360_KEY = "client-360"

export function useClient360(memberId: string | undefined) {
  return useQuery({
    queryKey: [CLIENT_360_KEY, memberId],
    queryFn: () => api.get<Client360>(`/client-360/${memberId}`),
    enabled: Boolean(memberId),
  })
}
