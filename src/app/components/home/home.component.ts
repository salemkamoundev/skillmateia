import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user-profile';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-gray-50 min-h-screen">
      <header class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-primary">SkillMate Matches</h1>
        <button (click)="logout()" class="text-sm text-gray-500">Déconnexion</button>
      </header>

      <div *ngIf="matches.length === 0" class="text-center text-gray-500 mt-10">
        Aucun match trouvé pour le moment...
      </div>

      <div class="grid gap-4">
        <div *ngFor="let mate of matches" class="bg-white p-4 rounded-xl shadow border-l-4 border-primary">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-bold text-lg">{{ mate.displayName }}</h3>
              <p class="text-sm text-gray-600">Peut t'apprendre : 
                <span class="font-semibold text-green-600">{{ getMatchingSkills(mate) }}</span>
              </p>
            </div>
            <button class="bg-secondary text-white px-4 py-2 rounded-full text-sm">Discuter</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  matches: UserProfile[] = [];
  currentUser: UserProfile | null = null;

  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);

  async ngOnInit() {
    this.currentUser = await this.profileService.getCurrentProfile();
    const allUsers = await this.profileService.getAllUsers();

    if (this.currentUser) {
      // LOGIQUE DE MATCHING : 
      // On cherche des gens qui OFFRENT ce que je DEMANDE
      this.matches = allUsers.filter(u => 
        u.uid !== this.currentUser?.uid && 
        u.skillsOffered.some(offer => this.currentUser?.skillsRequested.includes(offer))
      );
    }
  }

  getMatchingSkills(mate: UserProfile): string {
    if (!this.currentUser) return '';
    return mate.skillsOffered
      .filter(s => this.currentUser!.skillsRequested.includes(s))
      .join(', ');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
