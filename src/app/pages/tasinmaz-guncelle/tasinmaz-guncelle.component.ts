import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TasinmazGuncelleService } from './tasinmaz-guncelle.service';
import { Tasinmaz } from '../../models/tasinmaz.model';
import { Il } from '../../models/il.model';
import { Ilce } from '../../models/ilce.model';
import { Mahalle } from '../../models/mahalle.model';
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
  selector: 'app-tasinmaz-guncelle',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './tasinmaz-guncelle.component.html',
  styleUrls: ['./tasinmaz-guncelle.component.css']
})
export class TasinmazGuncelleComponent implements OnInit {
  isAdmin: boolean = false;
  iller: Il[] = [];
  ilceler: Ilce[] = [];
  mahalleler: Mahalle[] = [];
  form!: FormGroup;
  harita!: Map;
  gosterOnayKutusu: boolean = false;
  gosterCikisOnayKutusu: boolean = false;
  uyariMesaji: string | null = null;
  osmLayer!: TileLayer;
  googleLayer!: TileLayer;
  opacityValue: number = 1;

  constructor(
    private tasinmazService: TasinmazGuncelleService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    const rol = localStorage.getItem('rol');
    this.isAdmin = rol?.toLowerCase() === 'admin';
    this.form = this.fb.group({
      seciliTasinmazId: [0],
      seciliIlId: [null, Validators.required],
      seciliIlceId: [null, Validators.required],
      seciliMahalleId: [null, Validators.required],
      adaa: ['', Validators.required],
      parsel: ['', Validators.required],
      nitelik: ['', Validators.required],
      adres: ['', Validators.required],
      koordinat: ['', Validators.required]
    });

    this.tasinmazService.GetIller().subscribe(iller => {
      this.iller = iller;
      this.tasinmazService.GetIlceler().subscribe(ilceler => {
        this.ilceler = ilceler;
        this.tasinmazService.GetMahalleler().subscribe(mahalleler => {
          this.mahalleler = mahalleler;
          const gelenTasinmazlar = history.state.tasinmaz as Tasinmaz[] | undefined;
          if (gelenTasinmazlar && gelenTasinmazlar.length > 0) {
            const gelen = gelenTasinmazlar[0];
            const il = this.iller.find(i => i.ilAd === gelen.ilAd);
            const seciliIlId = il?.ilId ?? null;
            const ilceler = this.ilceler.filter(i => i.ilId === seciliIlId);
            const ilce = ilceler.find(i => i.ilceAd === gelen.ilceAd);
            const seciliIlceId = ilce?.ilceId ?? null;
            const mahalleler = this.mahalleler.filter(m => m.ilceId === seciliIlceId);
            const mahalle = mahalleler.find(m => m.mahalleAd === gelen.mahalleAd);
            const seciliMahalleId = mahalle?.mahalleId ?? null;

            this.form.patchValue({
              seciliTasinmazId: gelen.tasinmazId,
              adaa: gelen.adaa,
              parsel: gelen.parsel,
              nitelik: gelen.nitelik,
              adres: gelen.adres,
              koordinat: gelen.koordinat,
              seciliIlId,
              seciliIlceId,
              seciliMahalleId
            });
            this.initMap(gelen.koordinat);
          } else {
            this.UyariGoster("Güncellenecek taşınmaz bilgisi alınamadı.");
          }
        });
      });
    });
  }

  initMap(koordinat?: string) {
    const osmLayer = new TileLayer({ source: new OSM(), visible: true, opacity: 1 });
    const googleLayer = new TileLayer({
      source: new OSM({ url: 'http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' }),
      visible: false,
      opacity: 1
    });
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({ source: vectorSource });

    let centerCoordinates = fromLonLat([35.2433, 38.9637]);

    if (koordinat) {
      const [latStr, lonStr] = koordinat.split(',');
      const lat = parseFloat(latStr.trim());
      const lon = parseFloat(lonStr.trim());
      if (!isNaN(lat) && !isNaN(lon)) {
        centerCoordinates = fromLonLat([lon, lat]);
        const feature = new Feature({ geometry: new Point(centerCoordinates) });
        feature.setStyle(new Style({
          image: new Icon({ anchor: [0.5, 1], src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', scale: 0.05 })
        }));
        vectorSource.addFeature(feature);
      }
    }

    const view = new View({ center: centerCoordinates, zoom: 15 });
    const scaleLineControl = new ScaleLine({ units: 'metric', bar: true, steps: 2, text: true, minWidth: 140 });

    if (this.harita) this.harita.setTarget(undefined);

    this.harita = new Map({
      target: 'harita',
      layers: [osmLayer, googleLayer, vectorLayer],
      view: view,
      controls: defaultControls({ zoom: true, rotate: false, attribution: false }).extend([scaleLineControl])
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

  get filtrelenmisIlceler(): Ilce[] {
    return this.form.value.seciliIlId ? this.ilceler.filter(i => i.ilId === this.form.value.seciliIlId) : [];
  }

  get filtrelenmisMahalleler(): Mahalle[] {
    return this.form.value.seciliIlceId ? this.mahalleler.filter(m => m.ilceId === this.form.value.seciliIlceId) : [];
  }

  onIlDegisti() {
    this.form.patchValue({ seciliIlceId: null, seciliMahalleId: null });
  }

  onIlceDegisti() {
    this.form.patchValue({ seciliMahalleId: null });
  }

  GuncellemeIstegiGeldi() {
    if (this.form.invalid) {
      this.UyariGoster('Lütfen tüm alanları eksiksiz doldurun.');
      return;
    }
    this.gosterOnayKutusu = true;
  }

  Onayla() {
    this.gosterOnayKutusu = false;
    this.TasinmazGuncelle();
  }

  Vazgec() {
    this.gosterOnayKutusu = false;
  }

  TasinmazGuncelle() {
    const kullaniciId = Number(localStorage.getItem("kullaniciId"));
    if (!kullaniciId || isNaN(kullaniciId)) {
      this.UyariGoster("Kullanıcı bilgisi alınamadı. Lütfen tekrar giriş yapın.");
      this.router.navigate(['/login']);
      return;
    }

    const formDegerleri = this.form.value;
    const il = this.iller.find(i => i.ilId === formDegerleri.seciliIlId);
    const ilce = this.ilceler.find(i => i.ilceId === formDegerleri.seciliIlceId);
    const mahalle = this.mahalleler.find(m => m.mahalleId === formDegerleri.seciliMahalleId);

    const tasinmaz: Tasinmaz = {
      tasinmazId: formDegerleri.seciliTasinmazId,
      mahalleId: formDegerleri.seciliMahalleId,
      adaa: formDegerleri.adaa.trim(),
      parsel: formDegerleri.parsel.trim(),
      nitelik: formDegerleri.nitelik.trim(),
      adres: formDegerleri.adres.trim(),
      koordinat: formDegerleri.koordinat.trim(),
      kullaniciId,
      ilAd: il?.ilAd || '',
      ilceAd: ilce?.ilceAd || '',
      mahalleAd: mahalle?.mahalleAd || '',
      selected: false,
      ilId: il?.ilId ?? 0,
      ilceId: ilce?.ilceId ?? 0
    };

    this.tasinmazService.GuncelleTasinmaz(tasinmaz).subscribe({
      next: () => {
        this.UyariGoster("Taşınmaz başarıyla güncellendi.");
        setTimeout(() => this.router.navigate(['/tasinmaz-list']), 3000);
      },
      error: () => {
        this.UyariGoster("Taşınmaz güncellenirken bir hata oluştu.");
      }
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

  UyariGoster(mesaj: string) {
    this.uyariMesaji = mesaj;
    setTimeout(() => (this.uyariMesaji = null), 3000);
  }
}