/**
 * Created by jieliang on 4/5/17.
 */

 function onLoad() {
     gapi.load('auth2', function () {
         gapi.auth2.init();
     });
 }

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function() {
        console.log('User signed out.');
        window.location.href = window.location.origin;
    });
}

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    var name = profile.getName();
    var id_token = googleUser.getAuthResponse().id_token;
    var id = profile.getId();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
    console.log('Token: ' + id_token);
    $('.sign-in').hide();
    $('#sign-out').show();

    var current_date = new Date();
    current_date.setMonth(current_date.getMonth() + 1);
    // document.cookie = "IDToken=" + id_token + ";expires=" + current_date + ";domain=.recilive.stream;path=/";
    // document.cookie = "email=" + profile.getEmail() + ";expires=" + current_date + ";domain=.recilive.stream;path=/";
    // document.cookie = "name=" + profile.getName() + ";expires=" + current_date + ";domain=.recilive.stream;path=/";
    // document.cookie = "ID=" + profile.getId() + ";expires=" + current_date + ";domain=.recilive.stream;path=/";
    document.cookie = "IDToken=" + id_token + ";";
    document.cookie = "email=" + profile.getEmail() + ";";
    document.cookie = "name=" + profile.getName() + ";";
    document.cookie = "ID=" + profile.getId() + ";";

    var checkUser = $.ajax({
        type: "POST",
        url: "/ajax/check-user"
    });
    checkUser.done(function(data) {
        if (data.sign_up) {
            vex.dialog.buttons.YES.text = 'Student';
            vex.dialog.buttons.NO.text = 'Instructor';
            vex.dialog.confirm({
                message: 'What is your role?',
                callback: function(value) {
                  if(value) {
                    var role = 'Student';
                  }else {
                    role = 'Instructor';
                  }
                    $.ajax({
                        type: "POST",
                        url: "/ajax/sign_up",
                        contentType: "application/json",
                        data: JSON.stringify({
                            role: role
                        }),
                        success: function(data) {
                            if (data.result) {
                                if (data.redirect)
                                    window.location.href = window.location.origin + data.redirect;
                            } else {
                                // TODO ERROR handling
                            }
                        },
                        error: function(ts) {
                            console.log(ts.responseText);
                        }
                    });
                }
            });
        } else {
            window.location.href = window.location.origin + data.redirect;
        }
    });
}
