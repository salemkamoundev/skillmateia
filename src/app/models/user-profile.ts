export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  skillsOffered: string[];   // Ex: ['salsa', 'cuisine']
  skillsRequested: string[]; // Ex: ['anglais', 'piano']
  fcmToken?: string;         // Pour les notifications
  createdAt: Date;
}
