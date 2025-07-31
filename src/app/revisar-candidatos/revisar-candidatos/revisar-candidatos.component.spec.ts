import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisarCandidatosComponent } from './revisar-candidatos.component';

describe('RevisarCandidatosComponent', () => {
  let component: RevisarCandidatosComponent;
  let fixture: ComponentFixture<RevisarCandidatosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RevisarCandidatosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevisarCandidatosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
