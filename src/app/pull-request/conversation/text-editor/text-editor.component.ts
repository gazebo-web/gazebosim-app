import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AngularEditorConfig } from '@kolkov/angular-editor';

@Component({
  selector: 'text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent implements OnInit {

  @Input() closeReview: () => void;
  @Output() sendComment = new EventEmitter();

  /**
   * Configuration for richtext editor.
   * Refer to docs at https://www.npmjs.com/package/@kolkov/angular-editor
   */
  public editorConfig: AngularEditorConfig = {
    editable: true,
    minHeight: '15em'
  };

  /**
   * comment text holder
   */
  public newComment = '';

  public addComment(): void {
    this.sendComment.emit(this.newComment);
    this.newComment = "";
  }

  constructor() { }

  ngOnInit(): void {
  }

}
