import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MatTableDataSource,
  MatSnackBar,
  PageEvent
} from '@angular/material';
import { Subscription } from 'rxjs/Subscription';
import { SimulationService } from '../../../cloudsim';
import { SimulationRule, PaginatedSimulationRules } from '../rules';
import { TextInputDialogComponent } from '../../../text-input-dialog';
import {
  ConfirmationDialogComponent
} from '../../../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'ign-simulation-rules',
  templateUrl: 'simulation-rules.component.html',
  styleUrls: ['simulation-rules.component.scss']
})

/**
 * The Simulation Rule Component allows system admins to create and modify simulation rules.
 */
export class SimulationRulesComponent implements OnChanges {

  /**
   * The paginated rules to be represented.
   */
  @Input() public paginatedRules: PaginatedSimulationRules;

  /**
   * The columns of the table.
   */
  public columns = [
    'circuit',
    'owner',
    'type',
    'value',
    'control',
  ];

  /**
   * List of rule types.
   * Note: Required because the html template cannot call static methods of classes.
   */
  public typeList: string[] = Array.from(SimulationRule.ruleTypes.keys());

  /**
   * Simulation rules to be used as the table's data source.
   * This should be created when this component's Input value changes.
   */
  public dataSource: MatTableDataSource<SimulationRule>;

  /**
   * Circuit used to create a new Rule.
   */
  public circuitInputForm = new FormControl('Tunnel Circuit', {validators: [Validators.required]});

  /**
   * Rule Type used to create a new Rule.
   */
  public typeInputForm = new FormControl(this.typeList[0], {validators: [Validators.required]});

  /**
   * Form field for the New Rule Owner input.
   */
  public ownerInputForm = new FormControl('', {validators: [Validators.required]});

  /**
   * Form field for the New Rule Value input.
   */
  public valueInputForm = new FormControl('', {validators: [Validators.required]});

  /**
   * Dialog to provide a value to an existing rule.
   */
  private inputDialog: MatDialogRef<TextInputDialogComponent>;

  /**
   * Confirmation dialog when a Rule is deleted.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param dialog Allows the use dialogs.
   * @param simulationService Service used to get the simulation rules from the Server.
   * @param snackBar Snackbar used to display notifications to the user.
   */
  constructor(
    public dialog: MatDialog,
    public simulationService: SimulationService,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnChange lifecycle hook.
   *
   * It is triggered by changes on the Input fields, in this case, the simulation rules.
   * This creates the data source for the Material table.
   *
   * @param changes The simple changes event, that contains the current and previous values.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    const newPaginatedRules = changes.paginatedRules.currentValue;
    if (newPaginatedRules) {
      this.dataSource = new MatTableDataSource(newPaginatedRules.rules);
    }
  }

  /**
   * Callback of the paginator element, in order to get more simulation rules.
   *
   * @param pageEvent The event from the Paginator. Contains the page to get.
   */
  public pageChange(pageEvent: PageEvent): void {
    const page = pageEvent.pageIndex + 1;

    this.simulationService.getRules({page}).subscribe(
      (response) => {
        this.paginatedRules = response;
        this.dataSource = new MatTableDataSource(response.rules);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }

  /**
   * Create rule callback.
   *
   * @param event The event fired by the form's submission. Required in order to reset the form.
   */
  public create(event: Event) {

    // Trim the inputs.
    this.ownerInputForm.setValue(this.ownerInputForm.value.trim());
    this.ownerInputForm.updateValueAndValidity();
    this.valueInputForm.setValue(this.valueInputForm.value.trim());
    this.valueInputForm.updateValueAndValidity();

    // Make sure the fields are valid to proceed.
    if (this.circuitInputForm.invalid || this.typeInputForm.invalid ||
        this.ownerInputForm.invalid || this.valueInputForm.invalid) {
      return;
    }

    // Create the rule.
    const rule = new SimulationRule({});
    rule.circuit = this.circuitInputForm.value;
    rule.owner = this.ownerInputForm.value;
    rule.type = SimulationRule.ruleTypes.get(this.typeInputForm.value);
    rule.value = this.valueInputForm.value;

    this.simulationService.editOrCreateRule(rule).subscribe(
      (response) => {

        // Update the rule if it's present, otherwise add it to the list.
        const existingRuleIndex: number = this.paginatedRules.rules.findIndex(
          (rl: SimulationRule) => {
            return rl.isEqual(response);
          }
        );

        if (existingRuleIndex > -1) {
          this.paginatedRules.rules[existingRuleIndex] = response;
          this.snackBar.open('The rule was updated', 'Got it', { duration: 2750 });
        } else {
          this.paginatedRules.rules.push(response);
          this.paginatedRules.totalCount++;
        }

        this.dataSource = new MatTableDataSource(this.paginatedRules.rules);

        // Reset the input fields.
        this.ownerInputForm.reset();
        this.valueInputForm.reset();

        // Reset the form. This cleans the errors of each form field.
        const formElement = event.target as HTMLFormElement;
        formElement.reset();
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }

  /**
   * Edit rule callback.
   *
   * @param rule The rule to modify.
   */
  public edit(rule: SimulationRule) {

    // Open a dialog for text input.
    const dialogOptions = {
      data: {
        title: `Edit a custom rule`,
        message: `<p>Provide a new value for the <strong>${rule.typeName}</strong> rule in the \
          <strong>${rule.circuit}</strong>, for the owner <strong>${rule.owner}</strong></p>\
          <p>Previous value: <strong>${rule.value}</strong></p>`,
        buttonText: 'Edit',
        inputPlaceholder: 'Value',
      }
    };
    this.inputDialog = this.dialog.open(TextInputDialogComponent, dialogOptions);

    // Subscribe to the registration event coming from the Dialog.
    const sub: Subscription = this.inputDialog.componentInstance.onSubmit.subscribe(
      (val: string) => {
        // Update the rule.
        const index = this.paginatedRules.rules.indexOf(rule);
        rule.value = +val;
        this.simulationService.editOrCreateRule(rule).subscribe(
          (response) => {
            this.paginatedRules.rules[index] = response;
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
   * Delete rule callback.
   *
   * @param rule The rule to delete.
   */
  public delete(rule: SimulationRule) {

    // Fire the confirmation dialog.
    const dialogOps = {
      data: {
        title: `Remove rule`,
        message: `<p>Are you sure you want to remove this rule?</p>\
          <ul><li>Circuit: ${rule.circuit}</li>\
          <li>Type: ${rule.typeName}</li>\
          <li>Owner: ${rule.owner}</li>\
          <li>Value: ${rule.value}</li></ul>`,
        buttonText: 'Delete',
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Callback when the Dialog is closed.
    this.confirmationDialog.afterClosed().subscribe(
      (result) => {
        // Filters any result that is not the main action.
        if (result !== true) {
          return;
        }

        // Remove the Rule.
        this.simulationService.deleteRule(rule).subscribe(
          (response) => {
            this.paginatedRules.rules = this.paginatedRules.rules.filter((rl) => {
              return !rl.isEqual(response);
            });
            this.paginatedRules.totalCount--;
            this.dataSource = new MatTableDataSource(this.paginatedRules.rules);
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      });
  }
}
