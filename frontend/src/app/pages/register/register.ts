import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-8">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-5">
        <div class="text-center space-y-1">
          <h1 class="text-2xl font-bold text-slate-900">Student Registration</h1>
          <p class="text-sm text-slate-500">Register your hostel room details to submit & track issues</p>
        </div>

        <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onRegister()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                [(ngModel)]="form.name"
                name="name"
                required
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Roll Number</label>
              <input
                type="text"
                [(ngModel)]="form.rollNumber"
                name="rollNumber"
                required
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">College Email</label>
            <input
              type="email"
              [(ngModel)]="form.email"
              name="email"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Hostel Block</label>
              <select
                [(ngModel)]="form.hostelBlock"
                name="hostelBlock"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
              >
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Girls Hostel 1">Girls Hostel 1</option>
                <option value="Girls Hostel 2">Girls Hostel 2</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
              <input
                type="text"
                [(ngModel)]="form.roomNumber"
                name="roomNumber"
                required
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Password (min 6 chars)</label>
            <input
              type="password"
              [(ngModel)]="form.password"
              name="password"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {{ loading ? 'Creating Account...' : 'Create Student Account' }}
          </button>
        </form>

        <p class="text-center text-sm text-slate-600">
          Already have an account?
          <a routerLink="/login" class="text-indigo-600 font-semibold hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  form = {
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    hostelBlock: 'Block A',
    roomNumber: '',
  };
  errorMessage = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onRegister(): void {
    this.errorMessage = '';
    if (!this.form.name || !this.form.email || !this.form.password || !this.form.rollNumber || !this.form.roomNumber) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.loading = true;
    this.auth.register(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/student']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed.';
        this.cdr.detectChanges();
      },
    });
  }
}