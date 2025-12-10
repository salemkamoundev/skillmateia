import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user-profile';
import { Observable, switchMap, of, tap } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styles: [] // On utilise le SCSS global
})
export class UserProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private fb = inject(FormBuilder);

  user$: Observable<UserProfile | undefined> | undefined;
  currentUser: UserProfile | null = null; // Pour stocker les données courantes

  showModal = false;
  profileForm: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    title: [''],
    bio: [''],
    skillsOffered: [''],    // On gère ça comme une string "A, B, C"
    skillsRequested: ['']
  });

  ngOnInit() {
    this.user$ = this.auth.user$.pipe(
      switchMap(user => {
        if (!user) return of(undefined);
        return this.profileService.getUserProfile(user.uid);
      }),
      tap(user => {
        if (user) this.currentUser = user;
      })
    );
  }

  openEditModal() {
    if (!this.currentUser) return;

    // On pré-remplit le formulaire
    // Note: On transforme les tableaux ['A', 'B'] en string "A, B" pour l'input
    this.profileForm.patchValue({
      displayName: this.currentUser.displayName,
      title: this.currentUser.title || '',
      bio: this.currentUser.bio || '',
      skillsOffered: this.currentUser.skillsOffered?.join(', ') || '',
      skillsRequested: this.currentUser.skillsRequested?.join(', ') || ''
    });

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;

    const formValue = this.profileForm.value;

    // Transformation inverse : String "A, B" -> Array ['A', 'B']
    const skillsOfferedArray = formValue.skillsOffered
      ? formValue.skillsOffered.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : [];

    const skillsRequestedArray = formValue.skillsRequested
      ? formValue.skillsRequested.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : [];

    const updatedData: Partial<UserProfile> = {
      displayName: formValue.displayName,
      title: formValue.title,
      bio: formValue.bio,
      skillsOffered: skillsOfferedArray,
      skillsRequested: skillsRequestedArray
    };

    try {
      await this.profileService.saveUserProfile(updatedData);
      this.closeModal();
      // Le user$ se mettra à jour automatiquement grâce à Firestore realtime (si configuré) 
      // ou au prochain rechargement. Pour l'UX immédiate, c'est suffisant.
    } catch (err) {
      console.error('Erreur sauvegarde profil', err);
    }
  }
}
