import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { circuits as validCircuits } from './circuits';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { Robot } from '../../cloudsim/robot';
import { robotClass } from './base-class';
import { RobotType } from '../../cloudsim/robot-type';
import { SimulationService } from '../../cloudsim/simulation.service';
import { validParents } from './valid-parents';

@Component({
  selector: 'ign-simulation-launch-dialog',
  templateUrl: 'simulation-launch-dialog.component.html',
  styleUrls: ['simulation-launch-dialog.component.scss']
})

/**
 * The Simulation Launch Dialog is used to launch simulations on the Applications page.
 */
export class SimulationLaunchDialogComponent implements OnInit {
  /**
   * Used to emit an event when the form is complete.
   */
  @Output() public onSubmit = new EventEmitter<FormData>();

  /**
   * Input form for the simulation name.
   */
  public simName = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern('[a-zA-Z0-9]+'),
    ],
    updateOn: 'change' || 'submit',
  });

  /**
   * Input form for a new Robot name.
   */
  public robotName = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(24),
      Validators.pattern('[a-zA-Z0-9]+')
    ],
    updateOn: 'change' || 'submit',
  });

  /**
   * Input form for a new Robot image URL.
   */
  public robotImageUrl = new FormControl('', {
    validators: [
      Validators.required,
    ],
    updateOn: 'change' || 'submit',
  });

  /**
   * Form field for the Robot type select dropdown.
   */
  public typeDropdownForm = new FormControl('', {
    validators: [
      Validators.required,
    ],
    updateOn: 'change' || 'submit',
  });

  /**
   * Input form control for Marsupial Partner.
   */
  public marsupialPartner = new FormControl('', {
    validators: [
      Validators.minLength(2),
      Validators.maxLength(24),
      Validators.pattern('[a-zA-Z0-9]+')
    ],
    updateOn: 'change' || 'submit',
  });

  /**
   * Form field for the Circuit type select dropdown.
   */
  public circuitDropdownForm = new FormControl('', {
    validators: [
      Validators.required,
    ],
    updateOn: 'change' || 'submit',
  });

  /**
   * List of robots the user would upload. They consist of a name, a type, a docker image and the
   * credits they cost.
   */
  public robots: Robot[] = [];

  /**
   * List of robot types the user can upload for each image. This needs to be obtained from the
   * server, and passed through the dialog data.
   */
  public types: RobotType[];

  /**
   * Credits available.
   * Note: These are SubT Robot Credits.
   */
  public credits: number = 1000;

  /**
   * True if the credit check is enabled.
   */
  public creditsEnabled: boolean = true;

  /**
   * Error state matcher for robot fields
   */
  public robotErrorStateMatcher = new RobotErrorStateMatcher();

  /**
   * Name of previous robot type; used to determine if changing from teambase
   */
  public prevType: string;

  /**
   * List of available circuits for the Simulation.
   */
  public circuits: string[] = validCircuits;

  /**
   * Confirmation dialog reference.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param data Data for the dialog. Fields:
   *             - robotTypes (RobotTypes) The list of robot types from the Server.
   *             - user (string) The user that uploads the simulation.
   * @param dialogRef Reference to the opened dialog.
   * @param dialog Dialog to display warnings
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public simulationService: SimulationService,
    public dialogRef: MatDialogRef<SimulationLaunchDialogComponent>) {
  }

  /**
   * OnInit lifecycle hook. Used to set the array of robot types available.
   */
  public ngOnInit(): void {
    this.simulationService.getRobotTypes().subscribe((types) => {
      this.types = types;
    });
  }

  /**
   * Callback when the Upload button is clicked.
   *
   * Verifies that the form is valid to be uploaded. Warns the user if they try to submit a Circuit.
   */
  public upload(): void {
    // Trim name and image.
    this.simName.setValue(this.simName.value.trim());
    this.simName.updateValueAndValidity();

    if (this.simName.invalid || this.circuitDropdownForm.invalid || !this.data.user) {
      return;
    }

    // Check that there are robots to upload.
    if (this.robots.length === 0) {
      return;
    }

    // Verify that the credit limit is met.
    if (this.creditsEnabled && this.credits < 0) {
      const dialogOps = {
        data: {
          title: 'Upload a Submission',
          message: '<p>Your robots exceed the maximum credit limit.</p>' +
            '<p>To continue, please remove some of your robots in order to fit this criteria.</p>',
          buttonText: 'OK'
        }
      };

      this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

      return;
    }

    // Check that submitted robot team is valid
    const errors = this.validateTeamSubmission();
    // const errors = null;
    if (errors) {
      let message = '<h2>Submission Error</h2><ul>';
      errors.forEach(error => {
        message += `<li>${error}</li>`;
      });
      message += '</ul><p>For information, consult the <a href="https://github.com/osrf/subt/wiki/API#marsupials" target="_blank">SubT API on Marsupial Robots</a> and the <a href="https://www.subtchallenge.com/resources.html" target="_blank">SubT Challenge Rules</a>.</p>';
      const dialogOps = {
        data: {
          title: 'Upload a Submission',
          message,
          buttonText: 'Dismiss',
          hideCancel: true
        }
      };

      this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

      return;
    }

    // Prepare the form.
    const formData = new FormData();
    formData.append('owner', this.data.user);
    formData.append('name', this.simName.value);
    formData.append('circuit', this.circuitDropdownForm.value);

    this.robots.forEach((robot) => {
      formData.append('robot_name', robot.name);
      formData.append('robot_type', robot.type.type);
      formData.append('robot_image', robot.image);
      if (robot.partner) {
        formData.append('marsupial', `${robot.name}:${robot.partner}`);
      }
    });

    this.onSubmit.emit(formData);
    this.dialogRef.close();
  }

  /**
   * Add a robot to the form.
   */
  public addRobot(): void {
    // Verify that all the fields are valid.
    this.robotName.setValue(this.robotName.value.trim());
    this.robotName.updateValueAndValidity();
    this.robotImageUrl.setValue(this.robotImageUrl.value.trim());
    this.robotImageUrl.updateValueAndValidity();
    this.marsupialPartner.setValue(this.marsupialPartner.value.trim());
    this.marsupialPartner.updateValueAndValidity();

    if (this.robotName.invalid ||
        this.robotImageUrl.invalid ||
        this.typeDropdownForm.invalid ||
        this.marsupialPartner.invalid) {
      return;
    }

    // Add the robot to a list.
    const robot = {
      name: this.robotName.value,
      image: this.robotImageUrl.value,
      type: this.typeDropdownForm.value,
    };
    if (this.marsupialPartner.value.length > 0) {
      robot['partner'] = this.marsupialPartner.value;
    }

    this.robots.push(robot);
    this.credits -= robot.type.credits;

    // reset if teambase was added because there can only be one robot of type teambase
    if (robot.type.name === 'TEAMBASE') {
      this.robotName.reset('');
      this.robotImageUrl.reset('');
      this.typeDropdownForm.reset('');
    }
  }

  /**
   * Remove a robot from the list to submit.
   *
   * @param index The index of the robot to remove.
   */
  public removeRobot(index: number): void {
    this.credits += this.robots[index].type.credits;
    this.robots.splice(index, 1);
  }

  /**
   * Cancel the dialog.
   */
  public cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Open a warning dialog for a circuit.
   * @param formData the submitted data by the user
   * @param circuit the circuit selected
   */
  public openWarningDialog(formData: FormData, circuit: string): void {
    // Parse the HTML body.
    let body = '';
    this.robots.forEach((robot, index) => {
      body += `<p>Robot ${index + 1}</p>`;
      body += `<ul><li>Name: ${robot.name}</li>`;
      body += `<li>Docker Image: ${robot.image}</li>`;
      body += `<li>Type: ${robot.type.name}</li>`;
      body += `<li>Credits: ${robot.type.credits}</li></ul>`;
    });

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent);

    // Check for the result of the dialog. Upload when the user accepts.
    this.confirmationDialog.afterClosed()
      .subscribe(
        (result) => {
          if (result === true) {
            this.onSubmit.emit(formData);
            this.dialogRef.close();
          }
        }
      );
  }

  /**
   * Returns true if the selected vehicle in Robot Type is a valid parent platform.
   */
  public showMarsupialPartner(): boolean {
    const {type} = this.typeDropdownForm.value;
    return validParents[type] !== undefined;
  }

  public typeChange(event: MatSelectChange): void {
    if (!this.showMarsupialPartner()) {
      this.marsupialPartner.reset('');
    }

    // If TEAMBASE is selected, autofill the Robot Name field with the text "TEAMBASE "
    // but allow it to be modified
    if (this.teambaseSelected() && this.robotName.pristine) {
      this.robotName.setValue('TEAMBASE');
    }

    // if prev type was TEAMBASE, reset name
    if (this.prevType === 'TEAMBASE') {
      this.robotName.reset('');
    }

    // update prev type
    this.prevType = event.value.name;
  }

  /**
   * Callback for binding to disabled attribute of typeDropdownForm's options
   * Disable if a robot of type TEAMBASE is already added
   */
  public teambaseExists(robotType: object): boolean {
    return robotType['type'] === 'TEAMBASE' && this.robots.some(r => r['type']['name'] === 'TEAMBASE');
  }

  /**
   * Return true if TEAMBASE type is currently selected
   */
  public teambaseSelected(): boolean {
    return this.typeDropdownForm.value && this.typeDropdownForm.value.name === 'TEAMBASE';
  }

  /**
   * Checks that,
   * 1) FOR EACH robot with a Marsupial Partner of name <robot_name> specified,
   * a robot of name <robot_name> is included in the list of added/submitted robots
   * 2) Marsupial parents should only be able to put in the name of a compatible
   * marsupial child from the validparents file
   * 3) No more than 5 robots of any one robot class are included in the submission
   *
   * @returns string[] of errors or null if valid
   */
  private validateTeamSubmission(): string[] {
    const errors = [];
    const submittedRobotClasses: { [baseClass: string]: number; } = {};

    // for every robot
    this.robots.forEach((robot) => {
      // store a dictionary of robot classes in this submission
      // remove constant '_SENSOR_CONFIG_X' from the robot type

      const baseClass = robotClass[
        robot.type.type.substring(0, robot.type.type.indexOf('_SENSOR_CONFIG'))
      ];

      // increment entry in dictionary
      if (isNaN(submittedRobotClasses[baseClass])) {
        submittedRobotClasses[baseClass] = 1;
      } else {
        submittedRobotClasses[baseClass] = submittedRobotClasses[baseClass] + 1;
      }

      // if has partner
      if (robot.partner) {
        // make sure partner exists
        const partner = this.robots.find(robotPartner => robotPartner.name === robot.partner);
        if (!partner) {
          errors.push(`The marsupial child robot with name "${robot['partner']}" has not been specified.`);
          return;
        }
        // and is valid partner
        const partnerValid = validParents[robot.type.type].indexOf(partner.type.type) > -1;
        if (!partnerValid) {
          errors.push(
            `Robot of type ${robot.type.type} cannot be Marsupial Partners with robots of type ${partner.type.type}.`
          );
        }
      }
    });

    // if any class count is greater than 5, throw an error
    const MAXIMUM_ALLOWED_IN_CLASS = 5;
    let classMax = 0;
    let classMaxClass = '';
    for (const rClass in submittedRobotClasses) {
      if (rClass) {
        const value = submittedRobotClasses[rClass];
        if (value > classMax) {
          classMax = value;
          classMaxClass = rClass;
        }
      }
    }
    if (classMax > MAXIMUM_ALLOWED_IN_CLASS) {
      errors.push(
        `The submission contains ${classMax} platforms of base platform type "${classMaxClass}",
        but only ${MAXIMUM_ALLOWED_IN_CLASS} are allowed`
      );
    }

    return errors.length > 0 ? errors : null;
  }
}

/**
 * Error state matcher implementation which displays errors when control is dirty, touched, invalid.
 */
class RobotErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl, form: FormGroupDirective | NgForm): boolean {
    return control && (control.dirty || control.touched) && control.invalid;
  }
}
