import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import {
  MAT_DIALOG_DATA,
  MatAutocompleteModule,
  MatDialogModule,
  MatDialogRef,
  MatIconModule,
  MatInputModule,
  MatRadioModule,
  MatSelectModule,
  MatSnackBarModule,
} from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { MatExpansionModule } from '@angular/material/expansion';

import { AuthService } from '../../auth/auth.service';
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

  beforeEach(async(() => {
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
        AuthService,
        CollectionService,
        JsonClassFactoryService,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {close: Function} }
      ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionDialogComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should add the resource in the Collection', async(() => {
    const service = component.collectionService;
    spyOn(service, 'addAsset').and.returnValue(Observable.of({}));
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
  }));

  it(`should display the Collection's name`, async(() => {
    const name = component.getCollectionName(mockCollection);
    expect(name).toBe(mockCollection.name);
  }));

  it('should create the Collection', async(() => {
    const service = component.collectionService;
    spyOn(service, 'createCollection').and.returnValue(Observable.of(mockCollection));
    spyOn(service, 'addAsset').and.returnValue(Observable.of({}));
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
  }));

  it('should NOT create a Collection if the name is empty', async(() => {
    const service = component.collectionService;
    spyOn(service, 'createCollection').and.returnValue(Observable.of({}));

    component.collectionNameInputForm.setValue('');

    component.create();

    expect(service.createCollection).not.toHaveBeenCalled();
  }));

  it('should display the correct error when creating a duplicated Collection', async(() => {
    const service = component.collectionService;
    spyOn(service, 'createCollection').and.returnValue(Observable.throw({
      code: ErrMsg.ErrorResourceExists
    }));

    component.collectionNameInputForm.setValue(mockData.name);
    component.collectionOwnerList = [mockData.owner];
    component.collectionDescription = mockData.description;

    component.create();

    expect(component.collectionNameInputForm.hasError('duplicated')).toBe(true);
  }));

  it('should display the correct error for the Collection name input', async(() => {
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
  }));
});
