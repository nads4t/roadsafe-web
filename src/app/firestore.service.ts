import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
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
}
