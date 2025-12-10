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

  // Récupérer les offres de l'utilisateur connecté
  getUserOffers(): Observable<Offer[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        const ref = collection(this.firestore, 'offers');
        // On filtre par userId
        const q = query(ref, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<Offer[]>;
      })
    );
  }

  // Ajouter une offre
  async addOffer(offer: Partial<Offer>): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not connected');
    
    const ref = collection(this.firestore, 'offers');
    await addDoc(ref, { 
      ...offer, 
      userId: user.uid,
      active: true,
      createdAt: new Date() 
    });
  }

  // Modifier
  async updateOffer(id: string, offer: Partial<Offer>): Promise<void> {
    const docRef = doc(this.firestore, `offers/${id}`);
    await updateDoc(docRef, offer);
  }

  // Supprimer
  async deleteOffer(id: string): Promise<void> {
    const docRef = doc(this.firestore, `offers/${id}`);
    await deleteDoc(docRef);
  }
}
