export interface Kullanici {
  kullaniciId: number;
  kullaniciAd: string;
  kullaniciSoyad: string;
  eMail: string;
  parola?: string;
  rol: string;
  adres: string;
  eklenmeTarihi?: Date;
  guncellemeTarihi?: Date;
  selected?: boolean;
}
