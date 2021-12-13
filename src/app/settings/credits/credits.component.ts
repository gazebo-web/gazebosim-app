import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StripeService } from 'ngx-stripe';
import { switchMap } from 'rxjs/operators';
import { CreditsService } from './credits.service';

@Component({
  selector: 'ign-credits',
  templateUrl: 'credits.component.html',
  styleUrls: ['credits.component.scss']
})

/**
 * Credits Component allows users to buy credits and other tasks related to the billing system.
 */
export class CreditsComponent implements OnInit {

  /**
   * Credit balance of the user.
   */
  public credits: number;

  /**
   * @param creditsService The Service used to communicate with the Billing backend.
   * @param stripeService The Service used to communicate with Stripe.
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    private creditsService: CreditsService,
    private snackBar: MatSnackBar,
    private stripeService: StripeService,
  ) {}

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    this.getCredits();
  }

  /**
   * Get the credit balance from the Billing endpoint.
   */
  public getCredits(): void {
    // Get the credit balance from the Billing endpoint.
    this.creditsService.getBalance().subscribe((credits) => {
      this.credits = credits;
    });
  }

  /**
   * Callback of the buy credits button.
   */
  public buy(): void {
    // Use the Billing Service in order to buy more credits.
    this.creditsService.createSession()
      .pipe(
        switchMap((createdSession) => {
          return this.stripeService.redirectToCheckout({
            sessionId: createdSession['session'],
          });
        })
      )
      .subscribe((result) => {
        // From Ngx-Stripe:
        // If `redirectToCheckout` fails due to a browser or network
        // error, you should display the localized error message to your
        // customer using `error.message`.
        if (result.error) {
          this.snackBar.open(result.error.message, 'Got it');
        }
      });
  }
}
