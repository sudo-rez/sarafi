let cardInput = $("#card")
let newcardInput = $("#newcard")
let cvv2Input = $("#cvv2")
let monthInput = $("#month")
let yearInput = $("#year")
let cardValue = $("#card-value")
let cvv2Value = $("#cvv2-value")
let dateValue = $("#date-value")
let bankValue = $("#bank-value")
let bankLogo = $("#bank-logo")
let amountValue = $("#amount")
let paymentIDValue = $("#paymentID")
let errorNode = $('#error')
let errorNodeMsg = $('#error-msg')
let successNode = $('#success')
let successNodeMsg = $('#success-msg')
let pouya = $('#pouya')
let passInput = $("#second-pass")
let timer = $('#time-remain')
let form1 = $('#form1')
let form2 = $('#form2')
let form3 = $('#form3')
let form4 = $('#form4')
let priceValue = $('#price')
let mobileInput = $('#mobile')
let codeInput = $('#code')
let shaparakCodeInput = $('#codes')
let urlVar = getUrlVars()
let cvv2NewInput = $("#cvv2-new")
let monthNewInput = $("#month-new")
let yearNewInput = $("#year-new")


var distance = 0;
var distanceCard = 0
var distanceShaparak = 0
var remainTime = $("#time_remain").val()
var otpTime = null
var remainTimer = null
var shaparakTimer = null
var selectMobile = "";

passInput.on('focus', function () {
    passInput.attr("type", "password")
});
newcardInput.on('input', function (n) {
    newcardInput.val(newcardInput.val().toPersianDigits())
    val = newcardInput.val()
    if (n.originalEvent.data && (val.length == 4 || val.length == 9 || val.length == 14)) {
        newcardInput.val(val + "-")
    } else if (n.originalEvent.data && (val.length == 5 || val.length == 10 || val.length == 15)) {
        newcardInput.val(val.substring(0, val.length - 1) + "-" + n.originalEvent.data.toPersianDigits())
    }
    if (isValidCard(newcardInput.val())) {
        newcardInput.removeClass("invalid")
    } else {
        newcardInput.addClass("invalid")
    }
})
mobileInput.on('input', function (n) {
    mobileInput.val(mobileInput.val().toPersianDigits())
    if (!(!mobileInput.val().toEng().startsWith("09") || mobileInput.val().length != 11)) {
        mobileInput.removeClass("invalid")
    } else {
        mobileInput.addClass("invalid")
    }
})
codeInput.on('input', function (n) {
    if (codeInput.val().length > 1) {
        codeInput.removeClass("invalid")
    } else {
        codeInput.addClass("invalid")
    }
})
shaparakCodeInput.on('input', function (n) {
    if (codeInput.val().length > 1) {
        codeInput.removeClass("invalid")
    } else {
        codeInput.addClass("invalid")
    }
})
cardInput.on('input', function (n) {
    var element = $(this).find('option:selected');
    selectMobile = element.attr("mobile");
    val = cardInput.val()
    if (val.length != 16) {
        cardValue.text("")
        bankValue.text("")
        bankLogo.attr("src", "")
        cardInput.addClass("invalid")
        return
    }
    var trimedVal = val.replaceAll("-", "")
    trimedVal = trimedVal.toPersianDigits()
    bank = fetchBankData(trimedVal.substr(0, 6))
    if (bank) {
        bankValue.text("بانک " + bank.nameFa)
        bankLogo.attr("src", "./static/bank/" + bank.bin + ".png")
    }

    const joy = trimedVal.match(/.{1,4}/g);
    cardValue.text(joy.join('  '))
    cardInput.removeClass("invalid")
});
cvv2Input.on('input', function () {
    if (cvv2Input.val().length > 2) {
        cvv2Input.removeClass("invalid")
    } else {
        cvv2Input.addClass("invalid")
    }
    cvv2Input.val(cvv2Input.val().toPersianDigits())
    cvv2Value.text(cvv2Input.val())
});
monthInput.on('input', expireDate);
yearInput.on('input', expireDate);

cvv2NewInput.on('input', function () {
    if (cvv2Input.val().length > 2) {
        cvv2Input.removeClass("invalid")
    } else {
        cvv2Input.addClass("invalid")
    }
    cvv2Input.val(cvv2Input.val().toPersianDigits())
    cvv2Value.text(cvv2Input.val())
});
monthNewInput.on('input', expireDate);
yearNewInput.on('input', expireDate);

function expireDate() {
    if (monthInput.val().length = 2) {
        monthInput.removeClass("invalid")
    } else {
        monthInput.addClass("invalid")
    }
    if (yearInput.val().length = 2) {
        yearInput.removeClass("invalid")
    } else {
        yearInput.addClass("invalid")
    }
    yearInput.val(yearInput.val().toPersianDigits())
    monthInput.val(monthInput.val().toPersianDigits())
    dateValue.text(yearInput.val() + "/" + monthInput.val())
}


function getUrlVars() {
    var vars = [],
        hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}






function setSrcQuery(e, q) {
    var src = e.src;
    var p = src.indexOf('?');
    if (p >= 0) {
        src = src.substr(0, p);
    }
    e.src = src + "?" + q
}

function isValidCard(v) {
    v = v.toEng()
    if (v.length == 16) {
        var res = 0
        for (let i = 0; i < v.length; i++) {
            if ((i + 1) % 2 == 0) {
                res = res + ~~v[i]
            } else {
                var mul = (~~v[i] * 2)
                if (mul > 9) mul = mul - 9
                res = res + mul
            }
        }
        if (res % 10 == 0) {
            return true
        }
    }
    return false
}

function reload() {
    setSrcQuery(document.getElementById('image'), "reload=" + (new Date()).getTime());
    return false;
}

function sendOtp() {
    if (distance > 0) {
        showError("لطفا منتظر بمانید")
        return
    }
    if (monthInput.hasClass("invalid") || yearInput.hasClass("invalid") || cvv2Input.hasClass("invalid")) {
        monthInput.addClass("show")
        yearInput.addClass("show")
        cvv2Input.addClass("show")
        return
    }

    var data = {
        p: urlVar["p"],
        mobile: selectMobile.toEng(),
        pan: cardInput.val().toEng(),
        cvv2: cvv2Input.val().toEng(),
        e_month: monthInput.val().toEng(),
        e_year: yearInput.val().toEng(), 
    }
    var settings = {
        "url": "/otp",
        "method": "POST",
        "data": data
    };
    $.ajax(settings).done(function (response) {
        distance = 120000
        otpTimer = setInterval(timeFunc, 1000);
        if(response.msg)
        showSuccess(response.msg)
        if(response.message)
        showSuccess(response.message)
    }).fail(function (jqXHR) {
        showErrorResponse(jqXHR.responseJSON)
    });
}

function getCardOtp() {
    if (distanceCard > 0) {
        showError("لطفا منتظر بمانید")
        return
    }
    if (newcardInput.hasClass("invalid") || mobileInput.hasClass("invalid")) {
        newcardInput.addClass("show")
        mobileInput.addClass("show")
        return
    }

    var data = {
        p: urlVar["p"],
        mobile: mobileInput.val().toEng(),
        pan: newcardInput.val().toEng(),
    }
    var settings = {
        "url": "/card/check",
        "method": "POST",
        "data": data
    };
    $.ajax(settings).done(function (response) {
        switch (response.code) {
            case 0:
                showSuccessResponse(response)
                distanceCard = 120000
                cardOtpTimer = setInterval(timeFuncNewCard, 1000);

                break;
            case 1:
                showSuccess("اکانت با موفقیت ثبت گردید")
                addNewCard(data.pan,data.mobile)
                break;
            case 2:
                showErrorResponse(response)
                break;
            default:
                showErrorResponse(response)
                break;
        }

    }).fail(function (jqXHR) {
        showError(jqXHR.responseJSON.msg)
    });
}

function newCardSubmit() {
    if (newcardInput.hasClass("invalid") || mobileInput.hasClass("invalid") || codeInput.hasClass("invalid")) {
        newcardInput.addClass("show")
        mobileInput.addClass("show")
        codeInput.addClass("show")
        return
    }

    var data = {
        p: urlVar["p"],
        mobile: mobileInput.val().toEng(),
        pan: newcardInput.val().toEng(),
        otp: codeInput.val().toEng(),
        cvv2:cvv2NewInput.val().toEng(),
        e_month:monthNewInput.val().toEng(),
        e_year:yearNewInput.val().toEng(),
    }
    var settings = {
        "url": "/card/check/verify",
        "method": "POST",
        "data": data
    };
    $.ajax(settings).done(function (response) {
        switch (response.code) {
            case 0:
                getShaparakCardOtp()
                nextForm(4)
                break;
            default:
                showErrorResponse(response)
                break;
        }
    }).fail(function (jqXHR) {
        showErrorResponse(jqXHR.responseJSON)
    });
}
function getShaparakCardOtp() {
    if (distanceShaparak > 0) {
        showError("لطفا منتظر بمانید")
        return
    }
    if (newcardInput.hasClass("invalid") || mobileInput.hasClass("invalid")) {
        newcardInput.addClass("show")
        mobileInput.addClass("show")
        return
    }

    var data = {
        p: urlVar["p"],
        pan: newcardInput.val().toEng(),
        mobile: mobileInput.val().toEng(),
    }
    var settings = {
        "url": "/card/shaparak/otp",
        "method": "POST",
        "data": data
    };

    $.ajax(settings).done(function (response) {
        switch (response.code) {
            case 0:
                showSuccessResponse(response)
                distanceShaparak = 120000
                shaparakCardOtpTimer = setInterval(timeFuncShapark, 1000);

                break;
            default:
                showErrorResponse(response)
                break;
        }

    }
    ).fail(function (jqXHR) {
        showErrorResponse(jqXHR.responseJSON)
    });

}
function shaparakCardSubmit() {
    if (shaparakCodeInput.hasClass("invalid")) {
        shaparakCodeInput.addClass("show")
        return
    }


    var data = {
        p: urlVar["p"],
        pan: newcardInput.val().toEng(),
        mobile: mobileInput.val().toEng(),
        otp: shaparakCodeInput.val().toEng(),
        e_year:yearNewInput.val().toEng(),
        e_month:monthNewInput.val().toEng(),
        cvv2:cvv2NewInput.val().toEng(),
    }
    var settings = {
        "url": "/card/shaparak/verify",
        "method": "POST",
        "data": data
    };
    $.ajax(settings).done(function (response) {
        switch (response.code) {
            case 0:
                showSuccessResponse(response)
                addNewCard(data.pan,data.mobile)
                nextForm(1)
                break;
            default:
                showErrorResponse(response)
                break;
        }
    }).fail(function (jqXHR) {
        showErrorResponse(jqXHR.responseJSON)
    });

}


function transaction() {

    var data = {
        p: urlVar["p"],
        mobile: selectMobile.toEng(),
        pan: cardInput.val().toEng(),
        cvv2: cvv2Input.val().toEng(),
        pin: passInput.val().toEng(),
        e_month: monthInput.val().toEng(),
        e_year: yearInput.val().toEng(),
    }
    var settings = {
        "url": "/t",
        "method": "POST",
        "data": data
    };
    $.ajax(settings).done(function (response) {
        switch (response.code) {
            case 0:
                if (response.msg)
                showSuccess(response.msg)
                if (response.message)
                showSuccess(response.message)
                window.location.replace("/success?id="+urlVar["p"])
                break;
            default:
                showErrorResponse(response)
                break;
        }

    }).fail(function (jqXHR) {
        showErrorResponse(jqXHR.responseJSON)
    });
}
function addNewCard(card,mobile) {
    console.log(mobile);
    $('#card').append($('<option>', {
        value: card,
        text: card.match(/.{1,4}/g).join('-').toPersianDigits(),
        class: "text-center",
        mobile: mobile
    }));
        nextForm(1)
}

function toPaymentPage(d) {
    if (cardInput.hasClass("invalid")) {
        cardInput.addClass("show")
        showError("لطفا شماره کارت خود را انتخاب کنید")
        return
    }
    arr = JSON.parse(d)
    console.log(arr);
    if (arr.includes(cardInput.val().toEng().substring(0, 6))) {
        showError("بانک انتخاب شده موقتا غیرفعال میباشد ، لطفا از کارت دیگر بانک ها استفاده نمایید")
        return
    }
    // nextForm(2)

    var data = {
        p: urlVar["p"],
        mobile: selectMobile.toEng(),
        pan: cardInput.val().toEng()
    }
    var settings = {
        "url": "/card/check",
        "method": "POST",
        "data": data
    };
    $.ajax(settings).done(function (response) {
        switch (response.code) {
            case 0:
                showSuccessResponse(response)
                nextForm(3)
                newcardInput.val(cardInput.val().cardSplit())
                mobileInput.val(selectMobile.toPersianDigits())
                newcardInput.removeClass("invalid")
                mobileInput.removeClass("invalid")
                distanceCard = 120000
                cardOtpTimer = setInterval(timeFuncNewCard, 1000);

                break;
            case 1:
                nextForm(2)
                break;
            default:
                showErrorResponse(response)
                break;
        }

    }).fail(function (jqXHR) {
        showErrorResponse(jqXHR.responseJSON)
    });
}

function cancelTxn(code) {
    window.location.replace("/cancel?id="+urlVar["p"]+"&code="+code)
}

function nextForm(step) {
    switch (step) {
        case 1:
            form3.removeClass('active')
            form3.addClass('deactive');
            form2.removeClass('active')
            form2.addClass('deactive');
            form4.removeClass('active')
            form4.addClass('deactive');

            form1.removeClass('deactive');
            form1.addClass('active');
            
            cvv2Input.val("")
            monthInput.val("")
            yearInput.val("")
            cvv2Value.text("")
            dateValue.text("")

            break;

        case 2:
            form3.removeClass('active')
            form3.addClass('deactive');
            form1.removeClass('active')
            form1.addClass('deactive');
            form4.removeClass('active')
            form4.addClass('deactive');


            form2.removeClass('deactive');
            form2.addClass('active');

            newcardInput.val("")
            newcardInput.removeClass("show")

            mobileInput.val("")
            mobileInput.removeClass("show")

            codeInput.val("")
            codeInput.removeClass("show")


            break;
        case 3:
            form1.removeClass('active')
            form1.addClass('deactive');
            form2.removeClass('active')
            form2.addClass('deactive');
            form4.removeClass('active')
            form4.addClass('deactive');

            form3.removeClass('deactive');
            form3.addClass('active');
            

            newcardInput.val("")
            newcardInput.removeClass("show")

            mobileInput.val("")
            mobileInput.removeClass("show")

            codeInput.val("")
            codeInput.removeClass("show")
            break;
            case 4:
                form1.removeClass('active')
                form1.addClass('deactive');
                form2.removeClass('active')
                form2.addClass('deactive');
                form3.removeClass('active');
                form3.addClass('deactive');

                form4.removeClass('deactive');
                form4.addClass('active');
                break;


        default:
            break;
    }
}

function timeFunc() {
    distance = distance - 1000
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    remain = addZeroDigit(minutes) + " : " + addZeroDigit(seconds)
    pouya.text(remain.toPersianDigits())
    if (distance < 0) {
        clearInterval(otpTimer);
        pouya.text("دریافت رمز پویا")
    }
}


function timeFuncNewCard() {
    distanceCard = distanceCard - 1000
    var minutes = Math.floor((distanceCard % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distanceCard % (1000 * 60)) / 1000);
    remain = addZeroDigit(minutes) + " : " + addZeroDigit(seconds)
    $("#cardOtp").text(remain.toPersianDigits())
    if (distanceCard < 0) {
        clearInterval(cardOtpTimer);
        $("#cardOtp").text("دریافت کد")
    }
}
function timeFuncShapark() {
    distanceShaparak = distanceShaparak - 1000
    var minutes = Math.floor((distanceShaparak % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distanceShaparak % (1000 * 60)) / 1000);
    remain = addZeroDigit(minutes) + " : " + addZeroDigit(seconds)
    $("#cardOtps").text(remain.toPersianDigits())
    if (distanceShaparak < 0) {
        clearInterval(shaparakCardOtpTimer);
        $("#cardOtps").text("دریافت کد")
    }
}



function timerFunc() {
    remainTime = remainTime - 1000
    var minutes = Math.floor((remainTime % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((remainTime % (1000 * 60)) / 1000);
    remain = addZeroDigit(minutes) + " : " + addZeroDigit(seconds)
    timer.text(remain.toPersianDigits())
    if (remainTime < 0) {
        clearInterval(remainTimer);
        timer.text("زمان به اتمام رسید")
    }
}
function showErrorResponse(response) {
    if (response.msg)
        showError(response.msg)
    if (response.message)
        showError(response.message)

}
function showSuccessResponse(response) {
    if (response.msg)
    showSuccess(response.msg)
    if (response.message)
    showSuccess(response.message)

}
function showSuccess(msg) {
    successNodeMsg.text(msg)
    successNode.fadeTo(4000, 500).slideUp(500, function () {
        successNode.slideUp(500);
    });
}

function showError(msg) {
    errorNodeMsg.text(msg)
    errorNode.fadeTo(4000, 500).slideUp(500, function () {
        errorNode.slideUp(500);
    });
}

function addZeroDigit(n) {
    if (n <= 9) {
        return "۰" + n
    }
    return n
}
String.prototype.toEng = function () {
    var persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g]
    var arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g]
    str = this
    for (var i = 0; i < 10; i++) {
        str = str.replace(persianNumbers[i], i).replace(arabicNumbers[i], i);
    }

    return str.replaceAll("-", "")
}
String.prototype.toPersianDigits = function () {
    var id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return this.replace(/[0-9]/g, function (w) {
        return id[+w]
    });
}
String.prototype.currencySplit = function () {
    return this.split("").reverse().join("").match(/.{1,3}/g).join(',').split("").reverse().join("")
}
String.prototype.cardSplit = function () {
    return this.toPersianDigits().match(/.{1,4}/g).join('-')
}


function fetchBankData(n) {
    var i = $(t).filter(function (t, i) {
        return i.bin.toPersianDigits() === n
    });
    return i[0]
}

$(function () {
    remainTimer = setInterval(timerFunc, 1000);
    priceValue.text(priceValue.text().toPersianDigits().currencySplit());
    $('#card option').each(function () {
        $(this).text($(this).text().toPersianDigits());
    })
});

$('#form2 input').joinInputs()