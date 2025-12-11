import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, switchMap, of, tap } from 'rxjs';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user-profile';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.component.html',
  styles: [`
    .chat-container { height: calc(100vh - 80px); background-color: #f0f2f5; }
    .message-bubble { max-width: 75%; padding: 10px 15px; border-radius: 18px; position: relative; word-wrap: break-word; }
    .msg-sent { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .msg-received { background: white; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .chat-scroll::-webkit-scrollbar { width: 6px; }
    .chat-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
  `]
})
export class ChatRoomComponent implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  messages$: Observable<ChatMessage[]> | undefined;
  targetUser$: Observable<UserProfile | undefined> | undefined;
  
  currentUserId = '';
  targetUserId = '';
  chatRoomId = '';
  newMessage = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  ngOnInit() {
    const user = this.authService.currentUser;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserId = user.uid;

    this.route.paramMap.subscribe(params => {
      this.targetUserId = params.get('id') || '';
      
      if (!this.targetUserId) {
        // Si pas d'ID, retour home (ou liste de chats future)
        this.router.navigate(['/home']);
        return;
      }

      // 1. Récupérer les infos du correspondant
      this.targetUser$ = this.profileService.getUserProfile(this.targetUserId);

      // 2. Calculer l'ID de la salle et charger les messages
      this.chatRoomId = this.chatService.getChatRoomId(this.currentUserId, this.targetUserId);
      this.messages$ = this.chatService.getMessages(this.chatRoomId);
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;
    
    try {
      await this.chatService.sendMessage(this.chatRoomId, this.newMessage);
      this.newMessage = '';
    } catch (err) {
      console.error('Erreur envoi:', err);
    }
  }
}
