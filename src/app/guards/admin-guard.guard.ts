import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuardGuard: CanActivateFn = (route, state) => {
  const rol = localStorage.getItem('rol');

  // Eğer giriş yapılmamışsa login sayfasına yönlendir
  if (!rol) {
    const router = inject(Router);
    router.navigate(['/login']);
    return false;
  }

  // Sadece "Admin" veya "Kullanici" olan giriş yapmışsa izin ver
  return rol === 'Admin' || rol === 'Kullanici';
};
