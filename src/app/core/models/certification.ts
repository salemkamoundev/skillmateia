export interface Certification {
  id?: string;
  title: string;       // Ex: Angular Senior
  issuer: string;      // Ex: Google
  date: string;        // Ex: 2023-12-01
  url?: string;        // Lien vers le diplôme
  createdAt?: any;
}
