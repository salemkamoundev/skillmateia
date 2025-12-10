import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  user$: Observable<User | null> = user(this.auth);

  constructor() {}

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const credential = await signInWithPopup(this.auth, provider);
      return credential.user;
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  }

  async logout() {
    return await signOut(this.auth);
  }

  get currentUser() {
    return this.auth.currentUser;
  }
}
