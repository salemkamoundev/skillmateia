import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProfileService } from '../../core/services/profile.service';
import { OfferService } from '../../core/services/offer.service';
import { StudyService } from '../../core/services/study.service';
import { CertificationService } from '../../core/services/certification.service';
import { UserProfile } from '../../core/models/user-profile';
import { Offer } from '../../core/models/offer';
import { Study } from '../../core/models/study';
import { Certification } from '../../core/models/certification';
import { forkJoin, switchMap, map, of } from 'rxjs';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-profile.component.html',
  // On réutilise le CSS du profil privé pour le design
  styleUrls: ['../user-profile/user-profile.component.css'] 
})
export class PublicProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private profileService = inject(ProfileService);
  private offerService = inject(OfferService);
  private studyService = inject(StudyService);
  private certService = inject(CertificationService);

  user: UserProfile | null = null;
  offers: Offer[] = [];
  studies: Study[] = [];
  certs: Certification[] = [];
  isLoading = true;
  error = false;

  ngOnInit() {
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => {
        if (!id) return of(null);
        // Chargement parallèle de toutes les données publiques
        return forkJoin({
          profile: this.profileService.getUserProfile(id),
          offers: this.offerService.getOffersByUserId(id),
          studies: this.studyService.getStudiesByUserId(id),
          certs: this.certService.getCertificationsByUserId(id)
        });
      })
    ).subscribe({
      next: (data: any) => {
        if (data && data.profile) {
          this.user = data.profile;
          this.offers = data.offers || [];
          this.studies = data.studies || [];
          this.certs = data.certs || [];
        } else {
          this.error = true;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement profil public', err);
        this.error = true;
        this.isLoading = false;
      }
    });
  }
}
