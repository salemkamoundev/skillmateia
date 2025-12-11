import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserProfile } from '../../core/models/user-profile';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.component.html',
  styles: []
})
export class UserProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private fb = inject(FormBuilder);

  currentUser: UserProfile | null = null;
  isLoading = true;
  showModal = false;

  profileForm: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    title: [''],
    bio: [''],
    skillsOffered: [''],
    skillsRequested: ['']
  });

  ngOnInit() {
    this.chargerProfil();
  }

  chargerProfil() {
    this.isLoading = true;
    this.auth.user$.pipe(
      switchMap(user => {
        if (!user) return of(null);
        return this.profileService.getUserProfile(user.uid);
      })
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.currentUser = profile;
        } else {
          // Création d'un profil fictif pour éviter l'écran blanc si pas encore en BDD
          const authUser = this.auth.currentUser;
          if(authUser) {
             this.currentUser = {
               uid: authUser.uid,
               displayName: authUser.displayName || 'Utilisateur',
               email: authUser.email || '',
               skillsOffered: [],
               skillsRequested: [],
               createdAt: new Date()
             } as UserProfile;
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  openEditModal() {
    if (!this.currentUser) return;

    // Conversion des tableaux en chaîne pour l'input (Ex: ["Java", "Angular"] -> "Java, Angular")
    const offeredStr = this.currentUser.skillsOffered ? this.currentUser.skillsOffered.join(', ') : '';
    const requestedStr = this.currentUser.skillsRequested ? this.currentUser.skillsRequested.join(', ') : '';

    this.profileForm.patchValue({
      displayName: this.currentUser.displayName,
      title: this.currentUser.title || '',
      bio: this.currentUser.bio || '',
      skillsOffered: offeredStr,
      skillsRequested: requestedStr
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveProfile() {
    if (this.profileForm.invalid || !this.currentUser) return;

    const formValue = this.profileForm.value;

    // Conversion inverse : Chaîne -> Tableau
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
      
      // Mise à jour locale immédiate pour voir le résultat sans recharger
      this.currentUser = { ...this.currentUser, ...updatedData } as UserProfile;
      
      this.closeModal();
    } catch (err) {
      console.error('Erreur sauvegarde profil', err);
      alert("Erreur lors de la sauvegarde.");
    }
  }
}
