import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, switchMap, of, map, combineLatest, take } from 'rxjs';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user-profile';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  messages$: Observable<ChatMessage[]> | undefined;
  targetUser$: Observable<UserProfile | undefined> | undefined;
  myChats$: Observable<any[]> | undefined;
  
  // Search
  searchQuery = '';
  isSearching = false;
  searchResults: UserProfile[] = [];
  allUsersCache: UserProfile[] = [];

  // State
  currentUserId = '';
  targetUserId = ''; 
  chatRoomId = '';
  newMessage = '';
  replyMessage: ChatMessage | null = null;
  
  // NOUVEAU : État de la modale profil
  showProfileModal = false;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  ngOnInit() {
    const user = this.authService.currentUser;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserId = user.uid;

    this.myChats$ = this.chatService.getUserChats(this.currentUserId).pipe(
      switchMap(chats => {
        if (chats.length === 0) return of([]);
        const enrichedChats$ = chats.map(chat => {
          const otherId = chat.users.find((u: string) => u !== this.currentUserId);
          const profile$ = this.profileService.getUserProfile(otherId);
          const unread$ = this.chatService.getUnreadCount(chat.id, this.currentUserId);

          return combineLatest([profile$, unread$]).pipe(
            map(([profile, unreadCount]) => ({
              ...chat,
              otherUser: profile || { displayName: 'Inconnu', photoURL: '' },
              otherId: otherId,
              unreadCount: unreadCount
            }))
          );
        });
        return combineLatest(enrichedChats$);
      })
    );

    this.profileService.getAllProfiles().pipe(take(1)).subscribe(users => {
      this.allUsersCache = users.filter(u => u.uid !== this.currentUserId);
    });

    this.route.paramMap.subscribe(params => {
      this.targetUserId = params.get('id') || '';
      this.replyMessage = null;
      this.showProfileModal = false; // Fermer modale au changement
      
      if (this.targetUserId) {
        this.targetUser$ = this.profileService.getUserProfile(this.targetUserId);
        this.chatRoomId = this.chatService.getChatRoomId(this.currentUserId, this.targetUserId);
        
        this.messages$ = this.chatService.getMessages(this.chatRoomId).pipe(
          map(msgs => {
            this.chatService.markAsRead(this.chatRoomId, msgs, this.currentUserId);
            return msgs;
          })
        );
      } else {
        this.messages$ = undefined;
        this.targetUser$ = undefined;
      }
    });
  }

  ngAfterViewChecked() {
    if (this.targetUserId) this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  toggleSearch() {
    this.isSearching = !this.isSearching;
    this.searchQuery = '';
    this.searchResults = [];
  }

  onSearch() {
    const term = this.searchQuery.toLowerCase().trim();
    if (!term) {
      this.searchResults = [];
      return;
    }
    // Deep Search
    this.searchResults = this.allUsersCache.filter(u => {
      const name = (u.displayName || '').toLowerCase();
      const title = (u.title || '').toLowerCase();
      const bio = (u.bio || '').toLowerCase();
      const offers = (u.skillsOffered || []).some(s => s.toLowerCase().includes(term));
      const requests = (u.skillsRequested || []).some(s => s.toLowerCase().includes(term));
      return name.includes(term) || title.includes(term) || bio.includes(term) || offers || requests;
    });
  }

  startChat(userId: string) {
    this.isSearching = false;
    this.router.navigate(['/chat', userId]);
  }

  setReply(msg: ChatMessage) {
    this.replyMessage = msg;
  }

  cancelReply() {
    this.replyMessage = null;
  }

  // GESTION MODALE
  openProfileModal() {
    this.showProfileModal = true;
  }
  closeProfileModal() {
    this.showProfileModal = false;
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.targetUserId) return;
    
    let replyData = null;
    if (this.replyMessage) {
      replyData = {
        text: this.replyMessage.text,
        senderName: this.replyMessage.senderId === this.currentUserId ? 'Vous' : 'Contact' 
      };
    }

    try {
      await this.chatService.sendMessage(this.chatRoomId, this.newMessage, replyData);
      this.newMessage = '';
      this.replyMessage = null;
    } catch (err) {
      console.error('Erreur envoi:', err);
    }
  }
}
