import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtivoListComponent } from './ativo-list.component';

describe('AtivoListComponent', () => {
  let component: AtivoListComponent;
  let fixture: ComponentFixture<AtivoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtivoListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtivoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
