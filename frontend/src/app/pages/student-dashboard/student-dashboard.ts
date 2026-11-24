import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ComplaintService } from '../../services/complaint.service';
import { AppNotification, Complaint, User } from '../../models/types';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Top Navigation Bar -->
      <nav class="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div class="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="bg-indigo-600 px-2.5 py-1 rounded-lg font-bold text-sm">HC</span>
            <div>
              <h1 class="font-bold text-lg leading-tight">HostelCare</h1>
              <p class="text-xs text-slate-400">Student Resident Portal</p>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Notification Bell -->
            <div class="relative">
              <button
                (click)="toggleNotifications()"
                class="relative px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                title="Notifications"
              >
                <span class="text-xs font-semibold">Alerts</span>
                <span
                  *ngIf="unreadCount > 0"
                  class="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full"
                >
                  {{ unreadCount }}
                </span>
              </button>

              <!-- Dropdown -->
              <div
                *ngIf="showNotifications"
                class="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-40"
              >
                <div class="px-4 py-2.5 bg-slate-100 flex justify-between items-center border-b">
                  <span class="text-xs font-bold uppercase text-slate-600">Notifications</span>
                  <button
                    *ngIf="unreadCount > 0"
                    (click)="markAllRead()"
                    class="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                </div>
                <div class="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  <div *ngIf="notifications.length === 0" class="p-4 text-xs text-slate-500 text-center">
                    No notifications yet.
                  </div>
                  <div
                    *ngFor="let n of notifications"
                    (click)="markOneRead(n)"
                    [class.bg-indigo-50]="!n.isRead"
                    class="p-3 text-xs cursor-pointer hover:bg-slate-50 transition"
                  >
                    <p class="text-slate-800 font-medium">{{ n.message }}</p>
                    <span class="text-[11px] text-slate-400 mt-1 block">
                      {{ n.createdAt | date:'short' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="hidden sm:block text-right">
              <p class="text-sm font-semibold">{{ user?.name }}</p>
              <p class="text-xs text-slate-400">{{ user?.hostelBlock }} • Room {{ user?.roomNumber }}</p>
            </div>

            <button
              (click)="auth.logout()"
              class="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content Grid -->
      <main class="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Resident Card & Submit Complaint -->
        <section class="lg:col-span-1 space-y-5">
          <!-- Resident ID Badge -->
          <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-2xl p-5 shadow-sm">
            <p class="text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">Resident Profile</p>
            <h2 class="text-lg font-bold mt-0.5">{{ user?.name }}</h2>
            <p class="text-xs text-indigo-100 mt-1">Roll No: {{ user?.rollNumber }}</p>
            <div class="mt-3 pt-3 border-t border-indigo-500/40 flex justify-between text-xs font-medium">
              <span>{{ user?.hostelBlock }}</span>
              <span>Room {{ user?.roomNumber }}</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Report an Issue</h2>
              <p class="text-xs text-slate-500">Submit a maintenance or facility request.</p>
            </div>

            <div *ngIf="successMsg" class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2.5 rounded-lg text-xs font-medium">
              {{ successMsg }}
            </div>
            <div *ngIf="errorMsg" class="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-lg text-xs font-medium">
              {{ errorMsg }}
            </div>

            <form (ngSubmit)="submitComplaint()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  [(ngModel)]="form.title"
                  name="title"
                  required
                  placeholder="e.g., Ceiling fan making noise"
                  class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    [(ngModel)]="form.category"
                    name="category"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    [(ngModel)]="form.priority"
                    name="priority"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  [(ngModel)]="form.description"
                  name="description"
                  rows="4"
                  required
                  placeholder="Describe the issue clearly so maintenance can fix it fast..."
                  class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                [disabled]="submitting"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm shadow transition disabled:opacity-50"
              >
                {{ submitting ? 'Submitting...' : 'Submit Complaint' }}
              </button>
            </form>
          </div>
        </section>

        <!-- Right Column: My Complaints Tracker -->
        <section class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-900">My Complaints ({{ complaints.length }})</h2>
            <button
              (click)="loadData()"
              class="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Refresh Status
            </button>
          </div>

          <div *ngIf="complaints.length === 0" class="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
            You haven't submitted any complaints yet.
          </div>

          <div
            *ngFor="let item of complaints"
            class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3 hover:border-indigo-200 transition"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Unique Tracking ID Badge -->
                  <span class="px-2.5 py-0.5 text-xs font-mono font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {{ item.complaintId || ('HC-' + item._id.slice(-6).toUpperCase()) }}
                  </span>
                  <span class="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
                    {{ item.category }}
                  </span>
                  <span
                    [ngClass]="{
                      'bg-rose-100 text-rose-700': item.priority === 'High',
                      'bg-amber-100 text-amber-700': item.priority === 'Medium',
                      'bg-slate-100 text-slate-600': item.priority === 'Low'
                    }"
                    class="px-2 py-0.5 text-xs font-semibold rounded-md"
                  >
                    {{ item.priority }} Priority
                  </span>
                </div>
                <h3 class="text-base font-bold text-slate-900 mt-1.5">{{ item.title }}</h3>
              </div>

              <div class="flex items-center space-x-2">
                <span
                  [ngClass]="{
                    'bg-blue-100 text-blue-800': item.status === 'Submitted',
                    'bg-amber-100 text-amber-800': item.status === 'In Progress',
                    'bg-emerald-100 text-emerald-800': item.status === 'Resolved'
                  }"
                  class="px-3 py-1 text-xs font-bold rounded-full"
                >
                  {{ item.status }}
                </span>

                <button
                  *ngIf="item.status === 'Submitted'"
                  (click)="cancelComplaint(item._id)"
                  class="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                  title="Cancel this complaint"
                >
                  Cancel
                </button>
              </div>
            </div>

            <p class="text-sm text-slate-600 leading-relaxed">{{ item.description }}</p>

            <!-- Warden Resolution Note -->
            <div *ngIf="item.adminNote" class="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r-lg">
              <p class="text-xs font-bold text-indigo-900">Warden Resolution Note:</p>
              <p class="text-xs text-indigo-800 mt-0.5">{{ item.adminNote }}</p>
            </div>

            <!-- Status History Timeline -->
            <div *ngIf="item.history?.length" class="pt-2 border-t border-slate-100 text-xs">
              <details>
                <summary class="cursor-pointer font-semibold text-slate-700 hover:text-indigo-600 select-none">
                  Status History ({{ item.history!.length }})
                </summary>
                <ol class="mt-2 ml-2 border-l-2 border-indigo-200 pl-3 space-y-2">
                  <li *ngFor="let h of item.history">
                    <span class="font-bold text-slate-800">{{ h.status }}</span>
                    <span class="text-slate-400 ml-1">• {{ h.timestamp | date:'short' }}</span>
                    <p *ngIf="h.note" class="text-slate-600 mt-0.5">{{ h.note }}</p>
                  </li>
                </ol>
              </details>
            </div>

            <!-- Student Resolution Feedback (Shown when Resolved) -->
            <div *ngIf="item.status === 'Resolved'" class="pt-3 border-t border-slate-100">
              <!-- Submitted Feedback Display -->
              <div *ngIf="item.feedback?.rating" class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-emerald-900">Your Resolution Rating:</span>
                  <span class="text-amber-500 font-bold text-sm">
                    {{ '★'.repeat(item.feedback!.rating) }}<span class="text-slate-300">{{ '★'.repeat(5 - item.feedback!.rating) }}</span>
                    <span class="text-slate-700 text-xs ml-1">({{ item.feedback!.rating }}/5)</span>
                  </span>
                </div>
                <p *ngIf="item.feedback?.comment" class="text-slate-700 mt-1 italic">"{{ item.feedback!.comment }}"</p>
              </div>

              <!-- Rating Input Form -->
              <div *ngIf="!item.feedback?.rating" class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-700">Rate this resolution:</span>
                  <div class="flex items-center space-x-1">
                    <button
                      type="button"
                      *ngFor="let star of [1, 2, 3, 4, 5]"
                      (click)="setRating(item._id, star)"
                      [ngClass]="(ratingInputs[item._id] || 0) >= star ? 'text-amber-400' : 'text-slate-300'"
                      class="text-xl leading-none hover:scale-110 transition-transform"
                    >
                      ★
                    </button>
                  </div>
                </div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="commentInputs[item._id]"
                    [name]="'comment-' + item._id"
                    placeholder="Optional feedback on the fix..."
                    class="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    (click)="sendFeedback(item)"
                    [disabled]="!ratingInputs[item._id] || submittingFeedback[item._id]"
                    class="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-40"
                  >
                    {{ submittingFeedback[item._id] ? 'Saving...' : 'Submit' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
              <span>Submitted: {{ item.createdAt | date:'medium' }}</span>
              <span *ngIf="item.resolvedAt">Resolved: {{ item.resolvedAt | date:'medium' }}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
})
export class StudentDashboardComponent implements OnInit {
  user: User | null = null;
  complaints: Complaint[] = [];
  notifications: AppNotification[] = [];
  showNotifications = false;

  categories = ['Water', 'Electricity', 'Wi-Fi', 'Maintenance', 'Cleanliness', 'Furniture', 'Other'];
  form = {
    title: '',
    category: 'Wi-Fi',
    priority: 'Medium',
    description: '',
  };

  ratingInputs: { [complaintId: string]: number } = {};
  commentInputs: { [complaintId: string]: string } = {};
  submittingFeedback: { [complaintId: string]: boolean } = {};

  submitting = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    public auth: AuthService,
    private complaintService: ComplaintService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.loadData();
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  loadData(): void {
    this.complaintService.getMyComplaints().subscribe({
      next: (data) => {
        this.complaints = data;
        this.cdr.detectChanges();
      },
    });
    this.complaintService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.cdr.detectChanges();
      },
    });
  }

  submitComplaint(): void {
    this.successMsg = '';
    this.errorMsg = '';
    if (!this.form.title || !this.form.description) {
      this.errorMsg = 'Please enter a title and description.';
      return;
    }

    this.submitting = true;
    this.complaintService.createComplaint(this.form).subscribe({
      next: (created) => {
        this.submitting = false;
        this.complaints.unshift(created);
        this.form = { title: '', category: 'Wi-Fi', priority: 'Medium', description: '' };
        this.successMsg = `Complaint ${created.complaintId} submitted! The hostel warden has been notified.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg = err.error?.message || 'Failed to submit complaint.';
        this.cdr.detectChanges();
      },
    });
  }

  setRating(complaintId: string, stars: number): void {
    this.ratingInputs[complaintId] = stars;
  }

  sendFeedback(item: Complaint): void {
    const rating = this.ratingInputs[item._id];
    if (!rating) return;

    this.submittingFeedback[item._id] = true;
    const comment = this.commentInputs[item._id] || '';

    this.complaintService.submitFeedback(item._id, rating, comment).subscribe({
      next: (updated) => {
        item.feedback = updated.feedback;
        this.submittingFeedback[item._id] = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submittingFeedback[item._id] = false;
        alert(err.error?.message || 'Could not submit feedback.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelComplaint(id: string): void {
    if (!confirm('Cancel and remove this submitted complaint?')) return;
    this.complaintService.deleteComplaint(id).subscribe({
      next: () => {
        this.complaints = this.complaints.filter((c) => c._id !== id);
        this.cdr.detectChanges();
      },
      error: (err) => alert(err.error?.message || 'Could not cancel complaint.'),
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markOneRead(n: AppNotification): void {
    if (!n.isRead) {
      this.complaintService.markAsRead(n._id).subscribe(() => {
        n.isRead = true;
        this.cdr.detectChanges();
      });
    }
  }

  markAllRead(): void {
    this.complaintService.markAllAsRead().subscribe(() => {
      this.notifications.forEach((n) => (n.isRead = true));
      this.cdr.detectChanges();
    });
  }
}