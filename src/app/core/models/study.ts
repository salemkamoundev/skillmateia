export interface Study {
  id?: string;
  institution: string; // ex: MIT, Université de Paris
  degree: string;      // ex: Master, Licence
  field: string;       // ex: Informatique, Biologie
  startDate: string;   // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD (null si en cours)
  description?: string;
  createdAt?: any;
}
