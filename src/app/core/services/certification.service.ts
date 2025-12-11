import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, addDoc, updateDoc, deleteDoc, doc, collectionData, query, orderBy 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of } from 'rxjs';
import { Certification } from '../models/certification';

@Injectable({
  providedIn: 'root'
})
export class CertificationService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  getUserCertifications(): Observable<Certification[]> {
    return this.authService.user$.pipe(
      switchMap(user => user ? this.getCertificationsByUserId(user.uid) : of([]))
    );
  }

  // MÉTHODE PUBLIQUE
  getCertificationsByUserId(uid: string): Observable<Certification[]> {
    const certRef = collection(this.firestore, `users/${uid}/certifications`);
    const q = query(certRef, orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Certification[]>;
  }

  async addCertification(cert: Certification): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not connected');
    const certRef = collection(this.firestore, `users/${user.uid}/certifications`);
    await addDoc(certRef, { ...cert, createdAt: new Date() });
  }

  async updateCertification(id: string, cert: Partial<Certification>): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    const docRef = doc(this.firestore, `users/${user.uid}/certifications/${id}`);
    await updateDoc(docRef, cert);
  }

  async deleteCertification(id: string): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    const docRef = doc(this.firestore, `users/${user.uid}/certifications/${id}`);
    await deleteDoc(docRef);
  }
}
