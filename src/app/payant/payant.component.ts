import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, interval, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

// Imports Firebase
import { Firestore, collection, addDoc, doc, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { Database, ref, push, listVal, objectVal } from '@angular/fire/database';

@Component({
  selector: 'app-payant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payant.component.html',
  styleUrls: ['./payant.component.css']
})
export class PayantComponent implements OnDestroy {
  // Services Firebase injectés
  private firestore: Firestore = inject(Firestore);
  private rtdb: Database = inject(Database);

  // État local
  etape: 'CONFIG' | 'ATTENTE' | 'CHAT' | 'ACTIF' | 'FIN' = 'CONFIG';
  userRole: 'MENTOR' | 'ELEVE' = 'MENTOR'; // Pour la simulation
  
  // Données du formulaire
  config = { tarifType: 'FIXE', prix: 50, sujet: '' };
  
  // IDs
  currentContractId: string | null = null;
  
  // Données Observables
  messages$: Observable<any[]> | null = null;
  contratData: any = null;

  // Chat
  nouveauMessage = '';
  
  // Timer & Calcul
  timerSub: Subscription | null = null;
  tempsEcoule = '00:00:00';
  montantFinal = 0;

  constructor() {}

  // --- 1. MENTOR : Crée l'offre (Firestore) ---
  async creerOffre() {
    // On crée un document 'contract' dans Firestore
    const colRef = collection(this.firestore, 'contracts');
    const docRef = await addDoc(colRef, {
      ...this.config,
      statut: 'ATTENTE',
      createdAt: new Date(),
      mentorId: 'user_mentor_123'
    });
    
    this.currentContractId = docRef.id;
    this.ecouterContrat(this.currentContractId);
    this.etape = 'ATTENTE';
  }

  // --- 2. ELEVE : Rejoint (Simulé) ---
  rejoindreSession() {
    // Dans une vraie app, on récupérerait l'ID via l'URL
    if(!this.currentContractId) { alert('Créez une offre d\'abord'); return; }
    
    this.userRole = 'ELEVE';
    this.etape = 'CHAT';
    this.setupChat();
    
    // Met à jour Firestore pour dire qu'il y a un élève
    const docRef = doc(this.firestore, 'contracts', this.currentContractId);
    updateDoc(docRef, { statut: 'NEGOCIATION', eleveId: 'user_eleve_456' });
  }

  // --- ECOUTEURS (Realtime & Firestore) ---
  
  // Écoute les changements d'état du contrat (Firestore)
  ecouterContrat(id: string) {
    const docRef = doc(this.firestore, 'contracts', id);
    
    // onSnapshot permet d'écouter en temps réel le document Firestore
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.contratData = docSnap.data();
        const statut = this.contratData.statut;

        // Mise à jour de l'interface selon le statut Firestore
        if (statut === 'NEGOCIATION' && this.etape === 'ATTENTE') {
           this.etape = 'CHAT';
           this.setupChat();
        }
        if (statut === 'EN_COURS' && this.etape !== 'ACTIF') {
           this.demarrerLocally(this.contratData.startTime?.toDate());
        }
        if (statut === 'TERMINE' && this.etape !== 'FIN') {
           this.terminerLocally(this.contratData);
        }
      }
    });
  }

  // Configure le Chat (Realtime Database)
  setupChat() {
    if (!this.currentContractId) return;
    // On utilise l'ID du contrat Firestore comme noeud dans Realtime DB
    const chatRef = ref(this.rtdb, 'chats/' + this.currentContractId);
    this.messages$ = listVal(chatRef);
  }

  // --- ACTIONS ---

  envoyerMessage() {
    if (!this.nouveauMessage.trim() || !this.currentContractId) return;
    
    const chatRef = ref(this.rtdb, 'chats/' + this.currentContractId);
    push(chatRef, {
      user: this.userRole,
      text: this.nouveauMessage,
      timestamp: Date.now()
    });
    this.nouveauMessage = '';
  }

  // Démarre le contrat (Mise à jour Firestore)
  async lancerContrat() {
    if (!this.currentContractId) return;
    const docRef = doc(this.firestore, 'contracts', this.currentContractId);
    
    await updateDoc(docRef, {
      statut: 'EN_COURS',
      startTime: new Date()
    });
  }

  // Termine le contrat (Mise à jour Firestore)
  async stopperContrat() {
    if (!this.currentContractId) return;
    const docRef = doc(this.firestore, 'contracts', this.currentContractId);
    
    await updateDoc(docRef, {
      statut: 'TERMINE',
      endTime: new Date()
    });
  }

  // --- LOGIQUE INTERNE (Timer & Calcul) ---

  demarrerLocally(startTime: Date) {
    this.etape = 'ACTIF';
    
    // Si tarif horaire, on lance le compteur visuel
    if (this.config.tarifType === 'HEURE') {
      this.timerSub = interval(1000).subscribe(() => {
        const now = new Date().getTime();
        const start = startTime.getTime();
        const diff = new Date(now - start);
        this.tempsEcoule = diff.toISOString().substr(11, 8);
      });
    }
  }

  terminerLocally(data: any) {
    this.etape = 'FIN';
    if (this.timerSub) this.timerSub.unsubscribe();

    if (data.tarifType === 'FIXE') {
      this.montantFinal = data.prix;
    } else {
      // Calcul basé sur les timestamps Firestore (plus sûr)
      const start = data.startTime.toDate().getTime();
      const end = data.endTime.toDate().getTime();
      const hours = (end - start) / 3600000;
      this.montantFinal = Math.round(hours * data.prix * 100) / 100;
      if(this.montantFinal < 1) this.montantFinal = data.prix; // Minimum symbolique pour démo
    }
  }

  // Envoi Feedback (Firestore)
  async envoyerFeedback(note: number) {
    if (!this.currentContractId) return;
    // On stocke le feedback dans une sous-collection ou directement dans le contrat
    const docRef = doc(this.firestore, 'contracts', this.currentContractId);
    await updateDoc(docRef, {
      [`feedback_${this.userRole}`]: note
    });
    alert('Merci pour votre note !');
  }

  ngOnDestroy() {
    if (this.timerSub) this.timerSub.unsubscribe();
  }
}
