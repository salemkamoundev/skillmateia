import { Timestamp } from '@angular/fire/firestore';

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName?: string;
  text: string;
  videoUrl?: string;
  type: 'text' | 'suggestion';
  createdAt?: Timestamp;  // Ajout du '?' pour le rendre optionnel
}
