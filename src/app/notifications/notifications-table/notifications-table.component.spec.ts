import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PageTitleComponent } from 'src/app/page-title';
import { NotificationsTableComponent } from './notifications-table.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('NotificationsTableComponent', () => {
  let component: NotificationsTableComponent;
  let fixture: ComponentFixture<NotificationsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatDividerModule,
        MatTabsModule,
        MatTableModule,
        MatPaginatorModule
      ],
      declarations: [
        NotificationsTableComponent,
        PageTitleComponent
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsTableComponent);
    component = fixture.debugElement.componentInstance;
    component.notificationData = [{title: 'Update the thumbnail gallery', author: '@johnappleseed',
    action: 'Review Requested', date: '23 June 2021'}];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
