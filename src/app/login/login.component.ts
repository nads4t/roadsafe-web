import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  errorMessage = '';
  images = [
    'https://i.ibb.co/d0nmPN8q/491217162-475344848938181-5652417650372658418-n.jpg', // Image 1
    'https://i.ibb.co/v2YCTpN/495071536-4152750581681066-331987046933579498-n.jpg',
    'https://i.ibb.co/cK3hD1QF/491217162-475344848938181-5652417650372658418-n.jpg' // Image 2
  ];
  currentImageIndex = 0;
  currentImage = this.images[this.currentImageIndex];
  imageInterval: any;
  isLoggedIn = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.startImageRotation();

    // Check if the user is already logged in when the component initializes
    this.isLoggedIn = this.authService.isLoggedIn();
    
    // Listen for changes to the login status across tabs
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  ngOnDestroy() {
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
    }
    // Clean up the event listener when the component is destroyed
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
  }

  startImageRotation() {
    this.imageInterval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      this.currentImage = this.images[this.currentImageIndex];
      console.log('Current Image:', this.currentImage); // Debugging to ensure the image updates
    }, 3000); // Change image every 3 seconds
  }

  login() {
    if (this.isLoggedIn) {
      this.errorMessage = 'You are already logged in in another tab.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        console.log('Logged in!', res);
        // Set login status in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        this.isLoggedIn = true;
        this.router.navigateByUrl('/'); // Navigate to HomeComponent (root path)
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  private handleStorageChange(event: StorageEvent) {
    // Listen for login status changes across tabs
    if (event.key === 'isLoggedIn') {
      this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (this.isLoggedIn) {
        this.router.navigateByUrl('/'); // Redirect to HomeComponent if already logged in in another tab
      }
    }
  }
}
