#!/bin/bash

# Chemins
TS_FILE="src/app/features/home/home.component.ts"
HTML_FILE="src/app/features/home/home.component.html"
CSS_FILE="src/app/features/home/home.component.css"

echo "=================================================="
echo "UPGRADE HOME PAGE : RECHERCHE & DESIGN MODERNE"
echo "=================================================="

# 1. CSS : Styles pour la recherche et les cartes
cat <<EOF > $CSS_FILE
/* Container global */
.home-container {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 60px;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px 100px; /* Padding bas grand pour chevaucher */
  text-align: center;
  color: white;
  margin-bottom: -40px; /* Chevauchement */
}

.hero h1 { font-weight: 800; font-size: 2.5rem; margin-bottom: 10px; }
.hero p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 30px; font-weight: 300; }

/* Search Bar */
.search-container {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
}

.search-input-wrapper {
  background: white;
  padding: 8px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}
.search-input-wrapper:focus-within { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }

.search-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  font-size: 1.2rem;
}

.search-input {
  border: none;
  outline: none;
  flex: 1;
  padding: 10px;
  font-size: 1rem;
  color: #333;
}

/* Grid & Cards */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  padding: 20px;
  max-width: 1200px;
  margin: 40px auto 0;
}

.card-profile {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  border: none;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}
.card-profile:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(102, 126, 234, 0.15);
}

.card-header-img {
  height: 80px;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  opacity: 0.6;
}

.avatar-container {
  margin-top: -40px;
  text-align: center;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  border: 4px solid white;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: #667eea; /* Couleur du texte avatar */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); /* Fond avatar par défaut */
}

.card-body {
  padding: 20px;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name { font-weight: 700; color: #333; margin-bottom: 2px; font-size: 1.1rem; }
.user-title { color: #888; font-size: 0.85rem; margin-bottom: 15px; font-weight: 500; }

.skills-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-bottom: 20px;
}

.skill-tag {
  background-color: #f0f4ff;
  color: #5a67d8;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-footer-action {
  margin-top: auto;
}

.btn-view-profile {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 50px;
  padding: 8px 20px;
  font-weight: 600;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  width: 100%;
}
.btn-view-profile:hover {
  background: #667eea;
  color: white;
}

/* Empty State */
.empty-state { text-align: center; margin-top: 50px; color: #888; }
.spinner { margin-top: 50px; text-align: center; }
EOF

# 2. TYPESCRIPT : Logique de Filtrage
cat <<EOF > $TS_FILE
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
EOF

# 3. HTML : Nouvelle Structure
cat <<EOF > $HTML_FILE
<div class="home-container">
  
  <header class="hero">
    <h1>Trouvez votre mentor</h1>
    <p>Développez de nouvelles compétences avec la communauté SkillMate.</p>
    
    <div class="search-container">
      <div class="search-input-wrapper">
        <div class="search-icon">
          <i class="bi bi-search"></i>
        </div>
        <input type="text" 
               class="search-input" 
               placeholder="Que voulez-vous apprendre ? (Ex: Angular, Piano...)"
               [(ngModel)]="searchQuery">
        <button *ngIf="searchQuery" (click)="searchQuery=''" class="btn btn-sm text-muted rounded-circle"><i class="bi bi-x"></i></button>
      </div>
    </div>
  </header>

  <div *ngIf="loading" class="spinner">
    <div class="spinner-border text-primary" role="status"></div>
  </div>

  <div class="grid" *ngIf="!loading">
    
    <div *ngFor="let user of filteredUsers" class="card-profile">
      
      <div class="card-header-img"></div>
      
      <div class="avatar-container">
        <div class="user-avatar">
          {{ user.displayName.charAt(0).toUpperCase() }}
        </div>
      </div>

      <div class="card-body">
        <div class="user-name">{{ user.displayName }}</div>
        <div class="user-title">{{ user.title || 'Membre SkillMate' }}</div>
        
        <div class="skills-container">
          <span *ngFor="let skill of user.skillsOffered | slice:0:3" class="skill-tag">
            {{ skill }}
          </span>
          <span *ngIf="!user.skillsOffered || user.skillsOffered.length === 0" class="text-muted small fst-italic">
            Découverte
          </span>
        </div>

        <div class="card-footer-action">
          <a [routerLink]="['/p', user.uid]" class="btn-view-profile">
            Voir le Profil
          </a>
        </div>
      </div>
    </div>

  </div>

  <div *ngIf="!loading && filteredUsers.length === 0" class="empty-state">
    <div class="mb-3"><i class="bi bi-emoji-frown fs-1 opacity-50"></i></div>
    <h4>Aucun résultat trouvé</h4>
    <p>Essayez un autre mot-clé ou videz la recherche.</p>
  </div>

</div>
EOF

echo "Page d'accueil améliorée ! Recherche et Design activés."