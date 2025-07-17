export interface Log{
    logId:number;
    kullaniciId:number;
    durum:string;
    islemTipi:string;
    tarihSaat:Date;
    ip:string;
    aciklama:string;
    selected?: boolean;
    kullaniciAd:string;
}