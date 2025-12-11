import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, addDoc, updateDoc, deleteDoc, doc, collectionData, query, orderBy 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of } from 'rxjs';
import { Study } from '../models/study';

@Injectable({
  providedIn: 'root'
})
export class StudyService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  getUserStudies(): Observable<Study[]> {
    return this.authService.user$.pipe(
      switchMap(user => user ? this.getStudiesByUserId(user.uid) : of([]))
    );
  }

  // MÉTHODE PUBLIQUE
  getStudiesByUserId(uid: string): Observable<Study[]> {
    const ref = collection(this.firestore, `users/${uid}/studies`);
    const q = query(ref, orderBy('startDate', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Study[]>;
  }

  async addStudy(study: Study): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not connected');
    const ref = collection(this.firestore, `users/${user.uid}/studies`);
    await addDoc(ref, { ...study, createdAt: new Date() });
  }

  async updateStudy(id: string, study: Partial<Study>): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    const docRef = doc(this.firestore, `users/${user.uid}/studies/${id}`);
    await updateDoc(docRef, study);
  }

  async deleteStudy(id: string): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    const docRef = doc(this.firestore, `users/${user.uid}/studies/${id}`);
    await deleteDoc(docRef);
  }
}
