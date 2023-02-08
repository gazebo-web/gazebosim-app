/**
 * Angular imports.
 */
import { NgModule } from '@angular/core';
import { BrowserModule, DomSanitizer, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FlexLayoutModule } from '@angular/flex-layout';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { OverlayContainer, FullscreenOverlayContainer } from '@angular/cdk/overlay';

/**
 * Third party dependencies.
 */
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { NgxStripeModule } from 'ngx-stripe';

/**
 * Local elements.
 */
import { AccessTokenDialogComponent } from './settings/access-token-dialog.component';
import { AdminElasticsearchService } from './admin/elasticsearch';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './auth/auth.interceptor';
import { AuthPipe } from './auth/auth.pipe';
import { CategoriesComponent } from './fuel-resource/categories/categories.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { CopyDialogComponent } from './fuel-resource/copy-dialog/copy-dialog.component';
import { CreditsComponent } from './settings/credits/credits.component';
import { DescriptionComponent } from './description/description.component';
import { DndDirective } from './dnd/dnd.directive';
import { environment } from '../environments/environment';
import { FileSizePipe } from './file-size/file-size.pipe';
import { FileUploadComponent } from './file-upload';
import { FuelResourceListComponent } from './fuel-resource/list/fuel-resource-list.component';
import { GalleryComponent } from './gallery/gallery.component';
import { ItemCardComponent } from './item-card/item-card.component';
import { MetadataComponent } from './metadata';
import { NewOrganizationDialogComponent } from './organization';
import { OrganizationComponent } from './organization/organization.component';
import { PageTitleComponent } from './page-title/page-title.component';
import { ReportDialogComponent } from './fuel-resource/report-dialog/report-dialog.component';
import { SdfViewerComponent } from './model/sdfviewer/sdfviewer.component';
import { SimulationTableComponent } from './cloudsim';
import { TagsComponent } from './tags';
import { TextInputDialogComponent } from './text-input-dialog/text-input-dialog.component';
import { ThumbnailGeneratorComponent } from './model/edit/thumbnail-generator/thumbnail-generator.component';

/**
 * Entry point.
 */
@NgModule({
  bootstrap: [ AppComponent ],
  /**
   * Array of local components and pipes.
   */
  declarations: [
    AppComponent,
  ],
  /**
   * Import the used modules.
   */
  imports: [
    AccessTokenDialogComponent,
    AppRoutingModule,
    AuthPipe,
    BrowserAnimationsModule,
    BrowserModule,
    CategoriesComponent,
    ConfirmationDialogComponent,
    CopyDialogComponent,
    CreditsComponent,
    DescriptionComponent,
    FileSizePipe,
    FileUploadComponent,
    FlexLayoutModule,
    FormsModule,
    FuelResourceListComponent,
    GalleryComponent,
    HttpClientModule,
    ItemCardComponent,
    MarkdownModule.forRoot({
      markedOptions: {
        provide: MarkedOptions,
        useValue: {
          // Note: Sanitize is enabled by default.
          gfm: true,
          breaks: true,
        }
      }
    }),
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MetadataComponent,
    NewOrganizationDialogComponent,
    NgxStripeModule.forRoot(environment.STRIPE_PK),
    OrganizationComponent,
    PageTitleComponent,
    ReactiveFormsModule,
    ReportDialogComponent,
    SdfViewerComponent,
    SimulationTableComponent,
    TagsComponent,
    TextInputDialogComponent,
    ThumbnailGeneratorComponent,
  ],
  /**
   * Expose our Services and Providers into Angular's dependency injection.
   */
  providers: [
    AdminElasticsearchService,
    Title,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: OverlayContainer,
      useClass: FullscreenOverlayContainer
    }
  ]
})
export class AppModule {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
  ) {
    // This was taken from https://materialdesignicons.com/getting-started
    matIconRegistry.addSvgIcon('gz-world',
      domSanitizer.bypassSecurityTrustResourceUrl('./assets/icon/world.svg'));
    matIconRegistry.addSvgIcon('gz-model',
      domSanitizer.bypassSecurityTrustResourceUrl('./assets/icon/model.svg'));
  }
}
