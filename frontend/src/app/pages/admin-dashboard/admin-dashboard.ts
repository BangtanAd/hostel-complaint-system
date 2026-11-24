import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ComplaintService } from '../../services/complaint.service';
import { AppNotification, Complaint, ComplaintStats, User } from '../../models/types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Admin Navbar -->
      <nav class="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="bg-indigo-600 px-2.5 py-1 rounded-lg font-bold text-sm">HC</span>
            <div>
              <h1 class="font-bold text-lg leading-tight">HostelCare Warden Console</h1>
              <p class="text-xs text-slate-400">Administration & Analytics</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <!-- Export CSV Report -->
            <button
              (click)="exportCsv()"
              class="inline-flex px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold transition"
            >
              Export CSV
            </button>

            <!-- Notifications -->
            <div class="relative">
              <button
                (click)="showNotifications = !showNotifications"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition"
              >
                Alerts
                <span *ngIf="unreadCount > 0" class="ml-1 px-1.5 py-0.5 bg-rose-500 rounded-full text-white">
                  {{ unreadCount }}
                </span>
              </button>
              <div
                *ngIf="showNotifications"
                class="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 z-40 overflow-hidden"
              >
                <div class="px-4 py-2 bg-slate-100 flex justify-between items-center border-b">
                  <span class="text-xs font-bold uppercase text-slate-600">Recent Alerts</span>
                  <button (click)="markAllRead()" class="text-xs text-indigo-600 hover:underline">
                    Mark all read
                  </button>
                </div>
                <div class="max-h-64 overflow-y-auto divide-y">
                  <div *ngIf="notifications.length === 0" class="p-4 text-xs text-slate-500 text-center">
                    No alerts yet.
                  </div>
                  <div
                    *ngFor="let n of notifications"
                    (click)="markOneRead(n)"
                    [class.bg-indigo-50]="!n.isRead"
                    class="p-3 text-xs cursor-pointer hover:bg-slate-50 transition"
                  >
                    <p class="font-medium text-slate-800">{{ n.message }}</p>
                    <span class="text-[11px] text-slate-400">{{ n.createdAt | date:'short' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <span class="hidden md:inline text-sm font-medium text-slate-300">{{ admin?.name }}</span>
            <button
              (click)="auth.logout()"
              class="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <!-- Statistics Summary Cards -->
        <section *ngIf="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p class="text-xs font-semibold text-slate-500 uppercase">Total Complaints</p>
            <p class="text-3xl font-extrabold text-slate-900 mt-1">{{ stats.summary.total }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
            <p class="text-xs font-semibold text-blue-600 uppercase">Submitted</p>
            <p class="text-3xl font-extrabold text-blue-700 mt-1">{{ stats.summary.submitted }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
            <p class="text-xs font-semibold text-amber-600 uppercase">In Progress</p>
            <p class="text-3xl font-extrabold text-amber-700 mt-1">{{ stats.summary.inProgress }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
            <p class="text-xs font-semibold text-emerald-600 uppercase">Resolved</p>
            <p class="text-3xl font-extrabold text-emerald-700 mt-1">{{ stats.summary.resolved }}</p>
          </div>
        </section>

        <!-- Category Report Breakdown -->
        <section *ngIf="stats && stats.byCategory.length > 0" class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 class="text-sm font-bold uppercase text-slate-700 mb-4">Complaints by Category</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div *ngFor="let cat of stats.byCategory" class="space-y-1.5">
              <div class="flex justify-between text-xs font-semibold">
                <span>{{ cat._id }}</span>
                <span class="text-indigo-600">{{ cat.count }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div
                  class="bg-indigo-600 h-2 rounded-full"
                  [style.width.%]="(cat.count / (stats.summary.total || 1)) * 100"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Filter, Date-Range & Search Controls -->
        <section class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div class="flex flex-wrap gap-3 items-center justify-between">
            <div class="flex flex-wrap gap-3 items-center">
              <select
                [(ngModel)]="filterStatus"
                (ngModelChange)="applyFilters()"
                class="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                [(ngModel)]="filterCategory"
                (ngModelChange)="applyFilters()"
                class="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
              >
                <option value="All">All Categories</option>
                <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
              </select>

              <!-- Date-Wise Report Filter -->
              <div class="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <label class="font-semibold">From:</label>
                <input
                  type="date"
                  [(ngModel)]="dateFrom"
                  (ngModelChange)="applyFilters()"
                  class="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg bg-white outline-none"
                />
                <label class="font-semibold">To:</label>
                <input
                  type="date"
                  [(ngModel)]="dateTo"
                  (ngModelChange)="applyFilters()"
                  class="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg bg-white outline-none"
                />
              </div>
            </div>

            <div class="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                [(ngModel)]="searchText"
                (ngModelChange)="applyFilters()"
                placeholder="Search ID (HC-...), student, title..."
                class="px-3.5 py-2 text-sm border border-slate-300 rounded-lg w-full sm:w-64 outline-none"
              />
              <button
                *ngIf="hasActiveFilters"
                type="button"
                (click)="resetFilters()"
                class="px-3.5 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-300 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <!-- Complaints Management List -->
        <section class="space-y-4">
          <div class="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>Showing {{ filteredComplaints.length }} of {{ complaints.length }} complaint(s)</span>
            <span *ngIf="hasActiveFilters" class="text-indigo-600 font-semibold">Filters active</span>
          </div>

          <div *ngIf="filteredComplaints.length === 0" class="bg-white p-10 rounded-2xl border text-center text-slate-500 text-sm space-y-2">
            <p>No complaints match the current filter.</p>
            <button
              *ngIf="hasActiveFilters"
              type="button"
              (click)="resetFilters()"
              class="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>

          <div
            *ngFor="let item of filteredComplaints"
            class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <!-- Left 2 Columns: Complaint Details -->
            <div class="lg:col-span-2 space-y-2.5">
              <div class="flex flex-wrap items-center gap-2">
                <!-- Unique Tracking ID Badge -->
                <span class="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-slate-900 text-white">
                  {{ getDisplayId(item) }}
                </span>
                <span class="px-2.5 py-0.5 text-xs font-bold rounded bg-indigo-50 text-indigo-700">
                  {{ item.category }}
                </span>
                <span
                  [ngClass]="{
                    'bg-rose-100 text-rose-700': item.priority === 'High',
                    'bg-amber-100 text-amber-700': item.priority === 'Medium',
                    'bg-slate-100 text-slate-600': item.priority === 'Low'
                  }"
                  class="px-2 py-0.5 text-xs font-semibold rounded"
                >
                  {{ item.priority }}
                </span>
                <span class="text-xs text-slate-500 font-medium">
                  — {{ item.student?.name }} ({{ item.student?.rollNumber }}) —
                  <strong>{{ item.student?.hostelBlock }}, Room {{ item.student?.roomNumber }}</strong>
                </span>
              </div>

              <h3 class="text-lg font-bold text-slate-900">{{ item.title }}</h3>
              <p class="text-sm text-slate-600">{{ item.description }}</p>

              <!-- Student Feedback Rating Display (if rated) -->
              <div *ngIf="item.feedback?.rating" class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-emerald-900">Student Resolution Rating:</span>
                  <span class="text-amber-500 font-bold text-sm">
                    {{ '★'.repeat(item.feedback!.rating) }}<span class="text-slate-300">{{ '★'.repeat(5 - item.feedback!.rating) }}</span>
                    <span class="text-slate-700 text-xs ml-1">({{ item.feedback!.rating }}/5)</span>
                  </span>
                </div>
                <p *ngIf="item.feedback?.comment" class="text-slate-700 mt-1 italic">"{{ item.feedback!.comment }}"</p>
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

              <p class="text-xs text-slate-400">Logged on {{ item.createdAt | date:'medium' }}</p>
            </div>

            <!-- Right Column: Warden Action Box -->
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  [(ngModel)]="item.status"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Resolution / Warden Note</label>
                <textarea
                  [(ngModel)]="item.adminNote"
                  rows="2"
                  placeholder="Write note for the student..."
                  class="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                ></textarea>
              </div>

              <button
                (click)="saveUpdate(item)"
                class="w-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-lg transition"
              >
                Save & Notify Student
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  admin: User | null = null;
  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];
  stats: ComplaintStats | null = null;
  notifications: AppNotification[] = [];
  showNotifications = false;

  categories = ['Water', 'Electricity', 'Wi-Fi', 'Maintenance', 'Cleanliness', 'Furniture', 'Other'];
  filterStatus = 'All';
  filterCategory = 'All';
  searchText = '';
  dateFrom = '';
  dateTo = '';

  constructor(
    public auth: AuthService,
    private complaintService: ComplaintService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.admin = this.auth.getCurrentUser();
    this.refreshAll();
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  get hasActiveFilters(): boolean {
    return (
      this.filterStatus !== 'All' ||
      this.filterCategory !== 'All' ||
      this.searchText.trim() !== '' ||
      this.dateFrom !== '' ||
      this.dateTo !== ''
    );
  }

  getDisplayId(item: Complaint): string {
    return item.complaintId || `HC-${item._id.slice(-6).toUpperCase()}`;
  }

  refreshAll(): void {
    this.loadComplaints();
    this.complaintService.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.cdr.detectChanges();
      },
    });
    this.complaintService.getNotifications().subscribe({
      next: (n) => {
        this.notifications = n;
        this.cdr.detectChanges();
      },
    });
  }

  loadComplaints(): void {
    this.complaintService.getAllComplaints().subscribe({
      next: (data) => {
        this.complaints = data;
        this.applyFilters();
      },
    });
  }

  applyFilters(): void {
    const query = this.searchText.trim().toLowerCase();

    this.filteredComplaints = this.complaints.filter((c) => {
      if (this.filterStatus !== 'All' && c.status !== this.filterStatus) {
        return false;
      }

      if (this.filterCategory !== 'All' && c.category !== this.filterCategory) {
        return false;
      }

      if (query) {
        const displayId = this.getDisplayId(c).toLowerCase();
        const title = (c.title || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const studentName = (c.student?.name || '').toLowerCase();
        const rollNumber = (c.student?.rollNumber || '').toLowerCase();
        const room = (c.student?.roomNumber || '').toLowerCase();

        const matchesSearch =
          displayId.includes(query) ||
          title.includes(query) ||
          desc.includes(query) ||
          studentName.includes(query) ||
          rollNumber.includes(query) ||
          room.includes(query);

        if (!matchesSearch) return false;
      }

      const created = new Date(c.createdAt).getTime();
      if (this.dateFrom) {
        const fromTime = new Date(this.dateFrom + 'T00:00:00').getTime();
        if (created < fromTime) return false;
      }
      if (this.dateTo) {
        const toTime = new Date(this.dateTo + 'T23:59:59').getTime();
        if (created > toTime) return false;
      }

      return true;
    });

    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.filterStatus = 'All';
    this.filterCategory = 'All';
    this.searchText = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  saveUpdate(item: Complaint): void {
    this.complaintService
      .updateComplaint(item._id, {
        status: item.status,
        adminNote: item.adminNote,
      })
      .subscribe({
        next: () => {
          alert(`Updated "${item.title}" to ${item.status} and notified ${item.student?.name}!`); this.refreshAll(); }, error: (err) => { alert(err.error?.message \vert{}\vert{} 'Failed to update complaint.'); this.refreshAll(); }, }); }  exportCsv(): void { if (this.filteredComplaints.length === 0) { alert('No complaints to export.'); return; } const headers = [ 'Tracking ID', 'Title', 'Category', 'Priority', 'Status', 'Student', 'Roll No', 'Block', 'Room', 'Warden Note', 'Student Rating', 'Created At', ]; const rows = this.filteredComplaints.map((c) => [ this.getDisplayId(c), `"${(c.title || '').replace(/"/g