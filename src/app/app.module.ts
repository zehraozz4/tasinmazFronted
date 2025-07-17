import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { AppComponent } from './app.component';

import { LoginComponent } from './pages/login/login.component';
import { TasinmazListComponent } from './pages/tasinmaz-list/tasinmaz-list.component';
import { TasinmazEkleComponent } from './pages/tasinmaz-ekle/tasinmaz-ekle.component';
import { TasinmazGuncelleComponent } from './pages/tasinmaz-guncelle/tasinmaz-guncelle.component';
import { KullaniciListComponent } from './pages/kullanici-list/kullanici-list.component';
import { KullaniciEkleComponent } from './pages/kullanici-ekle/kullanici-ekle.component';
import { KullaniciGuncelleComponent } from './pages/kullanici-guncelle/kullanici-guncelle.component';
import { LogComponent } from './pages/log/log.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    TasinmazListComponent,
    TasinmazEkleComponent,
    TasinmazGuncelleComponent,
    KullaniciListComponent,
    KullaniciEkleComponent,
    KullaniciGuncelleComponent,
    LogComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule, 
    ReactiveFormsModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
