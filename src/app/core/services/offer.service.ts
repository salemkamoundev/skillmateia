import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, addDoc, updateDoc, deleteDoc, doc, collectionData, query, orderBy, where 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of } from 'rxjs';
import { Offer } from '../models/offer';

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Pour l'utilisateur connecté
  getUserOffers(): Observable<Offer[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        return this.getOffersByUserId(user.uid);
      })
    );
  }

  // MÉTHODE PUBLIQUE : Récupérer les offres de n'importe qui par UID
  getOffersByUserId(uid: string): Observable<Offer[]> {
    const ref = collection(this.firestore, 'offers');
    // On ne montre que les offres actives
    const q = query(
      ref, 
      where('userId', '==', uid), 
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Offer[]>;
  }

  async addOffer(offer: Partial<Offer>): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not connected');
    const ref = collection(this.firestore, 'offers');
    await addDoc(ref, { ...offer, userId: user.uid, active: true, createdAt: new Date() });
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<void> {
    const docRef = doc(this.firestore, `offers/${id}`);
    await updateDoc(docRef, offer);
  }

  async deleteOffer(id: string): Promise<void> {
    const docRef = doc(this.firestore, `offers/${id}`);
    await deleteDoc(docRef);
  }
}
