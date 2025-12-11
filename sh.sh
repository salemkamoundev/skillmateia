#!/bin/bash

# Chemins des fichiers
OFFERS_HTML="src/app/features/offers/offers.component.html"
PROFIL_TS="src/app/features/user-profile/user-profile.component.ts"
PROFIL_HTML="src/app/features/user-profile/user-profile.component.html"

echo "=================================================="
echo "CORRECTION DESIGN OFFRES & LOGIQUE PROFIL"
echo "=================================================="

# ---------------------------------------------------------
# 1. CORRECTION DU DESIGN OFFRES (PRIX FIXE EN BLANC)
# ---------------------------------------------------------
echo "[1/3] Application du style 'Blanc' sur Prix Fixe..."

cat <<EOF > $OFFERS_HTML
<div class="container py-4 router-container position-relative">
  
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h2 class="h4 fw-bold mb-1">Mes Offres</h2>
      <p class="text-muted small mb-0">Gérez vos services et tarifs.</p>
    </div>
    <button (click)="openAddModal()" class="btn btn-gradient-primary rounded-pill shadow-sm">
      <i class="bi bi-plus-lg me-1"></i> Créer une offre
    </button>
  </div>

  <div *ngIf="offers$ | async as offers; else loading">
    
    <div *ngIf="offers.length === 0" class="text-center py-5 card card-modern">
      <div class="text-muted mb-3"><i class="bi bi-tag fs-1 opacity-25"></i></div>
      <h5>Aucune offre active</h5>
      <p class="text-muted small">Commencez à proposer vos services.</p>
    </div>

    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      <div class="col" *ngFor="let offer of offers">
        <div class="card card-modern h-100 border-0 shadow-sm position-relative overflow-hidden group-action">
          
          <div class="position-absolute top-0 bottom-0 start-0" style="width: 6px;"
               [ngClass]="{
                 'bg-primary': offer.type === 'HOURLY',
                 'bg-success': offer.type === 'FIXED',
                 'bg-warning': offer.type === 'EXCHANGE'
               }"></div>

          <div class="card-body p-4 ps-4">
            
            <div class="d-flex justify-content-between align-items-start mb-3">
              
              <span class="badge rounded-pill fw-normal border"
                [ngClass]="{
                  'bg-primary bg-opacity-10 text-primary border-primary border-opacity-10': offer.type === 'HOURLY',
                  'bg-success text-white border-success': offer.type === 'FIXED', 
                  'bg-warning bg-opacity-10 text-warning border-warning border-opacity-10': offer.type === 'EXCHANGE'
                }">
                <i class="bi" [ngClass]="{
                  'bi-clock': offer.type === 'HOURLY',
                  'bi-cash-stack': offer.type === 'FIXED',
                  'bi-arrow-left-right': offer.type === 'EXCHANGE'
                }"></i>
                {{ getTypeLabel(offer.type) }}
              </span>

              <div class="dropdown">
                <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3">
                  <li><button (click)="openEditModal(offer)" class="dropdown-item small"><i class="bi bi-pencil me-2"></i>Modifier</button></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><button (click)="deleteOffer(offer.id!)" class="dropdown-item small text-danger"><i class="bi bi-trash me-2"></i>Supprimer</button></li>
                </ul>
              </div>
            </div>

            <h5 class="fw-bold mb-2">{{ offer.title }}</h5>
            
            <h3 class="fw-bold mb-3" *ngIf="offer.type !== 'EXCHANGE'">
              {{ offer.price }}€ <small class="fs-6 text-muted fw-normal" *ngIf="offer.type === 'HOURLY'">/h</small>
            </h3>
            
            <div *ngIf="offer.type === 'EXCHANGE'" class="mb-3 p-2 bg-light rounded-3 border border-warning border-opacity-25">
              <small class="text-muted d-block text-uppercase mb-1" style="font-size: 0.65rem;">En échange de</small>
              <div class="fw-bold text-dark"><i class="bi bi-stars text-warning me-1"></i> {{ offer.exchangeSkill }}</div>
            </div>

            <p class="text-muted small mb-0 text-truncate" *ngIf="offer.description">
              {{ offer.description }}
            </p>

          </div>
          
          <div class="card-footer bg-white border-0 pt-0 pb-3 ps-4">
             <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" [checked]="offer.active" disabled>
                <label class="form-check-label small text-muted">{{ offer.active ? 'Visible' : 'Masquée' }}</label>
             </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <ng-template #loading>
    <div class="d-flex justify-content-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
  </ng-template>

  <div class="modal fade show" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5); z-index: 1055;" *ngIf="showModal">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content card-modern border-0">
        
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold">{{ isEditing ? 'Modifier' : 'Créer' }} une offre</h5>
          <button type="button" class="btn-close" (click)="closeModal()"></button>
        </div>

        <div class="modal-body">
          <form [formGroup]="offerForm" (ngSubmit)="onSubmit()">
            
            <div class="btn-group w-100 mb-4" role="group">
              <input type="radio" class="btn-check" formControlName="type" value="HOURLY" id="t1" autocomplete="off">
              <label class="btn btn-outline-primary rounded-start-pill" for="t1">Par Heure</label>

              <input type="radio" class="btn-check" formControlName="type" value="FIXED" id="t2" autocomplete="off">
              <label class="btn btn-outline-primary" for="t2">Forfait</label>

              <input type="radio" class="btn-check" formControlName="type" value="EXCHANGE" id="t3" autocomplete="off">
              <label class="btn btn-outline-primary rounded-end-pill" for="t3">Échange</label>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">Titre de l'offre</label>
              <input type="text" formControlName="title" class="form-control bg-light border-0" placeholder="Ex: Cours de guitare débutant">
            </div>

            <div class="mb-3" *ngIf="offerForm.get('type')?.value !== 'EXCHANGE'">
              <label class="form-label fw-bold small">Tarif (€)</label>
              <div class="input-group">
                <input type="number" formControlName="price" class="form-control bg-light border-0">
                <span class="input-group-text border-0 bg-light">{{ offerForm.get('type')?.value === 'HOURLY' ? '€ / heure' : '€ total' }}</span>
              </div>
            </div>

            <div class="mb-3" *ngIf="offerForm.get('type')?.value === 'EXCHANGE'">
              <label class="form-label fw-bold small text-warning">Compétence souhaitée en retour</label>
              <input type="text" formControlName="exchangeSkill" class="form-control border-warning bg-light" placeholder="Ex: Développement Web, Jardinage...">
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">Description</label>
              <textarea formControlName="description" rows="3" class="form-control bg-light border-0" placeholder="Détaillez ce que vous proposez..."></textarea>
            </div>

            <div class="form-check form-switch mb-4">
              <input class="form-check-input" type="checkbox" formControlName="active" id="activeSwitch">
              <label class="form-check-label" for="activeSwitch">Rendre l'offre visible immédiatement</label>
            </div>

            <div class="d-grid gap-2">
              <button type="submit" [disabled]="offerForm.invalid" class="btn btn-gradient-primary py-2 rounded-pill shadow-sm">
                Enregistrer
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  </div>
</div>
EOF

# ---------------------------------------------------------
# 2. CORRECTION LOGIQUE PROFIL (TS)
# ---------------------------------------------------------
echo "[2/3] Correction logique TypeScript du profil..."

cat <<EOF > $PROFIL_TS
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
EOF

# ---------------------------------------------------------
# 3. CORRECTION HTML PROFIL (Sécurisation Affichage)
# ---------------------------------------------------------
echo "[3/3] Correction Template HTML du profil..."

cat <<EOF > $PROFIL_HTML
<div class="container py-4 router-container">
  
  <ng-container *ngIf="!isLoading && currentUser; else loading">
    
    <div class="card card-modern border-0 shadow-sm mb-4 text-center p-4">
      <div class="mx-auto mb-3 position-relative">
        
        <div class="rounded-circle bg-light d-flex align-items-center justify-content-center display-1 fw-bold text-primary mx-auto shadow-sm" 
             style="width: 100px; height: 100px; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; border: 4px solid white;">
           {{ currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U' }}
        </div>
        
        <button (click)="openEditModal()" class="btn btn-sm btn-dark rounded-circle position-absolute bottom-0 end-50 translate-middle-x mb-n2 shadow-sm" style="margin-left: 35px;">
          <i class="bi bi-pencil-fill small"></i>
        </button>
      </div>

      <h3 class="fw-bold mb-1">{{ currentUser.displayName }}</h3>
      <p class="text-muted mb-3">{{ currentUser.title || 'Aucun titre défini' }}</p>
      
      <div class="d-flex justify-content-center gap-4 border-top pt-3 mt-2">
        <div class="text-center">
          <h5 class="mb-0 fw-bold">{{ currentUser.skillsOffered?.length || 0 }}</h5>
          <small class="text-muted text-uppercase" style="font-size: 0.65rem;">Offres</small>
        </div>
        <div class="text-center">
          <h5 class="mb-0 fw-bold">{{ currentUser.skillsRequested?.length || 0 }}</h5>
          <small class="text-muted text-uppercase" style="font-size: 0.65rem;">Demandes</small>
        </div>
      </div>
    </div>

    <div class="card card-modern border-0 shadow-sm p-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0">À propos</h5>
      </div>
      
      <p class="text-muted" *ngIf="currentUser.bio; else noBio">{{ currentUser.bio }}</p>
      <ng-template #noBio><p class="text-muted fst-italic small">Aucune bio renseignée.</p></ng-template>
      
      <hr class="my-4 opacity-10">
      
      <h6 class="fw-bold mb-3 small text-uppercase text-primary ls-1">Je propose</h6>
      <div class="d-flex flex-wrap gap-2 mb-4">
        <span *ngFor="let skill of currentUser.skillsOffered" class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 border border-primary border-opacity-10">
          {{ skill }}
        </span>
        <span *ngIf="!currentUser.skillsOffered || currentUser.skillsOffered.length === 0" class="text-muted small">Rien pour l'instant</span>
      </div>

      <h6 class="fw-bold mb-3 small text-uppercase text-danger ls-1">Je recherche</h6>
      <div class="d-flex flex-wrap gap-2">
        <span *ngFor="let skill of currentUser.skillsRequested" class="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 border border-danger border-opacity-10">
          {{ skill }}
        </span>
        <span *ngIf="!currentUser.skillsRequested || currentUser.skillsRequested.length === 0" class="text-muted small">Rien pour l'instant</span>
      </div>
    </div>

  </ng-container>

  <ng-template #loading>
    <div class="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted mt-3 small">Chargement du profil...</p>
    </div>
  </ng-template>

  <div class="modal fade show" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5); z-index: 1055;" *ngIf="showModal">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content card-modern border-0">
        
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold">Modifier le profil</h5>
          <button type="button" class="btn-close" (click)="closeModal()"></button>
        </div>

        <div class="modal-body">
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
             
            <div class="mb-3">
              <label class="form-label fw-bold small">Nom complet</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-0"><i class="bi bi-person"></i></span>
                <input type="text" formControlName="displayName" class="form-control bg-light border-0">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">Titre / Poste</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-0"><i class="bi bi-briefcase"></i></span>
                <input type="text" formControlName="title" class="form-control bg-light border-0" placeholder="Ex: Étudiant, Développeur...">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">Bio</label>
              <textarea formControlName="bio" class="form-control bg-light border-0" rows="3" placeholder="Parlez un peu de vous..."></textarea>
            </div>

            <hr class="opacity-10 my-4">

            <div class="mb-3">
              <label class="form-label fw-bold small text-primary">Compétences offertes</label>
              <input type="text" formControlName="skillsOffered" class="form-control bg-light border-0" placeholder="Séparez par des virgules (Ex: Angular, Piano)">
              <div class="form-text x-small">Ce que vous pouvez enseigner aux autres.</div>
            </div>

            <div class="mb-4">
              <label class="form-label fw-bold small text-danger">Compétences recherchées</label>
              <input type="text" formControlName="skillsRequested" class="form-control bg-light border-0" placeholder="Séparez par des virgules (Ex: Cuisine, Yoga)">
              <div class="form-text x-small">Ce que vous souhaitez apprendre.</div>
            </div>

            <div class="d-grid gap-2">
              <button type="submit" [disabled]="profileForm.invalid" class="btn btn-gradient-primary py-2 rounded-pill shadow-sm">
                Enregistrer
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  </div>
</div>
EOF

echo "Correction terminée !"