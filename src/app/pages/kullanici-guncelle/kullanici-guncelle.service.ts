import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Kullanici } from '../../models/kullanici.model';

@Injectable({
    providedIn: 'root'
})
export class KullaniciGuncelleService {
    private apiUrl = 'https://localhost:7170/api/Kullanici';

    constructor(private http: HttpClient) { }

    GuncelleKullanici(id: number, kullanici: Kullanici): Observable<string> {
        return this.http.put(`${this.apiUrl}/${id}`, kullanici, {
            responseType: 'text'
        });
    }
}