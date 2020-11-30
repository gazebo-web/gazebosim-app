import { HttpClient } from '@angular/common/http';
import { PipeTransform, Pipe, OnDestroy } from '@angular/core';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Pipe used to get a resource using an explicit GET request that contains an Authorization header.
 *
 * Usage:
 * <img *ngIf="(url | ignAuthHeader | async) as result" [src]=result>
 */
@Pipe({name: 'ignAuthHeader'})
export class AuthPipe implements PipeTransform, OnDestroy {

  /**
   * The URL of the resource obtained by the Pipe.
   */
  public resourceUrl;

  /**
   * @param http To make requests to the Server.
   * @param sanitizer To allow the constructed Blob object.
   */
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
  }

  /**
   * The URL created must be revoked.
   */
  public ngOnDestroy(): void {
    if (this.resourceUrl) {
      URL.revokeObjectURL(this.resourceUrl);
    }
  }

  /**
   * Transform method of the Pipe.
   * Takes a URL and explicitly makes the GET request to the Server. This appends the
   * Authorization header to the request, allowing Private resources to be used.
   *
   * @param url The URL of the resource.
   */
  public transform(url: string): Observable<SafeUrl> {
    return this.http.get(url, {responseType: 'blob'}).pipe(
      map((response) => {
        this.resourceUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(response));
        return this.resourceUrl;
      })
    );
  }
}
