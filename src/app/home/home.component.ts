import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, addDoc, query, orderBy } from '@angular/fire/firestore';
import { Router } from '@angular/router';

interface Formation {
  id?: string;
  titre: string;
  description: string;
  type: 'GRATUIT' | 'PAYANT';
  prix: number;
  image: string;
  auteur: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private router = inject(Router);

  formations: Formation[] = [];
  loading = true;
  filtre: 'TOUT' | 'GRATUIT' | 'PAYANT' = 'TOUT';

  async ngOnInit() {
    await this.chargerFormations();
  }

  async chargerFormations() {
    this.loading = true;
    const colRef = collection(this.firestore, 'offres_formations');
    // On pourrait ajouter un tri ici : query(colRef, orderBy('prix'))
    const snap = await getDocs(colRef);
    
    this.formations = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Formation));
    
    this.loading = false;
  }

  // Fonction utilitaire pour générer des données de test si la base est vide
  async genererDemo() {
    const colRef = collection(this.firestore, 'offres_formations');
    
    const demos: Formation[] = [
      {
        titre: "Introduction à Angular",
        description: "Apprenez les bases du framework Angular 17+.",
        type: "GRATUIT",
        prix: 0,
        image: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Angular_full_color_logo.svg",
        auteur: "Jean Prof"
      },
      {
        titre: "Masterclass Firebase",
        description: "Devenez expert Firestore et Realtime DB.",
        type: "PAYANT",
        prix: 49.99,
        image: "https://firebase.google.com/static/images/brand-guidelines/logo-vertical.png",
        auteur: "Expert Cloud"
      },
      {
        titre: "CSS Moderne & Flexbox",
        description: "Faites de beaux designs sans bootstrap.",
        type: "GRATUIT",
        prix: 0,
        image: "https://upload.wikimedia.org/wikipedia/commons/6/62/CSS3_logo.svg",
        auteur: "Sophie Design"
      },
      {
        titre: "Coaching Privé Fullstack",
        description: "Accompagnement personnalisé sur votre projet.",
        type: "PAYANT",
        prix: 150,
        image: "https://cdn-icons-png.flaticon.com/512/2038/2038021.png",
        auteur: "Coach Pro"
      }
    ];

    for (const f of demos) {
      await addDoc(colRef, f);
    }
    await this.chargerFormations(); // Recharger après ajout
  }

  allerVersDetail(f: Formation) {
    if (f.type === 'PAYANT') {
      this.router.navigate(['/payant']); // Redirige vers le module payant
    } else {
      alert("C'est gratuit ! Accès direct au contenu (A implémenter)");
    }
  }

  get filteredFormations() {
    if (this.filtre === 'TOUT') return this.formations;
    return this.formations.filter(f => f.type === this.filtre);
  }
}
