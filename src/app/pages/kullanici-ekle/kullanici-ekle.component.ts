import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Kullanici } from '../../models/kullanici.model';
import { KullaniciEkleService } from './kullanici-ekle.service';

@Component({
  selector: 'app-kullanici-ekle',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './kullanici-ekle.component.html',
  styleUrls: ['./kullanici-ekle.component.css']
})
export class KullaniciEkleComponent implements OnInit {
  form!: FormGroup;
  gosterOnayKutusu = false;
  gosterCikisOnayKutusu = false;
  uyariMesaji: string | null = null;

  constructor(
    private fb: FormBuilder,
    private kullaniciService: KullaniciEkleService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      kullaniciAd: ['', Validators.required],
      kullaniciSoyad: ['', Validators.required],
      eMail: ['', [Validators.required, Validators.email]],
      parola: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      rol: [null, Validators.required],
      adres: ['', Validators.required]
    });
  }

  LogIslemleri(event: Event) {
    this.router.navigate(['/log']);
  }

  KullaniciIslemleri(event: Event) {
    this.router.navigate(['/kullanici-list']);
  }

  MevcutTasinmazlar(event: Event) {
    this.router.navigate(['/tasinmaz-list']);
  }

  Cikis(event: Event) {
    event.preventDefault();
    this.gosterCikisOnayKutusu = true;
  }

  OnaylaCikis() {
    this.gosterCikisOnayKutusu = false;
    this.router.navigate(['/login']);
  }

  VazgecCikis() {
    this.gosterCikisOnayKutusu = false;
  }

  EklemeIstegiGeldi() {
    if (this.form.invalid) {
      this.UyariGoster("Lütfen tüm alanları eksiksiz doldurun.");
      return;
    }
    this.gosterOnayKutusu = true;
  }

  Onayla() {
    this.gosterOnayKutusu = false;
    this.KullaniciEkle();
  }

  Vazgec() {
    this.gosterOnayKutusu = false;
  }

  KullaniciEkle() {
    const yeniKullanici: Kullanici = {
      kullaniciId: 0,
      kullaniciAd: this.form.value.kullaniciAd,
      kullaniciSoyad: this.form.value.kullaniciSoyad,
      eMail: this.form.value.eMail,
      parola: this.form.value.parola,
      rol: this.form.value.rol,
      adres: this.form.value.adres,
      eklenmeTarihi: new Date(),
      guncellemeTarihi: new Date()
    };
    this.kullaniciService.EkleKullanici(yeniKullanici).subscribe({
      next: () => {
        this.UyariGoster('Kullanıcı başarıyla eklendi!');
        setTimeout(() => this.router.navigate(['/kullanici-list']), 3000);
      },
      error: (error) => {
        console.error("Bir hata oluştu:", error);
        this.UyariGoster("Kullanıcı eklenirken bir hata oluştu.");
      }
    });
  }

  UyariGoster(mesaj: string) {
    this.uyariMesaji = mesaj;
    setTimeout(() => {
      this.uyariMesaji = null;
    }, 3000);
  }
}