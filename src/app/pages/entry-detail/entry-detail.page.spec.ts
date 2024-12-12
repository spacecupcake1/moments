import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntryDetailPage } from './entry-detail.page';

describe('EntryDetailPage', () => {
  let component: EntryDetailPage;
  let fixture: ComponentFixture<EntryDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
