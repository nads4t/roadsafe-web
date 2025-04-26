import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard'; // <-- Import the guard!

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] }, // <-- 🔒 Protected!
  { path: 'login', component: LoginComponent }
];
