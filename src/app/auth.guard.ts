import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { authState } from 'rxfire/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    map(user => {
      if (user) {
        return true;
      } else {
        router.navigate(['/login']); // Redirect to login if not authenticated
        return false;
      }
    })
  );
};
