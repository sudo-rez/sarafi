
let errorNode = $('#error')
let errorNodeMsg = $('#error-msg')

function disabled() {
    showError("پرداخت مستقیم در حال حاضر غیر فعال میباشد")
}

function showError(msg) {
    errorNodeMsg.text(msg)
    errorNode.fadeTo(4000, 500).slideUp(500, function () {
        errorNode.slideUp(500);
    });
}