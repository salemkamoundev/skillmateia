import { Routes } from '@angular/router';
import { AuthGuard, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/auth-guard'; // Import AngularFire Guard

import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/login/login.component';
import { ChatRoomComponent } from './features/chat-room/chat-room.component';
import { ProfileSetupComponent } from './features/profile-setup/profile-setup.component';
import { UserProfileComponent } from './features/user-profile/user-profile.component';
import { StudiesComponent } from './features/studies/studies.component';
import { CertificationsComponent } from './features/certifications/certifications.component';
import { OffersComponent } from './features/offers/offers.component';
import { SettingsComponent } from './features/settings/settings.component';
import { PublicProfileComponent } from './features/public-profile/public-profile.component';

// Helpers pour les redirections
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['home']);

export const routes: Routes = [
  // Redirection par défaut (protégée)
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // PAGE LOGIN (Seule page publique)
  // Si déjà connecté, on renvoie vers Home
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectLoggedInToHome }
  },

  // TOUTES LES AUTRES PAGES SONT PROTÉGÉES
  { 
    path: 'home', 
    component: HomeComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  
  // Même le profil public devient privé selon votre demande
  { 
    path: 'p/:id', 
    component: PublicProfileComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },

  { 
    path: 'chat', 
    component: ChatRoomComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  { 
    path: 'chat/:id', 
    component: ChatRoomComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },

  { 
    path: 'profile-edit', 
    component: ProfileSetupComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  { 
    path: 'profil', 
    component: UserProfileComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  { 
    path: 'etude', 
    component: StudiesComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  { 
    path: 'certifications', 
    component: CertificationsComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  { 
    path: 'offers', 
    component: OffersComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  { 
    path: 'settings', 
    component: SettingsComponent,
    canActivate: [AuthGuard], 
    data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
];
