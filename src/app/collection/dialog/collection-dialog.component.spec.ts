import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { of, throwError } from 'rxjs';

import { Collection } from '../collection';
import { CollectionDialogComponent } from './collection-dialog.component';
import { CollectionService } from '../collection.service';
import { ErrMsg } from '../../server/err-msg';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Model } from '../../model/model';

describe('CollectionDialogComponent', () => {
  let fixture: ComponentFixture<CollectionDialogComponent>;
  let component: CollectionDialogComponent;

  // Mock the Collection data.
  const mockData = {
    name: 'testCollection',
    owner: 'testOwner',
    description: 'testDescription',
    private: false
  };
  const mockCollection = new Collection(mockData);
  const mockResource = new Model({});

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        MatAutocompleteModule,
        MatDialogModule,
        MatExpansionModule,
        MatIconModule,
        MatInputModule,
        MatRadioModule,
        MatSelectModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        CollectionDialogComponent
        ],
      providers: [
        CollectionService,
        JsonClassFactoryService,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {close: Function} }
      ]
    });

    fixture = TestBed.createComponent(CollectionDialogComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should add the resource in the Collection', () => {
    const service = component.collectionService;
    spyOn(service, 'addAsset').and.returnValue(of({}));
    spyOn(component.dialog, 'close');
    component.resource = mockResource;

    // No collection.
    component.add();

    expect(service.addAsset).not.toHaveBeenCalled();
    expect(component.dialog.close).not.toHaveBeenCalled();

    // With a collection.
    component.collectionAddInputForm.setValue(mockCollection);
    component.add();

    expect(service.addAsset).toHaveBeenCalledWith(mockCollection.owner, mockCollection.name,
      mockResource);
    expect(component.dialog.close).toHaveBeenCalled();
  });

  it(`should display the Collection's name`, () => {
    const name = component.getCollectionName(mockCollection);
    expect(name).toBe(mockCollection.name);
  });

  it('should create the Collection', () => {
    const service = component.collectionService;
    spyOn(service, 'createCollection').and.returnValue(of(mockCollection));
    spyOn(service, 'addAsset').and.returnValue(of({}));
    spyOn(component.dialog, 'close');

    component.collectionNameInputForm.setValue(mockData.name);
    component.collectionOwnerList = [mockData.owner];
    component.collectionDescription = mockData.description;
    component.resource = mockResource;

    component.create();

    expect(service.createCollection).toHaveBeenCalledWith(mockData);
    expect(service.addAsset).toHaveBeenCalledWith(mockCollection.owner, mockCollection.name,
      mockResource);
    expect(component.dialog.close).toHaveBeenCalled();
  });

  it('should NOT create a Collection if the name is empty', () => {
    const service = component.collectionService;
    spyOn(service, 'createCollection').and.returnValue(of(mockCollection));

    component.collectionNameInputForm.setValue('');

    component.create();

    expect(service.createCollection).not.toHaveBeenCalled();
  });

  it('should display the correct error when creating a duplicated Collection', () => {
    const service = component.collectionService;
    spyOn(service, 'createCollection').and.returnValue(throwError({
      code: ErrMsg.ErrorResourceExists
    }));

    component.collectionNameInputForm.setValue(mockData.name);
    component.collectionOwnerList = [mockData.owner];
    component.collectionDescription = mockData.description;

    component.create();

    expect(component.collectionNameInputForm.hasError('duplicated')).toBe(true);
  });

  it('should display the correct error for the Collection name input', () => {
    // Required error.
    component.collectionNameInputForm.setErrors({
      required: true
    });
    let error: string = component.getCollectionNameError();
    expect(error).toBe('This field is required');
    component.collectionNameInputForm.reset();

    // Duplicated error.
    component.collectionNameInputForm.setErrors({
      duplicated: true
    });
    error = component.getCollectionNameError();
    expect(error).toBe('This collection already exists. Please use a different name.');
    component.collectionNameInputForm.reset();

    // No error.
    component.collectionNameInputForm.setErrors({});
    error = component.getCollectionNameError();
    expect(error).toBe('');
  });
});
