import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { TasinmazEkleComponent } from './pages/tasinmaz-ekle/tasinmaz-ekle.component';
import { LogComponent } from './pages/log/log.component';
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {path:'tasinmaz-list',component:TasinmazEkleComponent},
  {path:'log', component:LogComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
