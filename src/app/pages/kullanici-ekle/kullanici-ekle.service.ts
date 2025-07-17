import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Kullanici } from '../../models/kullanici.model';

@Injectable({
    providedIn: 'root'
})
export class KullaniciEkleService {
    private apiUrl = 'https://localhost:7170/api/Kullanici';

    constructor(private http: HttpClient) { }

    EkleKullanici(kullanici: Kullanici): Observable<string> {
        return this.http.post(this.apiUrl, kullanici, { responseType: 'text' });
    }
}