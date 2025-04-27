import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authState } from 'rxfire/auth';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'roadsafe-website';
  loggedIn = false;
  private auth = inject(Auth);
  private router = inject(Router);

  constructor() {
    // Listen to auth state changes and update loggedIn status
    authState(this.auth).subscribe(user => {
      this.loggedIn = !!user;  // Set loggedIn to true if user exists
      if (!user && this.router.url !== '/login') {
        // If user is not logged in and not on login route, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }
}
