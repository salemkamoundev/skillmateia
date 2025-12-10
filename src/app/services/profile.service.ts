import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, collection, getDocs, query, where } from '@angular/fire/firestore';
import { UserProfile } from '../models/user-profile';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private firestore: Firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Sauvegarder ou mettre à jour le profil
  async saveUserProfile(profileData: Partial<UserProfile>) {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not logged in');

    const userRef = doc(this.firestore, 'users', user.uid);
    // On fusionne avec les données existantes
    return await setDoc(userRef, { ...profileData, uid: user.uid, email: user.email }, { merge: true });
  }

  // Récupérer le profil courant
  async getCurrentProfile(): Promise<UserProfile | null> {
    const user = this.authService.currentUser;
    if (!user) return null;
    
    const docRef = doc(this.firestore, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  }

  // Récupérer tous les utilisateurs pour le matching (Simplifié pour MVP)
  async getAllUsers(): Promise<UserProfile[]> {
    const usersRef = collection(this.firestore, 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  }
}
