import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtivoDetailComponent } from './ativo-detail.component';

describe('AtivoDetailComponent', () => {
  let component: AtivoDetailComponent;
  let fixture: ComponentFixture<AtivoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtivoDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtivoDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
