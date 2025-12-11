#!/bin/bash

# Chemin
TS_FILE="src/app/features/home/home.component.ts"

echo "=================================================="
echo "RÉPARATION DU HOME COMPONENT (TYPESCRIPT)"
echo "=================================================="

cat <<EOF > $TS_FILE
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Import nécessaire pour routerLink
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user-profile';
import { forkJoin, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule], // RouterModule est CRUCIAL ici
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Variables attendues par le HTML
  matches: UserProfile[] = [];
  currentUser: UserProfile | null = null;
  loading = true;
  filtre: 'TOUT' | 'GRATUIT' | 'PAYANT' = 'TOUT';

  ngOnInit() {
    this.chargerDonnees();
  }

  chargerDonnees() {
    this.loading = true;

    // On récupère le user courant ET tous les profils
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
        const allUsers = data.all || [];

        if (this.currentUser) {
          // LOGIQUE DE MATCHING :
          // On cherche les gens qui OFFRENT ce que je DEMANDE
          this.matches = allUsers.filter(otherUser => {
            // 1. Ne pas se matcher soi-même
            if (otherUser.uid === this.currentUser?.uid) return false;

            // 2. Vérifier s'il y a une compétence commune
            // (Est-ce que 'otherUser' enseigne quelque chose que 'currentUser' veut ?)
            const myRequests = this.currentUser?.skillsRequested || [];
            const theirOffers = otherUser.skillsOffered || [];

            // On regarde s'il y a au moins une correspondance (insensible à la casse)
            return theirOffers.some(offer => 
              myRequests.some(req => req.toLowerCase() === offer.toLowerCase())
            );
          });
        } else {
          // Si pas connecté ou pas de profil, on montre tout le monde (mode découverte)
          this.matches = allUsers;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement home:', err);
        this.loading = false;
      }
    });
  }

  // Méthode pour le bouton filtre (même si la logique est à affiner plus tard)
  setFiltre(val: 'TOUT' | 'GRATUIT' | 'PAYANT') {
    this.filtre = val;
    // Ici on pourrait filtrer this.matches si on avait le prix dans le profil
  }
}
EOF

echo "Réparation terminée. Relancez 'ng serve'."