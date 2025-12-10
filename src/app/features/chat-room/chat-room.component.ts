import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatMessage } from '../../core/models/chat-message';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.component.html',
  styles: [`
    /* Custom scrollbar pour le chat */
    .chat-scroll::-webkit-scrollbar { width: 6px; }
    .chat-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
  `]
})
export class ChatRoomComponent implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  messages$: Observable<ChatMessage[]> | undefined;
  newMessage = '';
  currentUserId = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  ngOnInit() {
    this.currentUserId = this.authService.currentUser?.uid || '';
    this.messages$ = this.chatService.getMessages();
  }

  // Auto-scroll vers le bas quand un message arrive
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.chatService.sendMessage(this.newMessage)
      .then(() => this.newMessage = '')
      .catch(err => console.error('Erreur envoi:', err));
  }

  // Sécurisation de l'URL pour l'iframe YouTube
  getSafeUrl(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;
    
    // Transformation simple : watch?v=ID -> embed/ID si nécessaire
    let embedUrl = url;
    if (url.includes('watch?v=')) {
      embedUrl = url.replace('watch?v=', 'embed/');
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
