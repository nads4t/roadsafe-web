import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';
import { FirestoreService } from '../firestore.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  private map: L.Map | null = null;
  private mapMarkers: L.Marker[] = [];

  searchQuery: string = '';
  searchResults: any[] = [];
  selectedAddress: string = '';

  isFilterOpen = false;
  allPins: any[] = [];
  filteredPins: any[] = [];
  selectedStatuses: string[] = [];
  statuses: string[] = [];

  constructor(private firestoreService: FirestoreService) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  private initMap(): void {
    this.map = L.map('map').setView([13.1480, 123.7132], 14);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=8e1c78a8-fb4b-41c8-82f1-efb4b8fbcdb8', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors & Stadia Maps',
    }).addTo(this.map);

    this.addLegendControl();
    this.map.zoomControl.setPosition('bottomright');

    this.firestoreService.getTableData().subscribe((detections: any[]) => {
      this.allPins = detections;
      this.statuses = [...new Set(detections.map(item => item.status).filter(Boolean))];
      this.selectedStatuses = [...this.statuses]; // Check all statuses by default
      
      

      // Initialize selectedStatuses with all statuses only once
      if (this.selectedStatuses.length === 0) {
        this.selectedStatuses = [...this.statuses];
      }

      this.filterPinsByStatus(); // Apply filter immediately
    });
  }

  private updateMapMarkers(): void {
    this.mapMarkers.forEach(marker => this.map?.removeLayer(marker));
    this.mapMarkers = [];

    this.filteredPins.forEach(item => {
      const location = item.location;
      if (location?.latitude && location?.longitude) {
        const latLng: [number, number] = [location.latitude, location.longitude];
        const status = item.status ?? 'unassigned';

        let markerIcon: L.Icon;
        switch (status) {
          case 'repair-underway':
            markerIcon = L.icon({ iconUrl: 'assets/marker-icon-orange.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
            break;
          case 'awaiting-repair':
            markerIcon = L.icon({ iconUrl: 'assets/marker-icon-yellow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
            break;
          case 'fixed':
            markerIcon = L.icon({ iconUrl: 'assets/marker-icon-green.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
            break;
          default:
            markerIcon = L.icon({ iconUrl: 'assets/marker-icon-blue.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
        }

        const marker = L.marker(latLng, { icon: markerIcon })
          .addTo(this.map!)
          .bindPopup(`
            <strong>Status:</strong> ${status}<br>
            <strong>Date:</strong> ${item.readableDate?.toLocaleString() || ''}
          `);

        this.mapMarkers.push(marker);
      }
    });
  }

  private addLegendControl(): void {
    const legend = new L.Control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '11px';
      div.style.borderRadius = '5000px';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'space-evenly';

      div.innerHTML = `
        <div style="display: flex; align-items: center; margin-right: 10px;">
          <span style="background-color: orange; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px;"></span> Repair Underway
        </div>
        <div style="display: flex; align-items: center; margin-right: 10px;">
          <span style="background-color: yellow; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px;"></span> Awaiting Repair
        </div>
        <div style="display: flex; align-items: center; margin-right: 10px;">
          <span style="background-color: green; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px;"></span> Fixed
        </div>
        <div style="display: flex; align-items: center; margin-right: 10px;">
          <span style="background-color: blue; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px;"></span> Unassigned
        </div>
      `;
      return div;
    };

    this.map?.addControl(legend);
  }

  onSearchInput(): void {
    if (this.searchQuery.length > 2) {
      this.firestoreService.getAddressSuggestions(this.searchQuery).subscribe(results => {
        this.searchResults = results;
      });
    } else {
      this.searchResults = [];
    }
  }

  onSelectAddress(address: any): void {
    this.selectedAddress = address.place_name;
    const [longitude, latitude] = address.center;
    this.map?.setView([latitude, longitude], 14);
    L.marker([latitude, longitude]).addTo(this.map!).bindPopup(address.place_name).openPopup();
    this.searchResults = [];
    this.searchQuery = '';
  }

  toggleFilterPopup(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onStatusFilterChange(status: string, event: any): void {
    const checked = event.target.checked;
  
    if (checked) {
      // Add status to the selectedStatuses array if it's not already included
      if (!this.selectedStatuses.includes(status)) {
        this.selectedStatuses.push(status);
      }
    } else {
      // Remove status from the selectedStatuses array if unchecked
      this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
    }
  
    this.filterPinsByStatus(); // Reapply the filter after selection
  }

  filterPinsByStatus(): void {
    if (this.selectedStatuses.length === 0) {
      // If no statuses are selected, show all pins (including 'unassigned')
      this.filteredPins = [...this.allPins];
    } else {
      this.filteredPins = this.allPins.filter(item => {
        const status = item.status ?? 'unassigned';
        return this.selectedStatuses.includes(status);
      });
    }
  
    this.updateMapMarkers();
  }
}
