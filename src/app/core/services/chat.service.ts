import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, addDoc, collectionData, query, orderBy, serverTimestamp, doc, setDoc 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  // Génère un ID unique pour la conversation entre deux utilisateurs
  // On trie les UIDs pour que userA + userB donne le même ID que userB + userA
  getChatRoomId(user1: string, user2: string): string {
    return user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;
  }

  // Récupérer les messages d'une conversation spécifique
  getMessages(chatRoomId: string): Observable<ChatMessage[]> {
    const messagesRef = collection(this.firestore, `chats/${chatRoomId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
  }

  // Envoyer un message
  async sendMessage(chatRoomId: string, text: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const messagesRef = collection(this.firestore, `chats/${chatRoomId}/messages`);
    
    // 1. Ajouter le message
    await addDoc(messagesRef, {
      senderId: user.uid,
      text: text,
      createdAt: serverTimestamp()
    });

    // 2. Mettre à jour les métadonnées de la conversation (Dernier message, timestamp...)
    // Cela servira plus tard pour afficher la liste des conversations dans une inbox
    const roomRef = doc(this.firestore, `chats/${chatRoomId}`);
    await setDoc(roomRef, {
      lastMessage: text,
      lastUpdated: serverTimestamp(),
      users: chatRoomId.split('_') // Stocke les participants
    }, { merge: true });
  }
}
