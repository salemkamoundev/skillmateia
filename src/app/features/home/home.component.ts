import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user-profile';
import { Observable, map, switchMap, of, combineLatest } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  matches$: Observable<UserProfile[]> | undefined;

  ngOnInit() {
    const currentUser$ = this.authService.user$.pipe(
      switchMap(user => user ? this.profileService.getUserProfile(user.uid) : of(null))
    );

    const allProfiles$ = this.profileService.getAllProfiles();

    // Logique de Matching : Trouver les profils qui offrent ce que je demande
    this.matches$ = combineLatest([currentUser$, allProfiles$]).pipe(
      map(([currentUser, allUsers]) => {
        if (!currentUser) return [];
        
        return allUsers.filter(otherUser => {
          // Ne pas se matcher soi-même
          if (otherUser.uid === currentUser.uid) return false;

          // Intersection: Est-ce que otherUser offre une compétence que currentUser demande ?
          const hasMatchingSkill = otherUser.skillsOffered.some(offer => 
            currentUser.skillsRequested.some(req => req.toLowerCase() === offer.toLowerCase())
          );
          
          return hasMatchingSkill;
        });
      })
    );
  }
}
