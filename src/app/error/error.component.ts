import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error',
  imports: [],
  templateUrl: './error.component.html',
  styleUrl: './error.component.css'
})
export class ErrorComponent {


  constructor(private router: Router) {}


 goHome() {
    this.router.navigate(['/']); // Adjust the path as needed
  }

}
