import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { adminGuard, studentGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'student', component: StudentDashboardComponent, canActivate: [studentGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: 'login' },
];