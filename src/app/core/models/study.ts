export interface Study {
  id?: string;
  institution: string; // ex: Université de Paris
  degree: string;      // ex: Master 2 Informatique
  field: string;       // ex: Développement Web
  startDate: string;   // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD (null si en cours)
  description?: string;
  createdAt?: any;
}
