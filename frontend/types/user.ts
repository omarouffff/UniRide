export type UserRole = 'student' | 'admin' | 'driver';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  universityId: string;
  universityIdStatus: 'pending' | 'verified' | 'rejected';
  universityIdImage?: string;
  noShowCount?: number;
  waitingListPosition?: number | null;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}
