import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FaserComponent } from './faser.component';
import { AppModule } from '../../../app/app.module';

describe('FaserComponent', () => {
  let component: FaserComponent;
  let fixture: ComponentFixture<FaserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test if three.js is initialized
  it('should initialize three.js canvas', () => {
    component.ngOnInit();
    expect(document.getElementById('three-canvas')).toBeTruthy();
  });
});
