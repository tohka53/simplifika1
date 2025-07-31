import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarEmpleosComponent } from './buscar-empleos.component';

describe('BuscarEmpleosComponent', () => {
  let component: BuscarEmpleosComponent;
  let fixture: ComponentFixture<BuscarEmpleosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BuscarEmpleosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuscarEmpleosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
