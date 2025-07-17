import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Kullanici } from '../../models/kullanici.model';
import { KullaniciGuncelleService } from './kullanici-guncelle.service';

@Component({
  selector: 'app-kullanici-guncelle',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './kullanici-guncelle.component.html',
  styleUrls: ['./kullanici-guncelle.component.css']
})
export class KullaniciGuncelleComponent implements OnInit {
  form!: FormGroup;
  kullaniciId = 0;
  gosterOnayKutusu = false;
  uyariMesaji: string | null = null;
  gosterCikisOnayKutusu = false;

  constructor(
    private fb: FormBuilder,
    private kullaniciService: KullaniciGuncelleService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const gelen = history.state.kullanici as Kullanici | undefined;
    if (gelen) {
      this.kullaniciId = gelen.kullaniciId;
      this.form = this.fb.group({
        kullaniciAd: [gelen.kullaniciAd, Validators.required],
        kullaniciSoyad: [gelen.kullaniciSoyad, Validators.required],
        eMail: [gelen.eMail, [Validators.required, Validators.email]],
        parola: ['', [
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        ]],
        rol: [gelen.rol, Validators.required],
        adres: [gelen.adres, Validators.required]
      });
    } else {
      this.UyariGoster("Güncellenecek kullanıcı bilgisi alınamadı!");
    }
  }

  GuncellemeIstegiGeldi(): void {
    if (this.form.invalid) {
      this.UyariGoster("Lütfen tüm alanları eksiksiz doldurun.");
      return;
    }
    this.gosterOnayKutusu = true;
  }

  Onayla(): void {
    this.gosterOnayKutusu = false;
    this.KullaniciGuncelle();
  }

  Vazgec(): void {
    this.gosterOnayKutusu = false;
  }

  KullaniciGuncelle(): void {
    const guncellenmisKullanici: Kullanici = {
      kullaniciId: this.kullaniciId,
      kullaniciAd: this.form.value.kullaniciAd,
      kullaniciSoyad: this.form.value.kullaniciSoyad,
      eMail: this.form.value.eMail,
      parola: this.form.value.parola,
      rol: this.form.value.rol,
      adres: this.form.value.adres,
      guncellemeTarihi: new Date()
    };

    this.kullaniciService.GuncelleKullanici(this.kullaniciId, guncellenmisKullanici).subscribe({
      next: (mesaj) => {
        this.UyariGoster("Kullanıcı başarıyla güncellendi");
        setTimeout(() => this.router.navigate(['/kullanici-list']), 3000);
      },
      error: (error) => {
        console.error("Bir hata oluştu:", error);
        this.UyariGoster("Kullanıcı güncellenirken bir hata oluştu.");
      }
    });
  }

  LogIslemleri(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/log']);
  }

  KullaniciIslemleri(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/kullanici-list']);
  }

  MevcutTasinmazlar(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/tasinmaz-list']);
  }

  Cikis(event: Event): void {
    event.preventDefault();
    this.gosterCikisOnayKutusu = true;
  }

  OnaylaCikis(): void {
    this.gosterCikisOnayKutusu = false;
    this.router.navigate(['/login']);
  }

  VazgecCikis(): void {
    this.gosterCikisOnayKutusu = false;
  }

  UyariGoster(mesaj: string): void {
    this.uyariMesaji = mesaj;
    setTimeout(() => this.uyariMesaji = null, 3000);
  }
}