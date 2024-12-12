import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditEntryPage } from './edit-entry.page';

describe('EditEntryPage', () => {
  let component: EditEntryPage;
  let fixture: ComponentFixture<EditEntryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEntryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
