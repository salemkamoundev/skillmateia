import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Important pour ngModel
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user-profile';
import { forkJoin, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Ajout FormsModule
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  
  // Données brutes
  allUsers: UserProfile[] = [];
  currentUser: UserProfile | null = null;
  
  // UI States
  loading = true;
  searchQuery = ''; // Pour la barre de recherche

  ngOnInit() {
    this.chargerDonnees();
  }

  chargerDonnees() {
    this.loading = true;

    this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) return forkJoin({ current: of(null), all: this.profileService.getAllProfiles() });
        return forkJoin({
          current: this.profileService.getUserProfile(user.uid),
          all: this.profileService.getAllProfiles()
        });
      })
    ).subscribe({
      next: (data: { current: UserProfile | null | undefined, all: UserProfile[] }) => {
        this.currentUser = data.current || null;
        
        // On exclut soi-même de la liste
        this.allUsers = (data.all || []).filter(u => u.uid !== this.currentUser?.uid);

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement home:', err);
        this.loading = false;
      }
    });
  }

  // Getter pour filtrer dynamiquement
  get filteredUsers(): UserProfile[] {
    if (!this.searchQuery.trim()) {
      // Si pas de recherche, on peut appliquer une logique de "Matching" par défaut
      // ou simplement tout retourner.
      return this.allUsers;
    }

    const term = this.searchQuery.toLowerCase();
    
    return this.allUsers.filter(user => {
      // Recherche par Nom
      const nameMatch = user.displayName?.toLowerCase().includes(term);
      // Recherche par Compétence Offerte
      const skillMatch = user.skillsOffered?.some(s => s.toLowerCase().includes(term));
      
      return nameMatch || skillMatch;
    });
  }
}
