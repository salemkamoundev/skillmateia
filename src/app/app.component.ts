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
    { label: 'Études', icon: 'bi-book', link: '/etude' },
    { label: 'Certifications', icon: 'bi-award', link: '/certifications' },
    { label: 'Mes Offres', icon: 'bi-tag', link: '/offers' },
    { label: 'Paramètres', icon: 'bi-gear', link: '/settings' }
  ];

  async logout() {
    await this.authService.logout();
    // Fermer le menu offcanvas manuellement si besoin via JS, 
    // mais le router.navigate le fera souvent implicitement
  }
}
