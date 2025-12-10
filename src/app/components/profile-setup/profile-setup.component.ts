import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 class="text-2xl font-bold mb-4">Ton Profil</h2>
      
      <div class="mb-4">
        <label class="block text-gray-700">Ce que je peux enseigner (séparé par des virgules)</label>
        <input [(ngModel)]="offerInput" placeholder="Ex: Salsa, Python, Cuisine" class="w-full border p-2 rounded mt-1">
      </div>

      <div class="mb-6">
        <label class="block text-gray-700">Ce que je veux apprendre</label>
        <input [(ngModel)]="requestInput" placeholder="Ex: Anglais, Guitare" class="w-full border p-2 rounded mt-1">
      </div>

      <button (click)="save()" class="w-full bg-primary text-white p-3 rounded font-bold hover:bg-red-600">
        Valider et Trouver des Mates
      </button>
    </div>
  `
})
export class ProfileSetupComponent {
  offerInput = '';
  requestInput = '';
  
  private profileService = inject(ProfileService);
  private router = inject(Router);

  async save() {
    const skillsOffered = this.offerInput.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    const skillsRequested = this.requestInput.split(',').map(s => s.trim().toLowerCase()).filter(s => s);

    await this.profileService.saveUserProfile({
      skillsOffered,
      skillsRequested,
      createdAt: new Date()
    });

    this.router.navigate(['/home']);
  }
}
