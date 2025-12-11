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
import { forkJoin, switchMap, map, of, take } from 'rxjs'; // Ajout de 'take'

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
        
        // CORRECTION : Ajout de .pipe(take(1)) sur chaque observable
        // Cela force la fin du flux et permet à forkJoin de terminer
        return forkJoin({
          profile: this.profileService.getUserProfile(id).pipe(take(1)),
          offers: this.offerService.getOffersByUserId(id).pipe(take(1)),
          studies: this.studyService.getStudiesByUserId(id).pipe(take(1)),
          certs: this.certService.getCertificationsByUserId(id).pipe(take(1))
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
        this.isLoading = false; // Le chargement s'arrête ici
      },
      error: (err) => {
        console.error('Erreur chargement profil public', err);
        this.error = true;
        this.isLoading = false;
      }
    });
  }
}
