import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.startImageRotation();
  }

  ngOnDestroy() {
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
    }
  }

  startImageRotation() {
    // Ensuring image rotation even with two images
    this.imageInterval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      this.currentImage = this.images[this.currentImageIndex];
      console.log('Current Image:', this.currentImage); // Debugging to ensure the image updates
    }, 3000); // Change image every 5 seconds
  }

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        console.log('Logged in!', res);
        this.router.navigateByUrl('/'); // Navigate to HomeComponent (root path)
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
