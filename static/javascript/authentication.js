/**
 * Created by jieliang on 4/5/17.
 */

 function onLoad() {
     gapi.load('auth2', function () {
         gapi.auth2.init();
     });
 }
// only clear cookies without domain
function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if(name === "IDToken") {
          $.cookie('IDToken',null, {domain:'.recilive.stream'});
        }else {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    }
}

$(function() {
  // $('.sign-in').show();
  // $('#sign-out').hide();
});

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      deleteAllCookies();
        window.location.href = "http://recilive.stream";
    });
}

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    var name = profile.getName();
    var id_token = googleUser.getAuthResponse().id_token;
    var id = profile.getId();
    // $('.sign-in').hide();
    // $('#sign-out').show();

    var current_date = new Date();
    current_date.setMonth(current_date.getMonth() + 1);
    // document.cookie = "IDToken=" + id_token + ";expires=" + current_date + ";domain=.recilive.stream;path=/";
    // document.cookie = "email=" + profile.getEmail() + ";expires=" + current_date + ";domain=.recilive.stream;path=/";
    // document.cookie = "name=" + profile.getName() + ";expires=" + current_date + ";domain=.recilive.stream;path=/";
    // document.cookie = "ID=" + profile.getId() + ";expires=" + current_date + ";domain=.recilive.stream;path=/";
    document.cookie = "IDToken=" + id_token + ";domain=.recilive.stream;path=/";
    document.cookie = "email=" + profile.getEmail() + ";";
    document.cookie = "name=" + profile.getName() + ";";
    document.cookie = "ID=" + profile.getId() + ";";

    var checkUser = $.ajax({
        type: "POST",
        url: "/ajax/check-user"
    });
    checkUser.done(function (data) {
        if (data.sign_up) {
            vex.dialog.buttons.YES.text = 'Student';
            vex.dialog.buttons.NO.text = 'Instructor';

            prestartDialog = vex.dialog.open({
                message: 'What is your role?',
                buttons: [{
                    text: 'Student', type: 'button', className: 'vex-dialog-button-primary',
                    click: function () {
                        $.ajax({
                            type: "POST",
                            url: "/ajax/sign-up",
                            contentType: "application/json",
                            data: JSON.stringify({
                                role: 'Student'
                            }),
                            success: function (data) {
                                if (data.result) {
                                    if (data.redirect)
                                        window.location.href = window.location.origin + data.redirect;
                                } else {
                                    // TODO ERROR handling
                                }
                            },
                            error: function (ts) {
                                console.log(ts.responseText);
                            }
                        });
                    }
                }, {
                    text: 'Instructor', type: 'button', className: 'vex-dialog-button-primary',
                    click: function () {
                        $.ajax({
                            type: "POST",
                            url: "/ajax/sign-up",
                            contentType: "application/json",
                            data: JSON.stringify({
                                role: 'Instructor'
                            }),
                            success: function (data) {
                                if (data.result) {
                                    if (data.redirect)
                                        window.location.href = window.location.origin + data.redirect;
                                } else {
                                    // TODO ERROR handling
                                }
                            },
                            error: function (ts) {
                                console.log(ts.responseText);
                            }
                        });
                    }
                }],
                overlayClosesOnClick: false,
            });


        } else {
            window.location.href = window.location.origin + data.redirect;
        }
    });
}
