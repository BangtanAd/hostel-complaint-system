import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

export const studentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.getCurrentUser()?.role;

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (role === 'student') {
    return true;
  }
  router.navigate(['/admin']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.getCurrentUser()?.role;

  if (auth.isLoggedIn() && role === 'admin') {
    return true;
  }
  router.navigate(['/student']);
  return false;
};