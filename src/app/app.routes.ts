import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/login/login.component';
import { ChatRoomComponent } from './features/chat-room/chat-room.component';
import { ProfileSetupComponent } from './features/profile-setup/profile-setup.component';
import { UserProfileComponent } from './features/user-profile/user-profile.component';
import { StudiesComponent } from './features/studies/studies.component';
import { CertificationsComponent } from './features/certifications/certifications.component';
import { OffersComponent } from './features/offers/offers.component';
import { SettingsComponent } from './features/settings/settings.component';
import { PublicProfileComponent } from './features/public-profile/public-profile.component'; // Import

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  
  // Profil Public (Accessible à tous)
  { path: 'p/:id', component: PublicProfileComponent },

  // Pages Privées
  { path: 'chat', component: ChatRoomComponent },
  { path: 'profile-edit', component: ProfileSetupComponent },
  { path: 'profil', component: UserProfileComponent },
  { path: 'etude', component: StudiesComponent },
  { path: 'certifications', component: CertificationsComponent },
  { path: 'offers', component: OffersComponent },
  { path: 'settings', component: SettingsComponent },
];
