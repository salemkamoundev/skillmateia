import { Injectable, inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { ProfileService } from './profile.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private messaging = inject(Messaging);
  private profileService = inject(ProfileService);

  currentMessage$ = new Observable((observer) => {
    return onMessage(this.messaging, (payload) => {
      console.log('Nouveau message reçu (foreground):', payload);
      observer.next(payload);
    });
  });

  async requestPermissionAndSaveToken() {
    console.log('Demande de permission pour les notifications...');
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permission accordée.');
      
      // Récupération du token FCM
      try {
        const token = await getToken(this.messaging, {
          vapidKey: environment.firebase.vapidKey
        });

        if (token) {
          console.log('Token FCM récupéré:', token);
          // Sauvegarde dans Firestore via ProfileService
          await this.profileService.saveUserProfile({ fcmToken: token });
        } else {
          console.log('Impossible de récupérer le token.');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du token FCM', err);
      }
    } else {
      console.log('Permission refusée.');
    }
  }
}
