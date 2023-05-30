// Built in
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
// Third party
import { LocalStorageModule } from 'angular-2-local-storage';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// Interceptor
import { ApiInterceptor } from './api.interceptor';
// Modules
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './modules/shared/shared.module';
// Components
import { AppComponent } from './components/app.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
// Services
import { ApiService } from './services/api.service';
import { UserService } from './services/user.service';
import { NotifyService } from './services/notify.service';
import { SearchService } from './services/search.service';
import { StorageService } from './services/storage.service';
// Guards
import { AuthGuard } from './guards/auth.guard';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { MobileVerificationComponent } from './modules/mobile-verification/mobile-verification.component';
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './static/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    HeaderComponent,
    MobileVerificationComponent,
  ],
  imports: [
    BrowserModule,
    SharedModule.forRoot(),
    BrowserAnimationsModule,
    SimpleNotificationsModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    AppRoutingModule,
    HttpClientModule,
    LocalStorageModule.forRoot({
      prefix: 'p.',
      storageType: 'localStorage'
    })
  ],
  providers: [
    ApiService,
    UserService,
    NotifyService,
    SearchService,
    StorageService,
    AuthGuard,
    AdminAccessGuard,
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
