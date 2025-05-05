import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { authState } from 'rxfire/auth';
import { inject } from '@angular/core';
import { signOut } from 'firebase/auth';
import { filter } from 'rxjs/operators'; // ✅ For filtering NavigationEnd

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'roadsafe-website';
  loggedIn = false;
  breadcrumb = 'Home';
  showHomeLink = false; // ✅ Keep it here

  private auth = inject(Auth);
  private router = inject(Router);

  constructor() {
    // Listen to auth state
    authState(this.auth).subscribe(user => {
      this.loggedIn = !!user;
      if (!user && this.router.url !== '/login') {
        this.router.navigate(['/login']);
      }
    });

    // Listen to router NavigationEnd events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumb();
      });
  }

  // Update breadcrumb based on URL
  updateBreadcrumb() {
    const currentUrl = this.router.url;
    if (currentUrl.startsWith('/logs')) {
      this.breadcrumb = 'Logs';
      this.showHomeLink = true;
    } else if (currentUrl.startsWith('/map')) {
      this.breadcrumb = 'Map';
      this.showHomeLink = true;
    } else {
      this.breadcrumb = 'Home';
      this.showHomeLink = false;
    }
  }

  // Navigate to Home
  goHome() {
    this.router.navigateByUrl('/');
  }

  // Logout the user
  logout() {
    signOut(this.auth).then(() => {
      this.loggedIn = false;
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error('Logout error', error);
    });
  }
}
