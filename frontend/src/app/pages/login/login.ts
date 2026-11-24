import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 text-white text-2xl font-bold shadow-lg">
            HC
          </div>
          <h1 class="text-2xl font-bold text-slate-900">HostelCare Portal</h1>
          <p class="text-sm text-slate-500">
            {{ selectedPortal === 'admin' ? 'Warden & Administrator Console' : 'Sign in to manage or track hostel complaints' }}
          </p>
        </div>

        <!-- Student | Warden Portal Toggle -->
        <div class="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            (click)="switchPortal('student')"
            [ngClass]="selectedPortal === 'student'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-700 font-medium'"
            class="py-2 text-xs rounded-lg transition-all"
          >
            Student Portal
          </button>
          <button
            type="button"
            (click)="switchPortal('admin')"
            [ngClass]="selectedPortal === 'admin'
              ? 'bg-slate-900 text-white shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-700 font-medium'"
            class="py-2 text-xs rounded-lg transition-all"
          >
            Warden / Admin
          </button>
        </div>

        <div *ngIf="selectedPortal === 'admin'" class="bg-slate-50 border border-slate-200 text-slate-600 px-3.5 py-2.5 rounded-lg text-xs">
          Authorized hostel wardens only. Sign in with your provisioned administrator credentials.
        </div>

        <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              {{ selectedPortal === 'admin' ? 'Warden Email' : 'College Email' }}
            </label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {{ loading ? 'Signing in...' : (selectedPortal === 'admin' ? 'Sign In as Warden' : 'Sign In') }}
          </button>
        </form>

        <p *ngIf="selectedPortal === 'student'" class="text-center text-sm text-slate-600">
          New hostel resident?
          <a routerLink="/register" class="text-indigo-600 font-semibold hover:underline">Create an account</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  selectedPortal: 'student' | 'admin' = 'student';
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  switchPortal(portal: 'student' | 'admin'): void {
    this.selectedPortal = portal;
    this.errorMessage = '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.loading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (user) => {
        this.loading = false;

        if (this.selectedPortal === 'admin' && user.role !== 'admin') {
          this.auth.logout();
          this.errorMessage = 'Access denied: This account does not have Warden privileges.';
          this.cdr.detectChanges();
          return;
        }

        if (this.selectedPortal === 'student' && user.role === 'admin') {
          this.auth.logout();
          this.errorMessage = 'Please switch to the Warden / Admin tab to sign in with an administrator account.';
          this.cdr.detectChanges();
          return;
        }

        this.cdr.detectChanges();
        if (user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/student']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Check your credentials.';
        this.cdr.detectChanges();
      },
    });
  }
}