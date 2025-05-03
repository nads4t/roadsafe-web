import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TableDataItem {
  id: string;               // Add the id property
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
  status?: string;  // New status field
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit {
  deletionDate: Date | null = null;  // Property to hold the deletion date
  showRowDeletionModal: boolean = false;  // New variable for the row deletion modal
  showUpdateModal: boolean = false;  // New variable for the row deletion modal
  selectedRowToDelete: TableDataItem | null = null;  // Store the row to be deleted
  tableData: TableDataItem[] = [];
  filteredTableData: TableDataItem[] = []; // New array for filtered data
  selectedSort: string = '';
  deleteMode: boolean = false;
  showDeletionModal: boolean = false;
  rowsToDeleteCount: number = 0;
  searchTerm: string = ''; // Search term to filter logs
  currentPage: number = 1;
  itemsPerPage: number = 10;
  newStatus: string = '';  // Store the new status selected by the user


  currentSort = {
    column: '',
    direction: 'asc'
  };

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.loadTableData();
  }

  private loadTableData(): void {
    this.firestoreService.getTableData().subscribe({
      next: (data: any[]) => {
        this.tableData = data;
        this.filteredTableData = this.tableData; // Initially, set the filtered data to the full table data
        this.sortTableData();
        this.applySearch(); // Apply any search term on data loading

        this.tableData.forEach(item => {
          if (item.confidence) {
            item.confidence = Math.round(item.confidence * 100) / 100; // Rounds to two decimal places
          }
        });

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



  // Apply search filter on tableData
  applySearch(): void {
    if (this.searchTerm) {
      this.filteredTableData = this.tableData.filter(item =>
        item.confidence.toString().includes(this.searchTerm) ||
        item.prediction.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (item.address && item.address.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    } else {
      this.filteredTableData = this.tableData; // If search is cleared, show all data
    }
    this.currentPage = 1; // Reset to the first page after search
  }

  // Sort the table data based on selected column
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

  getSelectedRowCount(): number {
    return this.tableData.filter(item => item.selected).length;
  }

  // Get row count
  getRowCount(): number {
    return this.tableData.length;
  }

  // Format location as a string
  formatLocation(location: { latitude: number, longitude: number } | undefined): string {
    if (!location) return 'No location';
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }

  // Enable delete mode, which shows checkboxes
  enableDeleteMode(): void {
    this.deleteMode = true;
  }

  // Cancel delete mode, which removes checkboxes
  cancelDeleteMode(): void {
    this.deleteMode = false;
    this.deselectAllRows();
    this.rowsToDeleteCount = 0;  // Reset selected count
  }

  // Select all rows with a checkbox click
  selectAllRows(event: any): void {
    const checked = event.target.checked;
    this.tableData.forEach(item => item.selected = checked);
    this.checkSelectedRows();
  }

  totalRows: number = 0; // To store the total number of rows

  // Check if any row is selected and show the confirm button
  checkSelectedRows(): void {
    // Calculate total number of rows
    this.totalRows = this.tableData.length;
    
    // Count the number of selected rows
    this.rowsToDeleteCount = this.tableData.filter(item => item.selected).length;
  
    // Show the confirm deletion modal if there are selected rows
  }
  

  // Confirm deletion of selected rows
  openDeletionModal(): void {
    const selectedLogs = this.tableData.filter(item => item.selected);
  
    this.rowsToDeleteCount = selectedLogs.length;
    
    if (selectedLogs.length > 0) {
      this.deletionDate = selectedLogs[0].readableDate;  // Assuming the first selected row has readableDate
      console.log('Deletion date set to:', this.deletionDate);  // Debug log
    } else {
      this.deletionDate = null;
    }
  
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

  openRowDeletionModal(item: any): void {
  this.selectedRowToDelete = item; // Set selected row for deletion
  this.deletionDate = item.readableDate;
  this.showRowDeletionModal = true; // Ensure the deletion modal is shown
}

  // Method to confirm deletion of the selected row
  confirmRowDeletion(): void {
    if (this.selectedRowToDelete) {
      this.firestoreService.deleteLogById(this.selectedRowToDelete.id).subscribe({
        next: () => {
          // Remove the row from the table data
          this.tableData = this.tableData.filter(item => item.id !== this.selectedRowToDelete?.id);
          this.showRowDeletionModal = false;  // Hide the modal
        },
        error: (err) => {
          console.error('Failed to delete log:', err);
        }
      });
    }
  }

  // Cancel the row deletion
  cancelRowDeletion(): void {
    this.showRowDeletionModal = false;  // Hide the modal without deleting
  }

  // If user cancels inside modal
  cancelDeletionInModal(): void {
    this.showDeletionModal = false;
    
  }

  // Deselect all rows
  deselectAllRows(): void {
    this.tableData.forEach(item => item.selected = false);
  }

  // Sort the table by a specific column
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
      } else if (column === 'status') {
        valueA = a.status?.toLowerCase() || '';
        valueB = b.status?.toLowerCase() || '';
      } else {
        return 0;
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Get paginated data based on the filtered data
  getPaginatedData(): TableDataItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTableData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Get total number of pages based on filtered data
  getTotalPages(): number {
    return Math.ceil(this.filteredTableData.length / this.itemsPerPage);
  }

  // Handle page change
  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  // Search input change handler
  onSearchChange(): void {
    this.applySearch();
  }
  
  showRowModal = false;
  selectedRowData: any;

  openRowModal(item: any) {
    this.selectedRowData = item;
    this.showRowModal = true;
  }

  closeRowModal() {
    this.showRowModal = false;
  }

  openUpdateModal(item: TableDataItem): void {
    this.selectedRowData = item;
    this.newStatus = item.status || '';  // Set the current status as the selected value
    this.showUpdateModal = true;  // Show the modal
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
  }

  updateLogStatus(): void {
    if (this.selectedRowData && this.newStatus) {
      const logId = this.selectedRowData.id;
      this.firestoreService.updateStatus(logId, this.newStatus).subscribe({
        next: () => {
          // Update the status locally in the table data
          this.selectedRowData!.status = this.newStatus;
          this.showUpdateModal = false;  // Close the modal after update
        },
        error: (err) => {
          console.error('Failed to update log status:', err);
        }
      });
    } else {
      console.error('No log selected or status is empty');
    }
  }

  getStatusClass(status?: string): string {
    if (!status) {
      return 'no-status'; // Return class for default status
    }
  
    switch (status) {
      case 'in-progress':
        return 'in-progress'; // Class for 'in-progress' status
      case 'pending':
        return 'pending'; // Class for 'pending' status
      case 'resolved':
        return 'resolved'; // Class for 'resolved' status
      default:
        return 'no-status'; // Default case for unknown status
    }
  }

}
