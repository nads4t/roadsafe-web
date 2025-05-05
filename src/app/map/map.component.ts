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
  searchQuery: string = '';          // Holds the search input
  searchResults: any[] = [];         // Stores search results
  selectedAddress: string = '';      // Selected address for the map

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
      detections.forEach(item => {
        const location = item.location;
        if (location?.latitude && location?.longitude) {
          const latLng: [number, number] = [location.latitude, location.longitude];
  
          // Define marker icon based on status
          let markerIcon: L.Icon;
          switch (item.status) {
            case 'repair-underway':
              markerIcon = L.icon({
                iconUrl: 'assets/marker-icon-orange.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
              });
              break;
            case 'awaiting-repair':
              markerIcon = L.icon({
                iconUrl: 'assets/marker-icon-yellow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
              });
              break;
            case 'fixed':
              markerIcon = L.icon({
                iconUrl: 'assets/marker-icon-green.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
              });
              break;
            default:
              markerIcon = L.icon({
                iconUrl: 'assets/marker-icon-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
              });
          }
  
          // Add marker with icon and popup
          L.marker(latLng, { icon: markerIcon })
            .addTo(this.map!)
            .bindPopup(`
              <strong>Status:</strong> ${item.status || 'unknown'}<br>
              <strong>Date:</strong> ${item.readableDate?.toLocaleString() || ''}
            `);
        }
      });
    });
  }

  private addLegendControl(): void {
      // Create a new Control instance instead of using L.control()
      const legend = new L.Control({ position: 'bottomleft' });
    
      // Add content to the legend
      legend.onAdd = (map: L.Map) => {
        const div = L.DomUtil.create('div', 'leaflet-legend');
    
        // Apply styles to the legend container
        div.style.backgroundColor = 'white';  // Set background color to white
        div.style.padding = '11px';  // Optional: Add padding for better spacing
        div.style.borderRadius = '5000px';  // Make the border radius circular
        div.style.display = 'flex';  // Use flexbox to arrange items in a row
        div.style.alignItems = 'center';  // Align items vertically in the center
        div.style.justifyContent = 'space-evenly';  // Space items evenly across the row
    
        div.innerHTML = `
          <div class="legend-item" style="display: flex; align-items: center; margin-right: 10px;">
            <span class="legend-color" style="background-color: orange; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px;"></span> Repair Underway
          </div>
          <div class="legend-item" style="display: flex; align-items: center; margin-right: 10px;">
            <span class="legend-color" style="background-color: yellow; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px;"></span> Awaiting Repair
          </div>
          <div class="legend-item" style="display: flex; align-items: center; margin-right: 10px;">
            <span class="legend-color" style="background-color: green; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px;"></span> Fixed
          </div>
          <div class="legend-item" style="display: flex; align-items: center; margin-right: 10px;">
            <span class="legend-color" style="background-color: blue; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px;"></span> Unassigned
          </div>
        `;
        
        return div;
      };
    
      // Add the legend to the map
      if (this.map) {
        legend.addTo(this.map);
      }
    }

  // Method to handle search input change
  onSearchInput(): void {
    if (this.searchQuery.length > 2) {
      this.firestoreService.getAddressSuggestions(this.searchQuery).subscribe(results => {
        this.searchResults = results;
      });
    } else {
      this.searchResults = [];  // Clear the dropdown if input is short
    }
  }

  // Select address from the dropdown and update map view
  onSelectAddress(address: any): void {
    this.selectedAddress = address.place_name;
    const [longitude, latitude] = address.center;

    // Update the map to focus on the selected address
    this.map?.setView([latitude, longitude], 14);

    // Optionally, you can add a marker at the selected location
    L.marker([latitude, longitude]).addTo(this.map!).bindPopup(address.place_name).openPopup();

    // Clear search results after selection
    this.searchResults = [];
    this.searchQuery = '';
  }
  
  isFilterOpen = false;

  toggleFilterPopup(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

}
