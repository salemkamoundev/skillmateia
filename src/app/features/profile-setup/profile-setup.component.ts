import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-setup.component.html'
})
export class ProfileSetupComponent {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  profileForm = this.fb.group({
    skillsOffered: ['', Validators.required],   // Simplification: string séparée par virgules pour le MVP
    skillsRequested: ['', Validators.required]
  });

  async submit() {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      
      // Conversion des strings en tableaux (ex: "Piano, Guitare" -> ["Piano", "Guitare"])
      const offered = formValue.skillsOffered?.split(',').map(s => s.trim()) || [];
      const requested = formValue.skillsRequested?.split(',').map(s => s.trim()) || [];

      try {
        await this.profileService.saveUserProfile({
          skillsOffered: offered,
          skillsRequested: requested
        });
        this.router.navigate(['/home']);
      } catch (err) {
        console.error('Erreur sauvegarde profil', err);
      }
    }
  }
}
