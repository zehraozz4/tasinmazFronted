import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Log } from '../../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private apiUrl = 'https://localhost:7170/api/log';

  constructor(private http: HttpClient) { }

  GetirLoglar(): Observable<Log[]> {
    return this.http.get<Log[]>(this.apiUrl);
  }

  GetirPagedLoglar(page: number, pageSize: number): Observable<any> {
    const url = `${this.apiUrl}/paged?page=${page}&pageSize=${pageSize}`;
    return this.http.get<any>(url);
  }

}
