import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { TasinmazListComponent } from './pages/tasinmaz-list/tasinmaz-list.component';
import { TasinmazEkleComponent } from './pages/tasinmaz-ekle/tasinmaz-ekle.component';
import { TasinmazGuncelleComponent } from './pages/tasinmaz-guncelle/tasinmaz-guncelle.component';
import { LogComponent } from './pages/log/log.component';
import { KullaniciListComponent } from './pages/kullanici-list/kullanici-list.component';
import { KullaniciEkleComponent } from './pages/kullanici-ekle/kullanici-ekle.component';
import { KullaniciGuncelleComponent } from './pages/kullanici-guncelle/kullanici-guncelle.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path:'tasinmaz-list', component:TasinmazListComponent},
  { path:'tasinmaz-ekle',component:TasinmazEkleComponent},
  { path:'tasinmaz-guncelle',component:TasinmazGuncelleComponent},
  { path:'log',component:LogComponent},
  {path:'kullanici-list',component:KullaniciListComponent},
  {path:'kullanici-ekle',component:KullaniciEkleComponent},
  {path:'kullanici-guncelle',component:KullaniciGuncelleComponent}
];
