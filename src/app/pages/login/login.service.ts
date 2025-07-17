import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Login } from '../../models/login.model';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'https://localhost:7170/api/login';

  constructor(private http: HttpClient) {}

  GirisiYap(girisBilgi: Login): Observable<Login> {
    return this.http.post<Login>(this.apiUrl, girisBilgi);
  }
}
