import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AdminElasticsearchService } from '../admin-elasticsearch.service';

@Component({
  selector: 'gz-elasticsearch-config-dialog',
  templateUrl: 'config-dialog.component.html',
  styleUrls: ['config-dialog.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
})

/**
 * The Elasticsearch Config Dialog is used to configure an elasticsearch instance.
 */
export class ElasticsearchConfigDialogComponent {
  /**
   * Event emitter when the submit button is clicked.
   */
  @Output() public onSubmit = new EventEmitter<any>();

  /**
   * True to hide the password field.
   */
  public hide = true;

  /**
   * Input form for the address.
   */
  public addressInputForm = new FormControl('',
    {validators: [Validators.required, Validators.pattern('[^\/]*')],
    updateOn: 'change' || 'submit'});

  /**
   * Input form for the username.
   */
  public usernameInputForm = new FormControl('',
    {validators: [Validators.pattern('[^\/]*')],
    updateOn: 'change' || 'submit'});

  /**
   * Input form for the password.
   */
  public passwordInputForm = new FormControl('',
    {validators: [Validators.pattern('[^\/]*')],
    updateOn: 'change' || 'submit'});

  /**
   * @param dialog Reference to the opened dialog.
   * @param data Data for the dialog. Fields:
   *
   *        - address (string) Dialog title.
   *        - username (string) Dialog message.
   *        - password (string) The value of the name input field.
   */
  constructor(
    public elasticService: AdminElasticsearchService,
    public dialog: MatDialogRef<ElasticsearchConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data !== undefined && data !== null)  {
      this.addressInputForm.setValue(data.address);
      this.usernameInputForm.setValue(data.username);
      this.passwordInputForm.setValue(data.password);
    }
  }

  /**
   * Callback for the submit button click. Emits an onSubmit event.
   */
  public submit(): void {
    const configData = {
      address: this.addressInputForm.value,
      username: this.usernameInputForm.value,
      password: this.passwordInputForm.value
    };
    this.onSubmit.emit(configData);
  }
}
