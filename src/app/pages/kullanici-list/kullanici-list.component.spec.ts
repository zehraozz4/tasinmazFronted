import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KullaniciListComponent } from './kullanici-list.component';

describe('KullaniciListComponent', () => {
  let component: KullaniciListComponent;
  let fixture: ComponentFixture<KullaniciListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KullaniciListComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(KullaniciListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});