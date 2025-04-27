import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { NgxGaugeModule } from 'ngx-gauge';

import * as L from 'leaflet';
import { Router } from '@angular/router';

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
  address?: string;  // Add the address property here
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxGaugeModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  latestConfidence: number = 0; // Variable to store the latest confidence value
  address: string = '';
  tableData: TableDataItem[] = [];
  selectedSort: string = '';
  uniqueUserCount: number = 0;
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  todayCount: number = 0; // New variable for today’s count

  constructor(
    private firestoreService: FirestoreService, private router: Router) {}

  ngOnInit(): void {
    this.loadTableData();
    this.loadUniqueUserCount();
    this.loadTodayCount(); // Load the count for today
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private loadUniqueUserCount(): void {
    this.firestoreService.getUniqueUserCount().subscribe({
      next: (count) => {
        this.uniqueUserCount = count;
      },
      error: (err) => {
        console.error('Error fetching unique user count:', err);
      }
    });
  }

  private loadTodayCount(): void {
    this.firestoreService.getTodayCount().subscribe({
      next: (count) => {
        this.todayCount = count;
      },
      error: (err) => {
        console.error('Error fetching today count:', err);
      }
    });
  }

  latestAddress: string = ''; // Add this to your component class

  private loadTableData(): void {
    this.firestoreService.getTableData().subscribe({
      next: (data: any[]) => {
        this.tableData = data;
        this.sortTableData();
        this.showAllMarkers();

        // Sort by timestamp and update latestConfidence
        if (this.tableData.length > 0) {
          const latestItem = this.tableData.reduce((a, b) =>
            new Date(a.readableDate).getTime() > new Date(b.readableDate).getTime() ? a : b
          );

          // Get the latest confidence value and convert it to percentage with one decimal
          this.latestConfidence = parseFloat((latestItem.confidence * 100).toFixed(1)); // Convert to percentage with 1 decimal

          // Get address for latest item
          this.firestoreService.getAddressFromCoordinates(
            latestItem.location.latitude,
            latestItem.location.longitude
          ).subscribe({
            next: (address) => {
              this.latestAddress = address?.place_name || 'Unknown Location';
            },
            error: () => {
              this.latestAddress = 'Unknown Location';
            }
          });
        }
      },
      error: (err) => console.error('Error loading data:', err)
    });
  }
  

  sortTableData(): void {
    switch (this.selectedSort) {
      case 'confidence':
        this.tableData.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'date':
        this.tableData.sort((a, b) => new Date(b.readableDate).getTime() - new Date(a.readableDate).getTime());
        break;
      case 'prediction':
        this.tableData.sort((a, b) => b.prediction.localeCompare(a.prediction));
        break;
      default:
        break;
    }

    this.showAllMarkers(); // Re-render markers to match sorted data
  }

  getRowCount(): number {
    return this.tableData.length;
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
  
        // Fetch the address from Mapbox and store it in tableData
        this.firestoreService.getAddressFromCoordinates(item.location.latitude, item.location.longitude)
          .subscribe({
            next: (address) => {
              const locationName = address ? address.place_name : 'Address not available';
              item.address = locationName; // Store address directly in item
              marker.bindPopup(this.createPopupContent(item, locationName));
            },
            error: (err) => {
              console.error('Error fetching address:', err);
              item.address = 'Address not available'; // Fallback address
              marker.bindPopup(this.createPopupContent(item, 'Address not available'));
            }
          });
  
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
    this.map.setView(targetLatLng, 15);

    const matchingMarker = this.markers.find(marker => {
      const latLng = marker.getLatLng();
      return latLng.lat === item.location.latitude && latLng.lng === item.location.longitude;
    });

    if (matchingMarker) {
      matchingMarker.openPopup();
    }
  }

  private createPopupContent(item: TableDataItem, address: string): string {
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
            <b>Date:</b> ${new Date(item.readableDate).toLocaleString()}<br>
            <b>Address:</b> ${address}
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

  navigateToLogs() {
    this.router.navigate(['logs']);
  }
  
}
