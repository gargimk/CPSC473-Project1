/*globals $*/
"use strict";
var currentUser;  //to store current user

$(document).ready(function () {
    $(".dashboard").hide();
    $(".signin").hide();

    getSession();
    //if user is not present in session then show signin
    if (currentUser === 'temp') {
        $(".dashboard").hide();
        $(".signin").show();
        $(".signupButton").html("SignUp");
    }
    //if user is present then show dashboard 
    else {
        $(".currentUser").html(currentUser);
        $(".dashboard").show();
        $(".blogs").innerHTML = " ";
        display();
        $(".signin").hide();
        $(".signupButton").html("SignOut");
        //when user clicks signout button, singin is dispalyed
        $(".signupButton").on('click', function () {
            $(".dashboard").hide();
            $(".signin").show();
            signout();
        });
    }

    $("#tweetForm").keyup(function (event) {
        /*
            Update character count and disable submit 
            button after 140 characters.
        */
        var max = 140;
        var length = $(".tweet").val().length;
        $("#count").text((max - length));

        if (length > 140) {
            console.log(length);
            $("#tweet").prop("disabled", true);
        } else {
            console.log(length);
            $("#tweet").prop("disabled", false);
        }
    });


    //to get current date
    function getCurrentDate() {
        var date = new Date(),
            dateStr = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear().toString().substr(2, 2);
        return dateStr;
    }

    /*
        To submit the post.
        Update dB with post.
        Show post in the "Recent Tweet" area.
    */
    $("#tweetForm").submit(function (event) {
        event.preventDefault();
        var tweet = $(".tweet").val();
        if (tweet !== "" && tweet !== undefined && tweet !== null) {
            var user = [];
            user.push(currentUser);
            $.ajax({
                url: "http://localhost:3000/blog",
                type: "POST",
                dataType: 'json',
                data: JSON.stringify({
                    "votes": 1,             //user who post the tweet, user's vote is considered for the post by default
                    "date": getCurrentDate(),
                    "text": tweet,
                    "postedOnTwitter": false,
                    "createdby": currentUser,
                    "approvedBy": user
                }),
                contentType: "application/json",
                success: function (data) {
                    $(".blogs").append(loadNewTweets(data));
                },
                error: function (xhr, textStatus, errorThrown) {
                    console.log("Error" + xhr.status);
                }
            });
            //to reset the tweet box and character count
            $(".tweet").val("");
            $("#count").text(140);
        } else {
            //error alert if tweet box is empty
            $('#alertModal').modal('show');
             $('.alertTitle').html("Warning!");
            $('.modalMsg').html("Tweet box empty.<br>Please enter the tweet to post.");
        }
    });

    /*
    To increase the vote count. 
    Disable the vote button once clicked.
    Update votes for post in db
    */
    $(".blogs").on("click", "button", function () {
        
        //to prevent default form submit event
        $("#f1").submit(function (event) {
            event.preventDefault();
        });

        var id = this.lastChild.id;
        var parentId = $(this).parent()[0].id;
        var votes = this.lastChild.innerHTML;
        var date, text, postedOnTwitter, createdby;

        votes = parseInt(votes) + 1;   //increase vote count by 1 on click of the button

        $("#" + parentId)[0].innerHTML = "<span class=\"glyphicon glyphicon-thumbs-up\" aria-hidden=\"true\"></span> Votes <span class=\"likes\" id=" + id + ">" + votes + "</span>";

        $.ajax({
            url: 'http://localhost:3000/blog/' + id,
            type: 'GET',
            dataType: 'json',
            success: function (data) {

                votes = data.votes + 1;
                date = data.date;
                text = data.text;
                postedOnTwitter = data.postedOnTwitter;
                createdby = data.createdby;
                var approvedBy = data.approvedBy;
                approvedBy.push(currentUser);

                var count = getUserCount(); //to get number of users in db

                if (votes >= count) {
                    tweetPost(text, this);
                    $("#primaryDiv" + id).hide();
                    postedOnTwitter = true;
                }
                updateDb(votes, date, text, postedOnTwitter, createdby, approvedBy, id);
            },
            error: function (xhr, textStatus, errorThrown) {
                console.log("Error" + xhr + textStatus + errorThrown);
            }
        });

    });

});

/*
    Show pending approval post in the "Recent Tweet" area.
*/
function display() {
    $.ajax({
        url: "http://localhost:3000/blog",
        type: "GET",
        dataType: "json",
        success: function (data) {
            $.each(data, function (x, value) {
                if (!value.postedOnTwitter) {
                    $(".blogs").append(loadNewTweets(value));
                }

            });
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log("Error" + xhr + textStatus + errorThrown);
        }
    });
}
    
//To create the DOM for post display dynamically
function loadNewTweets(tweet) {
    var blog = "";
    blog += "<div id=\"primaryDiv" + tweet.id + "\" class=\"panel panel-primary\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Tweet by:" + tweet.createdby + " on " + tweet.date + "</h3>";
    blog += "</div><div class=\"panel-body\">" + tweet.text + "</div><div id=\"footer" + tweet.id + "\" class=\"panel-footer textright \">";
    var result = checkUsers(tweet.id);
    if (result) {
        blog += "<button class=\"btn like btn-warning\"><span class=\"glyphicon glyphicon-thumbs-up\" aria-hidden=\"true\"></span> Votes <span class=\"likes\" id=" + tweet.id + ">" + tweet.votes + "</span></button>";
    } else {
        blog += "<span class=\"glyphicon glyphicon-thumbs-up\" aria-hidden=\"true\"></span> Votes <span class=\"likes\" id=" + tweet.id + ">" + tweet.votes + "</span>";

    }
    blog += "</div></div>";
    return blog;
}

//update the database 
function updateDb(votes, date, text, postedOnTwitter, createdby, approvedBy, id) {
    $.ajax({
        url: "http://localhost:3000/blog/" + id,
        type: "PUT",
        dataType: 'json',
        async: false,
        data: JSON.stringify({
            "votes": votes,
            "date": date,
            "text": text,
            "postedOnTwitter": postedOnTwitter,
            "createdby": createdby,
            "approvedBy": approvedBy

        }),
        contentType: "application/json",
        success: function (data) {

        },
        error: function (xhr, textStatus, errorThrown) {
            console.log("Error" + xhr + textStatus + errorThrown);
        }

    });
}



//To check current and approved users for the post
function checkUsers(id) {

    var flag = function () {
        var temp = true;
        $.ajax({
            url: 'http://localhost:3000/blog/' + id,
            type: 'GET',
            dataType: 'json',
            async: false,
            success: function (data) {

                var userStr = data.approvedBy;
                getSession();
                if (data.createdby === currentUser) {
                    temp = false;
                } else {
                    for (var i in userStr) {

                        if (userStr[i] === currentUser) {
                            temp = false;
                        }
                    }
                }

            },
            error: function (xhr, textStatus, errorThrown) {
                console.log("Error" + xhr + textStatus + errorThrown);
            }
        });

        return temp;
    } ();

    return flag;
}


//call to the server to post the tweet to twitter
function tweetPost(text, id) {
    $.ajax({
        url: 'http://localhost:7012/postTweet',
        type: 'POST',
        dataType: 'json',
        contentType: "application/json",
        data: JSON.stringify({
            status: text
        }),
        success: function (data) {
            if(data.msg === "success"){
                $('#alertModal').modal('show');
                $('.alertTitle').html("Success Message!");
                $('.modalMsg').html("Tweet succesfully posted to twitter!!");
                setTimeout(function() {$('#alertModal').modal('hide');}, 5000);
            }
            else{
                $('#alertModal').modal('show');
                $('.alertTitle').html("Warning!");
                $('.modalMsg').html("Tweet post to twitter unsuccessful!");
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log("Error" + xhr + textStatus + errorThrown);
            $('#alertModal').modal('show');
            $('.alertTitle').html("Warning!");
            $('.modalMsg').html("Tweet post to twitter unsuccessful!");
        }
    });

}

//returns the ttal number of users in db
function getUserCount() {

    var flag = function () {
        var temp = 0;
        $.ajax({
            url: 'http://localhost:3000/users',
            type: 'GET',
            dataType: 'json',
            async: false,
            success: function (data) {
                $.each(data, function (index) {
                    temp = temp + 1;
                });

            },
            error: function (xhr, textStatus, errorThrown) {
                console.log("Error" + xhr + textStatus + errorThrown);
            }

        });
        return temp;
    } ();

    return flag;

}

//update the logged in user in session
function updateSessionDataForLogin(session) {
    $.ajax({
        url: 'http://localhost:3000/session/' + 1,
        type: 'PUT',
        contentType: 'application/json',
        dataType: 'json',
        async: false,
        data: JSON.stringify({
            user: session,
            isactive: true
        }),
        success: function (data) {

            if (data.id !== 'temp') {

                $(".dashboard").show();
                $(".blogs")[0].innerHTML = " ";
                display();
                $(".signin").hide();
                $(".signupButton").html("SignOut");
                $(".signupButton").on('click', function () {
                    $(".dashboard").hide();
                    $(".signin").show();
                    signout();

                });
            }
        },
        error: function (xhr, textStatus, errorThrown) {

            console.log("Error" + xhr + textStatus + errorThrown);
        }
    });
}

//to validate the user logging in 
function login() {
    $("#f1").submit(function (event) {
        event.preventDefault();
    });


    var email = $("#inputEmail").val();
    var password = $("#inputPassword").val();
    var session = null;


    if (email !== '' || password !== '') {   //validate if signin username or password field is not empty
        if (email === '') { $("#inputEmail").focus(); }
        if (password === '') { $("#inputPassword").focus(); }


        $.ajax({
            url: 'http://localhost:3000/users/' + email,
            type: "GET",
            contentType: 'application/json',
            dataType: 'json',
            async: false,
            success: function (data) {
                //if user is present then grant access
                if (data.id === email && data.password === password) {

                    session = email;
                    updateSessionDataForLogin(session);  //update session
                    getSession();
                    $(".currentUser").html(currentUser);
                }
                else {
                    $('#alertModal').modal('show');
                     $('.alertTitle').html("Warning!");
                    $('.modalMsg').html("Username/Password invalid");
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                console.log("Error" + xhr + textStatus + errorThrown);
                $('#alertModal').modal('show');
                 $('.alertTitle').html("Warning!");
                $('.modalMsg').html("Username/Password invalid");

            }
        });
    }
    else {
        //error message if any of username or password is blank
        $('#alertModal').modal('show');
         $('.alertTitle').html("Warning!");
        $('.modalMsg').html("Username/Password cannot be blank.");
    }
}

//update the session for new user signup and grant the access
var session, email, pass;
function updateSessionDataForSignup(session) {
    $("#f1").submit(function (event) {
        event.preventDefault();
    });
    $.ajax({
        url: 'http://localhost:3000/session/',
        type: 'post',
        async: false,
        dataType: 'json',
        data: {
            user: session,
            isactive: true,
            id: 1
        },
        success: function (data) {
            if (data.id !== 'temp') {
                $(".dashboard").show();
                $(".blogs")[0].innerHTML = " ";
                display();
                $(".signin").hide();
                $(".signupButton").html("SignOut");
                $(".signupButton").on('click', function () {
                    $(".dashboard").hide();
                    $(".signin").show();
                    signout();
                });
            }
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log("Error" + xhr + textStatus + errorThrown);
        }
    });
}
//create new user at sign up
function createUser() {

    $("#f2").submit(function (event) {

        event.preventDefault();
    });

    var signupID = $("#signupEmail").val();
    var signupPass = $("#signupPassword").val();
    var session = null;

    if (signupID !== '' && signupPass !== '') {  //validate if signup username or password field is not empty
        //username cannotbe 'temp' as it is revesed for session management
        if (signupID === 'temp') {
            $('#alertModal').modal('show');
             $('.alertTitle').html("Warning!");
            $('.modalMsg').html("Username 'temp' is not accepted.Please use different username");
        }
        else {
            //check if user is already exists    
            var flag = function () {
                var temp = false;
                $.ajax({
                    url: 'http://localhost:3000/users/' + signupID,
                    type: 'GET',
                    dataType: 'json',
                    async: false,
                    success: function (data) {
                        if (data.id.length > 0)
                            temp = true;
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        console.log("Error" + xhr + textStatus + errorThrown);
                    }

                });
                return temp;
            } ();


            if (flag) {
                //if user already present in db then show error box
                $('#alertModal').modal('show');
                 $('.alertTitle').html("Warning!");
                $('.modalMsg').html("User already present.<br>Please use diffrent Username");
            }
            else {
                //else create new user and grant access
                $.ajax({
                    url: 'http://localhost:3000/users/',
                    type: "post",
                    async: false,
                    dataType: 'json',
                    data: {
                        id: signupID,
                        password: signupPass
                    },
                    success: function (data) {

                        session = data.id;
                        updateSessionDataForSignup(session); //update the session on success
                        getSession();
                        $(".currentUser").html(currentUser);
                        $('#signupModal').modal('hide');
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        console.log("Error" + xhr + textStatus + errorThrown);
                    }
                });
            }

        }
    }
    else {
        //error message if username or password field is empty
        $('#alertModal').modal('show');
         $('.alertTitle').html("Warning!");
        $('.modalMsg').html("Username/Password cannot be blank.");
    }
}

//to show the sign up box
function signup() {
    getSession();
    if (currentUser === 'temp') {
        $('#signupModal').modal('show');
        $(".dashboard").hide();
    }

}

/* 
to update the session to 'temp' user on signout
redirect to sign in from dashbaord
*/
function signout() {
    $.ajax({
        url: 'http://localhost:3000/session/' + 1,
        type: 'PUT',
        contentType: 'application/json',
        dataType: 'json',
        async: false,
        data: JSON.stringify({
            user: "temp",
            isactive: false
        }),
        success: function (data) {
            $(".dashboard").hide();
            $(".signin").show();
            $(".signupButton").html("SignUp");
            //clear the signin and signup input fields
            $("#inputEmail").val("");
            $("#inputPassword").val("");
            $("#signupEmail").val("");
            $("#signupPassword").val("");
        },
        error: function (xhr, textStatus, errorThrown) {

            console.log("Error" + xhr + textStatus + errorThrown);
        }
    });

}

/*
to get the current user in session
 */
function getSession() {
    $.ajax({
        url: 'http://localhost:3000/session/1',
        type: "GET",
        contentType: 'application/json',
        dataType: 'json',
        async: false,
        success: function (data) {
            currentUser = data.user;
            $("#user").html(currentUser);
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log("Error" + xhr + textStatus + errorThrown);
        }
    });
}

/* 
to dispaly the 'About' information box
contains the information about the application, developers and class
*/
function aboutTweetApp() {
    $('#aboutModal').modal('show');
}



