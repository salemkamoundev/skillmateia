import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { OfferService } from '../../core/services/offer.service';
import { CertificationService } from '../../core/services/certification.service'; // Service Certif
import { UserProfile } from '../../core/models/user-profile';
import { Offer } from '../../core/models/offer';
import { Certification } from '../../core/models/certification'; // Modèle Certif
import { switchMap, of, forkJoin, take } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private offerService = inject(OfferService);
  private certService = inject(CertificationService); // Injection
  private fb = inject(FormBuilder);
  private router = inject(Router);

  currentUser: UserProfile | null = null;
  isLoading = true;
  
  showEditModal = false;
  showOfferDetailModal = false;
  selectedOffer: Offer | null = null;

  profileForm: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    title: [''],
    bio: [''],
    skillsOffered: [[]],
    skillsRequested: [[]]
  });

  // Data Sources
  myAvailableOffers: Offer[] = []; 
  myCertifications: Certification[] = []; // Liste des certifications
  
  allLearningTopics: string[] = [
    'Angular', 'React', 'Vue.js', 'Node.js', 'Python', 'Java', 'C#', 
    'Piano', 'Guitare', 'Chant', 'Anglais', 'Espagnol', 'Japonais',
    'Mathématiques', 'Physique', 'Cuisine', 'Yoga', 'Fitness', 
    'Marketing', 'SEO', 'Copywriting', 'Design UI/UX', 'Figma'
  ].sort();

  // Inputs Tags
  offeredInput = '';
  requestedInput = '';
  filteredOffered: string[] = []; 
  filteredRequested: string[] = [];
  showOfferedDropdown = false;
  showRequestedDropdown = false;

  ngOnInit() {
    this.chargerDonnees();
  }

  chargerDonnees() {
    this.isLoading = true;
    
    this.auth.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) return of({ profile: null, offers: [], certs: [] });
        
        // CHARGEMENT PARALLELE : Profil + Offres + Certifications
        return forkJoin({
          profile: this.profileService.getUserProfile(user.uid).pipe(take(1)), 
          offers: this.offerService.getUserOffers().pipe(take(1)),
          certs: this.certService.getUserCertifications().pipe(take(1))
        });
      })
    ).subscribe({
      next: (data: any) => {
        // 1. Profil
        if (data.profile) {
          this.currentUser = data.profile;
        } else {
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

        // 2. Offres
        this.myAvailableOffers = data.offers || [];

        // 3. Certifications
        this.myCertifications = data.certs || [];
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // --- NAVIGATION ---
  manageOffers() {
    this.closeOfferDetailModal();
    this.router.navigate(['/offers']);
  }

  // Méthode pour aller gérer les certifications
  manageCertifications() {
    this.router.navigate(['/certifications']);
  }

  // --- DETAILS OFFRE ---
  openOfferDetails(skillName: string) {
    const offer = this.myAvailableOffers.find(o => o.title === skillName);
    if (offer) {
      this.selectedOffer = offer;
      this.showOfferDetailModal = true;
    }
  }

  closeOfferDetailModal() {
    this.showOfferDetailModal = false;
    this.selectedOffer = null;
  }

  // --- MODAL EDITION PROFIL ---
  openEditModal() {
    if (!this.currentUser) return;
    this.offeredInput = '';
    this.requestedInput = '';
    this.filteredOffered = [];
    this.filteredRequested = [];

    this.profileForm.patchValue({
      displayName: this.currentUser.displayName,
      title: this.currentUser.title || '',
      bio: this.currentUser.bio || '',
      skillsOffered: [...(this.currentUser.skillsOffered || [])],
      skillsRequested: [...(this.currentUser.skillsRequested || [])]
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  // --- GESTION TAGS ---
  addSkill(type: 'offered' | 'requested', skill: string) {
    const controlName = type === 'offered' ? 'skillsOffered' : 'skillsRequested';
    const control = this.profileForm.get(controlName);
    const currentSkills = control?.value as string[];

    if (skill && !currentSkills.includes(skill)) {
      control?.setValue([...currentSkills, skill]);
    }

    if (type === 'offered') {
      this.offeredInput = '';
      this.showOfferedDropdown = false;
    } else {
      this.requestedInput = '';
      this.showRequestedDropdown = false;
    }
  }

  removeSkill(type: 'offered' | 'requested', skill: string) {
    const controlName = type === 'offered' ? 'skillsOffered' : 'skillsRequested';
    const control = this.profileForm.get(controlName);
    const currentSkills = control?.value as string[];
    control?.setValue(currentSkills.filter(s => s !== skill));
  }

  onSearch(type: 'offered' | 'requested', value: string) {
    const term = value.toLowerCase();
    const controlName = type === 'offered' ? 'skillsOffered' : 'skillsRequested';
    const alreadySelected = this.profileForm.get(controlName)?.value || [];

    const sourceList = type === 'offered' 
      ? this.myAvailableOffers.map(o => o.title) 
      : this.allLearningTopics;

    const results = sourceList.filter(skill => 
      skill.toLowerCase().includes(term) && !alreadySelected.includes(skill)
    );

    if (type === 'offered') {
      this.filteredOffered = results;
      this.showOfferedDropdown = true; 
    } else {
      this.filteredRequested = results.slice(0, 10);
      this.showRequestedDropdown = term.length > 0;
    }
  }

  onFocusOffered() {
    const alreadySelected = this.profileForm.get('skillsOffered')?.value || [];
    this.filteredOffered = this.myAvailableOffers
      .map(o => o.title)
      .filter(s => !alreadySelected.includes(s));
    this.showOfferedDropdown = this.filteredOffered.length > 0;
  }

  onEnter(type: 'offered' | 'requested', event: Event) {
    event.preventDefault();
    const value = type === 'offered' ? this.offeredInput.trim() : this.requestedInput.trim();
    if (value) {
      const formatted = value.charAt(0).toUpperCase() + value.slice(1);
      this.addSkill(type, formatted);
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid || !this.currentUser) return;

    const formValue = this.profileForm.value;
    const updatedData: Partial<UserProfile> = {
      displayName: formValue.displayName,
      title: formValue.title,
      bio: formValue.bio,
      skillsOffered: formValue.skillsOffered,
      skillsRequested: formValue.skillsRequested
    };

    try {
      await this.profileService.saveUserProfile(updatedData);
      this.currentUser = { ...this.currentUser, ...updatedData } as UserProfile;
      this.closeEditModal();
    } catch (err) {
      console.error('Erreur sauvegarde', err);
    }
  }
}
