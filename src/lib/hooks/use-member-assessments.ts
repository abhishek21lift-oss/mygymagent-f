import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  MemberAssessment,
  MemberAssessmentType,
  MemberFitnessTestResult,
  MemberMeasurement,
  MemberScreening,
} from "@/lib/types/gym";

const KEY = "member-assessments";

export function useMemberAssessments(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "assessments"],
    queryFn: () => api.get<MemberAssessment[]>(`/members/${memberId}/assessments`),
    enabled: !!memberId,
  });
}

export function useCreateMemberAssessment(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: MemberAssessmentType; notes?: string }) =>
      api.post<MemberAssessment>(`/members/${memberId}/assessments`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId, "assessments"] }),
  });
}

export interface MemberMeasurementInput {
  assessmentId?: string;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  waistCm?: number;
  hipCm?: number;
  chestCm?: number;
  restingHeartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  notes?: string;
}

export function useMemberMeasurements(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "measurements"],
    queryFn: () => api.get<MemberMeasurement[]>(`/members/${memberId}/measurements`),
    enabled: !!memberId,
  });
}

export function useCreateMemberMeasurement(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberMeasurementInput) =>
      api.post<MemberMeasurement>(`/members/${memberId}/measurements`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId, "measurements"] });
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId, "assessments"] });
    },
  });
}

export function useMemberFitnessResults(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "fitness-tests"],
    queryFn: () => api.get<MemberFitnessTestResult[]>(`/members/${memberId}/fitness-tests`),
    enabled: !!memberId,
  });
}

export function useCreateMemberFitnessResult(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      assessmentId?: string;
      testName: string;
      value: number;
      unit: string;
      notes?: string;
    }) => api.post<MemberFitnessTestResult>(`/members/${memberId}/fitness-tests`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId, "fitness-tests"] });
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId, "assessments"] });
    },
  });
}

export function useMemberScreenings(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "screenings"],
    queryFn: () => api.get<MemberScreening[]>(`/members/${memberId}/screenings`),
    enabled: !!memberId,
  });
}

export function useCreateMemberScreening(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      responses: Record<string, boolean>;
      flaggedForMedicalClearance: boolean;
      notes?: string;
    }) => api.post<MemberScreening>(`/members/${memberId}/screenings`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId, "screenings"] }),
  });
}
