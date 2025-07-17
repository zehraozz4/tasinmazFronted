import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Kullanici } from '../../models/kullanici.model';

@Injectable({
  providedIn: 'root'
})
export class KullaniciListService {
  private apiUrl = 'https://localhost:7170/api/Kullanici';

  constructor(private http: HttpClient) { }

  GetKullanicilar(): Observable<Kullanici[]> {
    return this.http.get<Kullanici[]>(this.apiUrl);
  }

  SilKullanici(id: number,dto:Kullanici): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`,{ body: dto });
  }
  GetirPagedKullanicilar(page: number, pageSize: number): Observable<any> {
    const url = `${this.apiUrl}/paged?page=${page}&pageSize=${pageSize}`;
    return this.http.get<any>(url);
  }
  
}