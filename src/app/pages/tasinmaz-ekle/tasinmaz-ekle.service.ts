import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tasinmaz } from '../../models/tasinmaz.model';
import { Il } from '../../models/il.model';
import { Ilce } from '../../models/ilce.model';
import { Mahalle } from '../../models/mahalle.model';

@Injectable({
    providedIn: 'root'
})
export class TasinmazEkleService {
    private baseUrl = 'https://localhost:7170/api';

    constructor(private http: HttpClient) { }

    GetIller(): Observable<Il[]> {
        return this.http.get<Il[]>(`${this.baseUrl}/Il`);
    }

    GetIlceler(): Observable<Ilce[]> {
        return this.http.get<Ilce[]>(`${this.baseUrl}/Ilce`);
    }

    GetMahalleler(): Observable<Mahalle[]> {
        return this.http.get<Mahalle[]>(`${this.baseUrl}/Mahalle`);
    }

    TasinmaziEkle(tasinmaz: Tasinmaz): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.baseUrl}/Tasinmaz`, tasinmaz);
    }
}
