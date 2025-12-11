import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  authService = inject(AuthService);
  router = inject(Router);
  
  // Menu configuration
  menuItems = [
    { label: 'Home', icon: 'bi-house-door', link: '/home' },
    { label: 'Profil', icon: 'bi-person', link: '/profil' },
    { label: 'Mes Offres', icon: 'bi-tag', link: '/offers' },
    { label: 'Diplômes', icon: 'bi-mortarboard', link: '/etude' }, // <-- AJOUTÉ ICI
    { label: 'Certifications', icon: 'bi-award', link: '/certifications' },
    { label: 'Paramètres', icon: 'bi-gear', link: '/settings' }
  ];

  async logout() {
    await this.authService.logout();
  }
}
