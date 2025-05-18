import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';
import { FirestoreService } from '../firestore.service';

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.css']
})
export class PublicComponent implements AfterViewInit {
  private map: L.Map | null = null;
  private mapMarkers: L.Marker[] = [];
  allPins: any[] = [];
  
  constructor(private firestoreService: FirestoreService) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map').setView([13.1480, 123.7132], 14);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=8e1c78a8-fb4b-41c8-82f1-efb4b8fbcdb8', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors & Stadia Maps',
    }).addTo(this.map);

    this.map.zoomControl.setPosition('bottomright');

    this.firestoreService.getTableData().subscribe((pins: any[]) => {
      this.allPins = pins;
      this.updateMapMarkers();
    });
  }

  private updateMapMarkers(): void {
    // Remove old markers
    this.mapMarkers.forEach(marker => this.map?.removeLayer(marker));
    this.mapMarkers = [];

    this.allPins.forEach(item => {
      const location = item.location;
      if (location?.latitude && location?.longitude) {
        const latLng: [number, number] = [location.latitude, location.longitude];

        // Choose icon color based on status
        let markerIcon: L.Icon;
        switch (item.status) {
          case 'repair-underway':
            markerIcon = L.icon({ iconUrl: 'assets/marker-icon-orange.png', iconSize: [25, 41], iconAnchor: [12, 41] });
            break;
          case 'awaiting-repair':
            markerIcon = L.icon({ iconUrl: 'assets/marker-icon-yellow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
            break;
          case 'fixed':
            markerIcon = L.icon({ iconUrl: 'assets/marker-icon-green.png', iconSize: [25, 41], iconAnchor: [12, 41] });
            break;
          default:
            markerIcon = L.icon({ iconUrl: 'assets/marker-icon-blue.png', iconSize: [25, 41], iconAnchor: [12, 41] });
        }

        const marker = L.marker(latLng, { icon: markerIcon }).addTo(this.map!);

        // Popup content, simplified version
        const popupContent = `
          <div>
            <b>Status:</b> ${item.status || 'Unassigned'}<br>
            <b>Prediction:</b> ${item.prediction || 'Unknown'}<br>
            <b>Address:</b> ${item.address || 'N/A'}
          </div>
        `;

        marker.bindPopup(popupContent);
        this.mapMarkers.push(marker);
      }
    });
  }
}
