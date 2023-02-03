import { NgModule } from '@angular/core';
import { RouterModule, Routes, ActivatedRoute } from '@angular/router';

import { AdminCloudsimComponent } from './admin/cloudsim/admin-cloudsim.component';
import { AdminComponent } from './admin';
import { AdminElasticsearchComponent } from './admin/elasticsearch/admin-elasticsearch.component';
import { AdminGuard } from './admin/admin-guard.service';
import { ApplicationsComponent } from './applications/applications.component';
import { AuthGuard } from './auth/auth-guard.service';
import { CollectionComponent } from './collection/collection.component';
import { CollectionListComponent } from './collection/list/collection-list.component';
import { CollectionResolver } from './collection/collection.resolver';
import { EditCollectionComponent } from './collection/edit/edit-collection.component';
import { EditModelComponent } from './model/edit/edit-model.component';
import { EditWorldComponent } from './world/edit/edit-world.component';
import { LikedModelsResolver } from './model/list/liked-models.resolver';
import { LikedWorldsResolver } from './world/list/liked-worlds.resolver';
import { ModelComponent } from './model/model.component';
import { ModelListComponent } from './model/list/model-list.component';
import { ModelResolver } from './model/model.resolver';
import { NewModelComponent } from './model/new/new-model.component';
import { NewModelGuard } from './model/new/new-model-guard.service';
import { NewWorldComponent } from './world/new/new-world.component';
import { NewWorldGuard } from './world/new/new-world-guard.service';
import { OrganizationComponent } from './organization';
import { OwnerCollectionsResolver } from './collection/list/owner-collections.resolver';
import { OwnerProfileResolver } from './user/owner-profile.resolver';
import { PublicCollectionsResolver } from './collection/list/public-collections.resolver';
import { PublicModelsResolver } from './model/list/public-models.resolver';
import { PublicWorldsResolver } from './world/list/public-worlds.resolver';
import { SearchComponent } from './search';
import { SettingsComponent } from './settings';
import { SimulationComponent } from './cloudsim/detail/simulation.component';
import { SimulationResolver } from './cloudsim/detail/simulation.resolver';
import { UserComponent } from './user/user.component';
import { UserModelsResolver } from './model/list/user-models.resolver';
import { UserWorldsResolver } from './world/list/user-worlds.resolver';
import { VisualizationComponent } from './visualization';
import { WorldComponent } from './world/world.component';
import { WorldListComponent } from './world/list/world-list.component';
import { WorldResolver } from './world/world.resolver';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'api',
    loadComponent: () => import('./api/api.component').then(module => module.APIComponent),
    data: {
      titlebarTitle: 'Information',
      titlebarSubtitle: 'API'
    }
  },
  {
    path: 'information',
    loadComponent: () => import('./information/information.component').then(module => module.InformationComponent),
    data: {
      titlebarTitle: 'Information',
      titlebarSubtitle: ''
    }
  },
  {
    path: 'home',
    loadComponent: () => import('./dashboard/dashboard.component').then(module => module.DashboardComponent),
    data: {
      titlebarTitle: 'Dashboard',
      titlebarSubtitle: ''
    }
  },
  {
    path: 'visualization',
    component: VisualizationComponent,
    data: {
      titlebarTitle: 'Visualization',
      titlebarSubtitle: ''
    }
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: AdminComponent,
        data: {
          title: 'Administration',
          titlebarTitle: 'Admin',
        },
      },
      {
        path: 'cloudsim',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: AdminCloudsimComponent,
            data: {
              titlebarTitle: 'Admin',
              titlebarSubtitle: 'Cloudsim',
            },
          },
          {
            path: ':groupId',
            pathMatch: 'full',
            loadComponent: () => import(
              './asset-display/asset-display.component'
            ).then(module => module.AssetDisplayComponent),
            resolve: {
              resolvedData: SimulationResolver
            },
            data: {
              component: SimulationComponent,

              titlebarTitle: 'Cloudsim',
              titlebarSubtitle: 'Simulation Details',
              title: (route: ActivatedRoute) => {
                return route.snapshot.params['groupId'];
              }
            },
          }
        ],
      },
      {
        path: 'elasticsearch',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: AdminElasticsearchComponent,
            data: {
              titlebarTitle: 'Admin',
              titlebarSubtitle: 'Elasticsearch',
            },
          },
        ],
      },
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(module => module.DashboardComponent),
    data: {
      titlebarTitle: 'Dashboard',
      titlebarSubtitle: ''
    }
  },
  {
    path: 'fuel',
    loadComponent: () => import('./fuel-home/fuel-home.component').then(module => module.FuelHomeComponent),
    data: {
      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Assets for robotic apps'
    }
  },
  {
    path: 'applications',
    component: ApplicationsComponent,
    data: {
      titlebarTitle: 'Applications',
      titlebarSubtitle: ''
    }
  },
  {
    path: 'settings',
    component: SettingsComponent,
    data: {
      titlebarTitle: 'Settings',
      titlebarSubtitle: '',
      title: 'Settings'
    }
  },
  {
    path: 'search',
    component: SearchComponent,
    pathMatch: 'full',
    data: {
      titlebarTitle: 'Search Results',
      titlebarSubtitle: '',
      title: 'Search Results'
    },
  },
  {
    path: 'simulations',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '/home'
      },
      {
        path: ':groupId',
        loadComponent: () => import(
          './asset-display/asset-display.component'
        ).then(module => module.AssetDisplayComponent),
        pathMatch: 'full',
        resolve: {
          resolvedData: SimulationResolver
        },
        data: {
          component: SimulationComponent,
          titlebarTitle: 'Cloudsim',
          titlebarSubtitle: 'Simulation Details',
          title: (route: ActivatedRoute) => {
            return route.snapshot.params['groupId'];
          }
        },
      },
    ],
  },
  {
    path: 'models',
    redirectTo: 'fuel/models'
  },
  {
    path: 'fuel/models',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    pathMatch: 'full',
    data: {
      component: ModelListComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Latest Models',

      title: (route: ActivatedRoute) => {
        const search = route.snapshot.params['q'];
        if (search !== undefined && search !== '') {
          return `Search results for \"${search}\"`;
        }
        return 'Latest models';
      }
    },
    resolve: {
      resolvedData: PublicModelsResolver
    }
  },
  {
    path: 'models/upload',
    redirectTo: 'fuel/models/upload'
  },
  {
    path: 'fuel/models/upload',
    component: NewModelComponent,
    canActivate: [NewModelGuard],
    pathMatch: 'full',
    data: {
      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Model Upload',

      title: 'Upload a new model'
    }
  },
  {
    path: 'worlds',
    redirectTo: 'fuel/worlds'
  },
  {
    path: 'fuel/worlds',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    pathMatch: 'full',
    data: {

      component: WorldListComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Latest Worlds',

      title: (route: ActivatedRoute) => {
        const search = route.snapshot.params['q'];
        if (search !== undefined && search !== '') {
          return `Search results for \"${search}\"`;
        }
        return 'Latest worlds';
      }
    },
    resolve: {
      resolvedData: PublicWorldsResolver
    }
  },
  {
    path: 'worlds/upload',
    redirectTo: 'fuel/worlds/upload'
  },
  {
    path: 'fuel/worlds/upload',
    component: NewWorldComponent,
    canActivate: [NewWorldGuard],
    pathMatch: 'full',
    data: {
      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'World Upload',

      title: 'Upload a new world'
    }
  },
  {
    path: 'collections',
    redirectTo: 'fuel/collections'
  },
  {
    path: 'fuel/collections',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: CollectionListComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Latest Collections',

      title: 'Latest collections'
    },
    resolve: {
      resolvedData: PublicCollectionsResolver
    },
  },
  {
    path: ':owner/models',
    redirectTo: ':owner/fuel/models'
  },
  {
    path: ':owner/fuel/models',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: ModelListComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'User Models',

      title: (route: ActivatedRoute) => {
        return `${route.snapshot.params['owner']}'s models`;
      }
    },
    resolve: {
      resolvedData: UserModelsResolver
    }
  },
  {
    path: ':owner/models/:modelname',
    redirectTo: ':owner/fuel/models/:modelname'
  },
  {
    path: ':owner/fuel/models/:modelname',
    pathMatch: 'full',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    resolve: {
      resolvedData: ModelResolver
    },
    data: {
      component: ModelComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Model Info',

      title: (route: ActivatedRoute) => {
        return route.snapshot.params['modelname'];
      }
    }
  },
  {
    path: ':owner/models/:modelname/edit',
    redirectTo: ':owner/fuel/models/:modelname/edit'
  },
  {
    path: ':owner/fuel/models/:modelname/edit',
    pathMatch: 'full',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: EditModelComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Model Edit',

      title: (route: ActivatedRoute) => {
        const model = route.snapshot.data['resolvedData'];
        return `Editing ${model.owner}'s ${model.name} model`;
      }
    },
    resolve: {
      resolvedData: ModelResolver
    }
  },
  {
    path: ':owner/models/:modelname/:version',
    redirectTo: ':owner/fuel/models/:modelname/:version'
  },
  {
  path: ':owner/fuel/models/:modelname/:version',
    pathMatch: 'full',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    resolve: {
      resolvedData: ModelResolver
    },
    data: {
      component: ModelComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Model Info',

      title: (route: ActivatedRoute) => {
        return route.snapshot.params['modelname'];
      }
    }
  },
  {
    path: ':user/likes/models',
    redirectTo: ':user/fuel/likes/models'
  },
  {
    path: ':user/fuel/likes/models',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: ModelListComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Liked Models',

      title: (route: ActivatedRoute) => {
        return `Models liked by ${route.snapshot.params['user']}`;
      }
    },
    resolve: {
      resolvedData: LikedModelsResolver
    }
  },
  {
    path: ':owner/worlds',
    redirectTo: ':owner/fuel/worlds'
  },
  {
    path: ':owner/fuel/worlds',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: WorldListComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'User Worlds',

      title: (route: ActivatedRoute) => {
        return `${route.snapshot.params['owner']}'s worlds`;
      }
    },
    resolve: {
      resolvedData: UserWorldsResolver
    }
  },
  {
    path: ':owner/worlds/:worldname',
    redirectTo: ':owner/fuel/worlds/:worldname'
  },
  {
    path: ':owner/fuel/worlds/:worldname',
    pathMatch: 'full',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    resolve: {
      resolvedData: WorldResolver
    },
    data: {
      component: WorldComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'World Info',

      title: (route: ActivatedRoute) => {
        return route.snapshot.params['worldname'];
      }
    }
  },
  {
    path: ':owner/worlds/:worldname/edit',
    redirectTo: ':owner/fuel/worlds/:worldname/edit'
  },
  {
    path: ':owner/fuel/worlds/:worldname/edit',
    pathMatch: 'full',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: EditWorldComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'World Edit',

      title: (route: ActivatedRoute) => {
        const world = route.snapshot.data['resolvedData'];
        return `Editing ${world.owner}'s ${world.name} world`;
      }
    },
    resolve: {
      resolvedData: WorldResolver
    }
  },
  {
    path: ':owner/worlds/:worldname/:version',
    redirectTo: ':owner/fuel/worlds/:worldname/:version'
  },
  {
  path: ':owner/fuel/worlds/:worldname/:version',
    pathMatch: 'full',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    resolve: {
      resolvedData: WorldResolver
    },
    data: {
      component: WorldComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'World Info',

      title: (route: ActivatedRoute) => {
        return route.snapshot.params['worldname'];
      }
    }
  },
  {
    path: ':user/likes/worlds',
    redirectTo: ':user/fuel/likes/worlds'
  },
  {
    path: ':user/fuel/likes/worlds',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: WorldListComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Liked Worlds',

      title: (route: ActivatedRoute) => {
        return `Worlds liked by ${route.snapshot.params['user']}`;
      }
    },
    resolve: {
      resolvedData: LikedWorldsResolver
    }
  },
  {
    path: ':user/collections',
    redirectTo: ':user/fuel/collections'
  },
  {
    path: ':user/fuel/collections',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: CollectionListComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'User Collections',

      title: (route: ActivatedRoute) => {
        return `${route.snapshot.params['user']}'s collections`;
      }
    },
    resolve: {
      resolvedData: OwnerCollectionsResolver
    },
  },
  {
    path: ':user/collections/:collection',
    redirectTo: ':user/fuel/collections/:collection'
  },
  {
    path: ':user/fuel/collections/:collection',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: CollectionComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Collection Info',

      title: (route: ActivatedRoute) => {
        return route.snapshot.params['collection'];
      }
    },
    resolve: {
      resolvedData: CollectionResolver
    },
  },
  {
    path: ':user/collections/:collection/edit',
    redirectTo: ':user/fuel/collections/:collection/edit'
  },
  {
    path: ':user/fuel/collections/:collection/edit',
    pathMatch: 'full',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      component: EditCollectionComponent,

      titlebarTitle: 'Fuel',
      titlebarSubtitle: 'Collection Edit',

      title: (route: ActivatedRoute) => {
        const collection = route.snapshot.data['resolvedData'];
        return `Editing ${collection.owner}'s ${collection.name} collection`;
      }
    },
    resolve: {
      resolvedData: CollectionResolver
    }
  },
  {
    path: 'callback',
    loadComponent: () => import('./auth/callback.component').then(module => module.AuthCallbackComponent),
  },
  {
    path: ':name',
    loadComponent: () => import(
      './asset-display/asset-display.component'
    ).then(module => module.AssetDisplayComponent),
    data: {
      // Note: As the resolver determines which component to display, both need to be added at the
      // route configuration level in order for Angular to provide a Factory for them.
      component: [OrganizationComponent, UserComponent],

      titlebarTitle: 'Profile',
      titlebarSubtitle: '',

      title: (route: ActivatedRoute) => {
        return route.snapshot.params['name'];
      }
    },
    resolve: {
      resolvedData: OwnerProfileResolver,
    },
  },
  {
    path: '**',
    loadComponent: () => import(
      './page-not-found/page-not-found.component'
    ).then(module => module.PageNotFoundComponent),
    data: {

      titlebarTitle: 'Page not found',
      titlebarSubtitle: '',

      title: 'Page not found'
    }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled',
    onSameUrlNavigation: 'reload',
    scrollPositionRestoration: 'enabled',
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
