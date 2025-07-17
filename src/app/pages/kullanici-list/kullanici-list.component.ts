import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Kullanici } from '../../models/kullanici.model';
import { KullaniciListService } from './kullanici-list.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-kullanici-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './kullanici-list.component.html',
  styleUrls: ['./kullanici-list.component.css']
})
export class KullaniciListComponent implements OnInit {
  kullanicilar: Kullanici[] = [];
  form!: FormGroup;
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;

  kullaniciAdList: string[] = [];
  kullaniciSoyadList: string[] = [];
  eMailList: string[] = [];
  rolList: string[] = [];
  adresList: string[] = [];

  uyariMesaji: string | null = null;

  gosterCikisOnayKutusu = false;
  gosterSilOnayKutusu = false;

  constructor(
    private kullaniciService: KullaniciListService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      aramaMetni: [''],
      kullaniciAd: [''],
      kullaniciSoyad: [''],
      eMail: [''],
      rol: [''],
      adres: ['']
    });

    this.LoadKullanicilar();
    this.form.valueChanges.subscribe(() => this.applyFilters());
  }

  LoadKullanicilar() {
    this.kullaniciService.GetirPagedKullanicilar(this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        this.kullanicilar = response.data;
        this.totalCount = response.totalCount;

        this.kullaniciAdList = [...new Set(this.kullanicilar.map(k => k.kullaniciAd))].sort();
        this.kullaniciSoyadList = [...new Set(this.kullanicilar.map(k => k.kullaniciSoyad))].sort();
        this.eMailList = [...new Set(this.kullanicilar.map(k => k.eMail))].sort();
        this.rolList = [...new Set(this.kullanicilar.map(k => k.rol))].sort();
        this.adresList = [...new Set(this.kullanicilar.map(k => k.adres))].sort();
      },
      error: () => this.UyariGoster("Kullanıcılar yüklenemedi!")
    });
  }

  applyFilters() {
    const { aramaMetni, kullaniciAd, kullaniciSoyad, eMail, rol, adres } = this.form.value;

    this.kullanicilar = this.kullanicilar.filter(kullanici =>
      (!kullaniciAd || kullanici.kullaniciAd === kullaniciAd) &&
      (!kullaniciSoyad || kullanici.kullaniciSoyad === kullaniciSoyad) &&
      (!eMail || kullanici.eMail === eMail) &&
      (!rol || kullanici.rol === rol) &&
      (!adres || kullanici.adres === adres) &&
      (!aramaMetni || [
        kullanici.kullaniciAd,
        kullanici.kullaniciSoyad,
        kullanici.eMail,
        kullanici.rol,
        kullanici.adres
      ].some(field => field.toLowerCase().includes(aramaMetni.toLowerCase())))
    );
  }

  SayfaDegistir(sayfa: number) {
    if (sayfa < 1 || sayfa > this.ToplamSayfa()) return;
    this.currentPage = sayfa;
    this.LoadKullanicilar();
  }

  ToplamSayfa(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  LogIslemleri(event: Event) {
    this.router.navigate(["/log"]);
  }

  MevcutTasinmazlarListesi(event: Event) {
    this.router.navigate(["/tasinmaz-list"]);
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

  Temizle(event: Event) {
    event.preventDefault();
    this.form.reset({
      aramaMetni: '',
      kullaniciAd: '',
      kullaniciSoyad: '',
      eMail: '',
      rol: '',
      adres: ''
    });
    this.LoadKullanicilar();
  }

  Ekle(event: Event) {
    this.router.navigate(["/kullanici-ekle"]);
  }

  Guncelle(event: Event) {
    const selected = this.kullanicilar.filter(t => t.selected);
    if (selected.length === 0) {
      this.UyariGoster('Lütfen bir kullanıcı seçiniz.');
      return;
    }
    if (selected.length > 1) {
      this.UyariGoster('Lütfen yalnızca bir kullanıcı seçiniz.');
      return;
    }
    this.router.navigate(['kullanici-guncelle'], { state: { kullanici: selected[0] } });
  }

  Sil(event: Event) {
    event.preventDefault();
    const selected = this.kullanicilar.filter(k => k.selected);
    if (selected.length === 0) {
      this.UyariGoster("Lütfen silinecek kullanıcı seçiniz.");
      return;
    }
    this.gosterSilOnayKutusu = true;
  }

  OnaylaSil() {
    this.gosterSilOnayKutusu = false;

    const selected = this.kullanicilar.filter(k => k.selected);
    let silinen = 0;
    let silinemeyen = 0;
    let tamamlanan = 0;
    let hataMesajlari: string[] = [];

    selected.forEach(kullanici => {
      this.kullaniciService.SilKullanici(kullanici.kullaniciId, kullanici).pipe(
        finalize(() => {
          tamamlanan++;
          if (tamamlanan === selected.length) {
            let mesaj = '';
            if (silinen > 0) mesaj += `${silinen} kullanıcı başarıyla silindi.\n`;
            if (silinemeyen > 0) mesaj += `${silinemeyen} kullanıcı silinemedi:\n${hataMesajlari.join('\n')}`;
            this.UyariGoster(mesaj || 'Silme işlemi tamamlandı.');
            this.LoadKullanicilar();
          }
        })
      ).subscribe({
        next: () => silinen++,
        error: (err) => {
          silinemeyen++;
          const hata = err?.error?.error || 'Silme sırasında hata oluştu.';
          hataMesajlari.push(`${kullanici.kullaniciAd}: ${hata}`);
        }
      });
    });
  }

  VazgecSil() {
    this.gosterSilOnayKutusu = false;
  }

  Raporla(event: Event) {
    const secilenKullanicilar = this.kullanicilar.filter(k => k.selected);
    if(this.kullanicilar.length===0){
      this.UyariGoster("Raporlanacak kullanıcı yok.");
    }
    if (secilenKullanicilar.length > 0) {
      const doc = new jsPDF();

      const headers = [['Ad', 'Soyad', 'Email', 'Rol', 'Adres']];
      const rows = secilenKullanicilar.map(kullanici => [
        kullanici.kullaniciAd,
        kullanici.kullaniciSoyad,
        kullanici.eMail,
        kullanici.rol,
        kullanici.adres
      ]);

      autoTable(doc, { head: headers, body: rows });
      doc.save('secilen-kullanicilar.pdf');
    } else {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.kullanicilar.map(kullanici => ({
        'Ad': kullanici.kullaniciAd,
        'Soyad': kullanici.kullaniciSoyad,
        'Email': kullanici.eMail,
        'Rol': kullanici.rol,
        'Adres': kullanici.adres,
      })));

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kullanicilar');

      const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data: Blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      });
      FileSaver.saveAs(data, 'tum-kullanicilar.xlsx');
    }
  }

  UyariGoster(mesaj: string): void {
    this.uyariMesaji = mesaj;
    setTimeout(() => this.uyariMesaji = null, 3000);
  }
}
