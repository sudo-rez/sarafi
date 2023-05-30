import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { forkJoin } from "rxjs";

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';
import { Image } from '../../../interfaces/image';

@Component({
  selector: 'dropzone-images',
  templateUrl: './dropzone-images.component.html',
  styles: [],
  animations: [
    trigger('toggle-modal', [
      state('invisible', style({
        opacity: 0,
        visibility: 'hidden'
      })),
      state('visible', style({
        opacity: 1,
        visibility: 'visible'
      })),
      transition('invisible <=> visible', animate('100ms ease-in'))
    ])
  ]
})
export class DropzoneImagesComponent implements OnInit {
  @Input() public multi: boolean = false;
  @Input() public returnID: boolean = false;
  @Input() public domain: string = '';
  @Input() public countLimit: number = 20;
  @Input() public sizeLimit: number = 20480000; // = 20MB
  @Input() public types: ["image"] = ["image"];
  @Input() public apiGroup: "admin" | "store" = "store";

  @Output() public changed: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() public added: EventEmitter<Image[]> = new EventEmitter<Image[]>();
  @Output() public removed: EventEmitter<Image> = new EventEmitter<Image>();

  @Input() set defaults(defaults: Image[]) {
    if (defaults.length)
      this.selectImages(defaults);
  };

  public selectedImages: Image[] = [];
  public modalState: 'invisible' | 'visible' = 'invisible';
  public isFull(): boolean {
    return !this.multi && !!this.selectedImages.length || this.selectedImages.length >= this.countLimit;
  }

  constructor(
    private _simpleNotify: NotificationsService,
    private _translate: TranslateService
  ) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) { }

  public openModal(): void {
    this.modalState = 'visible';
  }

  public closeModal(): void {
    this.modalState = 'invisible';
  }

  public selectImages(images: Image[]): void {
    let addedImagesList: Image[] = [];
    if (this.multi) {
      for (let i = 0; i < images.length; i++) {
        const image: Image = images[i];
        if (this.selectedImages.length < this.countLimit) {
          if (!this.selectedImages.map((selectedImage: Image) => selectedImage.original).includes(image.original)) {
            this.selectedImages.push(image);
            addedImagesList.push(image);
          }
        } else {
          let notifyTitle$ = this._translate.get("notify.select-image-overlimit.title");
          let notifyMessage$ = this._translate.get("notify.select-image-overlimit.message", { countLimit: this.countLimit });
          forkJoin([notifyTitle$, notifyMessage$]).subscribe(data => {
            const [title, message]: string[] = data;
            this._simpleNotify.error(title, message);
          });
          break;
        }
      }
    } else {
      this.selectedImages = [images[0]];
      addedImagesList = [images[0]];
    }
    if (addedImagesList.length) {
      this.added.emit(addedImagesList);
      this.changed.emit(this.selectedImages.map((image: Image) => {
        if(this.returnID){
          return image.id;
        }else{
          return image.original;
        }
      }));
    }
  }

  public removeImage(image: Image): void {
    let imageIndex: number = this.selectedImages.map((image: Image) => image.original).indexOf(image.original);
    if (imageIndex == -1) return;
    this.removed.emit(this.selectedImages[imageIndex]);
    this.selectedImages.splice(imageIndex, 1);
    this.changed.emit(this.selectedImages.map((image: Image) => {
      if(this.returnID){
        return image.id;
      }
      return image.original;
    }));
  }
}
