import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard'; // <-- Import the guard!
import { LogsComponent } from './logs/logs.component';
import { MapComponent } from './map/map.component';
import { PublicComponent } from './public/public.component';
import { ErrorComponent } from './error/error.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'logs', component: LogsComponent },
    { path: 'home', component: PublicComponent },
  { path: 'map', component: MapComponent } // <-- 🔒 Protected!
];
