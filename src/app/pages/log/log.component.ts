import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Log } from '../../models/log.model';
import { LogService } from './log.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
@Component({
  selector: 'app-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css']
})
export class LogComponent implements OnInit {
  loglar: Log[] = [];

  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;

  durumList: string[] = [];
  islemTipiList: string[] = [];
  tarihSaatList: string[] = [];
  ipList: string[] = [];
  form!: FormGroup;
  constructor(
    private router: Router,
    private logService: LogService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      durum: [''],
      islemTipi: [''],
      tarihSaat: [''],
      ip: [''],
      aciklama: ['']
    });

    this.LoglariGetir();
    this.form.valueChanges.subscribe(() => this.applyFilters());
  }


  LoglariGetir(page: number = 1): void {
    this.logService.GetirPagedLoglar(page, this.pageSize).subscribe({
      next: (res) => {
        this.loglar = res.data;
        this.totalCount = res.totalCount;
        this.currentPage = res.page;

        this.durumList = [...new Set(this.loglar.map(l => l.durum))].sort();
        this.islemTipiList = [...new Set(this.loglar.map(l => l.islemTipi))].sort();
        this.tarihSaatList = [...new Set(this.loglar.map(l => new Date(l.tarihSaat).toLocaleString()))].sort();
        this.ipList = [...new Set(this.loglar.map(l => l.ip))].sort();
      },
      error: (err) => console.error("Loglar alınamadı:", err)
    });
  }
  applyFilters() {
    const {
      durum,
      islemTipi,
      tarihSaat,
      ip
    } = this.form.value;

    this.loglar = this.loglar.filter(log => {
      const tarihStr = new Date(log.tarihSaat).toLocaleString();

      return (
        (!durum || log.durum === durum) &&
        (!islemTipi || log.islemTipi === islemTipi) &&
        (!tarihSaat || tarihStr === tarihSaat) &&
        (!ip || log.ip === ip)
      );
    });
  }

  Temizle(event: Event): void {
    this.form.reset({
      aramaMetni: '',
      durum: '',
      islemTipi: '',
      tarihSaat: '',
      ip: '',
      aciklama: ''
    });
    this.LoglariGetir(this.currentPage);
  }


  KullaniciIslemleri(event: Event): void {
    this.router.navigate(['/kullanici-list']);
  }

  MevcutTasinmazlar(event: Event): void {
    this.router.navigate(['/tasinmaz-list']);
  }
  SayfaDegistir(page: number): void {
    if (page < 1 || page > this.ToplamSayfa()) return;
    this.LoglariGetir(page);
  }

  ToplamSayfa(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  Yazdir(event: Event): void {
    const secilenLoglar = this.loglar.filter(l => (l as any).selected);

    if (secilenLoglar.length > 0) {
      const doc = new jsPDF();

      const headers = [['Kullanıcı ID', 'Durum', 'İşlem Tipi', 'Tarih Saat', 'IP', 'Açıklama']];
      const rows = secilenLoglar.map(log => [
        log.kullaniciId,
        log.durum,
        log.islemTipi,
        new Date(log.tarihSaat).toLocaleString(),
        log.ip,
        log.aciklama
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
      });

      doc.save('secilen-loglar.pdf');
    } else {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.loglar.map(log => ({
        'Kullanıcı ID': log.kullaniciId,
        'Durum': log.durum,
        'İşlem Tipi': log.islemTipi,
        'Tarih Saat': new Date(log.tarihSaat).toLocaleString(),
        'IP': log.ip,
        'Açıklama': log.aciklama
      })));

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Loglar');

      const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data: Blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      });
      FileSaver.saveAs(data, 'tum-loglar.xlsx');
    }
  }

  Cikis(event: Event): void {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      this.router.navigate(['/login']);
    }
  }
}