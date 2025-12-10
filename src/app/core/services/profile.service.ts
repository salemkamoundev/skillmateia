import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, collection, getDocs, query, where } from '@angular/fire/firestore';
import { UserProfile } from '../models/user-profile';
import { AuthService } from './auth.service';
import { from, Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  // Créer ou mettre à jour le profil utilisateur
  async saveUserProfile(profileData: Partial<UserProfile>): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    
    const fullProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Anonyme',
      email: user.email || '',
      photoURL: user.photoURL || '',
      skillsOffered: profileData.skillsOffered || [],
      skillsRequested: profileData.skillsRequested || [],
      createdAt: new Date(),
      ...profileData // Merge des nouvelles données
    };

    return setDoc(userRef, fullProfile, { merge: true });
  }

  // Récupérer le profil courant
  getUserProfile(uid: string): Observable<UserProfile | undefined> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      map(snapshot => snapshot.data() as UserProfile)
    );
  }

  // Récupérer tous les profils (pour le matching)
  // Note: En prod, utiliser la pagination et des filtres serveur
  getAllProfiles(): Observable<UserProfile[]> {
    const usersRef = collection(this.firestore, 'users');
    return from(getDocs(usersRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data() as UserProfile))
    );
  }
}
