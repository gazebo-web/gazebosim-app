import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MatSnackBar, PageEvent } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { AuthService } from '../auth/auth.service';
import { Logfile,
  PaginatedLogfile,
  LogfileService,
  LogfileScoreDialogComponent,
  NewLogfileDialogComponent } from '../logfile';
import { PaginatedOrganizations, Organization } from '../organization';
import { Portal, PortalService } from '../portal';
import { RegistrationDialogComponent, Registration, PaginatedRegistration } from '../portal';
import { TextInputDialogComponent } from '../text-input-dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog';

import * as FileSaver from 'file-saver';

@Component({
  selector: 'ign-portal',
  templateUrl: 'portal.component.html',
  styleUrls: ['portal.component.scss']
})

/**
 * Portal Component is the page that display the details of a portal.
 */
export class PortalComponent implements OnInit {

  /**
   * The portal represented by this Component. It is fetched using a Route Resolver.
   */
  public portal: Portal;

  /**
   * List of the paginated pending logfiles.
   */
  public pendingPaginatedLogfiles: PaginatedLogfile;

  /**
   * List of the paginated done (scored) logfiles.
   */
  public donePaginatedLogfiles: PaginatedLogfile;

  /**
   * List of the paginated rejected logfiles.
   */
  public rejectedPaginatedLogfiles: PaginatedLogfile;

  /**
   * List of pending registrations.
   */
  public pendingRegistrations: Registration[] = [];

  /**
   * List of paginated pending registrations.
   */
  public paginatedPendingRegistrations: PaginatedRegistration;

  /**
   * List of participants (paginated).
   */
  public paginatedParticipants: PaginatedOrganizations;

  /**
   * List of rejected registrations.
   */
  public rejectedRegistrations: Registration[] = [];

  /**
   * Event to handle changes on the Paginator elements.
   */
  public pageEvent: PageEvent;

  /**
   * Dialog to send the registration request.
   */
  public registrationDialog: MatDialogRef<RegistrationDialogComponent>;

  /**
   * Dialog to upload a logfile.
   */
  public newLogfileDialog: MatDialogRef<NewLogfileDialogComponent>;

  /**
   * Dialog to score a logfile.
   */
  private scoreDialog: MatDialogRef<LogfileScoreDialogComponent>;

  /**
   * Dialog to provide a comment. Used to reject registrations.
   */
  private inputDialog: MatDialogRef<TextInputDialogComponent>;

  /**
   * Simple confirmation dialog.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param authService Service to get authentication details
   * @param dialog Allows the use dialogs.
   * @param logfileService Service used to handle logfiles from the Server.
   * @param portalService Service used to handle portals from the Server.
   * @param snackBar Snackbar used to display notifications
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    public dialog: MatDialog,
    public logfileService: LogfileService,
    public portalService: PortalService,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the portal obtained from the Route Resolver.
   */
  public ngOnInit(): void {
    if (this.activatedRoute.snapshot.data['resolvedData'] !== undefined) {
      this.portal = this.activatedRoute.snapshot.data['resolvedData'];
    }

    // Only receive information if the user is logged in.
    if (this.authService.isAuthenticated()) {
      // Check if there is a participant organization that the User is part of.
      // If there are, then the user is registered and will be able to interact with the portal.
      this.getParticipants();

      // Get the pending registrations.
      this.getPendingRegistrations();

      // Get the logfiles.
      this.getPendingLogfiles();
      this.getDoneLogfiles();
      this.getRejectedLogfiles();
    }
  }

  /**
   * Start the registration process.
   *
   * Opens a dialog to let the user request registration. In order to register, the user must
   * provide an organization they have write access to.
   */
  public registration(): void {

    const dialogOptions = {
      data: {
        portal: this.portal,
      }
    };

    this.registrationDialog = this.dialog.open(RegistrationDialogComponent, dialogOptions);

    // Subscribe to the registration event coming from the Dialog.
    const sub: Subscription = this.registrationDialog.componentInstance.onRegister.subscribe(
      (organization) => {
        this.portalService.sendRegistrationRequest(organization).subscribe(
          (response) => {
            this.registrationDialog.close();
            this.pendingRegistrations.push(response);
            this.snackBar.open(
              `Registration request sent for ${response.participant}`,
              'Got it',
              { duration: 2750 });
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      }
    );

    // Unsubscribe from the registration event.
    this.registrationDialog.afterClosed().subscribe(() => sub.unsubscribe());
  }

  /**
   * Approve a registration request.
   * Only competition admins will have access to the element that calls this method.
   */
  public approveRegistration(registration: Registration): void {
    // Update the request.
    this.portalService.modifyRegistration(registration.participant, true).subscribe(
      (response) => {
        // Remove from Pending.
        // The response is the modified request. We need to look for the index of the participant.
        const index = this.pendingRegistrations.map(
          (reg) => reg.participant).indexOf(response.participant);
        this.pendingRegistrations.splice(index, 1);

        // Refresh the Participants.
        this.getParticipants();
        this.snackBar.open(`${response.participant} successfully joined ${this.portal.name}.`,
          'Got it');
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      });
  }

  /**
   * Reject a pending registration.
   * Only competition admins will have access to the element that calls this method.
   */
  public rejectRegistration(registration: Registration) {

    // Open a dialog for text input.
    const dialogOptions = {
      data: {
        title: `Reject registration of ${registration.participant}`,
        message: `<p>Are you sure you want to reject the registration request of \
          ${registration.participant}?</p><p>Please write the reason below.</p>`,
        buttonText: 'Reject',
        inputPlaceholder: 'Reason',
      }
    };
    this.inputDialog = this.dialog.open(TextInputDialogComponent, dialogOptions);

    // Subscribe to the registration event coming from the Dialog.
    const sub: Subscription = this.inputDialog.componentInstance.onSubmit.subscribe(
      (comment: string) => {
        // Update the request.
        this.portalService.modifyRegistration(registration.participant, false, comment).subscribe(
          (response) => {
            // Remove from Pending.
            // The response is the modified request. We need to look for the index of
            // the participant.
            const index = this.pendingRegistrations.map(
              (reg) => reg.participant).indexOf(response.participant);
            this.pendingRegistrations.splice(index, 1);
            this.snackBar.open(`${response.participant} request was rejected.`, 'Got it');
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      }
    );

    // Unsubscribe from the dialog event.
    this.inputDialog.afterClosed().subscribe(() => sub.unsubscribe());
  }

  /**
   * Remove a registered participant.
   * Only competition admins will have access to the element that calls this method.
   */
  public removeParticipant(org: Organization) {

    // Open a dialog for text input.
    const dialogOptions = {
      data: {
        title: `Remove participant ${org.name}`,
        message: `<p>Are you sure you want to remove the participant \
          ${org.name}?</p><p>Please write the reason below.</p>`,
        buttonText: 'Remove',
        inputPlaceholder: 'Reason',
      }
    };
    this.inputDialog = this.dialog.open(TextInputDialogComponent, dialogOptions);

    // Subscribe to the registration event coming from the Dialog.
    const sub: Subscription = this.inputDialog.componentInstance.onSubmit.subscribe(
      (comment: string) => {
        // Update the request.
        this.portalService.removeParticipant(org.name, comment).subscribe(
          (response) => {
            this.getParticipants();
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      }
    );

    // Unsubscribe from the dialog event.
    this.inputDialog.afterClosed().subscribe(() => sub.unsubscribe());
  }
  /**
   * Upload a Logfile
   */
  public uploadLogfile(): void {

    // Upload dialog
    const dialogOptions = {
      data: {
        portal: this.portal,
      }
    };

    this.newLogfileDialog = this.dialog.open(NewLogfileDialogComponent, dialogOptions);

    // Add the new logfile into the array.
    this.newLogfileDialog.afterClosed().subscribe(
      (response) => {
        if (response) {
          this.pendingPaginatedLogfiles.logfiles.push(new Logfile(response));
        }
      });
  }

  /**
   * Score a logfile.
   * Only competition admins will have access to the element that calls this method.
   *
   * @param logfile The logfile to score.
   * @param isRejected Optional. Whether the logfile was previously rejected or not.
   */
  public scoreLogfile(logfile: Logfile, isRejected?: boolean): void {
    // Open a dialog to score the logfile.
    const dialogOptions = {
      data: {
        logfile,
      }
    };

    this.scoreDialog = this.dialog.open(LogfileScoreDialogComponent, dialogOptions);

    // Update the modified logfile.
    this.scoreDialog.afterClosed().subscribe(
      (response) => {
        if (response) {
          let paginatedLogfile: PaginatedLogfile;
          if (isRejected) {
            paginatedLogfile = this.rejectedPaginatedLogfiles;
          } else {
            paginatedLogfile = this.pendingPaginatedLogfiles;
          }
          const logfiles: Logfile[] = paginatedLogfile.logfiles;
          // Remove from the logfiles.
          const index = logfiles.indexOf(logfile);
          logfiles.splice(index, 1);
          paginatedLogfile.totalCount -= 1;
          // Update the scored logfiles.
          this.donePaginatedLogfiles.logfiles.push(new Logfile(response));
          this.donePaginatedLogfiles.totalCount += 1;
        }
      });
  }

  /**
   * Reject a logfile.
   * Only competition admins will have access to the element that calls this method.
   */
  public rejectLogfile(logfile: Logfile): void {

    // Open a dialog for text input.
    const dialogOptions = {
      data: {
        title: `Reject the logfile ${logfile.name}`,
        message: `<p>Are you sure you want to reject this logfile?</p>\
          <p>Please write the reason below.</p>`,
        buttonText: 'Reject',
        inputPlaceholder: 'Reason',
      }
    };

    this.inputDialog = this.dialog.open(TextInputDialogComponent, dialogOptions);

    // Subscribe to the event coming from the Dialog.
    const sub: Subscription = this.inputDialog.componentInstance.onSubmit.subscribe(
      (comment: string) => {
        // Mark the logfile as Invalid.
        this.logfileService.modify(logfile.id, {status: 2, comments: comment}).subscribe(
          (response) => {
            // Remove the logfile from the pending list.
            const logfiles: Logfile[] = this.pendingPaginatedLogfiles.logfiles;
            const index = logfiles.indexOf(logfile);
            logfiles.splice(index, 1);
            this.pendingPaginatedLogfiles.totalCount -= 1;
            this.snackBar.open(`Logfile ${logfile.name} was rejected.`, 'Got it');
            // Update the rejected logfiles.
            this.rejectedPaginatedLogfiles.logfiles.push(new Logfile(response));
            this.rejectedPaginatedLogfiles.totalCount += 1;
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      }
    );

    // Unsubscribe from the dialog event.
    this.inputDialog.afterClosed().subscribe(() => sub.unsubscribe());
  }

  /**
   * Restore a logfile into the Pending list.
   *
   * @param logfile The logfile to restore.
   */
  public undoReject(logfile: Logfile): void {

    // Open a dialog for the confirmation.
    const dialogOptions = {
      data: {
        title: `Restore the logfile ${logfile.name}`,
        message: `<p>Are you sure you want to restore this logfile back to the <strong>Pending \
          logfiles</strong> list?</p>`,
        buttonText: 'Restore',
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOptions);

    // Subscribe to the event coming from the Dialog.
    this.confirmationDialog.afterClosed().subscribe(
      (response) => {
        if (response === true) {
          // Mark the logfile as pending.
          this.logfileService.modify(logfile.id, {status: 0, comments: ''}).subscribe(
            (restoredLogfile) => {
              // Remove the logfile from the rejected list.
              const logfiles = this.rejectedPaginatedLogfiles.logfiles.filter(
                (file) => {
                  return file !== logfile;
                }
              );
              this.rejectedPaginatedLogfiles.logfiles = logfiles;
              this.rejectedPaginatedLogfiles.totalCount -= 1;
              this.snackBar.open(`Logfile ${logfile.name} was restored.`, 'Got it');
              // Update the pending logfiles.
              this.pendingPaginatedLogfiles.logfiles.push(restoredLogfile);
              this.pendingPaginatedLogfiles.totalCount += 1;
            },
            (error) => {
              this.snackBar.open(error.message, 'Got it');
            }
          );
        }
      }
    );
  }

  /**
   * Download a Logfile
   */
  public downloadLogfile(logfile: Logfile): void {
    this.logfileService.download(logfile.id).subscribe(
      (file) => {
        FileSaver.saveAs(file, `${logfile.name}`);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      });
  }

  /**
   * Get the pending logfiles.
   *
   * @param pageEvent Optional. The event from the Paginator. Allows loading more resources.
   */
  public getPendingLogfiles(pageEvent?: PageEvent): void {
    let page = 1;
    if (pageEvent) {
      page = pageEvent.pageIndex + 1;
    }
    this.logfileService.getList('pending', page).subscribe(
      (paginatedLogfiles) => {
        this.pendingPaginatedLogfiles = paginatedLogfiles;
      }
    );
  }

  /**
   * Get the scored logfiles.
   *
   * @param pageEvent Optional. The event from the Paginator. Allows loading more resources.
   */
  public getDoneLogfiles(pageEvent?: PageEvent): void {
    let page = 1;
    if (pageEvent) {
      page = pageEvent.pageIndex + 1;
    }
    this.logfileService.getList('done', page).subscribe(
      (paginatedLogfiles) => {
        this.donePaginatedLogfiles = paginatedLogfiles;
      }
    );
  }

  /**
   * Get the rejected logfiles.
   *
   * @param pageEvent Optional. The event from the Paginator. Allows loading more resources.
   */
  public getRejectedLogfiles(pageEvent?: PageEvent): void {
    let page = 1;
    if (pageEvent) {
      page = pageEvent.pageIndex + 1;
    }
    this.logfileService.getList('rejected', page).subscribe(
      (paginatedLogfiles) => {
        this.rejectedPaginatedLogfiles = paginatedLogfiles;
      }
    );
  }

  /**
   * The title of the registration button.
   *
   * @returns The button title.
   */
  public registrationButtonTitle(): string {
    if (!this.authService.isAuthenticated()) {
      return 'Please sign in to register';
    }

    if (this.pendingRegistrations && this.pendingRegistrations.length > 0) {
      return 'There is a pending registration';
    }

    return 'Submit a registration';
  }

  /**
   * Helper method to get participants.
   *
   * @param pageEvent Optional. The event from the Paginator. Allows loading more resources.
   */
  public getParticipants(pageEvent?: PageEvent): void {
    let page = 1;
    if (pageEvent) {
      page = pageEvent.pageIndex + 1;
    }

    this.portalService.getParticipants(page).subscribe(
      (participants) => {
        this.paginatedParticipants = participants;
        if (page === 1) {
          this.portal.participants = participants.organizations;
        }
      }
    );
  }

  /**
   * Helper method to get the pending registration requests from the Server.
   *
   * @param pageEvent Optional. The event from the Paginator. Allows loading more resources.
   */
  public getPendingRegistrations(pageEvent?: PageEvent): void {
    let page = 1;
    if (pageEvent) {
      page = pageEvent.pageIndex + 1;
    }

    this.portalService.getRegistrationRequests('pending', page).subscribe(
      (response) => {
        this.paginatedPendingRegistrations = response;
        this.pendingRegistrations = response.registrations;
      }
    );
  }
}
