import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private mapboxAccessToken = 'pk.eyJ1IjoiZ290dGFzYWRhZSIsImEiOiJjbTY3d3oydTkwN2wzMmxvZm1rMzlsbjB4In0.9tJ1I4Vx-3-YMTUvUcLIMA'; // Replace with your Mapbox API key

  constructor(private http: HttpClient) {}

  // Function to get address from coordinates using Mapbox API
  getAddressFromCoordinates(latitude: number, longitude: number): Observable<any> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.mapboxAccessToken}`;
    return this.http.get<any>(url);
  }
}
