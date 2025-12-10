export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  title?: string;            // Ex: "Développeur Angular"
  bio?: string;              // Ex: "Passionné par..."
  skillsOffered: string[];   // ['Angular', 'Piano']
  skillsRequested: string[]; // ['Cuisine']
  fcmToken?: string;
  createdAt: any;
}
