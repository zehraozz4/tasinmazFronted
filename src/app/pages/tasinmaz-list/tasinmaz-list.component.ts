import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { Tasinmaz } from '../../models/tasinmaz.model';
import { TasinmazListService } from './tasinmaz-list.service';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import ScaleLine from 'ol/control/ScaleLine';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Point from 'ol/geom/Point';
import { Feature } from 'ol';
import { Icon, Style } from 'ol/style';

import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-tasinmaz-list',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './tasinmaz-list.component.html',
  styleUrls: ['./tasinmaz-list.component.css']
})
export class TasinmazListComponent implements OnInit {
  isAdmin = false;
  kullaniciId = 0;

  tasinmazlar: Tasinmaz[] = [];
  tumTasinmazlar: Tasinmaz[] = [];

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;

  form!: FormGroup;
  uyariMesaji: string | null = null;

  ilAdList: string[] = [];
  ilceAdList: string[] = [];
  mahalleAdList: string[] = [];
  adaaList: string[] = [];
  parselList: string[] = [];
  nitelikList: string[] = [];

  harita!: Map;
  osmLayer!: TileLayer;
  googleLayer!: TileLayer;
  opacityValue: number = 1;

  gosterCikisOnayKutusu: boolean = false;
  gosterSilOnayKutusu: boolean = false;

  constructor(
    private tasinmazService: TasinmazListService,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      ilAd: [''],
      ilceAd: [''],
      mahalleAd: [''],
      adaa: [''],
      parsel: [''],
      nitelik: [''],
      aramaMetni: ['']
    });

    const rol = localStorage.getItem('rol');
    this.isAdmin = rol?.toLowerCase() === 'admin';
    const id = localStorage.getItem('kullaniciId');
    this.kullaniciId = Number(id);

    this.form.valueChanges.subscribe(() => this.applyFilters());

    this.LoadTasinmazlar();
  }

  LoadTasinmazlar() {
    this.tasinmazService.GetirPagedTasinmazlar(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        const data = res.data;
        this.totalCount = res.totalCount;

        if (data.length === 0 && this.currentPage > 1) {
          this.currentPage--;
          this.LoadTasinmazlar();
          return;
        }

        this.tumTasinmazlar = this.isAdmin ? data : data.filter((t: Tasinmaz) => t.kullaniciId === this.kullaniciId);
        this.tasinmazlar = [...this.tumTasinmazlar];

        this.ilAdList = [...new Set(this.tumTasinmazlar.map(t => t.ilAd))];
        this.ilceAdList = [...new Set(this.tumTasinmazlar.map(t => t.ilceAd))];
        this.mahalleAdList = [...new Set(this.tumTasinmazlar.map(t => t.mahalleAd))];
        this.adaaList = [...new Set(this.tumTasinmazlar.map(t => t.adaa))];
        this.parselList = [...new Set(this.tumTasinmazlar.map(t => t.parsel))];
        this.nitelikList = [...new Set(this.tumTasinmazlar.map(t => t.nitelik))];

        this.initMap();
      },
      error: (err) => console.error('Taşınmazlar yüklenemedi', err)
    });
  }

  applyFilters() {
    const { ilAd, ilceAd, mahalleAd, adaa, parsel, nitelik, aramaMetni } = this.form.value;

    this.tasinmazlar = this.tumTasinmazlar.filter(tasinmaz => {
      const matchesFilters =
        (!ilAd || tasinmaz.ilAd.toLowerCase() === ilAd.toLowerCase()) &&
        (!ilceAd || tasinmaz.ilceAd.toLowerCase() === ilceAd.toLowerCase()) &&
        (!mahalleAd || tasinmaz.mahalleAd.toLowerCase() === mahalleAd.toLowerCase()) &&
        (!adaa || tasinmaz.adaa.toLowerCase() === adaa.toLowerCase()) &&
        (!parsel || tasinmaz.parsel.toLowerCase() === parsel.toLowerCase()) &&
        (!nitelik || tasinmaz.nitelik.toLowerCase() === nitelik.toLowerCase());

      const searchTerm = aramaMetni ? aramaMetni.toLowerCase() : '';

      const matchesSearch =
        !searchTerm ||
        tasinmaz.adaa.toLowerCase().includes(searchTerm) ||
        tasinmaz.parsel.toLowerCase().includes(searchTerm) ||
        tasinmaz.nitelik.toLowerCase().includes(searchTerm) ||
        tasinmaz.adres.toLowerCase().includes(searchTerm) ||
        tasinmaz.ilAd.toLowerCase().includes(searchTerm) ||
        tasinmaz.ilceAd.toLowerCase().includes(searchTerm) ||
        tasinmaz.mahalleAd.toLowerCase().includes(searchTerm) ||
        tasinmaz.koordinat.toLowerCase().includes(searchTerm);

      return matchesFilters && matchesSearch;
    });

    this.initMap();
  }

  Temizle(event: Event) {
    event.preventDefault();
    this.form.reset({
      ilAd: '',
      ilceAd: '',
      mahalleAd: '',
      adaa: '',
      parsel: '',
      nitelik: '',
      aramaMetni: ''
    });
    this.tasinmazlar = [...this.tumTasinmazlar];
    this.initMap();
  }

  SayfaDegistir(sayfa: number) {
    if (sayfa < 1 || sayfa > this.ToplamSayfa()) return;
    this.currentPage = sayfa;
    this.LoadTasinmazlar();
  }

  ToplamSayfa(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  LogIslemleri(event: Event) {
    this.router.navigate(['/log']);
  }

  KullaniciIslemleri(event: Event) {
    this.router.navigate(['/kullanici-list']);
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

  Ekle(event: Event) {
    event.preventDefault();
    this.router.navigate(['/tasinmaz-ekle']);
  }

  Guncelle(event: Event) {
    event.preventDefault();
    const selected = this.tasinmazlar.filter(t => t.selected);
    if (selected.length === 0) {
      this.UyariGoster("Lütfen güncellenecek bir taşınmaz seçiniz.");
      return;
    }
    if (selected.length > 1) {
      this.UyariGoster('Lütfen aynı anda yalnızca bir seçim yapınız.');
      return;
    }
    this.router.navigate(['tasinmaz-guncelle'], { state: { tasinmaz: selected } });
  }

  Sil(event: Event) {
    event.preventDefault();
    const selected = this.tasinmazlar.filter(t => t.selected);
    if (selected.length === 0) {
      this.UyariGoster('Lütfen silinecek bir taşınmaz seçiniz.');
      return;
    }
    this.gosterSilOnayKutusu = true;
  }

  OnaylaSil() {
    this.gosterSilOnayKutusu = false;
    const selected = this.tasinmazlar.filter(t => t.selected);
    console.log("Seçilenler:", selected);

    if (selected.length === 0) return;

    let completed = 0;
    let successCount = 0;

    const checkCompletion = () => {
      if (completed === selected.length) {
        this.UyariGoster(`${successCount} taşınmaz başarıyla silindi.`);
        this.LoadTasinmazlar();
      }
    };
    selected.forEach(tasinmaz => {
      this.tasinmazService.SilTasinmaz(tasinmaz.tasinmazId, tasinmaz).subscribe({
        next: () => {
          successCount++;
          completed++;
          checkCompletion();
        },
        error: (err) => {
          console.error("Silme hatası:", err);
          completed++;
          checkCompletion();
        }
      });
    });
  }


  VazgecSil() {
    this.gosterSilOnayKutusu = false;
  }

  Raporla(event: Event) {
    event.preventDefault();
    const secilenTasinmazlar = this.tasinmazlar.filter(t => (t as any).selected);
    if(this.tasinmazlar.length===0){
      this.UyariGoster("Raporlanacak taşınmaz yok");
      return;
    }
    if (secilenTasinmazlar.length > 0) {
      const doc = new jsPDF();
      const headers = [['İl', 'İlçe', 'Mahalle', 'Ada', 'Parsel', 'Nitelik', 'Adres', 'Koordinat']];
      const rows = secilenTasinmazlar.map(t => [
        t.ilAd, t.ilceAd, t.mahalleAd, t.adaa, t.parsel, t.nitelik, t.adres, t.koordinat
      ]);

      autoTable(doc, { head: headers, body: rows });
      doc.save('secilen-tasinmazlar.pdf');
    } else {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.tasinmazlar.map(t => ({
        'Il ad': t.ilAd,
        'Ilce Ad': t.ilceAd,
        'Mahalle Ad': t.mahalleAd,
        'Ada': t.adaa,
        'Parsel': t.parsel,
        'Nitelik': t.nitelik,
        'Adres': t.adres,
        'Koordinat': t.koordinat
      })));

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tasinmazlar');
      const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data: Blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      });
      FileSaver.saveAs(data, 'tum-tasinmazlar.xlsx');
    }
  }

  initMap() {
    const osmLayer = new TileLayer({ source: new OSM(), visible: true, opacity: this.opacityValue });
    const googleLayer = new TileLayer({
      source: new OSM({ url: 'http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' }),
      visible: false,
      opacity: this.opacityValue
    });

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({ source: vectorSource });

    const view = new View({
      center: fromLonLat([35.2433, 38.9637]),
      zoom: 6
    });

    const scaleLineControl = new ScaleLine({
      units: 'metric',
      bar: true,
      steps: 2,
      text: true,
      minWidth: 140
    });

    if (this.harita) {
      this.harita.setTarget(undefined);
    }

    this.harita = new Map({
      target: 'harita',
      layers: [osmLayer, googleLayer, vectorLayer],
      view,
      controls: defaultControls({ zoom: true, rotate: false, attribution: false }).extend([scaleLineControl])

    });

    this.tasinmazlar.forEach(tasinmaz => {
      if (tasinmaz.koordinat) {
        const [latStr, lonStr] = tasinmaz.koordinat.split(',');
        const lat = parseFloat(latStr.trim());
        const lon = parseFloat(lonStr.trim());

        if (!isNaN(lat) && !isNaN(lon)) {
          const feature = new Feature({
            geometry: new Point(fromLonLat([lon, lat]))
          });

          feature.setStyle(new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              scale: 0.05
            })
          }));

          vectorSource.addFeature(feature);
        }
      }
    });

    this.osmLayer = osmLayer;
    this.googleLayer = googleLayer;
  }

  toggleLayer(layer: 'osm' | 'google') {
    this.osmLayer.setVisible(layer === 'osm');
    this.googleLayer.setVisible(layer === 'google');
  }

  setOpacity(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.opacityValue = value;
    this.osmLayer.setOpacity(value);
    this.googleLayer.setOpacity(value);
  }

  UyariGoster(mesaj: string) {
    this.uyariMesaji = mesaj;
    setTimeout(() => (this.uyariMesaji = null), 3000);
  }
}
