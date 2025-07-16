export interface Tournament {
  _id: string;
  _type: 'tournament';
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  currentParticipants?: number;
  registrationStartDate?: string;
  registrationDeadline?: string;
  descriptionPostId?: string;
  rulesPostId?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

export interface TournamentFormData {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  registrationStartDate?: string;
  registrationDeadline?: string;
  descriptionPostId?: string | null;
  rulesPostId?: string | null;
}
