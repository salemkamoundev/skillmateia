import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CertificationService } from '../../core/services/certification.service';
import { Certification } from '../../core/models/certification';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './certifications.component.html',
  styleUrls: ['./certifications.component.scss'] // On utilisera le SCSS global ou inline
})
export class CertificationsComponent implements OnInit {
  private certService = inject(CertificationService);
  private fb = inject(FormBuilder);

  certifications$: Observable<Certification[]> | undefined;
  
  // Gestion de la modale et du formulaire
  showModal = false;
  isEditing = false;
  currentCertId: string | null = null;
  
  certForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    issuer: ['', Validators.required],
    date: ['', Validators.required],
    url: ['']
  });

  ngOnInit() {
    this.certifications$ = this.certService.getUserCertifications();
  }

  // --- ACTIONS MODALE ---
  openAddModal() {
    this.isEditing = false;
    this.currentCertId = null;
    this.certForm.reset();
    this.showModal = true;
  }

  openEditModal(cert: Certification) {
    this.isEditing = true;
    this.currentCertId = cert.id!;
    this.certForm.patchValue({
      title: cert.title,
      issuer: cert.issuer,
      date: cert.date,
      url: cert.url
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // --- CRUD ACTIONS ---
  async onSubmit() {
    if (this.certForm.invalid) return;

    const formValue = this.certForm.value;

    try {
      if (this.isEditing && this.currentCertId) {
        await this.certService.updateCertification(this.currentCertId, formValue);
      } else {
        await this.certService.addCertification(formValue);
      }
      this.closeModal();
    } catch (err) {
      console.error('Erreur sauvegarde', err);
    }
  }

  async deleteCert(id: string) {
    if (confirm('Voulez-vous vraiment supprimer cette certification ?')) {
      await this.certService.deleteCertification(id);
    }
  }
}
