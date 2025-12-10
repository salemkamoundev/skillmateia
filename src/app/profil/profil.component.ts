import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';

interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  poste: string;
  bio: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  
  userId = 'user_demo_123';
  
  // CORRECTION MAJEURE : On initialise isLoading à true pour bloquer le HTML
  isLoading = true;
  isEditing = false;
  
  // CORRECTION MAJEURE : On initialise user avec des valeurs vides immédiates
  // Cela empêche 'user' d'être undefined pendant la première milliseconde du rendu
  user: UserProfile = {
    nom: '',
    prenom: '',
    email: '',
    poste: '',
    bio: '',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Init'
  };

  // On initialise aussi le cache pour éviter des erreurs en mode édition
  editCache: UserProfile = { ...this.user };

  async ngOnInit() {
    await this.chargerProfil();
  }

  async chargerProfil() {
    this.isLoading = true;
    try {
      const docRef = doc(this.firestore, 'users', this.userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // CORRECTION : On utilise "|| ''" partout pour éviter que null/undefined n'arrive dans le HTML
        this.user = {
          nom: data['nom'] || '',
          prenom: data['prenom'] || '',
          email: data['email'] || '',
          poste: data['poste'] || '',
          bio: data['bio'] || '',
          avatarUrl: data['avatarUrl'] || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default'
        };
      } else {
        // Création du profil par défaut si l'utilisateur n'existe pas dans Firestore
        this.user = {
          nom: 'Doe',
          prenom: 'John',
          email: 'john.doe@example.com',
          poste: 'Développeur Fullstack',
          bio: 'Passionné par Angular et Firebase.',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
        };
        await setDoc(docRef, this.user);
      }
      
      // On met à jour le cache d'édition
      this.editCache = { ...this.user };

    } catch (e) {
      console.error("Erreur critique chargement:", e);
    } finally {
      // On libère le chargement seulement quand tout est prêt
      this.isLoading = false;
    }
  }

  activerEdition() {
    this.editCache = { ...this.user };
    this.isEditing = true;
  }

  annulerEdition() {
    this.isEditing = false;
  }

  async sauvegarder() {
    this.isLoading = true;
    const docRef = doc(this.firestore, 'users', this.userId);
    
    // Mise à jour de l'avatar si le prénom change
    if(this.editCache.prenom && this.editCache.prenom !== this.user.prenom) {
       this.editCache.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.editCache.prenom}`;
    }

    try {
      await updateDoc(docRef, { ...this.editCache });
      this.user = { ...this.editCache };
      this.isEditing = false;
    } catch (e) {
      console.error("Erreur sauvegarde", e);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      this.isLoading = false;
    }
  }
}
