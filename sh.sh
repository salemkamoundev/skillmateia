#!/bin/bash

# Fichier cible
HTML_FILE="src/app/features/home/home.component.html"

echo "=================================================="
echo "CORRECTION DU CRASH 'CHARAT' SUR LA HOME"
echo "=================================================="

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
          {{ (user.displayName || 'U').charAt(0).toUpperCase() }}
        </div>
      </div>

      <div class="card-body">
        <div class="user-name">{{ user.displayName || 'Utilisateur' }}</div>
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

echo "Correction appliquée. La page d'accueil est sécurisée contre les profils incomplets."