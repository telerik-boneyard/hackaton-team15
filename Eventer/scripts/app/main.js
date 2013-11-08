var app = (function () {
    'use strict';

    // global error handling
    var showAlert = function(message, title, callback) {
        navigator.notification.alert(message, callback || function () {
        }, title, 'OK');
    };
    var showError = function(message) {
        showAlert(message, 'Error occured');
    };
    window.addEventListener('error', function (e) {
        e.preventDefault();
        var message = e.message + "' from " + e.filename + ":" + e.lineno;
        showAlert(message, 'Error occured');
        return true;
    });

    var onBackKeyDown = function(e) {
        e.preventDefault();
        navigator.notification.confirm('Do you really want to exit?', function (confirmed) {
            var exit = function () {
                navigator.app.exitApp();
            };
            if (confirmed === true || confirmed === 1) {
                AppHelper.logout().then(exit, exit);
            }
        }, 'Exit', 'Ok,Cancel');
    };
    var onDeviceReady = function() {
        //Handle document events
        document.addEventListener("backbutton", onBackKeyDown, false);
    };

    document.addEventListener("deviceready", onDeviceReady, false);

    var applicationSettings = {
        emptyGuid: '00000000-0000-0000-0000-000000000000',
        apiKey: 'x0JGkn5LGo9RHsjo',
        scheme: 'http'
    };

    // initialize Everlive SDK
    var el = new Everlive({
        apiKey: applicationSettings.apiKey,
        scheme: applicationSettings.scheme
    });

    var facebook = new IdentityProvider({
        name: "Facebook",
        loginMethodName: "loginWithFacebook",
        endpoint: "https://www.facebook.com/dialog/oauth",
        response_type:"token",
        client_id: "622842524411586",
        redirect_uri:"https://www.facebook.com/connect/login_success.html",
        access_type:"online",
        scope:"email",
        display: "touch"
    });
    
    var AppHelper = {
        resolveProfilePictureUrl: function (id) {
            if (id && id !== applicationSettings.emptyGuid) {
                return el.Files.getDownloadUrl(id);
            }
            else {
                return 'styles/images/avatar.png';
            }
        },
        resolvePictureUrl: function (id) {
            if (id && id !== applicationSettings.emptyGuid) {
                return el.Files.getDownloadUrl(id);
            }
            else {
                return '';
            }
        },
        formatDate: function (dateString) {
            var date = new Date(dateString);
            var year = date.getFullYear().toString();
            var month = date.getMonth().toString();
            var day = date.getDate().toString();
            return day + '.' + month + '.' + year;
        },
        logout: function () {
            return el.Users.logout();
        }
    };

    var mobileApp = new kendo.mobile.Application(document.body, { transition: 'slide', layout: 'mobile-tabstrip' });

    var usersModel = (function () {
        var currentUser = kendo.observable({ data: null });
        var usersData;
        var loadUsers = function () {
            return el.Users.currentUser()
            .then(function (data) {
                var currentUserData = data.result;
                currentUserData.PictureUrl = AppHelper.resolveProfilePictureUrl(currentUserData.Picture);
                currentUser.set('data', currentUserData);
                return el.Users.get();
            })
            .then(function (data) {
                usersData = new kendo.data.ObservableArray(data.result);
            })
            .then(null,
                  function (err) {
                      showError(err.message);
                  }
            );
        };
        return {
            load: loadUsers,
            users: function () {
                return usersData;
            },
            currentUser: currentUser
        };
    }());

    // login view model
    var loginViewModel = (function () {
        var login = function () {
            //var username = $('#loginUsername').val();
            //var password = $('#loginPassword').val();

            //el.Users.login(username, password)
            el.Users.login("richard", "hack15")
            .then(function () {
                return usersModel.load();
            })
            .then(function () {
                mobileApp.navigate('views/feedView.html');
            })
            .then(null,
                  function (err) {
                      showError(err.message);
                  }
            );
        };
        var loginWithFacebook = function() {
            mobileApp.showLoading();
            facebook.getAccessToken(function(token) {
                el.Users.loginWithFacebook(token)
                .then(function () {
                    return usersModel.load();
                })
                .then(function () {
                    mobileApp.hideLoading();
                    mobileApp.navigate('views/feedView.html');
                })
                .then(null, function (err) {
                    mobileApp.hideLoading();
                    if (err.code = 214) {
                        showError("The specified identity provider is not enabled in the backend portal.");
                    }
                    else {
                        showError(err.message);
                    }
                });
            })
        } 
        return {
            login: login,
            loginWithFacebook: loginWithFacebook
        };
    }());

    // signup view model
    var singupViewModel = (function () {
        var dataSource;
        var signup = function () {
            dataSource.Gender = parseInt(dataSource.Gender);
            var birthDate = new Date(dataSource.BirthDate);
            if (birthDate.toJSON() === null)
                birthDate = new Date();
            dataSource.BirthDate = birthDate;
            Everlive.$.Users.register(
                dataSource.Username,
                dataSource.Password,
                dataSource)
            .then(function () {
                showAlert("Registration successful");
                mobileApp.navigate('#welcome');
            },
                  function (err) {
                      showError(err.message);
                  }
            );
        };
        var show = function () {
            dataSource = kendo.observable({
                Username: '',
                Password: '',
                DisplayName: '',
                Email: '',
                Gender: '1',
                About: '',
                Friends: [],
                BirthDate: new Date()
            });
            kendo.bind($('#signup-form'), dataSource, kendo.mobile.ui);
        };
        return {
            show: show,
            signup: signup
        };
    }());

    var EventsModel = (function () {
        var EventModel = {
            id: 'Id',
            fields: {
                Title: {
                    field: 'Title',
                    defaultValue: ''
                },
                CreatedAt: {
                    field: 'CreatedAt',
                    defaultValue: new Date()
                },
                Description: {
                    field: 'Description',
                    defaultValue: ''
                },
                StartTime: {
                    field: 'StartTime',
                    defaultValue: new Date()
                },
                Organizer: {
                    field: 'Organizer',
                    defaultValue: ""
                },
                Participants: {
                    field: 'Participants',
                    defaultValue: ""
                },
                MaxParticipants: {
                    field: 'MaxParticipants',
                    defaultValue: ""
                },
                CoverImage: {
                    field: 'CoverImage',
                    defaultValue: ''
                },
                LocationDescription: {
                    field: 'LocationDescription',
                    defaultValue: ''
                },
                LocationCoordinates: {
                    field: 'LocationCoordinates',
                    defaultValue: ''
                },
                Tags: {
                    field: 'Tags',
                    defaultValue: []
                }
                
            },
            CreatedAtFormatted: function () {
                return AppHelper.formatDate(this.get('CreatedAt'));
            },
            StartTimeFormatted: function () {
                return AppHelper.formatDate(this.get('StartTime'));
            },
            CoverImageURL: function () {
                return AppHelper.resolvePictureUrl(this.get('CoverImage'));
            },
            ParticipantsCount: function () {
                var participants = this.get('Participants');
                //return participants.length;
                return 2;
            },
            ParticipantsAvatars: function () {
                var participants = this.get('Participants'),
                users = usersModel.users(),
                avatars = [];
                
                users.forEach(function (item) {
                    if(participants.indexOf(item.Id) != -1) {
                        avatars.push(AppHelper.resolvePictureUrl(item.get('Avatar')));
                    }
                });
                
                console.log(avatars);
                return avatars;
            }
        };
        var eventsDataSource = new kendo.data.DataSource({
            type: 'everlive',
            schema: {
                model: EventModel
            },
            transport: {
                // required by Everlive
                typeName: 'Event'
            },
            change: function (e) {
                if (e.items && e.items.length > 0) {
                    $('#no-activities-span').hide();
                }
                else {
                    $('#no-activities-span').show();
                }
            },
            sort: { field: 'CreatedAt', dir: 'desc' }
        });
        return {
            events: eventsDataSource
        };
    }());
    
    // feed view model
    var feedViewModel = (function () {
        var eventSelected = function (e) {
            mobileApp.navigate('views/eventView.html?uid=' + e.data.uid);
        };
        
        /*
        var navigateHome = function () {
            mobileApp.navigate('#welcome');
        };
        
        var logout = function () {
            AppHelper.logout()
            .then(navigateHome, function (err) {
                showError(err.message);
                navigateHome();
            });
        };
        */
        return {
            feed: EventsModel.events,
            eventSelected: eventSelected,
            //logout: logout
        };
    }());

    // event details view model
    var eventViewModel = (function () {
        var joinOrCancel;
        
        function joinCancel(e) {
            // Here you can write the logic for cancel and joining an event // Richard
            joinOrCancel ? console.log("join") : console.log("cancel");
        }
        
        return {
            show: function (e) {
                var event = EventsModel.events.getByUid(e.view.params.uid),
                me = usersModel.currentUser.get('data').Id,
                btn = $("#joinBtn"),
                user;
                
                kendo.bind(e.view.element, event, kendo.mobile.ui);
                
                user = $.grep(usersModel.users(), function (e) {
                    return me === event.Organizer;
                })[0];
                
                user ? joinOrCancel = false : joinOrCancel = true;
                user ? btn.text("Cancel") : btn.text("Join!");
                
                btn.kendoTouch({ tap: function (e) { joinCancel() } });
                $("body").kendoTouch({ enableSwipe: true, swipe: function (e) {
                    if(e.direction === "right") {
                        mobileApp.navigate('#:back');
                    }
                } });
            }
        };
    }());

    // add activity view model
    var addActivityViewModel = (function () {
        var $newStatus;
        var validator;
        var init = function () {
            validator = $('#enterStatus').kendoValidator().data("kendoValidator");
            $newStatus = $('#newStatus');
        };
        var show = function () {
            $newStatus.val('');
            validator.hideMessages();
        };
        var saveActivity = function () {
            if (validator.validate()) {
                var activities = activitiesModel.activities;
                var activity = activities.add();
                activity.Text = $newStatus.val();
                activity.UserId = usersModel.currentUser.get('data').Id;
                activities.one('sync', function () {
                    mobileApp.navigate('#:back');
                });
                activities.sync();
            }
        };
        return {
            init: init,
            show: show,
            me: usersModel.currentUser,
            saveActivity: saveActivity
        };
    }());

    return {
        viewModels: {
            login: loginViewModel,
            signup: singupViewModel,
            addActivity: addActivityViewModel,
            feed: feedViewModel,
            event: eventViewModel
        }
    };
}());