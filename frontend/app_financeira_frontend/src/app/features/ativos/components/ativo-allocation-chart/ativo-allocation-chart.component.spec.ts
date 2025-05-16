import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtivoAllocationChartComponent } from './ativo-allocation-chart.component';

describe('AtivoAllocationChartComponent', () => {
  let component: AtivoAllocationChartComponent;
  let fixture: ComponentFixture<AtivoAllocationChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtivoAllocationChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtivoAllocationChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
