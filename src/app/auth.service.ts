import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { from, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth) {}

  // Login method
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      // After successful login, we store the login status in localStorage
      tap(() => {
        localStorage.setItem('isLoggedIn', 'true');
      })
    );
  }

  // Register method
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  // Logout method
  logout(): Observable<void> {
  // Clear the login status in localStorage when logging out
  localStorage.removeItem('isLoggedIn');
  return from(signOut(this.auth));
}


  // Get current user (Firebase Auth method)
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Check if the user is logged in
  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}
