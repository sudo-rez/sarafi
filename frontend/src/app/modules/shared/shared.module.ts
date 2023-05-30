import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// Third party
import { TranslateModule } from '@ngx-translate/core';
import { OrderModule } from 'ngx-order-pipe';
import { DpDatePickerModule } from 'ng2-jalali-date-picker';
// Components
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { DropzoneImagesComponent } from './dropzone-images/dropzone-images.component';
import { DropzoneImagesModalComponent } from './dropzone-images-modal/dropzone-images-modal.component';
import { PaginationComponent } from './pagination/pagination.component';
import { TagInputComponent } from './tag-input/tag-input.component';
import { SelectInputComponent } from './select-input/select-input.component';
import { InputItemComponent } from './input-item/input-item.component';
// Pipes
import { SubMenusPipe } from '../../pipes/sub-menus.pipe';
import { LocalSearchPipe } from '../../pipes/local-search.pipe';
import { NameTranslatePipe } from '../../pipes/name-translate.pipe';
import { JalaliPipe } from '../../pipes/jalali.pipe';
import { ExcerptPipe } from '../../pipes/excerpt.pipe';
import { NumberPipePipe } from "../../pipes/number-pipe.pipe";
// Modules
import { ImageCropperModule } from './image-cropper/image-cropper.module';
import { BankPipe } from 'src/app/pipes/card.pipe';
// Directives

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    OrderModule,
    ImageCropperModule,
    DpDatePickerModule,
  ],
  declarations: [
    BreadcrumbComponent,
    DropzoneImagesComponent,
    DropzoneImagesModalComponent,
    PaginationComponent,
    TagInputComponent,
    SelectInputComponent,
    InputItemComponent,
    SubMenusPipe,
    LocalSearchPipe,
    NameTranslatePipe,
    JalaliPipe,
    ExcerptPipe,
    NumberPipePipe,
    BankPipe
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    OrderModule,
    DpDatePickerModule,
    BreadcrumbComponent,
    DropzoneImagesComponent,
    DropzoneImagesModalComponent,
    PaginationComponent,
    TagInputComponent,
    SelectInputComponent,
    InputItemComponent,
    SubMenusPipe,
    LocalSearchPipe,
    NameTranslatePipe,
    JalaliPipe,
    ExcerptPipe,
    NumberPipePipe,
    BankPipe,
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: [
        SubMenusPipe,
        LocalSearchPipe,
        JalaliPipe,
        BankPipe
      ]
    }
  }
}
