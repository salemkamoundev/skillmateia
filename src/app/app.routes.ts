import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/login/login.component';
import { ChatRoomComponent } from './features/chat-room/chat-room.component';
import { ProfileSetupComponent } from './features/profile-setup/profile-setup.component';
import { UserProfileComponent } from './features/user-profile/user-profile.component';
import { StudiesComponent } from './features/studies/studies.component';
import { CertificationsComponent } from './features/certifications/certifications.component';
import { PricingComponent } from './features/pricing/pricing.component';
import { SettingsComponent } from './features/settings/settings.component';
import { AuthGuard } from '@angular/fire/auth-guard'; // Optionnel si configuré

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'chat', component: ChatRoomComponent },
  { path: 'profile-edit', component: ProfileSetupComponent },
  { path: 'profil', component: UserProfileComponent },
  { path: 'etude', component: StudiesComponent },
  { path: 'certifications', component: CertificationsComponent },
  
  { path: 'settings', component: SettingsComponent },
  { 
    path: 'payant', 
    loadComponent: () => import('./payant/payant.component').then(m => m.PayantComponent) 
  }
];
