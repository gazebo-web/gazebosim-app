import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';

declare const SwaggerUIBundle: any;

@Component({
  standalone: true,
  selector: 'gz-api',
  templateUrl: 'api.component.html',
  styleUrls: ['api.component.scss']
})

/**
 * API Component contains information about the API.
 */
export class APIComponent implements OnInit {

  /**
   * URL to the Fuel swagger definition
   */
  public fuelUrl: string = `${environment.API_HOST}/${environment.API_VERSION}/swagger.json`;

  /**
   * OnInit lifecycle hook.
   *
   * Get the resources to display.
   */
  public ngOnInit(): void {
    const ui = SwaggerUIBundle({
      dom_id: '#swagger-ui',
      layout: 'BaseLayout',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      url: this.fuelUrl,
      docExpansion: 'none',
      operationsSorter: 'alpha'
    });
  }
}
