import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  
  // Observable de l'utilisateur courant (null si déconnecté)
  user$: Observable<User | null> = user(this.auth);

  constructor() {}

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.auth, provider);
      // CORRECTION : Redirection directe vers la page d'accueil
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Erreur de connexion Google', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  get currentUser(): User | null {
    return this.auth.currentUser;
  }
}
