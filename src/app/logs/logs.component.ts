import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  address?: string;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit {
  tableData: TableDataItem[] = [];
  selectedSort: string = '';

  constructor(
    private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.loadTableData();
  }

  private loadTableData(): void {
    this.firestoreService.getTableData().subscribe({
      next: (data: any[]) => {
        this.tableData = data;
        this.sortTableData();

        // Fetch addresses for each item
        for (const item of this.tableData) {
          if (item.location) {
            this.firestoreService.getAddressFromCoordinates(
              item.location.latitude,
              item.location.longitude
            ).subscribe({
              next: (address) => {
                item.address = address?.place_name || 'Unknown Location';
              },
              error: () => {
                item.address = 'Unknown Location';
              }
            });
          }
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
  }

  getRowCount(): number {
    return this.tableData.length;
  }

  formatLocation(location: { latitude: number, longitude: number } | undefined): string {
    if (!location) return 'No location';
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }

  showLocationOnMap(item: TableDataItem): void {
    console.log('Clicked item location:', item.location);
    // You can later implement showing the map or navigating to another component
  }
}
