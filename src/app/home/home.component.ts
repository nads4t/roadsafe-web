import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

interface TableDataItem {
  image: string;
  confidence: number;
  readableDate: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  prediction: string;
  timestamp?: any;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  tableData: TableDataItem[] = [];
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.loadTableData();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private loadTableData(): void {
    this.firestoreService.getTableData().subscribe({
      next: (data: any[]) => {
        this.tableData = data.map(item => ({
          ...item,
          readableDate: this.convertTimestamp(item.timestamp)
        }));
        this.showAllMarkers();
      },
      error: (err) => console.error('Error loading data:', err)
    });
  }

  getRowCount(): number {
    return this.tableData.length;
  }

  private convertTimestamp(timestamp: any): Date {
    return timestamp?.toDate ? timestamp.toDate() : new Date();
  }

  private initMap(): void {
    this.fixLeafletMarkerIcons();

    this.map = L.map('map').setView([13.1480, 123.7132], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }

  private fixLeafletMarkerIcons(): void {
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';

    if (typeof window !== 'undefined') {
      const iconDefault = L.Icon.Default.prototype as any;
      if (iconDefault._getIconUrl) {
        delete iconDefault._getIconUrl;
      }

      L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        shadowAnchor: [14, 41]
      });
    }
  }

  private showAllMarkers(): void {
    if (!this.map) return;

    this.clearMarkers();

    for (const item of this.tableData) {
      if (item.location && typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number') {
        const latLng = L.latLng(item.location.latitude, item.location.longitude);
        const marker = L.marker(latLng, {
          icon: new L.Icon.Default()
        }).addTo(this.map);

        marker.bindPopup(this.createPopupContent(item));
        this.markers.push(marker);
      }
    }

    if (this.markers.length) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
  }

  formatLocation(location: { latitude: number, longitude: number } | undefined): string {
    if (!location) return 'No location';
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }

  showLocationOnMap(item: TableDataItem): void {
    if (!this.map || !item?.location) return;
  
    const targetLatLng = L.latLng(item.location.latitude, item.location.longitude);
    this.map.setView(targetLatLng, 15); // Recenter and zoom
  
    // Find the existing marker for this item and open its popup
    const matchingMarker = this.markers.find(marker => {
      const latLng = marker.getLatLng();
      return latLng.lat === item.location.latitude && latLng.lng === item.location.longitude;
    });
  
    if (matchingMarker) {
      matchingMarker.openPopup();
    }
  }
  
  

  private createPopupContent(item: TableDataItem): string {
    return `
      <div class="leaflet-popup-content-wrapper">
        <div class="leaflet-popup-content">
          <div style="text-align: center;">
            <img src="${item.image}" alt="Damage Image" 
                 style="max-width: 200px; max-height: 150px; border-radius: 4px; margin-bottom: 8px;">
          </div>
          <div style="margin-top: 8px;">
            <b>Prediction:</b> ${item.prediction}<br>
            <b>Confidence:</b> ${item.confidence}<br>
            <b>Date:</b> ${new Date(item.readableDate).toLocaleString()}
          </div>
        </div>
      </div>
    `;
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => {
      this.map?.removeLayer(marker);
    });
    this.markers = [];
  }
}
