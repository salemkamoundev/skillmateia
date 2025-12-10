import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  collectionData, 
  query, 
  orderBy, 
  serverTimestamp 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ChatMessage } from '../models/chat-message';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  // Récupérer les messages d'une chatroom spécifique
  // Note: Pour le MVP, on utilise une collection globale 'chats'
  // Dans le futur: users/{uid}/chats/{chatId}/messages
  getMessages(): Observable<ChatMessage[]> {
    const chatRef = collection(this.firestore, 'chats');
    const q = query(chatRef, orderBy('createdAt', 'asc')); // Tri par date croissante
    
    // collectionData renvoie un flux temps réel des données
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
  }

  // Envoyer un message
  async sendMessage(text: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const chatRef = collection(this.firestore, 'chats');
    
    await addDoc(chatRef, {
      senderId: user.uid,
      senderName: user.displayName || 'Utilisateur',
      text: text,
      type: 'text',
      createdAt: serverTimestamp() // Le serveur gère l'heure exacte
    });
  }
}
