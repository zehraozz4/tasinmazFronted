import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tasinmaz } from '../../models/tasinmaz.model';

@Injectable({
  providedIn: 'root'
})
export class TasinmazListService {
  private apiUrl = 'https://localhost:7170/api/Tasinmaz';

  constructor(private http: HttpClient) { }

  GetTasinmazlar(): Observable<Tasinmaz[]> {
    return this.http.get<Tasinmaz[]>(this.apiUrl);
  }

  SilTasinmaz(id: number, dto: Tasinmaz): Observable<any> {
    return this.http.request('delete', `${this.apiUrl}/${id}`, { body: dto });
  }
  GetirPagedTasinmazlar(page: number, pageSize: number): Observable<any> {
    const url = `${this.apiUrl}/paged?page=${page}&pageSize=${pageSize}`;
    return this.http.get<any>(url);
  }
}
