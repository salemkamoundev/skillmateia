export interface Offer {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  type: 'HOURLY' | 'FIXED' | 'EXCHANGE'; // Par heure, Prix fixe, ou Troc
  price?: number;        // Requis si HOURLY ou FIXED
  exchangeSkill?: string; // Requis si EXCHANGE (ex: "J'apprends le Piano contre Anglais")
  active: boolean;       // Pour activer/désactiver l'offre sans la supprimer
  createdAt: any;
}
