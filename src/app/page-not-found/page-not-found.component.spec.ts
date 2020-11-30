import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { PageNotFoundComponent } from './page-not-found.component';
import { PageTitleComponent } from '../page-title';

describe('PageNotFoundComponent', () => {
  let comp: PageNotFoundComponent;
  let fixture: ComponentFixture<PageNotFoundComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatIconModule,
      ],
      declarations: [
        PageNotFoundComponent,
        PageTitleComponent,
      ],
    });

    fixture = TestBed.createComponent(PageNotFoundComponent);
    comp = fixture.componentInstance;
  });

  it('should not log to console', () => {
    spyOn(console, 'log');
    expect(console.log).not.toHaveBeenCalled();
  });
});
