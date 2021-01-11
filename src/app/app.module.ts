/**
 * Angular imports.
 */
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule, DomSanitizer, Title } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { NgModule } from '@angular/core';
import { OverlayContainer, FullscreenOverlayContainer } from '@angular/cdk/overlay';
import { RouterModule, PreloadAllModules } from '@angular/router';

/**
 * Third party dependencies.
 */
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { NgxGalleryModule } from '@kolkov/ngx-gallery';
import 'hammerjs';

/**
 * Local elements.
 */
import { AccessTokenDialogComponent } from './settings/access-token-dialog.component';
import { AdminCloudsimComponent } from './admin/cloudsim/admin-cloudsim.component';
import { AdminComponent } from './admin';
import { AdminElasticsearchComponent } from './admin/elasticsearch';
import { AdminElasticsearchService } from './admin/elasticsearch';
import { AdminGuard } from './admin/admin-guard.service';
import { APIComponent } from './api';
import { AppComponent } from './app.component';
import { AssetDisplayComponent } from './asset-display';
import { AuthCallbackComponent } from './auth/callback.component';
import { AuthGuard } from './auth/auth-guard.service';
import { AuthInterceptor } from './auth/auth.interceptor';
import { AuthPipe } from './auth/auth.pipe';
import { AuthService } from './auth/auth.service';
import { CategoriesComponent } from './fuel-resource/categories/categories.component';
import { CategoryService } from './fuel-resource/categories/category.service';
import { CollectionComponent } from './collection/collection.component';
import { CollectionDialogComponent } from './collection/dialog/collection-dialog.component';
import { CollectionListComponent } from './collection/list/collection-list.component';
import { CollectionResolver } from './collection/collection.resolver';
import { CollectionService } from './collection/collection.service';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { CopyDialogComponent } from './fuel-resource/copy-dialog/copy-dialog.component';
import { DashboardComponent } from './dashboard';
import { DescriptionComponent } from './description';
import { DndDirective } from './dnd/dnd.directive';
import { DurationPipe } from './cloudsim/detail/duration.pipe';
import { EditCollectionComponent } from './collection/edit/edit-collection.component';
import { EditModelComponent } from './model/edit/edit-model.component';
import { EditWorldComponent } from './world/edit/edit-world.component';
import { ROUTES } from './app.routes';
import {
  ElasticsearchConfigDialogComponent
} from './admin/elasticsearch/config-dialog/config-dialog.component';
import { ExtraDialogComponent } from './cloudsim/extra-dialog/extra-dialog.component';
import { FileSizePipe } from './file-size/file-size.pipe';
import { FileUploadComponent } from './file-upload';
import { FuelHomeComponent } from './fuel-home';
import { FuelResourceListComponent } from './fuel-resource';
import { FuelResourceService } from './fuel-resource';
import { InformationComponent } from './information';
import { ItemCardComponent } from './item-card/item-card.component';
import { JsonClassFactoryService } from './factory/json-class-factory.service';
import { LaunchQueueComponent } from './admin/cloudsim/launch-queue/launch-queue.component';
import { LeaderBoardComponent } from './portal';
import { LikedModelsResolver } from './model/list/liked-models.resolver';
import { LikedWorldsResolver } from './world/list/liked-worlds.resolver';
import { LogfileScoreDialogComponent } from './logfile';
import { LogfileService } from './logfile';
import { MetadataComponent } from './metadata';
import { ModelComponent } from './model/model.component';
import { ModelListComponent } from './model/list/model-list.component';
import { ModelResolver } from './model/model.resolver';
import { ModelService } from './model/model.service';
import { NewLogfileDialogComponent } from './logfile';
import { NewModelComponent } from './model/new/new-model.component';
import { NewModelGuard } from './model/new/new-model-guard.service';
import { NewOrganizationDialogComponent } from './organization';
import { NewWorldComponent } from './world/new/new-world.component';
import { NewWorldGuard } from './world/new/new-world-guard.service';
import { Ng2DeviceService } from './device-detector';
import { OrganizationComponent } from './organization/organization.component';
import { OrganizationService } from './organization/organization.service';
import { OwnerCollectionsResolver } from './collection/list/owner-collections.resolver';
import { OwnerProfileResolver } from './user/owner-profile.resolver';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PageTitleComponent } from './page-title/page-title.component';
import { PortalComponent } from './portal';
import { PortalListComponent } from './portal';
import { PortalListResolver } from './portal';
import { PortalRedirectGuard } from './portal/portal-redirect.guard';
import { PortalResolver } from './portal';
import { PortalService } from './portal/portal.service';
import { PublicCollectionsResolver } from './collection/list/public-collections.resolver';
import { PublicModelsResolver } from './model/list/public-models.resolver';
import { PublicWorldsResolver } from './world/list/public-worlds.resolver';
import { RegistrationDialogComponent } from './portal';
import { ReportDialogComponent } from './fuel-resource/report-dialog/report-dialog.component';
import { SdfViewerComponent } from './model/sdfviewer/sdfviewer.component';
import { SearchComponent } from './search/search.component';
import { SettingsComponent } from './settings';
import { SimulationActionsComponent } from './cloudsim';
import { SimulationComponent } from './cloudsim/detail/simulation.component';
import { SimulationResolver } from './cloudsim/detail/simulation.resolver';
import { SimulationRulesComponent } from './admin/cloudsim/rules/simulation-rules.component';
import { SimulationService } from './cloudsim';
import { SimulationTableComponent } from './cloudsim';
import {
  SimVisualizerComponent
} from './admin/cloudsim/visualizer-tester/sim-visualizer-tester.component';
import { TagsComponent } from './tags';
import { TextInputDialogComponent } from './text-input-dialog/text-input-dialog.component';
import { UserComponent } from './user/user.component';
import { UserModelsResolver } from './model/list/user-models.resolver';
import { UserService } from './user/user.service';
import { UserWorldsResolver } from './world/list/user-worlds.resolver';
import { WebsocketService } from './cloudsim/websocket/sim-websocket.service';
import { WorldComponent } from './world/world.component';
import { WorldListComponent } from './world/list/world-list.component';
import { WorldResolver } from './world/world.resolver';
import { WorldService } from './world/world.service';

/**
 * Entry point.
 */
@NgModule({
  bootstrap: [ AppComponent ],
  /**
   * Array of local components and pipes.
   */
  declarations: [
    AccessTokenDialogComponent,
    AdminCloudsimComponent,
    AdminComponent,
    AdminElasticsearchComponent,
    APIComponent,
    AppComponent,
    AssetDisplayComponent,
    AuthCallbackComponent,
    AuthPipe,
    CategoriesComponent,
    CollectionComponent,
    CollectionDialogComponent,
    CollectionListComponent,
    ConfirmationDialogComponent,
    CopyDialogComponent,
    DashboardComponent,
    DescriptionComponent,
    DndDirective,
    DurationPipe,
    EditCollectionComponent,
    EditModelComponent,
    EditWorldComponent,
    ElasticsearchConfigDialogComponent,
    ExtraDialogComponent,
    FileSizePipe,
    FileUploadComponent,
    FuelHomeComponent,
    FuelResourceListComponent,
    InformationComponent,
    ItemCardComponent,
    LaunchQueueComponent,
    LeaderBoardComponent,
    LogfileScoreDialogComponent,
    MetadataComponent,
    ModelComponent,
    ModelListComponent,
    NewLogfileDialogComponent,
    NewModelComponent,
    NewOrganizationDialogComponent,
    NewWorldComponent,
    OrganizationComponent,
    PageNotFoundComponent,
    PageTitleComponent,
    PortalComponent,
    PortalListComponent,
    RegistrationDialogComponent,
    ReportDialogComponent,
    SdfViewerComponent,
    SearchComponent,
    SettingsComponent,
    SimulationActionsComponent,
    SimulationComponent,
    SimulationRulesComponent,
    SimulationTableComponent,
    SimVisualizerComponent,
    TagsComponent,
    TextInputDialogComponent,
    UserComponent,
    WorldComponent,
    WorldListComponent,
  ],
  /**
   * Import the used modules.
   */
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    InfiniteScrollModule,
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
    NgxGalleryModule,
    ReactiveFormsModule,
    RouterModule.forRoot(ROUTES, { useHash: false, preloadingStrategy: PreloadAllModules }),
  ],
  /**
   * Expose our Services and Providers into Angular's dependency injection.
   */
  providers: [
    AdminElasticsearchService,
    AdminGuard,
    AuthGuard,
    AuthService,
    CategoryService,
    CollectionResolver,
    CollectionService,
    JsonClassFactoryService,
    LikedModelsResolver,
    LikedWorldsResolver,
    LogfileService,
    ModelResolver,
    ModelService,
    NewModelGuard,
    NewWorldGuard,
    Ng2DeviceService,
    OrganizationService,
    OwnerCollectionsResolver,
    OwnerProfileResolver,
    PortalListResolver,
    PortalRedirectGuard,
    PortalResolver,
    PortalService,
    PublicCollectionsResolver,
    PublicModelsResolver,
    PublicWorldsResolver,
    SimulationResolver,
    SimulationService,
    Title,
    UserModelsResolver,
    UserService,
    UserWorldsResolver,
    WebsocketService,
    WorldResolver,
    WorldService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: OverlayContainer,
      useClass: FullscreenOverlayContainer
    }
  ],
  entryComponents: [
    AccessTokenDialogComponent,
    CollectionDialogComponent,
    ConfirmationDialogComponent,
    CopyDialogComponent,
    ElasticsearchConfigDialogComponent,
    ExtraDialogComponent,
    LogfileScoreDialogComponent,
    NewLogfileDialogComponent,
    NewOrganizationDialogComponent,
    RegistrationDialogComponent,
    ReportDialogComponent,
    TextInputDialogComponent,
  ]
})
export class AppModule {

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
  ) {
    // This was taken from https://materialdesignicons.com/getting-started
    matIconRegistry.addSvgIconSet(
      domSanitizer.bypassSecurityTrustResourceUrl('./assets/icon/mdi.svg'));
    matIconRegistry.addSvgIcon('ign-world',
      domSanitizer.bypassSecurityTrustResourceUrl('./assets/icon/world.svg'));
    matIconRegistry.addSvgIcon('ign-model',
      domSanitizer.bypassSecurityTrustResourceUrl('./assets/icon/model.svg'));
  }
}
