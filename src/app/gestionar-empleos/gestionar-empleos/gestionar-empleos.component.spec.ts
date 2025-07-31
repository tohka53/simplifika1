import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarEmpleosComponent } from './gestionar-empleos.component';

describe('GestionarEmpleosComponent', () => {
  let component: GestionarEmpleosComponent;
  let fixture: ComponentFixture<GestionarEmpleosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionarEmpleosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarEmpleosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
