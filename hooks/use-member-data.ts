'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getEnrolmentsByMember,
  getActivitiesByMember,
  getMemberDocuments,
} from '@/lib/family-members/actions';
import type { FamilyMember, SchoolEnrolment, Extracurricular, MemberDocument } from '@/lib/types';

export interface UseMemberDataReturn {
  loading: boolean;
  enrolments: SchoolEnrolment[];
  activities: Extracurricular[];
  documents: MemberDocument[];
  currentEnrolment: SchoolEnrolment | undefined;
  activeActivities: Extracurricular[];
  totalActivityCost: number;
  refresh: () => Promise<void>;
}

export function useMemberData(member: FamilyMember): UseMemberDataReturn {
  const [loading, setLoading] = useState(true);
  const [enrolments, setEnrolments] = useState<SchoolEnrolment[]>([]);
  const [activities, setActivities] = useState<Extracurricular[]>([]);
  const [documents, setDocuments] = useState<MemberDocument[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [enrolmentsData, activitiesData, documentsData] = await Promise.all([
        member.member_type === 'child' ? getEnrolmentsByMember(member.id) : Promise.resolve([]),
        member.member_type === 'child' ? getActivitiesByMember(member.id) : Promise.resolve([]),
        getMemberDocuments(member.id),
      ]);
      setEnrolments(enrolmentsData);
      setActivities(activitiesData);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading member data:', error);
    } finally {
      setLoading(false);
    }
  }, [member.id, member.member_type]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentEnrolment = useMemo(() => enrolments.find((e) => e.is_current), [enrolments]);

  const activeActivities = useMemo(() => activities.filter((a) => a.is_active), [activities]);

  const totalActivityCost = useMemo(
    () =>
      activeActivities.reduce((sum, a) => {
        const cost = a.cost_amount || 0;
        const multiplier = a.cost_frequency?.per_year_multiplier || 1;
        return sum + cost * multiplier;
      }, 0),
    [activeActivities]
  );

  return {
    loading,
    enrolments,
    activities,
    documents,
    currentEnrolment,
    activeActivities,
    totalActivityCost,
    refresh: loadData,
  };
}
