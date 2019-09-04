
var onloadCallback = function(token: string) {
    $('#signupBtn').prop('disabled', false);
    $('.captcha-token').val(token);
};