import { supabase } from '../lib/supabase';
import type { Database, Json } from '../types/database.types';

export type SubmissionType =
  | 'new_place'
  | 'place_update'
  | 'food_update'
  | 'prayer_update'
  | 'event_update';

export type CreateSubmissionInput = {
  submissionType: SubmissionType;
  placeId?: string | null;
  eventId?: string | null;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  message: string;
  suggestedData?: Json;
};

type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];

export async function createSubmission(input: CreateSubmissionInput) {
  if (!input.message.trim()) {
    throw new Error('Please describe the correction before submitting.');
  }

  const newSubmission: SubmissionInsert = {
    submission_type: input.submissionType,
    place_id: input.placeId ?? null,
    event_id: input.eventId ?? null,
    submitted_by_name: input.submittedByName ?? null,
    submitted_by_email: input.submittedByEmail ?? null,
    message: input.message.trim(),
    suggested_data: input.suggestedData ?? {},
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('submissions')
    .insert(newSubmission)
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}