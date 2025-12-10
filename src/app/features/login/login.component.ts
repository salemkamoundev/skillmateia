import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent {
  private authService = inject(AuthService);

  login() {
    this.authService.loginWithGoogle();
  }
}
