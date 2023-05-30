import { Component, OnInit, SimpleChanges, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { forkJoin } from "rxjs";

import { NotificationsService } from 'angular2-notifications';
import { TranslateService } from '@ngx-translate/core';

import { ApiService } from '../../../services/api.service';
import { NotifyService, Opr, Ent } from '../../../services/notify.service';
import { SearchService } from '../../../services/search.service';
import { Dimensions, ImageCroppedEvent, ImageTransform } from '../image-cropper/interfaces/index';
import { imageFile } from '../image-cropper/utils/blob.utils';
import { Image } from '../../../interfaces/image';

interface GetImagesResponse {
  page: number;
  gallery: Image[];
  total_pages: number;
}

interface ApiList {
  list: string;
  upload: string;
  delete: string;
}

@Component({
  selector: 'dropzone-images-modal',
  templateUrl: './dropzone-images-modal.component.html',
  styles: []
})
export class DropzoneImagesModalComponent implements OnInit {
  @Input() public selectedImages: Image[];
  @Input() public state: 'invisible' | 'visible';
  @Input() public multi: boolean = false;
  @Input() public countLimit: number = 20;
  @Input() public sizeLimit: number = 20480000; // = 20MB
  @Input() public types: ["image"] = ["image"];
  @Input() public apiGroup: "admin" | "store" = "store";

  private _apiList(): ApiList {
    let lists: { [key: string]: ApiList } = {
      store: {
        list: "store/list_images",
        upload: "store/upload_images",
        delete: "store/delete_image",
      },
      admin: {
        list: "admin/file/list",
        upload: "admin/file/upload",
        delete: "admin/file/delete",
      }
    };
    return lists[this.apiGroup];
  }

  @Output() public closed: EventEmitter<any> = new EventEmitter<any>();
  @Output() public selected: EventEmitter<Image[]> = new EventEmitter<Image[]>();
  @Output() public removed: EventEmitter<Image> = new EventEmitter<Image>();

  public dragOvered: boolean = false;
  public illegalFile: boolean = false;

  public imageChangedEvent: any = '';
  public croppedImage: any = '';
  public canvasRotation = 0;
  public rotation = 0;
  public scale = 1;
  public showCropper = false;
  public containWithinAspectRatio = false;
  public transform: ImageTransform = {};

  constructor(
    private elem: ElementRef,
    private _simpleNotify: NotificationsService,
    private _translate: TranslateService,
    private _api: ApiService,
    private _notify: NotifyService,
    public search: SearchService
  ) { }

  ngAfterViewInit() {
    this.getImages();
    this.search.set("imagesList", (terms: string): void => {
      this.getImages(1, terms);
    });
  }

  public images: Image[] = [];
  public totalPages: number = 1;
  public currentPage: number = 1;
  private _searchTerms: string = "";
  public getImages(pageNumber: number = this.currentPage, searchTerms: string = this._searchTerms): void {
    this._searchTerms = searchTerms;
    this._api.set(this._apiList().list, "GET", { params: { limit: 24, page: pageNumber, search: searchTerms } }, (res: GetImagesResponse): void => {
      if (res) {
        this.images = res.gallery;
        this.currentPage = res.page;
        this.totalPages = res.total_pages;
      }
      this._setContentTop();
    });
  }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    this._setContentTop();
  }

  @ViewChild("header") private _header: ElementRef;
  public contentTop: string = '0';
  private _setContentTop() {
    setTimeout(() => {
      this.contentTop = this._header.nativeElement.offsetHeight + "px";
    });
  }

  public closeModal(): void {
    this.isShowCropper = false;
    this.closed.emit();
  }

  // cropper
  public imageForUpload;
  public imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
    this.imageForUpload = imageFile(event.base64, this.imageName);
  }

  public uploadImage() {
    let file = this.imageForUpload;
    let formData = new FormData();
    formData.append("images", file);
    this._api.set(this._apiList().upload, "POST", {
      body: formData,
      options: { reportProgress: true }
    }, (res: { uploaded_images: Image[] }): void => {
      if (res) {
        this.imageChangedEvent = "";
        this.croppedImage = "";
        this.isShowCropper = false;
        this.getImages();
        this.selected.emit([res.uploaded_images[0]]);
        this._notify.status(Opr.Upload, Ent.Image);
      }
    }, err => {
      this.imageChangedEvent = "";
      this.croppedImage = "";
      this.isShowCropper = false;
    });
  }

  public uploadImageWithoutCrop() {
    let formData = new FormData();
    this.validatedImageFiles.forEach(imageFile => {
      formData.append("images", imageFile);
    });

    // TODO: Loading
    this._api.set(this._apiList().upload, "POST", {
      body: formData,
      options: { reportProgress: true }
    }, (res: { uploaded_images: Image[] }): void => {
      this.selected.emit(res.uploaded_images);
      this.imageChangedEvent = "";
      this.croppedImage = "";
      this.isShowCropper = false;
      this.getImages();
      this._notify.status(Opr.Upload, Ent.Image);
    }, err => {
      this.imageChangedEvent = "";
      this.croppedImage = "";
      this.isShowCropper = false;
    });
  }

  public imageLoaded() {
    this.showCropper = true;
  }

  public cropperReady(sourceImageDimensions: Dimensions) {
    console.log('Cropper ready', sourceImageDimensions);
  }

  public loadImageFailed() {
    console.log('Load failed');
  }

  public flipHorizontal() {
    this.transform = {
      ...this.transform,
      flipH: !this.transform.flipH
    };
  }

  public flipVertical() {
    this.transform = {
      ...this.transform,
      flipV: !this.transform.flipV
    };
  }

  public resetImage() {
    this.scale = 1;
    this.rotation = 0;
    this.canvasRotation = 0;
    this.transform = {};
  }

  public zoomOut() {
    this.scale -= .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  public zoomIn() {
    this.scale += .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  public scroll(el) {
    if (el.length) {
      el[0].scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
      });
    }
  }

  public isShowCropper: boolean = false;
  public openCropper(): void {
    this.isShowCropper = !this.isShowCropper;
    setTimeout(() => {
      let el = this.elem.nativeElement.querySelectorAll("#image-cropper");
      this.scroll(el);
    }, 200);
  }

  public imageName: string = "";
  public toggleSelect(image: Image): void {
    if (this.isSelected(image)) {
      this.removed.emit(image);
      // this.imageChangedEvent = "";
      // this.imageName = "";
    }
    else {
      this.selected.emit([image]);
      // this.imageChangedEvent = image;
      // this.imageName = image.original_name;
    }
  }

  public isSelected(image: Image): boolean {
    return this.selectedImages.map((image: Image) => image.original).includes(image.original);
  }

  public dragEnter(): void {
    this.dragOvered = true;
  }

  public dragLeave(): void {
    this.dragOvered = false;
  }

  public dragOver(event): void {
    event.preventDefault();
    this.dragOvered = true;
    // this.illegalFile = !this._validateImageFiles(event.target.files).length;
  }

  public onDrop(event): void {
    event.preventDefault();
    this.dragOvered = false;
    this.imageChangedEvent = "";
    this.imageName = "";
    this.uploadDropFile(this._validateImageFiles(event.dataTransfer.files));
  }

  public inputChange(event): void {
    this.imageChangedEvent = event;
    this.imageName = event.target.files[0].name;
    this.upload(this._validateImageFiles(event.target.files));
  }

  private _validateImageFiles(imageFiles): any {
    let imageFilesList = [];
    for (let i = 0; i < imageFiles.length; i++) {
      let image = imageFiles[i];
      if (!this.types.includes(image.type.split("/")[0])) {
        this.imageChangedEvent = "";
        this.showCropper = false;
        let notifyTitle$ = this._translate.get("notify.upload-type-error.title");
        let notifyMessage$ = this._translate.get("notify.upload-type-error.message", { fileName: image.name });
        forkJoin([notifyTitle$, notifyMessage$]).subscribe(data => {
          const [title, message]: string[] = data;
          this._simpleNotify.error(title, message);
        });
        continue;
      }
      if (image.size > this.sizeLimit) {
        this.imageChangedEvent = "";
        this.showCropper = false;
        let notifyTitle$ = this._translate.get("notify.upload-size-error.title");
        let notifyMessage$ = this._translate.get("notify.upload-size-error.message", { fileName: image.name });
        forkJoin([notifyTitle$, notifyMessage$]).subscribe(data => {
          const [title, message]: string[] = data;
          this._simpleNotify.error(title, message);
        });
        continue;
      }
      imageFilesList.push(image);
    }
    return imageFilesList;
  }

  public validatedImageFiles;
  public upload(validatedImageFiles): void {
    if (!validatedImageFiles.length) return;
    this.validatedImageFiles = validatedImageFiles;
    this.openCropper();
  }

  public uploadDropFile(validatedImageFiles) {
    if (!validatedImageFiles.length) return;
    this.validatedImageFiles = validatedImageFiles;
    let formData = new FormData();
    this.validatedImageFiles.forEach(imageFile => {
      formData.append("images", imageFile);
    });

    // TODO: Loading
    this._api.set(this._apiList().upload, "POST", {
      body: formData,
      options: { reportProgress: true }
    }, (res: { uploaded_images: Image[] }): void => {
      this.selected.emit(res.uploaded_images);
      this.getImages();
      this._notify.status(Opr.Upload, Ent.Image);
    });
  }

  public deleteImage(image: Image): void {
    this._notify.confirm(Opr.Del, Ent.Image, () => {
      let imageName: string[] = image.original.split("/");
      this._api.set(this._apiList().delete, "DELETE", { body: { name: imageName[imageName.length - 1] } }, (res: any): void => {
        this.removed.emit(image);
        this.getImages();
        this._notify.status(Opr.Del, Ent.Image);
      });
    });
  }

  // TODO: Preview panel
  // TODO: Show selected images count and limit count in modal

  ngOnDestroy() {
    this.search.remove("imagesList");
    this._api.remove(this._apiList().list);
    this._api.remove(this._apiList().upload);
    this._api.remove(this._apiList().delete);
  }
}
