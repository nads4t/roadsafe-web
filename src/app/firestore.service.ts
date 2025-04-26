import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, doc, deleteDoc, writeBatch } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';
import mapboxgl from 'mapbox-gl';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private mapboxAccessToken: string = 'pk.eyJ1IjoiZ290dGFzYWRhZSIsImEiOiJjbTY3d3oydTkwN2wzMmxvZm1rMzlsbjB4In0.9tJ1I4Vx-3-YMTUvUcLIMA';  // Replace with your Mapbox access token

  constructor(private firestore: Firestore) {
    mapboxgl.accessToken = this.mapboxAccessToken;  // Set the access token for Mapbox
  }

  getTableData(): Observable<any[]> {
    const tableRef = collection(this.firestore, 'road damage detections');

    return collectionData(tableRef, { idField: 'id' }).pipe(
      map(data => {
        // Convert Firestore Timestamp to Date
        const updatedData = data.map(item => ({
          ...item,
          readableDate: (item['date'] as Timestamp)?.toDate()
        }));

        // Sort by date descending
        return updatedData.sort((a, b) => {
          return (b.readableDate as Date).getTime() - (a.readableDate as Date).getTime();
        });
      })
    );
  }

  getUniqueUserCount(): Observable<number> {
    const tableRef = collection(this.firestore, 'road damage detections');

    return collectionData(tableRef).pipe(
      map((data: any[]) => {
        const uniqueUsers = new Set(data.map(item => item.userId || item.id)); // Replace with correct user ID field
        return uniqueUsers.size;
      })
    );
  }

  getTodayCount(): Observable<number> {
    const tableRef = collection(this.firestore, 'road damage detections');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Set start of the day
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // Set end of the day

    // Create a query to get documents where the date is within today
    const todayQuery = query(
      tableRef,
      where('date', '>=', Timestamp.fromDate(todayStart)),
      where('date', '<=', Timestamp.fromDate(todayEnd))
    );

    return collectionData(todayQuery, { idField: 'id' }).pipe(
      map(data => data.length) // Return the count of documents
    );
  }

  getAddressFromCoordinates(latitude: number, longitude: number): Observable<any> {
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.mapboxAccessToken}`;

    return new Observable(observer => {
      fetch(geocodingUrl)
        .then(response => response.json())
        .then(data => {
          if (data && data.features && data.features.length > 0) {
            observer.next(data.features[0]);
          } else {
            observer.next(null);
          }
          observer.complete();
        })
        .catch(error => {
          console.error('Error fetching address from Mapbox:', error);
          observer.error(error);
        });
    });
  }

  // Corrected method to delete logs from Firestore using batch write
  deleteLogs(logs: any[]): Observable<any> {
    const batch = writeBatch(this.firestore); // Correct way to instantiate the batch

    // Loop through each selected log and delete it from Firestore
    logs.forEach(log => {
      const logRef = doc(this.firestore, 'road damage detections', log.id); // Assuming 'id' is the unique identifier for each log
      batch.delete(logRef);
    });

    // Commit the batch to delete the logs
    return new Observable((observer) => {
      batch.commit()
        .then(() => {
          observer.next('Logs deleted successfully');
          observer.complete();
        })
        .catch(err => {
          console.error('Error deleting logs:', err);
          observer.error(err);
        });
    });
  }
}
