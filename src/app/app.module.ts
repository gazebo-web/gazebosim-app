import { BrowserModule, DomSanitizer, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MomentModule } from 'angular2-moment';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxGalleryModule } from 'ngx-gallery';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';

import {
  NgModule,
  ApplicationRef
} from '@angular/core';
import {
  removeNgStyles,
  createNewHosts,
  createInputTransfer
} from '@angularclass/hmr';
import {
  RouterModule,
  PreloadAllModules
} from '@angular/router';

import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDialogModule,
  MatIconModule,
  MatIconRegistry,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatOptionModule,
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
} from '@angular/material';
import 'hammerjs';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';
// App is our top level component
import { AppComponent } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';

import { AccessTokenDialogComponent } from './settings/access-token-dialog.component';
import { AdminCloudsimComponent } from './admin/cloudsim/admin-cloudsim.component';
import { AdminComponent } from './admin';
import { AdminGuard } from './admin/admin-guard.service';
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
import { EditCollectionComponent } from './collection/edit/edit-collection.component';
import { EditModelComponent } from './model/edit/edit-model.component';
import { EditWorldComponent } from './world/edit/edit-world.component';
import { ExtraDialogComponent } from './cloudsim/extra-dialog/extra-dialog.component';
import { FileSizePipe } from './file-size/file-size.pipe';
import { FileUploadComponent } from './file-upload';
import { FuelHomeComponent } from './fuel-home';
import { FuelResourceListComponent } from './fuel-resource';
import { FuelResourceService } from './fuel-resource';
import { ItemCardComponent } from './item-card/item-card.component';
import { JsonClassFactoryService } from './factory/json-class-factory.service';
import { LaunchQueueComponent } from './admin/cloudsim/launch-queue/launch-queue.component';
import { LeaderBoardComponent } from './portal';
import { LikedModelsResolver } from './model/list/liked-models.resolver';
import { LikedWorldsResolver } from './world/list/liked-worlds.resolver';
import { LogfileScoreDialogComponent } from './logfile';
import { LogfileService } from './logfile';
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
import { PortalService } from './portal';
import { PublicCollectionsResolver } from './collection/list/public-collections.resolver';
import { PublicModelsResolver } from './model/list/public-models.resolver';
import { PublicWorldsResolver } from './world/list/public-worlds.resolver';
import { RegistrationDialogComponent } from './portal';
import { ReportDialogComponent } from './fuel-resource/report-dialog/report-dialog.component';
import { SdfViewerComponent } from './model/sdfviewer/sdfviewer.component';
import { SearchComponent } from './search/search.component';
import { SearchbarComponent } from './searchbar/searchbar.component';
import { SettingsComponent } from './settings';
import { SimulationActionsComponent } from './cloudsim';
import { SimulationRulesComponent } from './admin/cloudsim/rules/simulation-rules.component';
import { SimulationService } from './cloudsim';
import { SimulationTableComponent } from './cloudsim';
import { TagsComponent } from './tags';
import { TextInputDialogComponent } from './text-input-dialog/text-input-dialog.component';
import { UserComponent } from './user/user.component';
import { UserModelsResolver } from './model/list/user-models.resolver';
import { UserService } from './user/user.service';
import { UserWorldsResolver } from './world/list/user-worlds.resolver';
import { WorldComponent } from './world/world.component';
import { WorldListComponent } from './world/list/world-list.component';
import { WorldResolver } from './world/world.resolver';
import { WorldService } from './world/world.service';

import '../styles/styles.scss';
import '../styles/custom-theme.scss';

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AdminGuard,
  AppState,
  AuthGuard,
  AuthService,
  CategoryService,
  CollectionResolver,
  CollectionService,
  FuelResourceService,
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
  SimulationService,
  Title,
  UserModelsResolver,
  UserService,
  UserWorldsResolver,
  WorldResolver,
  WorldService,
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true,
  }
];

interface StoreType  {
  state: InternalStateType;
  restoreInputValues: () => void;
  disposeOldHosts: () => void;
}

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [
    AccessTokenDialogComponent,
    AdminCloudsimComponent,
    AdminComponent,
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
    EditCollectionComponent,
    EditModelComponent,
    EditWorldComponent,
    ExtraDialogComponent,
    FileSizePipe,
    FileUploadComponent,
    FuelHomeComponent,
    FuelResourceListComponent,
    ItemCardComponent,
    LaunchQueueComponent,
    LeaderBoardComponent,
    LogfileScoreDialogComponent,
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
    SearchbarComponent,
    SettingsComponent,
    SimulationActionsComponent,
    SimulationRulesComponent,
    SimulationTableComponent,
    TagsComponent,
    TextInputDialogComponent,
    UserComponent,
    WorldComponent,
    WorldListComponent,
  ],
  /**
   * Import Angular's modules.
   */
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    InfiniteScrollModule,
    MarkdownModule.forRoot({
      provide: MarkedOptions,
        useValue: {
          sanitize: true,
          gfm: true,
          breaks: true,
        },
      }),
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatOptionModule,
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
    ENV_PROVIDERS,
    APP_PROVIDERS,
  ],
  entryComponents: [
    AccessTokenDialogComponent,
    CollectionDialogComponent,
    ConfirmationDialogComponent,
    CopyDialogComponent,
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
    public appRef: ApplicationRef,
    public appState: AppState,
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

  public hmrOnInit(store: StoreType) {
    if (!store || !store.state) {
      return;
    }
    console.log('HMR store', JSON.stringify(store, null, 2));
    /**
     * Set state
     */
    this.appState._state = store.state;
    /**
     * Set input values
     */
    if ('restoreInputValues' in store) {
      const restoreInputValues = store.restoreInputValues;
      setTimeout(restoreInputValues);
    }

    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  public hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map((cmp) => cmp.location.nativeElement);
    /**
     * Save state
     */
    const state = this.appState._state;
    store.state = state;
    /**
     * Recreate root elements
     */
    store.disposeOldHosts = createNewHosts(cmpLocation);
    /**
     * Save input values
     */
    store.restoreInputValues  = createInputTransfer();
    /**
     * Remove styles
     */
    removeNgStyles();
  }

  public hmrAfterDestroy(store: StoreType) {
    /**
     * Display new elements
     */
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }
}
