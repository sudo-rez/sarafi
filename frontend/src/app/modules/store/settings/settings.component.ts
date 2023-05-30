import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';

import { ApiService } from '../../../services/api.service';
import { UserService } from '../../../services/user.service';
import { NotifyService, Opr, Ent, Notify, SwlT } from '../../../services/notify.service';
import { StorageService } from '../../../services/storage.service';
import { NgxSmartModalService } from "ngx-smart-modal";
import { CustomMetaTag, Domain, Store } from "../../../interfaces/store";
import { CustomValidators } from "../../../validators/custom-validators";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { NotificationType } from "angular2-notifications";
import { Content } from '../../../interfaces/content';
import { Brand } from 'src/app/interfaces/brand';

declare var jquery;
declare var $: any;
declare var select2: any;
declare let L;


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styles: []
})
export class SettingsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('selectTabMenu') selectTabMenu: ElementRef;

  public title: string = "store.settings.title";
  public ajaxSelect2 = window.location.origin;
  public lang: string  = this._translate.currentLang;
  public storeCustomTags: Array<CustomMetaTag> = [];
  public formSubmitted = false;
  public newDomainName: FormControl = this._fb.control("", Validators.compose([
    Validators.required,
    Validators.pattern(CustomValidators.domain)
  ]));
  clickmodal = false;
  clickTabAddress = false;
  clickSendAndPay = false;
  arr_selected_area = [];
  obj = {
    province_name: "",
    province_id: 0,
    city_name: "",
    city_id: 0,
    district_name: "",
    district_id: 0
  };

  constructor(
    private _fb: FormBuilder,
    private _api: ApiService,
    private _notify: NotifyService,
    public _userService: UserService,
    private _storage: StorageService,
    public ngxSmartModalService: NgxSmartModalService,
    public _translate: TranslateService,
    private _router: Router,
    private _route: ActivatedRoute,
  ) {
    this._migrateForm();
  }

  public form: FormGroup;
  public seoanddomine: FormGroup;
  private resultForm;
  public strAllDistrict: string;
  public strAllCity: string;
  private _migrateForm(): void {
    this.form = this._fb.group({
      "store": this._fb.group({
        "name": ["", Validators.compose([Validators.required, Validators.minLength(3), Validators.maxLength(100)])],
        "email": ["", Validators.compose([Validators.pattern(CustomValidators.email), Validators.required])],
        "description": ["", Validators.compose([Validators.maxLength(15000)])],
        "freeze": true,
        "sub_not_required": false,
        "ordering_freeze": false,
        "must_verify_customer": false,
        "unlimited_time_ordering": true,
        "open_time": ["00:00:00"],
        "close_time": ["00:00:00"],
        "index_in_mastershop": false,
        "display_bab_copyright": true,
        "customize_sms_footer": false,
        "sms_footer": "",
        "home_page": {},
        "copyright": "",
        "is_mastershop": false
      }),
      "sendandpay": this._fb.group({
        "ravanpardakht": true,
        "CardTransfer": false,
        "card_number": [""],
        "pay_inperson": false,
        "online_payment_is_active": false,
        "payment_facility": this._fb.group({
          "api_key": "",
          "terminal_id":  ["", Validators.compose([Validators.maxLength(30)])],
          "merchant_number": 0,
          "internet_terminal_password": ""
        }),
        "saman": this._fb.group({
          "merchant_id": ["", Validators.compose([Validators.maxLength(30)])]
        }),
        "irankish": this._fb.group({
          "merchant_id": ["", Validators.compose([Validators.maxLength(30)])],
          "description": ["", Validators.compose([Validators.maxLength(200)])]
        }),
        "mellat": this._fb.group({
          "terminal_id": ["", Validators.compose([Validators.maxLength(30)])],
          "username": ["", Validators.compose([Validators.maxLength(50)])],
          "password": ["", Validators.compose([Validators.maxLength(50)])],
          "description": ["", Validators.compose([Validators.maxLength(200)])],
        }),
        "tax": [0, Validators.compose([Validators.min(0), Validators.max(100)])],
        "post": false,
        "inperson": true,
        "free_shiping": false,
        "free_for_price": [0],
        "courier": false,
        "country": true,
        "select_area": "",
        "geographical_delivery_support": [],
        "default_post_cost": 0,
        "courier_cost": 0,
        "post_cost": this._fb.array([])
      }),
      "addressandsocial": this._fb.group({
        "phone": ["", Validators.compose([Validators.maxLength(11), Validators.pattern(CustomValidators.numberOnly)])],
        "cellphone":["", Validators.compose([Validators.maxLength(11), Validators.pattern(CustomValidators.numberOnly)])],
        "postal": [null, Validators.compose([Validators.maxLength(10), Validators.pattern(CustomValidators.numberOnly)])],
        "fax": ["", Validators.compose([Validators.maxLength(11),Validators.pattern(CustomValidators.numberOnly)])],
        "address": ["", Validators.compose([Validators.maxLength(500)])],
        "province": {},
        "city": {},
        "district": {},
        "latitude": "",
        "longitude": "",
        "map_zoom_level": 0
      }),
      "social": this._fb.group({
        "telegram_channel": ["", Validators.compose([Validators.maxLength(200)])],
        "telegram_support": ["", Validators.compose([Validators.maxLength(200)])],
        "instagram": ["", Validators.compose([Validators.maxLength(200)])],
        "instagram-auth": this._fb.group({
          "username": ["", Validators.compose([Validators.maxLength(200)])],
          "password": ["", Validators.compose([Validators.maxLength(200)])]
        }),
        // "facebook": ["", Validators.compose([Validators.maxLength(200)])],
        // "twitter": ["", Validators.compose([Validators.maxLength(200)])],
        "aparat": ["", Validators.compose([Validators.maxLength(200)])],
        // "google_plus": ["", Validators.compose([Validators.maxLength(200)])],
        "send_to_social_medias": false,
        // "telegram_id": ""
      }),
      "seoanddomine": this._fb.group({
        "enamad_tag": ["", Validators.compose([Validators.maxLength(1500)])],
        "enamad_meta_id": ["", Validators.compose([Validators.maxLength(50)])],
        "samandehi": ["", Validators.compose([Validators.maxLength(600)])],
        "google_analytics":  ["", Validators.compose([Validators.maxLength(50)])],
        "custom_meta_tags": this._fb.array([]),
        "meta_description": ["", Validators.compose([Validators.maxLength(200)])],
        "crisp": ""
      })
    });
  }

  private _getStore() {
    this._api.set("brand/", "GET", {}, (res: { brand: Brand }): void => {

      this._userService.updateUserBrand(res.brand);
      this.form.get(['store']).patchValue(res.brand);
      // this.form.get(['store', 'freeze']).patchValue(!res.brand.freeze);
      // this.form.get(['sendandpay']).patchValue(res.brand.delivery);
      // this.form.get(['sendandpay']).patchValue(res.brand.payment);

      // this.activeCurrency = res.brand.currency;


      this.statusinput(null, 'post');
      this.statusinput(null, 'free_shiping');
      this.statusinput(null, 'CardTransfer');


      if(res.brand['geographical_delivery_support'].length > 0) {
        this.arr_selected_area = res.brand['geographical_delivery_support'];
        this.form.get(['sendandpay', 'country']).setValue(false);
        this.form.get(['sendandpay', 'select_area']).enable();
      }




      this.resultForm = res;

      if(res.brand['unlimited_time_ordering']) {
        this.form.get(['store', 'open_time']).disable();
        this.form.get(['store', 'close_time']).disable();
        $('#open_time').click();
        $('#close_time').click();
      } else {
        if(res.brand['open_time'] == "") {this.form.get('store.open_time').setValue('00:00:00')}
        if(res.brand['close_time'] == "") {this.form.get('store.close_time').setValue('00:00:00')}
      }

      this.getContents(this.resultForm);

    });
  }


  public toggleClass(): void {
    if (this._translate.currentLang == 'fa') {
      $(".ql-editor").addClass("ql-placeholder");
    } else {
      $(".ql-editor").removeClass("ql-placeholder");
    }
  }

  public activeCurrency = "";
  public setCurrency(e): void {
    let currency = e.target.value;
    this._api.set("product/currency/change", 'POST', {
      id: 'setCurrency',
      body: {currency: currency},
      formData: true
    }, (res) => {
      this.activeCurrency = currency;
    });
  }

  ngOnInit() {
    this._translate.onLangChange.subscribe((res) => {
      this.lang  = res['lang'];
    });
    this.toggleClass();
  }

  ngAfterViewInit() {
   this._getStore();
  }

  public contents: Content[] = [];
  public getContents(result): void {
    let home_page = {
      id: result.store['home_page']['id'],
      name: result.store['home_page']['title']
    };
    this._api.set("store/content", "GET", {}, (res): void => {
      this.contents = res.contents.filter((d: Content) =>{
        if (d.group == 'PAGE' && d.is_published === true){
          return d;
        }
      });
      let mainPage = $('#main-page');
      mainPage.select2({
        dir: "rtl",
        dropdownAutoWidth: true,
        dropdownParent: $('#parent-mainPageSelect2')
      });
      let txtDefaultMainPage = this._translate.instant("store.default-mainpage-theme");
      $("#main-page").append(new Option(txtDefaultMainPage, "", true, true));
      this.contents.forEach((d) => {
        if (d['id'] != home_page['id']) {
          $("#main-page").append(new Option(d['title'], d['id']));
        } else {
          $("#main-page").append(new Option(d['title'], d['id'], true, true));
        }
      })
    });
  }

  public addPricePost(price: string): void {
    let province = {
      name: $('#provinceforPost').select2('data')[0].text,
      id: $('#provinceforPost').val()
    };
    const postPriceArray: FormArray = <FormArray>this.form.get('sendandpay.post_cost');
    postPriceArray.controls.forEach((d, index) => {
      let id = d.value['province']['id'];
      if (id == province['id']) {
        this.removePricePost(index)
      }
    });
    if (price != '') {
      postPriceArray.push(this._fb.group({
        "province": this._fb.group({
          "name": [province['name'] || "", Validators.required],
          "id": [province['id'] || "", Validators.required]
        }),
        "price": [parseInt(price) || 0 , Validators.required]
      }));
    }
  }
  public removePricePost(postIndex: number): void {
    const postPriceArray: FormArray = <FormArray>this.form.get('sendandpay.post_cost');
    postPriceArray.removeAt(postIndex);
  }

  public cities = [];
  public defaultCities = [];
  public getCities(cityName?): void {
    let name = cityName.target.value;
    let c = name.length;
    if (c > 0) {
      this._api.set("brand/search/" + name, "GET", {}, (res): void => {
        this.cities = res;
      });
    }
  }
  public setCities(cityName: string[]) {
    this.form.controls['brand'].patchValue(cityName);
  }

  private initmapandselect2(res) {

    let _api = this.ajaxSelect2 + '/api/public/v1';
    let provinces = [];

    let selectProvince = $('#province');
    let selectCity = $('#city');
    let selectDistrict = $('#district');
    let v_latitude = res.store['latitude'] || 32.4279;
    let v_longitude = res.store['longitude'] || 53.6880;
    let v_map_zoom_level = res.store['map_zoom_level'] || 5;

    selectProvince.select2({
      dir: "rtl",
      dropdownAutoWidth: true,
      dropdownParent: $('#parent')
    });
    selectCity.select2({
      dir: "rtl",
      dropdownAutoWidth: true,
      dropdownParent: $('#parent')
    });
    selectDistrict.select2({
      dir: "rtl",
      dropdownAutoWidth: true,
      dropdownParent: $('#parent'),
    });

    let sp = {
      name: res.store['province']['name'],
      id: res.store['province']['id']
    };
    let sc = {
      name: res.store['city']['name'],
      id: res.store['city']['id']
    };
    let sd = {
      name: res.store['district']['name'],
      id: res.store['district']['id']
    };

    let ajaxCity = (idSelectedPro) => {
      $.ajax({
        url: _api + "/province/" + idSelectedPro + "/city",
        success: function (result) {
          $("#city").html('');
          $("#district").html('');
          result.forEach((d) => {
            $("#city").append(new Option(d.name, d.id));
          });
          let idSelectedCity = $("#city").val();
          ajaxDistrict(idSelectedCity);
        }
      })
        .then(() => {
          let idSelectedPro = $("#province option:selected").val();
          let idSelectedCity = $("#city option:selected").val();
          $.ajax({
            url: _api + "/province/" + idSelectedPro + "/city",
            success: function (result) {
              result.forEach((d) => {
                if(d.id == idSelectedCity) {
                  map.setView([d.latitude, d.longitude], 14);
                }
              })
            }
          });
        });
    };
    let ajaxDistrict = (idSelectedCity) => {
      $.ajax({
        url: _api + "/city/" + idSelectedCity + "/district",
        success: function (result) {
          if (result == null) {
            return;
          }
          result.forEach((d) => {
            $("#district").append(new Option(d.name, d.id));
          });
        }
      });
    };
    let ajaxProvince = () => {
      $.ajax({
        url: _api + '/province',
        success: function (data) {
          $("#province").html('');
          provinces = data;
          provinces.forEach((d) => {
            $("#province").append(new Option(d.name, d.id));
          });
          let idSelectedPro = $("#province").val();
          $("#city").html('');
          $("#district").html('');
          ajaxCity(idSelectedPro);
        }
      });
    };

    if (sp.name != '') {
      $.ajax({
        url: _api + '/province',
        success: function (data) {
          $("#province").html('');
          $("#city").html('');
          $("#district").html('');
          provinces = data;
          provinces.forEach((d) => {
            if (d.id != sp.id) {
              $("#province").append(new Option(d.name, d.id));
            } else {
              $('#province').append(new Option(sp.name, sp.id, true, true));
            }
          });
        }
      });
    } else {
      ajaxProvince();
    }
    if (sc.name != '') {
      $.ajax({
        url: _api + "/province/" + sp.id + "/city",
        success: function (result) {
          $("#district").html('');
          result.forEach((d) => {
            if (d.id != sc.id) {
              $("#city").append(new Option(d.name, d.id));
            } else {
              $('#city').append(new Option(sc.name, sc.id, true, true));
            }
          })
        },
        error: function (xhr, ajaxOptions, thrownError) {
        }
      });
    }
    if (sd.name != '') {
      $.ajax({
        url: _api + "/city/" + sc.id + "/district",
        success: function (result) {
          if (result == null) {
            return;
          }
          result.forEach((d) => {
            if (d.id != sd.id) {
              $("#district").append(new Option(d.name, d.id));
            } else {
              $('#district').append(new Option(sd.name, sd.id, true, true));
            }
          });
        },
        error: function (xhr, ajaxOptions, thrownError) {
        }
      });
    } else {
      $('#district').append(new Option("", "", true, true));
    }

    selectProvince.on("select2:select", function (e) {
      let idSelectedPro = $("#province option:selected").val();
      $("#city").html('');
      $("#district").html('');
      ajaxCity(idSelectedPro);
    });
    selectCity.on("select2:select", function (e) {
      let idSelectedCity = $("#city option:selected").val();
      $("#district").html('');
      ajaxDistrict(idSelectedCity);
    });


    $('#city').change((d) => {
      let idSelectedPro = $("#province option:selected").val();
      let idSelectedCity = $("#city option:selected").val();
      $.ajax({
        url: _api + "/province/" + idSelectedPro + "/city",
        success: function (result) {
          result.forEach((d) => {
            if(d.id == idSelectedCity) {
              map.setView([d.latitude, d.longitude], 14);
            }
          })
        }
      });
    });

    const url = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attr = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      osm = L.tileLayer(url, {
        attribution: attr
      });
    var map = L.map('map').setView([v_latitude, v_longitude], v_map_zoom_level).addLayer(osm);
    let geojsonFeature = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [this.form.get(['addressandsocial','latitude']).value, this.form.get(['addressandsocial','longitude']).value]
      }
    };
    let marker;
    let markers = [];
    if (markers.length > 0) {
      map.removeLayer(markers.pop());
    }
    L.geoJson(geojsonFeature, {
      pointToLayer: (feature, latlng) => {
        marker = L.marker([this.form.get(['addressandsocial','latitude']).value, this.form.get(['addressandsocial','longitude']).value], {
          title: "Resource Location",
          alt: "Resource Location",
          riseOnHover: true,
          draggable: true,
          icon: L.icon({
            iconUrl: './static/images/marker.png',
            iconSize: [50, 50]
          }),
        });
        markers.push(marker);
        return marker;
      }
    }).addTo(map);
    map.on('click', onMapClick);
    function onMapClick(e) {
      geojsonFeature = {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Point",
          "coordinates": [e.latlng.lat, e.latlng.lng]
        }
      };
      if (markers.length > 0) {
        map.removeLayer(markers.pop());
      }
      L.geoJson(geojsonFeature, {
        pointToLayer: (feature, latlng) => {
          marker = L.marker(e.latlng, {
            title: "Resource Location",
            alt: "Resource Location",
            riseOnHover: true,
            draggable: true,
            icon: L.icon({
              iconUrl: './static/images/marker.png',
              iconSize: [50, 50]
            }),
          });
          markers.push(marker);
          return marker;
        }
      }).addTo(map);
      (<HTMLInputElement>document.getElementById('latlng')).value = [e.latlng.lat, e.latlng.lng, e.target._zoom].toString();
    }
  }

  public statusinput(input?, name?) {
    let inputname;
    if (input != null) {
      inputname = (<HTMLInputElement>input.currentTarget).name;
    } else {
      inputname = name;
    }
    switch (inputname) {
      case 'country': {
        let country = this.form.get(['sendandpay', 'country']);
        if(country.value) {
          $("#cities").attr("disabled", true);
          if(this.arr_selected_area.length > 0) {
            this._notify.confirm(Opr.Del, Ent.Selected_Area, () => {
              this.arr_selected_area = [];
              this.form.get(['sendandpay', 'geographical_delivery_support']).patchValue(this.arr_selected_area);
            },() => {
              country.setValue(false);
            });
          }
        } else {
          $('#cities').attr("disabled", false);
        }
        break;
      }
      case 'provincemodal': {
        // $('#citymodal').select2('val', '');
        break;
      }
      case 'citymodal': {
        // $('#districtmodal').select2('val', '');
        break;
      }
      case 'store': {
        break;
      }
      case 'sendandpay': {
        if(!this.clickSendAndPay && this.form.get('sendandpay.post').value) {
          setTimeout(() => {
            $.ajax({
              url: this.ajaxSelect2 + '/api/public/v1/province',
              success: function (data) {
                let selectProvince = $('#provinceforPost');
                selectProvince.select2({
                  dir: "rtl",
                  dropdownAutoWidth: true,
                  dropdownParent: $('.parent4')
                });
                $("#provinceforPost").html('');
                data.forEach((d) => {
                  $("#provinceforPost").append(new Option(d.name, d.id));
                });
              }
            });
          },500);
          this.clickSendAndPay = true;
        }
        break;
      }
      case 'addressandsocial': {
        if(!this.clickTabAddress) {
          this.initmapandselect2(this.resultForm);
          this.clickTabAddress = true;
        }
        break;
      }
      case 'seoanddomine': {
        break;
      }
      case 'social': {
        break;
      }
      case 'unlimited_time_ordering': {
        let unlimited_time_ordering = this.form.get(['store', 'unlimited_time_ordering']).value;
        let open_time = this.form.get(['store', 'open_time']);
        let close_time = this.form.get(['store', 'close_time']);
        if (unlimited_time_ordering) {
          open_time.disable();
          close_time.disable();
          $('#open_time').click();
          $('#close_time').click();
        } else {
          open_time.enable();
          close_time.enable();
          $('#open_time').click();
          $('#close_time').click();
        }
        break;
      }
      case 'post': {
        let post = this.form.get('sendandpay.post').value;
        if(post) {
          this.form.get('sendandpay.default_post_cost').setValidators(Validators.compose([Validators.required]));
          this.form.get('sendandpay.default_post_cost').updateValueAndValidity();
        } else {
          this.form.get('sendandpay.default_post_cost').clearValidators();
          this.form.get('sendandpay.default_post_cost').updateValueAndValidity();
        }
        break;
      }
      case 'free_shiping': {
        let free_shiping = this.form.get('sendandpay.free_shiping').value;
        if(free_shiping) {
          this.form.get('sendandpay.free_for_price').setValidators(Validators.compose([Validators.required]));
          this.form.get('sendandpay.free_for_price').updateValueAndValidity();
        } else {
          this.form.get('sendandpay.free_for_price').clearValidators();
          this.form.get('sendandpay.free_for_price').updateValueAndValidity();
        }
        break;
      }
      case 'CardTransfer': {
        let CardTransfer = this.form.get('sendandpay.CardTransfer').value;
        if(CardTransfer) {
          this.form.get('sendandpay.card_number').setValidators(Validators.compose([Validators.required]));
          this.form.get('sendandpay.card_number').updateValueAndValidity();
        } else {
          this.form.get('sendandpay.card_number').clearValidators();
          this.form.get('sendandpay.card_number').updateValueAndValidity();
        }
        break;
      }
    }

  }


  public submit(form = this.form): void {
    // "province": {id:$('#province').val().toString(), name: $('#province').select2('data')[0].text },
    // "city":  {id:$('#city').val().toString(), name: $('#city').select2('data')[0].text },
    // "district":  {id:$('#district').val().toString(), name: $('#district').select2('data')[0].text },

    this.formSubmitted = true;

    if (this.form.invalid) {
      this._translate.get("notification.required").subscribe( text => {
        this._notify.create("", text, NotificationType.Error)
      });
      return;
    }

    let province  = {};
    let city =  {};
    let district =  {};
    let main_page = {};

    $('#main-page').val() ? main_page = {id: $('#main-page').val().toString() || "", title: $('#main-page').select2('data')[0].text} : main_page = {id: "", title: ""};

    if(this.clickTabAddress) {
      $('#province').val() ? province  = {id:$('#province').val().toString() || "", name: $('#province').select2('data')[0].text } : province = {};
      $('#city').val() ? city =  {id:$('#city').val().toString() || "", name: $('#city').select2('data')[0].text } : city = {};
      $('#district').val() ? district =  {id:$('#district').val().toString() || "", name: $('#district').select2('data')[0].text } : district = {};
    }

    let data = JSON.parse(JSON.stringify(form.getRawValue()));
    let geographical_delivery_support = [];
    let custom_meta_tags = [];
    geographical_delivery_support.push(data['sendandpay']['geographical_delivery_support']);
    custom_meta_tags.push(data['seoanddomine']['custom_meta_tags']);
    let llz =(<HTMLInputElement>document.getElementById('latlng')).value;
    const postPriceArray: FormArray = <FormArray>this.form.get('sendandpay.post_cost');
    let latlng = llz.split(',');
    let latitude  = parseFloat(latlng[0]);
    let longitude  = parseFloat(latlng[1]);
    let zoom  = parseInt(latlng[2]);
    let f  = this._fb.group({

      // address
      "phone": data['addressandsocial']['phone'],
      "cellphone": data['addressandsocial']['cellphone'],
      "postal": parseInt(data['addressandsocial']['postal']),
      "fax": data['addressandsocial']['fax'],
      "address": data['addressandsocial']['address'],
      "province": province,
      "city": city,
      "district": district,
      "latitude": latitude,
      "longitude": longitude,
      "map_zoom_level": zoom,
      "index_in_mastershop": data['store']['index_in_mastershop'],

      // main
      "freeze": !data['store']['freeze'],
      "sub_not_required": data['store']['sub_not_required'],
      "ordering_freeze": data['store']['ordering_freeze'],
      "must_verify_customer": data['store']['must_verify_customer'],
      "name": data['store']['name'],
      "description": data['store']['description'],
      "email": data['store']['email'],
      "open_time": data['store']['open_time'],
      "close_time": data['store']['close_time'],
      "unlimited_time_ordering": data['store']['unlimited_time_ordering'],
      "display_bab_copyright": data['store']['display_bab_copyright'],
      "copyright": data['store']['copyright'],
      "home_page": main_page,
      "sms_footer": data['store']['sms_footer'],

      // pay
      "tax": data['sendandpay']['tax'],
      "payment": this._fb.group({
        "ravanpardakht": data['sendandpay']['ravanpardakht'],
        "CardTransfer": data['sendandpay']['CardTransfer'],
        "card_number": data['sendandpay']['card_number'],
        "pay_inperson": data['sendandpay']['pay_inperson'],
        "online_payment_is_active": data['sendandpay']['online_payment_is_active']
      }),
      "saman": this._fb.group({
        "merchant_id": data['sendandpay']['saman']['merchant_id']
      }),
      "mellat": this._fb.group({
        "terminal_id": data['sendandpay']['mellat']['terminal_id'],
        "username": data['sendandpay']['mellat']['username'],
        "password": data['sendandpay']['mellat']['password'],
        "description": data['sendandpay']['mellat']['description']
      }),
      "irankish": this._fb.group({
        "merchant_id": data['sendandpay']['irankish']['merchant_id'],
        "description": data['sendandpay']['irankish']['description']
      }),
      "payment_facility": this._fb.group({
        "api_key": data['sendandpay']['payment_facility']['api_key'],
        "terminal_id":  data['sendandpay']['payment_facility']['terminal_id'],
        "merchant_number":  data['sendandpay']['payment_facility']['merchant_number'],
        "internet_terminal_password":  data['sendandpay']['payment_facility']['internet_terminal_password']
      }),

      // send
      "delivery": this._fb.group({
        "post": data['sendandpay']['post'],
        "inperson": data['sendandpay']['inperson'],
        "free_shiping": data['sendandpay']['free_shiping'],
        "courier": data['sendandpay']['courier'],
        "post_cost": postPriceArray,
        "courier_cost": data['sendandpay']['courier_cost'],
        "default_post_cost": data['sendandpay']['default_post_cost'],
        "free_for_price": data['sendandpay']['free_for_price'],
      }),
      "country": data['sendandpay']['country'],
      "select_area": data['sendandpay']['select_area'],
      "geographical_delivery_support": geographical_delivery_support,

      // seo
      "enamad_tag": data['seoanddomine']['enamad_tag'],
      "enamad_meta_id": data['seoanddomine']['enamad_meta_id'],
      "samandehi": data['seoanddomine']['samandehi'],
      "google_analytics": data['seoanddomine']['google_analytics'],
      "custom_meta_tags": custom_meta_tags,
      "meta_description": data['seoanddomine']['meta_description'],
      "crisp": data['seoanddomine']['crisp'],
      "instagram-auth": data["social"]["instagram-auth"],

      // social
      "socials": this._fb.group({
        "telegram_channel": data['social']['telegram_channel'],
        "telegram_support": data['social']['telegram_support'],
        "instagram": data['social']['instagram'],
        "facebook": data['social']['facebook'],
        "twitter": data['social']['twitter'],
        "aparat": data['social']['aparat'],
        "google_plus": data['social']['google_plus'],
        "send_to_social_medias": data['social']['send_to_social_medias']
        // "telegram_id": data['social']['telegram_id']
      }),

    });

    this._api.set("brand/setting", "POST", {
      body: f.getRawValue()
    }, (res: { brand: Brand }): void => {
      this._userService.updateUserBrand(res.brand);
      this._notify.status(Opr.Edit, Ent.Store, res['name']);
    }, err => {
      this._notify.create(Opr.Save, err.message, Notify.Error);
    });
  }

  public selectTab(evt, id) {
    event.preventDefault();
    let i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(id).style.display = "block";
    evt.target.className += " active";
    this.selectTabMenu.nativeElement.value = id;
    this.statusinput(null, id);

  }

  public loadmodal() {
    setTimeout(() => {
      let strAllDistrict = this._translate.instant("store.all_district");
      let strAllCity = this._translate.instant("store.all_city");
      if(this.clickmodal == false) {

        let _api = this.ajaxSelect2 + '/api/public/v1';
        let provinces = [];

        let provincemodal = $('#provincemodal');
        let citymodal = $('#citymodal');
        let districtmodal = $('#districtmodal');


        provincemodal.select2({
          dir: "rtl",
          dropdownAutoWidth: true,
          dropdownParent: $('.parent1')
        });
        citymodal.select2({
          dir: "rtl",
          dropdownAutoWidth: true,
          dropdownParent: $('.parent2')
        });
        districtmodal.select2({
          dir: "rtl",
          dropdownAutoWidth: true,
          dropdownParent: $('.parent3'),
        });

        $.ajax({
          url: _api + '/province',
          success: function (data) {
            provinces = data;
            provinces.forEach((d) => {
              $("#provincemodal").append(new Option(d.name, d.id));
              ajaxCity();
            });
          }
        });

        let ajaxCity = () => {
          let idProvince = $("#provincemodal").val();
          $.ajax({
            url: _api + "/province/" + idProvince + "/city",
            success: function (result) {
              $("#citymodal").html('');
              $("#districtmodal").html('');
              $("#citymodal").append(new Option(strAllCity, ''));
              $("#districtmodal").append(new Option(strAllDistrict, ''));
              result.forEach((d) => {
                $("#citymodal").append(new Option(d.name, d.id));
              })
            }
          });
        };

        let ajaxDis = () => {
          let idCity =  $("#citymodal").val();
          if (idCity != '') {
            $.ajax({
              url: _api + "/city/" + idCity + "/district",
              success: function (result) {
                $("#districtmodal").html('');
                if (result == null) {
                  return;
                }
                $("#districtmodal").append(new Option(strAllDistrict, ''));
                result.forEach((d) => {
                  $("#districtmodal").append(new Option(d.name, d.id));
                });
              }
            })
          } else {
            $("#districtmodal").html('');
            $("#districtmodal").append(new Option(strAllDistrict, ''));
          }
        };

        $('#provincemodal').change(() => {
          ajaxCity();
        });

        $('#citymodal').change(() => {
          ajaxDis();
        });



        this.clickmodal = true;
      }
    }, 100);

  }

  public delete_area(array: Array<object>, i) {
    array.splice(i, 1);
    this.form.get(['sendandpay', 'geographical_delivery_support']).patchValue(array);
  }

  public add_selected_area() {
    this.obj = {
      province_name: $('#provincemodal').select2('data')[0].text,
      province_id: $('#provincemodal').val(),
      city_name: $('#citymodal').select2('data')[0].text,
      city_id: $('#citymodal').val(),
      district_name: $('#districtmodal').select2('data')[0].text,
      district_id: $('#districtmodal').val()
    };
    this.arr_selected_area.forEach((d, index) => {
      if(this.obj.province_id == d['province_id'] && this.obj.city_id == d['city_id'] && this.obj.district_id == d['district_id']) {
        this.delete_area(this.arr_selected_area, index);
      }
    });
    this.arr_selected_area.push(this.obj);
    this.form.get(['sendandpay', 'geographical_delivery_support']).patchValue(this.arr_selected_area);
  }

  public alertForPlan(): void {
    this._translate.get('accounting').subscribe(text => {
      setTimeout(() => {
        this._notify.alert(text.no_plan, text.activate_section, SwlT.Warn).then((res) => {
          this._router.navigate(['/accounting'], { relativeTo: this._route, queryParams: {} });
        });
      }, 200);
    });
  };

  ngOnDestroy() {
    this._api.remove("store");
    this._api.remove("/static/iranstates.json");
    this._api.remove("customer/profile_fields");
    this._api.remove("store/setting");
    this._api.remove("store/domain");
    this._api.remove("product/currency/change");
  }
}
