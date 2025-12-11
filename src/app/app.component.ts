import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ChatService } from './core/services/chat.service';
import { Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  chatService = inject(ChatService);
  router = inject(Router);
  
  unreadCount$: Observable<number> = of(0);

  menuItems = [
    { label: 'Home', icon: 'bi-house-door', link: '/home' },
    { label: 'Profil', icon: 'bi-person', link: '/profil' },
    { label: 'Chat', icon: 'bi-chat-dots', link: '/chat' },
    { label: 'Mes Offres', icon: 'bi-tag', link: '/offers' },
    { label: 'Diplômes', icon: 'bi-mortarboard', link: '/etude' },
    { label: 'Certifications', icon: 'bi-award', link: '/certifications' },
    { label: 'Paramètres', icon: 'bi-gear', link: '/settings' }
  ];

  ngOnInit() {
    // Le compteur se met à jour quand l'utilisateur change ou quand les messages arrivent
    this.unreadCount$ = this.authService.user$.pipe(
      switchMap(user => user ? this.chatService.getGlobalUnreadCount() : of(0))
    );
  }

  async logout() {
    await this.authService.logout();
  }
}
