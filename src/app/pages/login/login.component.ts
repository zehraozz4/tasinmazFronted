import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hataMesaji: string = '';
  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) { }
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      eMail: ['', [Validators.required, Validators.email]],
      parola: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  GirisYap() {
    if (this.loginForm.invalid) {
      this.hataMesaji = 'Lütfen geçerli e-posta ve parola giriniz.';
      return;
    }
    const girisBilgi = this.loginForm.value;
    this.loginService.GirisiYap(girisBilgi).subscribe({
      next: (response) => {
        if (!response.kullaniciId) {
          this.hataMesaji = 'Giriş başarılı ancak kullanıcı ID alınamadı.';
          return;
        }

        localStorage.setItem('kullaniciId', response.kullaniciId.toString());
        localStorage.setItem('rol', response.rol.toString().toLowerCase());
        console.log('Gelen response:', response);

        this.router.navigate(['/tasinmaz-list']);
      },
      error: (error) => {
        if (error.status === 401) {
          this.hataMesaji = 'E Mail veya parola hatalı!';
        } else {
          this.hataMesaji = 'Bir hata oluştu. Lütfen tekrar deneyin.';
        }
      }
    });
  }
}