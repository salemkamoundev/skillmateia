import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="flex h-screen items-center justify-center bg-gray-100">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-primary mb-2">SkillMate</h1>
        <p class="text-gray-600 mb-6">Rencontrer en apprenant.</p>
        <button (click)="login()" 
          class="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-full shadow-md hover:bg-gray-50 flex items-center gap-2 mx-auto">
          <span>Connexion avec Google</span>
        </button>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  async login() {
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/setup']);
    } catch (err) {
      alert('Erreur de connexion');
    }
  }
}
