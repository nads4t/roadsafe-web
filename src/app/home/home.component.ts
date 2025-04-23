import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  tableData: any[] = [];
  private map: L.Map | null = null;

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.firestoreService.getTableData().subscribe((data) => {
      this.tableData = data;
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

 private initMap(): void {
  // Fix for default marker icons
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'assets/marker-icon-2x.png',
    iconUrl: 'assets/marker-icon.png',
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Initialize map with Daraga City coordinates
  this.map = L.map('map').setView([13.1480, 123.7132], 14);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(this.map);

  // Add marker for last reported damage
  L.marker([13.1480, 123.7132])
    .addTo(this.map)
    .bindPopup('Last reported damage')
    .openPopup();
}
}