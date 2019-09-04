
var onloadCallback = function(token) {
    $('#signupBtn').prop('disabled', false);
    $('.captcha-token').val(token);
};