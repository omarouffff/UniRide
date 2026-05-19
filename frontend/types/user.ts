export type UserRole = 'student' | 'admin' | 'driver';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  phoneNumber?: string;
  college?: string;
  academicYear?: string;
  profileImage?: string;
  universityId: string;
  universityIdStatus: 'pending' | 'approved' | 'verified' | 'rejected';
  idCardImage?: string;
  universityIdImage?: string;
  noShowCount?: number;
  waitingListPosition?: number | null;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken?: string;
  refreshToken?: string;
}
