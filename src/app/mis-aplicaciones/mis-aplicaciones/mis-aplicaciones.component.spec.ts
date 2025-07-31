import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisAplicacionesComponent } from './mis-aplicaciones.component';

describe('MisAplicacionesComponent', () => {
  let component: MisAplicacionesComponent;
  let fixture: ComponentFixture<MisAplicacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MisAplicacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisAplicacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
