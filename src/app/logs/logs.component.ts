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
  selected?: boolean;  // Add a 'selected' property for checkbox state
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
  deleteMode: boolean = false;
  showConfirmDeletion: boolean = false;
  showDeletionModal: boolean = false;
  rowsToDeleteCount: number = 0;
  

  constructor(private firestoreService: FirestoreService) {}

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

  // Enable delete mode, which shows checkboxes
  enableDeleteMode(): void {
    this.deleteMode = true;
  }

  // Cancel delete mode, which removes checkboxes
  cancelDeleteMode(): void {
    this.deleteMode = false;
    this.deselectAllRows();
    this.showConfirmDeletion = false;
  }

  // Select all rows with a checkbox click
  selectAllRows(event: any): void {
    const checked = event.target.checked;
    this.tableData.forEach(item => item.selected = checked);
    this.checkSelectedRows();
  }

  // Check if any row is selected and show the confirm button
  checkSelectedRows(): void {
    const selectedCount = this.tableData.filter(item => item.selected).length;
    this.showConfirmDeletion = selectedCount > 0;
  }

  // Confirm deletion of selected rows
  openDeletionModal(): void {
    this.rowsToDeleteCount = this.tableData.filter(item => item.selected).length;
    this.showDeletionModal = true;
  }
  
  // If user confirms inside modal
  confirmDeletionInModal(): void {
    const selectedLogs = this.tableData.filter(item => item.selected);
  
    this.firestoreService.deleteLogs(selectedLogs).subscribe({
      next: () => {
        this.tableData = this.tableData.filter(item => !item.selected);
        this.cancelDeleteMode();
        this.showDeletionModal = false;
      },
      error: (err) => console.error('Error deleting logs:', err)
    });
  }
  
  // If user cancels inside modal
  cancelDeletionInModal(): void {
    this.showDeletionModal = false;
  }

  // Deselect all rows
  deselectAllRows(): void {
    this.tableData.forEach(item => item.selected = false);
    this.showConfirmDeletion = false;
  }

  currentSort = {
    column: '',
    direction: 'asc'
  };

  sortTableBy(column: string): void {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = 'asc';
    }
  
    const direction = this.currentSort.direction;
  
    this.tableData.sort((a, b) => {
      let valueA: any;
      let valueB: any;
  
      if (column === 'confidence') {
        valueA = a.confidence;
        valueB = b.confidence;
      } else if (column === 'date') {
        valueA = new Date(a.readableDate).getTime();
        valueB = new Date(b.readableDate).getTime();
      } else if (column === 'location') {
        // SORT BY ADDRESS NOW
        valueA = a.address?.toLowerCase() || '';
        valueB = b.address?.toLowerCase() || '';
      } else if (column === 'prediction') {
        valueA = a.prediction?.toLowerCase() || '';
        valueB = b.prediction?.toLowerCase() || '';
      } else {
        return 0;
      }
  
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  
  }

  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  getPaginatedData(): TableDataItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.tableData.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  getTotalPages(): number {
    return Math.ceil(this.tableData.length / this.itemsPerPage);
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }
  

}
