import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Tasinmaz } from '../../models/tasinmaz.model';
import { Il } from '../../models/il.model';
import { Ilce } from '../../models/ilce.model';
import { Mahalle } from '../../models/mahalle.model';
import { TasinmazEkleService } from './tasinmaz-ekle.service';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Icon, Style } from 'ol/style';
import ScaleLine from 'ol/control/ScaleLine';

@Component({
  selector: 'app-tasinmaz-ekle',
  standalone: true,
  templateUrl: './tasinmaz-ekle.component.html',
  styleUrl: './tasinmaz-ekle.component.css',
  imports: [CommonModule, ReactiveFormsModule]
})
export class TasinmazEkleComponent implements OnInit {
  isAdmin = false;
  iller: Il[] = [];
  ilceler: Ilce[] = [];
  mahalleler: Mahalle[] = [];
  form!: FormGroup;
  harita!: Map;
  tasinmazlar: Tasinmaz[] = [];
  gosterOnayKutusu = false;
  uyariMesaji: string | null = null;
  gosterCikisOnayKutusu = false;

  osmLayer!: TileLayer;
  googleLayer!: TileLayer;
  opacityValue = 1;

  constructor(private tasinmazService: TasinmazEkleService, private router: Router, private fb: FormBuilder) { }

  ngOnInit(): void {
    const rol = localStorage.getItem('rol');
    this.isAdmin = rol?.toLowerCase() === 'admin';

    this.tasinmazService.GetIller().subscribe(data => (this.iller = data));
    this.tasinmazService.GetIlceler().subscribe(data => (this.ilceler = data));
    this.tasinmazService.GetMahalleler().subscribe(data => (this.mahalleler = data));

    this.form = this.fb.group({
      seciliIl: [null, Validators.required],
      seciliIlce: [null, Validators.required],
      seciliMahalle: [null, Validators.required],
      adaa: ['', Validators.required],
      parsel: ['', Validators.required],
      nitelik: ['', Validators.required],
      adres: ['', Validators.required],
      koordinat: ['', Validators.required]
    });

    this.initMap();
  }

  initMap() {
    this.osmLayer = new TileLayer({ source: new OSM(), visible: true, opacity: 1 });
    this.googleLayer = new TileLayer({
      source: new OSM({ url: 'http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' }),
      visible: false,
      opacity: 1
    });

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({ source: vectorSource });

    const view = new View({
      center: fromLonLat([35.2433, 38.9637]),
      zoom: 6
    });

    const scaleLineControl = new ScaleLine({ units: 'metric', bar: true, steps: 2, text: true, minWidth: 140 });

    if (this.harita) this.harita.setTarget(undefined);

    this.harita = new Map({
      target: 'harita',
      layers: [this.osmLayer, this.googleLayer, vectorLayer],
      view: view,
      controls: defaultControls({ zoom: true, rotate: false, attribution: false }).extend([scaleLineControl])
    });

    this.harita.on('click', (event) => {
      const [lon, lat] = toLonLat(event.coordinate).map(coord => +coord.toFixed(6));
      this.form.patchValue({ koordinat: `${lat}, ${lon}` });

      vectorSource.clear();
      const feature = new Feature({ geometry: new Point(event.coordinate) });
      feature.setStyle(
        new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scale: 0.05
          })
        })
      );
      vectorSource.addFeature(feature);
    });

    this.tasinmazlar.forEach(({ koordinat }) => {
      if (!koordinat) return;
      const [latStr, lonStr] = koordinat.split(',');
      const lat = parseFloat(latStr.trim());
      const lon = parseFloat(lonStr.trim());
      if (isNaN(lat) || isNaN(lon)) return;

      const feature = new Feature({ geometry: new Point(fromLonLat([lon, lat])) });
      feature.setStyle(
        new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scale: 0.05
          })
        })
      );
      vectorSource.addFeature(feature);
    });
  }

  toggleLayer(layer: 'osm' | 'google') {
    this.osmLayer.setVisible(layer === 'osm');
    this.googleLayer.setVisible(layer === 'google');
  }

  setOpacity(event: Event) {
    const input = event.target as HTMLInputElement;
    this.opacityValue = parseFloat(input.value);
    this.osmLayer.setOpacity(this.opacityValue);
    this.googleLayer.setOpacity(this.opacityValue);
  }

  onIlDegisti() {
    this.form.patchValue({ seciliIlce: null, seciliMahalle: null });
  }

  onIlceDegisti() {
    this.form.patchValue({ seciliMahalle: null });
  }

  get FiltrelenmisIlceler(): Ilce[] {
    return this.form.value.seciliIl ? this.ilceler.filter(i => i.ilId === this.form.value.seciliIl) : [];
  }

  get FiltrelenmisMahalleler(): Mahalle[] {
    return this.form.value.seciliIlce ? this.mahalleler.filter(m => m.ilceId === this.form.value.seciliIlce) : [];
  }

  EklemeIstegiGeldi() {
    if (this.form.invalid) {
      this.UyariGoster('Lütfen tüm alanları eksiksiz doldurun.');
      return;
    }
    this.gosterOnayKutusu = true;
  }

  Onayla() {
    this.gosterOnayKutusu = false;
    this.TasinmazEkle();
  }

  Vazgec() {
    this.gosterOnayKutusu = false;
  }

  TasinmazEkle() {
    const kullaniciId = Number(localStorage.getItem('kullaniciId'));
    if (!kullaniciId) {
      this.UyariGoster('Kullanıcı oturumu bulunamadı. Giriş yapın.');
      this.router.navigate(['/login']);
      return;
    }

    const il = this.iller.find(i => i.ilId === this.form.value.seciliIl);
    const ilce = this.ilceler.find(i => i.ilceId === this.form.value.seciliIlce);
    const mahalle = this.mahalleler.find(m => m.mahalleId === this.form.value.seciliMahalle);

    if (!il || !ilce || !mahalle) {
      this.UyariGoster('İl, ilçe veya mahalle bilgisi eksik.');
      return;
    }

    const yeniTasinmaz: Tasinmaz = {
      selected: false,
      tasinmazId: 0,
      ilId: il.ilId!,
      ilceId: ilce.ilceId!,
      mahalleId: mahalle.mahalleId!,
      adaa: this.form.value.adaa.trim(),
      parsel: this.form.value.parsel.trim(),
      nitelik: this.form.value.nitelik.trim(),
      adres: this.form.value.adres.trim(),
      ilAd: il.ilAd,
      ilceAd: ilce.ilceAd,
      mahalleAd: mahalle.mahalleAd,
      kullaniciId: kullaniciId,
      koordinat: this.form.value.koordinat.trim()
    };

    this.tasinmazService.TasinmaziEkle(yeniTasinmaz).subscribe({
      next: () => {
        this.UyariGoster('Taşınmaz başarıyla eklendi');
        setTimeout(() => this.router.navigate(['/tasinmaz-list']), 3000);
      },
      error: err => {
        console.error('Taşınmaz ekleme hatası:', err);
        this.UyariGoster('Taşınmaz eklenirken bir hata oluştu.');
      }
    });
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

  UyariGoster(mesaj: string) {
    this.uyariMesaji = mesaj;
    setTimeout(() => (this.uyariMesaji = null), 3000);
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
}
