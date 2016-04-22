//-------------------------------------------------------------
function globalErrorHandler(msg, url, line, col, error) {
    // Note that col & error are only in the HTML 5 
    var extra = !col ? '' : '\ncolumn: ' + col + !error ? '' : '\nerror: ' + error;

    $('#dvMessage').text("javascript error: " + msg + "\nurl: " + url + "\nline: " + line + extra);

    // TODO: Report this error via ajax so you can keep track of js issues

    var suppressErrorAlert = true;

    // If you return true, then error alerts (like in older versions of Internet Explorer) will be suppressed.
    return true;
}
//------------------------------------------------------------------------------------------------------------

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}
//------------------------------------------------------------------------------------------------------------

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}
//------------------------------------------------------------------------------------------------------------

