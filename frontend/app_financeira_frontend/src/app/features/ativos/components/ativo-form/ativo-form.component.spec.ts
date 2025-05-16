import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtivoFormComponent } from './ativo-form.component';

describe('AtivoFormComponent', () => {
  let component: AtivoFormComponent;
  let fixture: ComponentFixture<AtivoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtivoFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtivoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
