import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoteItemComponent } from './vote-item.component';

describe('VoteItemComponent', () => {
  let component: VoteItemComponent;
  let fixture: ComponentFixture<VoteItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VoteItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoteItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
