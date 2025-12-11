#!/bin/bash

# Chemins
CHAT_TS="src/app/features/chat-room/chat-room.component.ts"
CHAT_HTML="src/app/features/chat-room/chat-room.component.html"
CHAT_CSS="src/app/features/chat-room/chat-room.component.css"

echo "=================================================="
echo "AJOUT DU POPUP PROFIL DANS LE CHAT"
echo "=================================================="

# 1. MISE À JOUR CSS (Curseur + Style Modal)
cat <<EOF > $CHAT_CSS
.layout-wrapper { height: calc(100vh - 64px); overflow: hidden; background: #f8fafc; }

/* Sidebar */
.chat-sidebar { width: 350px; background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
.chat-item { cursor: pointer; transition: 0.2s; border-bottom: 1px solid #f1f5f9; }
.chat-item:hover, .chat-item.active { background-color: #f1f5f9; }

/* Main Chat */
.chat-main { flex: 1; display: flex; flex-direction: column; background: #e5ddd5; position: relative; }
.chat-background {
  position: absolute; top:0; left:0; width:100%; height:100%; opacity: 0.06;
  background-image: url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png");
  pointer-events: none;
}

/* Messages */
.message-row { display: flex; width: 100%; margin-bottom: 4px; position: relative; }
.message-row.sent { justify-content: flex-end; }
.message-row.received { justify-content: flex-start; }

.message-bubble { 
  max-width: 70%; 
  padding: 8px 12px; 
  border-radius: 12px; 
  position: relative; 
  word-wrap: break-word; 
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  font-size: 0.95rem;
  line-height: 1.4;
}

.msg-sent { background: #d9fdd3; color: #111b21; border-top-right-radius: 0; }
.msg-received { background: white; color: #111b21; border-top-left-radius: 0; }

.quoted-message {
  background: rgba(0,0,0,0.05);
  border-left: 4px solid #667eea;
  padding: 5px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}
.quoted-author { font-weight: bold; color: #667eea; margin-bottom: 2px; }

.msg-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 0.65rem;
  color: #667781;
  margin-top: 2px;
  float: right;
  margin-left: 10px;
}
.icon-read { color: #53bdeb; }
.icon-sent { color: #8696a0; }

.msg-actions { opacity: 0; transition: opacity 0.2s; position: absolute; top: 0; padding: 5px; }
.message-row:hover .msg-actions { opacity: 1; }
.msg-actions.sent { left: -30px; }
.msg-actions.received { right: -30px; }

.reply-preview-bar {
  background: #f0f2f5;
  border-left: 5px solid #667eea;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #ddd;
}

.user-search-list {
  position: absolute; top: 60px; left: 0; width: 100%; background: white; z-index: 100;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-height: 300px; overflow-y: auto;
}

/* NOUVEAU : Curseur main pour le header cliquable */
.cursor-pointer { cursor: pointer; }
.cursor-pointer:hover { background-color: #f8f9fa; }

/* Modal Custom Styles */
.modal-profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 100px;
  position: relative;
}
.profile-avatar-large {
  width: 90px; height: 90px;
  border-radius: 50%;
  border: 4px solid white;
  background: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: bold; color: #667eea;
  position: absolute;
  bottom: -45px; left: 50%; transform: translateX(-50%);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .chat-sidebar { width: 100%; }
  .chat-main { display: none; }
  .has-active-chat .chat-sidebar { display: none; }
  .has-active-chat .chat-main { display: flex; }
}
EOF

# 2. MISE À JOUR TYPESCRIPT (Gestion Modal)
cat <<EOF > $CHAT_TS
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
EOF

# 3. MISE À JOUR HTML (Ajout de l'événement Click + Code de la Modale)
cat <<EOF > $CHAT_HTML
<div class="layout-wrapper d-flex" [class.has-active-chat]="!!targetUserId">
  
  <div class="chat-sidebar position-relative">
    
    <div class="p-3 border-bottom bg-white sticky-top d-flex justify-content-between align-items-center" style="height: 64px;">
      <h5 class="fw-bold mb-0" *ngIf="!isSearching">Discussions</h5>
      
      <div *ngIf="isSearching" class="flex-grow-1 me-2">
        <input type="text" class="form-control form-control-sm rounded-pill" 
               placeholder="Chercher un utilisateur..." [(ngModel)]="searchQuery" (input)="onSearch()" autofocus>
      </div>

      <button class="btn btn-light rounded-circle shadow-sm text-primary" (click)="toggleSearch()">
        <i class="bi" [class.bi-plus-lg]="!isSearching" [class.bi-x-lg]="isSearching"></i>
      </button>
    </div>

    <div *ngIf="isSearching && searchResults.length > 0" class="user-search-list">
      <div *ngFor="let user of searchResults" (click)="startChat(user.uid)" class="chat-item d-flex align-items-center p-3">
        <div class="rounded-circle bg-light border d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
           {{ (user.displayName || 'U').charAt(0).toUpperCase() }}
        </div>
        <div>
          <h6 class="fw-bold mb-0 small">{{ user.displayName }}</h6>
          <small class="text-muted">{{ user.title || 'Membre' }}</small>
        </div>
      </div>
    </div>

    <div class="flex-grow-1 overflow-auto">
      <ng-container *ngIf="myChats$ | async as chats">
        <div *ngIf="chats.length === 0 && !isSearching" class="text-center p-4 text-muted mt-4">
          <i class="bi bi-chat-square-quote opacity-25 fs-1"></i>
          <p class="small mt-2">Aucune discussion.</p>
          <button (click)="toggleSearch()" class="btn btn-sm btn-outline-primary rounded-pill">Démarrer un chat</button>
        </div>

        <a *ngFor="let chat of chats" 
           [routerLink]="['/chat', chat.otherId]" 
           class="chat-item d-flex align-items-center p-3 text-decoration-none text-dark"
           [class.active]="chat.otherId === targetUserId">
          
          <div class="rounded-circle bg-light border d-flex align-items-center justify-content-center me-3 flex-shrink-0" 
               style="width: 50px; height: 50px;">
             <span class="fw-bold text-primary">{{ (chat.otherUser.displayName || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <h6 class="fw-bold mb-0 text-truncate" [class.fw-bolder]="chat.unreadCount > 0">{{ chat.otherUser.displayName }}</h6>
              <small class="text-muted" style="font-size: 0.7rem;">
                {{ chat.lastUpdated | date:'dd/MM' }}
              </small>
            </div>
            
            <div class="d-flex justify-content-between align-items-center">
              <p class="text-muted small mb-0 text-truncate" 
                 [class.fw-bold]="chat.unreadCount > 0"
                 [class.text-dark]="chat.unreadCount > 0">
                {{ chat.lastMessage }}
              </p>
              
              <span *ngIf="chat.unreadCount > 0" class="badge rounded-pill bg-danger ms-2">
                {{ chat.unreadCount }}
              </span>
            </div>
          </div>
        </a>
      </ng-container>
    </div>
  </div>

  <div class="chat-main">
    <div class="chat-background"></div>
    
    <div *ngIf="!targetUserId" class="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4 position-relative z-1">
      <div class="display-4 mb-3 opacity-25"><i class="bi bi-whatsapp"></i></div>
      <h5>SkillMate Web</h5>
      <p class="small">Envoyez et recevez des messages sans téléphone.</p>
    </div>

    <ng-container *ngIf="targetUserId">
      
      <div class="bg-white px-3 py-2 border-bottom shadow-sm d-flex align-items-center justify-content-between sticky-top z-2 cursor-pointer"
           (click)="openProfileModal()">
        
        <div class="d-flex align-items-center gap-3" *ngIf="targetUser$ | async as target">
          <button class="btn btn-sm btn-light rounded-circle d-md-none border" routerLink="/chat" (click)="\$event.stopPropagation()">
            <i class="bi bi-arrow-left"></i>
          </button>
          
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary fw-bold border" 
                 style="width: 40px; height: 40px;">
              {{ (target.displayName || 'U').charAt(0).toUpperCase() }}
            </div>
            <div>
              <h6 class="fw-bold mb-0 text-dark">{{ target.displayName }}</h6>
              <div class="d-flex align-items-center gap-1">
                <span class="d-inline-block rounded-circle bg-success" style="width: 8px; height: 8px;"></span>
                <small class="text-muted" style="font-size: 0.75rem;">Cliquez pour voir le profil</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div #scrollContainer class="flex-grow-1 overflow-auto p-3 p-md-4 chat-scroll position-relative z-1">
        <div class="d-flex flex-column gap-2">
          <ng-container *ngFor="let msg of messages$ | async">
            <div class="message-row" [ngClass]="msg.senderId === currentUserId ? 'sent' : 'received'">
              
              <div class="msg-actions" [ngClass]="msg.senderId === currentUserId ? 'sent' : 'received'">
                <button class="btn btn-sm btn-light rounded-circle shadow-sm p-1" (click)="setReply(msg)" title="Répondre">
                  <i class="bi bi-reply-fill text-muted"></i>
                </button>
              </div>

              <div class="message-bubble shadow-sm" [ngClass]="msg.senderId === currentUserId ? 'msg-sent' : 'msg-received'">
                <div *ngIf="msg.replyTo" class="quoted-message" (click)="setReply(msg)">
                  <div class="quoted-author">{{ msg.replyTo.senderName }}</div>
                  <div class="text-truncate">{{ msg.replyTo.text }}</div>
                </div>
                {{ msg.text }}
                <div class="msg-meta">
                  {{ msg.createdAt | date:'HH:mm' }}
                  <span *ngIf="msg.senderId === currentUserId" class="ms-1">
                    <i class="bi" [ngClass]="msg.read ? 'bi-check-all icon-read' : 'bi-check icon-sent'"></i>
                  </span>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <div class="bg-white position-relative z-2">
        <div *ngIf="replyMessage" class="reply-preview-bar slide-up">
          <div>
            <div class="small fw-bold text-primary">Réponse à un message</div>
            <div class="text-muted small text-truncate" style="max-width: 300px;">{{ replyMessage.text }}</div>
          </div>
          <button (click)="cancelReply()" class="btn btn-sm btn-link text-muted"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="p-3 border-top">
          <div class="input-group bg-light rounded-pill border p-1">
            <input type="text" class="form-control border-0 bg-transparent shadow-none ps-4" 
                   placeholder="Message..." [(ngModel)]="newMessage" (keyup.enter)="sendMessage()">
            <button class="btn btn-gradient-primary rounded-circle m-1 d-flex align-items-center justify-content-center" 
                    style="width: 40px; height: 40px;" (click)="sendMessage()" [disabled]="!newMessage.trim()">
              <i class="bi bi-send-fill fs-6"></i>
            </button>
          </div>
        </div>
      </div>

    </ng-container>
  </div>

  <div class="modal fade show" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5); z-index: 1060;" *ngIf="showProfileModal && (targetUser$ | async) as user">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content card-modern border-0 overflow-hidden">
        
        <div class="modal-profile-header">
          <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" (click)="closeProfileModal()"></button>
          
          <div class="profile-avatar-large">
             {{ user.displayName.charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="modal-body p-4 pt-5 text-center mt-3">
          
          <h4 class="fw-bold mb-1">{{ user.displayName }}</h4>
          <p class="text-muted mb-3">{{ user.title || 'Membre SkillMate' }}</p>
          
          <p class="text-muted small mb-4 bg-light p-3 rounded-3 fst-italic">
            {{ user.bio || 'Aucune biographie.' }}
          </p>

          <h6 class="small fw-bold text-uppercase text-primary ls-1 mb-2">Compétences</h6>
          <div class="d-flex flex-wrap justify-content-center gap-2 mb-4">
            <span *ngFor="let skill of user.skillsOffered" class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 rounded-pill">
              {{ skill }}
            </span>
            <span *ngIf="!user.skillsOffered || user.skillsOffered.length === 0" class="text-muted x-small">Aucune</span>
          </div>

          <div class="d-grid">
            <a [routerLink]="['/p', user.uid]" (click)="closeProfileModal()" class="btn btn-outline-primary rounded-pill">
              Voir le profil complet
            </a>
          </div>

        </div>
      </div>
    </div>
  </div>

</div>
EOF

echo "Le popup profil est ajouté ! Cliquez sur le header du chat pour le voir."