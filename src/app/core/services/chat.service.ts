import { Injectable, inject } from '@angular/core';
import { 
  Database, ref, push, set, listVal, objectVal, update, query, orderByChild, equalTo, get
} from '@angular/fire/database';
import { Observable, combineLatest, of, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  read: boolean;
  replyTo?: any;
  createdAt: number; // En RTDB, on stocke le timestamp en millisecondes
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private db = inject(Database); // Injection de Realtime Database
  private auth = inject(AuthService);

  // Génération ID (Même logique)
  getChatRoomId(user1: string, user2: string): string {
    return user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;
  }

  // 1. Récupérer les messages (Flux temps réel)
  getMessages(chatId: string): Observable<ChatMessage[]> {
    const messagesRef = ref(this.db, `chats/${chatId}/messages`);
    // listVal convertit la liste d'objets en tableau et inclut la clé comme 'id'
    return listVal(messagesRef, { keyField: 'id' }) as Observable<ChatMessage[]>;
  }

  // 2. Récupérer mes conversations
  // En RTDB, on ne peut pas faire de query complexe facilement.
  // On utilise un noeud dédié 'user-chats/{userId}' qui contient les métadonnées.
  getUserChats(userId: string): Observable<any[]> {
    const myChatsRef = ref(this.db, `user-chats/${userId}`);
    // On récupère la liste des chats associés à l'utilisateur
    return listVal(myChatsRef, { keyField: 'id' }).pipe(
      map(chats => chats.sort((a: any, b: any) => b.lastUpdated - a.lastUpdated)) // Tri JS client-side
    );
  }

  // 3. Compteur Global
  getGlobalUnreadCount(): Observable<number> {
    const user = this.auth.currentUser;
    if (!user) return of(0);

    return this.getUserChats(user.uid).pipe(
      switchMap(chats => {
        if (!chats || chats.length === 0) return of(0);
        // On combine les compteurs de chaque chat
        const counts$ = chats.map(chat => this.getUnreadCount(chat.id, user.uid));
        return combineLatest(counts$).pipe(
          map(counts => counts.reduce((acc, curr) => acc + curr, 0))
        );
      })
    );
  }

  // 4. Compteur par conversation
  getUnreadCount(chatId: string, currentUserId: string): Observable<number> {
    return this.getMessages(chatId).pipe(
      map(messages => 
        messages.filter(m => !m.read && m.senderId !== currentUserId).length
      )
    );
  }

  // 5. Envoyer un message (Multi-path update pour la performance)
  async sendMessage(chatId: string, text: string, replyTo?: any): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const timestamp = Date.now();
    
    // A. Créer le message
    const messagesRef = ref(this.db, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    
    const messageData = {
      senderId: user.uid,
      text: text,
      read: false,
      replyTo: replyTo || null,
      createdAt: timestamp
    };

    // B. Préparer les mises à jour des métadonnées pour les DEUX utilisateurs
    // Cela permet à getUserChats() d'être très rapide sans parcourir tous les messages
    const users = chatId.split('_'); // [uid1, uid2]
    const user1 = users[0];
    const user2 = users[1];

    const updates: any = {};
    
    // 1. Sauvegarde du message
    updates[`chats/${chatId}/messages/${newMessageRef.key}`] = messageData;

    // 2. Mise à jour de l'index de chat pour l'User 1
    updates[`user-chats/${user1}/${chatId}`] = {
      lastMessage: text,
      lastUpdated: timestamp,
      users: users,
      otherId: user1 === user.uid ? user2 : user1 // L'autre ID
    };

    // 3. Mise à jour de l'index de chat pour l'User 2
    updates[`user-chats/${user2}/${chatId}`] = {
      lastMessage: text,
      lastUpdated: timestamp,
      users: users,
      otherId: user2 === user.uid ? user1 : user2
    };

    // Exécution atomique
    await update(ref(this.db), updates);
  }

  // 6. Marquer comme lu
  async markAsRead(chatId: string, messages: ChatMessage[], currentUserId: string): Promise<void> {
    const updates: any = {};
    let hasUpdates = false;

    messages.forEach(msg => {
      if (msg.id && msg.senderId !== currentUserId && !msg.read) {
        updates[`chats/${chatId}/messages/${msg.id}/read`] = true;
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      await update(ref(this.db), updates);
    }
  }
}

// Helper pour l'import switchMap manquant
import { switchMap } from 'rxjs/operators';
