import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  constructor(private firestore: Firestore) {}

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
}


