import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OfferService } from '../../core/services/offer.service';
import { Offer } from '../../core/models/offer';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './offers.component.html',
  styles: [] 
})
export class OffersComponent implements OnInit {
  private offerService = inject(OfferService);
  private fb = inject(FormBuilder);

  offers$: Observable<Offer[]> | undefined;
  
  showModal = false;
  isEditing = false;
  currentOfferId: string | null = null;

  offerForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    type: ['HOURLY', Validators.required], // HOURLY par défaut
    price: [null],
    exchangeSkill: [''],
    active: [true]
  });

  ngOnInit() {
    this.offers$ = this.offerService.getUserOffers();

    // Gestion dynamique des validateurs (Prix vs Échange)
    this.offerForm.get('type')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });
  }

  updateValidators(type: string) {
    const priceControl = this.offerForm.get('price');
    const skillControl = this.offerForm.get('exchangeSkill');

    if (type === 'EXCHANGE') {
      priceControl?.clearValidators();
      priceControl?.setValue(null);
      skillControl?.setValidators([Validators.required]);
    } else {
      skillControl?.clearValidators();
      skillControl?.setValue('');
      priceControl?.setValidators([Validators.required, Validators.min(0)]);
    }
    priceControl?.updateValueAndValidity();
    skillControl?.updateValueAndValidity();
  }

  // --- MODAL ACTIONS ---
  openAddModal() {
    this.isEditing = false;
    this.currentOfferId = null;
    this.offerForm.reset({ type: 'HOURLY', active: true });
    this.updateValidators('HOURLY');
    this.showModal = true;
  }

  openEditModal(offer: Offer) {
    this.isEditing = true;
    this.currentOfferId = offer.id!;
    this.offerForm.patchValue(offer);
    this.updateValidators(offer.type);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // --- CRUD ---
  async onSubmit() {
    if (this.offerForm.invalid) return;
    const formValue = this.offerForm.value;

    try {
      if (this.isEditing && this.currentOfferId) {
        await this.offerService.updateOffer(this.currentOfferId, formValue);
      } else {
        await this.offerService.addOffer(formValue);
      }
      this.closeModal();
    } catch (err) {
      console.error('Erreur', err);
    }
  }

  async deleteOffer(id: string) {
    if(confirm('Supprimer cette offre ?')) {
      await this.offerService.deleteOffer(id);
    }
  }

  // Helper pour l'affichage
  getTypeLabel(type: string): string {
    switch(type) {
      case 'HOURLY': return 'Taux Horaire';
      case 'FIXED': return 'Prix Fixe';
      case 'EXCHANGE': return 'Échange';
      default: return type;
    }
  }
}
