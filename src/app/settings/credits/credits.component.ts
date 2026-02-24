import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CreditsService } from "./credits.service";

@Component({
  selector: "gz-credits",
  templateUrl: "credits.component.html",
  styleUrls: ["credits.component.scss"],
  standalone: false,
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
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    private creditsService: CreditsService,
    private snackBar: MatSnackBar,
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
   * Redirects to Stripe Checkout using the session URL from the billing backend.
   */
  public buy(): void {
    // Use the Billing Service in order to create a Stripe Checkout session.
    this.creditsService.createSession().subscribe({
      next: (createdSession) => {
        // Redirect to the Stripe Checkout URL provided by the backend.
        // In @stripe/stripe-js v8+, redirectToCheckout was removed.
        // The backend should return a checkout URL or session ID.
        const checkoutUrl =
          createdSession["url"] || createdSession["session_url"];
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          this.snackBar.open("Unable to create checkout session", "Got it");
        }
      },
      error: (error) => {
        this.snackBar.open(
          error.message || "Failed to create checkout session",
          "Got it",
        );
      },
    });
  }
}
