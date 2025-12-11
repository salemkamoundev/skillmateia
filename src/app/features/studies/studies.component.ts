import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudyService } from '../../core/services/study.service';
import { Study } from '../../core/models/study';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-studies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './studies.component.html',
  styles: [] // Utilise le style global
})
export class StudiesComponent implements OnInit {
  private studyService = inject(StudyService);
  private fb = inject(FormBuilder);

  studies$: Observable<Study[]> | undefined;
  
  showModal = false;
  isEditing = false;
  currentId: string | null = null;

  studyForm: FormGroup = this.fb.group({
    institution: ['', Validators.required],
    degree: ['', Validators.required],
    field: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: [''], 
    description: ['']
  });

  ngOnInit() {
    this.studies$ = this.studyService.getUserStudies();
  }

  // --- ACTIONS MODAL ---
  openAddModal() {
    this.isEditing = false;
    this.currentId = null;
    this.studyForm.reset();
    this.showModal = true;
  }

  openEditModal(study: Study) {
    this.isEditing = true;
    this.currentId = study.id!;
    this.studyForm.patchValue(study);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // --- CRUD ---
  async onSubmit() {
    if (this.studyForm.invalid) return;
    const val = this.studyForm.value;

    try {
      if (this.isEditing && this.currentId) {
        await this.studyService.updateStudy(this.currentId, val);
      } else {
        await this.studyService.addStudy(val);
      }
      this.closeModal();
    } catch (e) {
      console.error(e);
    }
  }

  async deleteStudy(id: string) {
    if(confirm('Supprimer ce diplôme ?')) {
      await this.studyService.deleteStudy(id);
    }
  }
}
