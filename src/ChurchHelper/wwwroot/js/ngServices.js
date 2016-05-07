﻿(function () {
    'use strict';
    var app = angular.module("appServices", ["ngRoute"]);
    /*---------------------------------------------------------------------------------------------------------
                                                Service Api Call
    --------------------------------------------------------------------------------------------------------- */
    app.service('serviceApiCalls', ['$http', '$rootScope', function ($http, $rootScope) {
        var apiPath = "http://localhost:54379/apiBible/"; // "http://churchhelper.azurewebsites.net/apiBible/"; 
        //--------------------------------------------------------------------------------------
        var me = this;

        this.getBibleStructure = function () { // get bible structure in 2 lang once at the begining of the angular app

            $http.get(apiPath + "GetBibleStructure")
                .then(function (response) {
                    var apiResponse = response.data;
                    if (apiResponse.Status.Ok) {
                        $rootScope.bibleStructures = apiResponse.Data; //intended to be 2 bible structures each in a different language
                        $rootScope.bibleStructures.unshift(apiResponse.Data[0]); //add an extra bible at the position of 0 as default and to make switch between bible versions easier
                    } else {
                        me.failureApiCall(apiResponse);
                    }
                }, this.failureHttpRequest);
        }
        //--------------------------------------------------------------------------------------
        this.getVerseOfChapter = function (bibleId, bookId, chapterId, callBack) {

            $http.get(apiPath + "GetVersesOfChapter/" + bibleId + "/" + bookId + "/" + chapterId)
                .then(function (response) {
                    var apiResponse = response.data;
                    if (apiResponse.Status.Ok) {
                        callBack(apiResponse.Data);
                    } else {
                        me.failureApiCall(apiResponse);
                    }
                }, this.failureHttpRequest);
        }
        //--------------------------------------------------------------------------------------
        this.doSearch = function (jsonData, callBack) {

            $http.post(apiPath + "DoSearch", jsonData)
                .then(function (response) {
                    var apiResponse = response.data;
                    if (apiResponse.Status.Ok) {
                        callBack(apiResponse.Data, apiResponse.Pagination);
                    } else {
                        me.failureApiCall(apiResponse);
                    }
                }, this.failureHttpRequest);
        }
        //--------------------------------------------------------------------------------------
        this.failureHttpRequest = function (response) {
            $("#dvMessage").text("http Failure: " + response.status + " : " + response.statusText);
            $('#btnClearMessage').show();
        };
        this.failureApiCall = function (apiResponse) {
            $("#dvMessage").text("api Failure: " + apiResponse.Status.Id + " : " + apiResponse.Status.Info);
            $('#btnClearMessage').show();
        };
        //--------------------------------------------------------------------------------------

    }
    ]);
    /*---------------------------------------------------------------------------------------------------------
                                                Service Display
    --------------------------------------------------------------------------------------------------------- */
    app.service('serviceDisplay', function () {
        var me = this;
        this.publish = [];                                      // array of subscribers
        this.arDisplayData = [];                                // array of data to display  
        this.currentIndex = 1;
        this.titlePrefix = "";

        this.registerSubscriber = function (callback) {         //build publish array
            me.publish.push(callback);
        };

        this.setDisplayData = function (data, index, titlePrefix) {
            me.currentIndex = index;                           // when bible, book or chapter changes
            me.titlePrefix = titlePrefix;
            me.arDisplayData = data;
            me.publish.forEach(function (p) {
                p("dataChange");
            });
        }

        this.startDisplay = function (index) {
            me.currentIndex = index;
            me.publish.forEach(function (p) {                 // when user clicks a certain index to go display, fire a signal to start display
                p("switchTab");
            });
        }

    });
    /*---------------------------------------------------------------------------------------------------------
                                                service Bible Settings
    --------------------------------------------------------------------------------------------------------- */
    app.service('serviceBibleSettings', ['$rootScope', function ($rootScope) {
        var me = this;
        this.publish = [];
        this.settings = { versesPerPage: 2, bibleId: 1, align: "right", language: "arabic" };

        this.getSettings = function () {
            return me.settings;
        };

        this.registerSubscriber = function (callback) {
            me.publish.push(callback);
        };

        this.initSettings = function () {
            var settings = getCookie("bibleSettings");
            if (settings != null && settings != '')
                me.settings = JSON.parse(settings);

            me.publish.forEach(function (p) {
                p();
            });
        };

        this.saveSettings = function () {
            setCookie("bibleSettings", JSON.stringify(me.settings), 1000);
        }

        this.setVersesPerPage = function (versesPerPage) {
            me.settings.versesPerPage = versesPerPage;
            me.publish.forEach(function (p) {
                p();
            });
        }

        this.setBibleId = function (bibleId) {
            me.settings.bibleId = bibleId;
            var index = parseInt(bibleId);
            if ($rootScope.bibleStructures != null && $rootScope.bibleStructures[index] != null) {
                me.settings.align = $rootScope.bibleStructures[index].Alignment;
                me.settings.language = $rootScope.bibleStructures[index].Language;
            }
            me.publish.forEach(function (p) {
                p();
            });
        }

    }]);

    /*---------------------------------------------------------------------------------------------------------
                                                service StyleSettings
    --------------------------------------------------------------------------------------------------------- */
    app.service('serviceStyleSettings', ['serviceBibleSettings', function (serviceBibleSettings) {

        var me = this;
        this.publish = [];  // array of function pointers that are subscribed to the service and will be called on updates by the service
        this.settings = { backgroundColor: "aliceblue", backgroundImage: "none", backgroundRepeat: "stretch", fontColor: "black", fontSize: "18", align: "left", language: "english" };

        this.getSettings = function () {
            return me.settings;
        };

        this.registerSubscriber = function (callback) {
            me.publish.push(callback);              // register subscribers
        };

        this.initSettings = function () {
            var settings = getCookie("styleSettings");
            if (settings != null && settings != '')
                me.settings = JSON.parse(settings);

            this.setCssClass(me.settings.fontColor, me.settings.backgroundColor);

            me.settings.align = serviceBibleSettings.settings.align;
            me.settings.language = serviceBibleSettings.settings.language;

            me.publish.forEach(function (p) {      // publish updates to subscribers
                p();
            });
        };

        this.saveSettings = function () {
            setCookie("styleSettings", JSON.stringify(me.settings), 1000);
        }

        this.init = function () {
            serviceBibleSettings.registerSubscriber(me.updateSubscriber);  //get registered at other publishers
        };

        this.updateSubscriber = function () { // subscribe to & read from serviceBibleSettings
            me.settings.align = serviceBibleSettings.settings.align;
            me.settings.language = serviceBibleSettings.settings.language;
            me.publish.forEach(function (p) {
                p();
            });
        }

        this.setFontSize = function (fontSize) { // write from serviceSettings
            me.settings.fontSize = fontSize;
            me.publish.forEach(function (p) {
                p();
            });
        }

        this.setBackgroundColor = function (backgroundColor) {
            me.settings.backgroundColor = backgroundColor;
            me.publish.forEach(function (p) {
                p();
            });
            this.setCssClass(me.settings.fontColor, me.settings.backgroundColor);
        }

        this.setBackgroundImage = function (backgroundImage) {
            me.settings.backgroundImage = backgroundImage;
            me.publish.forEach(function (p) {
                p();
            });
        }

        this.setBackgroundRepeat = function (backgroundRepeat) {
            me.settings.backgroundRepeat = backgroundRepeat;
            me.publish.forEach(function (p) {
                p();
            });
        }

        this.setFontColor = function (fontColor) {
            me.settings.fontColor = fontColor;
            me.publish.forEach(function (p) {
                p();
            });
            this.setCssClass(me.settings.fontColor, me.settings.backgroundColor);
        }

        this.displayStyle = function () {
            var style = {};
            style["background-color"] = me.settings.backgroundColor;
            if (me.settings.backgroundImage === 'none') {
                style["background-image"] = "";
            } else {
                style["background-image"] = "url('../images/" + me.settings.backgroundImage + "')";
                style["background-repeat"] = me.settings.backgroundRepeat === "repeat" ? "repeat" : "no-repeat";
                if (me.settings.backgroundRepeat === "stretch") {
                        style["-webkit-background-size"] = "100% 100%";
                        style["-moz-background-size"] = "100% 100%";
                        style["-o-background-size"] = "100% 100%";
                        style["background-size"] = "100% 100%";
                }
            }
            style["color"] = me.settings.fontColor;
            style["font-size"] = me.settings.fontSize + "px";
            style["text-align"] = me.settings.align;
            return style;
        }

        this.rgbToHsl = function (r, g, b) {
            r /= 255, g /= 255, b /= 255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var h, s, l = (max + min) / 2;

            if (max == min) {
                h = s = 0;
            } else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

                switch (max) {
                    case r:
                        h = (g - b) / (max - min);
                        break;
                    case g:
                        h = 2.0 + (b - r) / (max - min);
                        break;
                    case b:
                        h = 4.0 + (r - g) / (max - min);
                        break;
                }

                h = h * 0.6;
            }
            h = (h * 100 + 0.5) | 0;
            s = ((s * 100 + 0.5) | 0);
            l = ((l * 100 + 0.5) | 0);
            return { h: h, s: s, l: l };
        };

        this.setCssClass = function (frontColor, backgroundColor) {
            var rgb = [];
            var hex = (backgroundColor + '').replace(/#/, '');

            for (var i = 0; i < 6; i += 2) {
                rgb.push(parseInt(hex.substr(i, 2), 16));
            }
            var hsl = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
            //--------------------------------------------
            var $style = $("<style type='text/css'>").appendTo('head');
            var menuBkColor             = "hsl(" + hsl.h + ", 50% , 93% )";          // menu has a less staurated color than the base color
            var menuBkColorEnd          = "hsl(" + hsl.h + ", 50% , 91% )";          // menu ends have lighter than base color to form the gradient
            var titleBarBkColor         = "hsl(" + hsl.h + ", 50% , 85% )";
            var stripedOddColor         = "hsl(" + hsl.h + ", 50% , 95% )";
            var stripedEvenColor        = "hsl(" + hsl.h + ", 50% , 87% )";
            var hoverBkColor            = "hsl(" + hsl.h + ", 35% , 65%)";
            var selectedBkColor         = "hsl(" + hsl.h + ", 25% , 75%) !important;";
            var hoverColor              = "yellow";
            var selectedColor           = "white";
            var btnBkColor              = "hsl(" + hsl.h + ", 50% , 95% )";
            var btnBorderColor          = "hsl(" + hsl.h + ", 50% , 90% )";
            var btnColor                = "black";
            var btnActiveBkColor        = "hsl(" + hsl.h + ", 50% , 77%) !important;";
            var btnActiveBroderColor    = "hsl(" + hsl.h + ", 50% , 70%) !important;";
            var btnActiveColor          = "white";

            var css = "\
            .new-biblebook-striped > tbody > tr:nth-child(odd) > td,\
            .new-biblebook-striped > tbody > tr:nth-child(odd) > th {\
                  background-color: " + stripedOddColor + ";\
            }\
            .new-biblebook-striped > tbody > tr:nth-child(even) > td,\
            .new-biblebook-striped > tbody > tr:nth-child(even) > th {\
                  background-color: " + stripedEvenColor + ";\
            }\
            .new-biblebook-hover > tbody > tr:hover > td,\
            .new-biblebook-hover > tbody > tr:hover > th {\
                  background-color: " + hoverBkColor + " ;\
                  color: " + hoverColor + ";\
            }\
            .new-menu-bar {\
                 background-color: " + menuBkColor + " ;" +
                    "background-image: -webkit-linear-gradient(top," + menuBkColorEnd + "," + menuBkColor + "," + menuBkColorEnd + ");" +
                    "background-image:    -moz-linear-gradient(top," + menuBkColorEnd + "," + menuBkColor + "," + menuBkColorEnd + ");" +
                    "background-image:      -o-linear-gradient(top," + menuBkColorEnd + "," + menuBkColor + "," + menuBkColorEnd + ");" +
                    "background-image:         linear-gradient(to bottom," + menuBkColorEnd + "," + menuBkColor + "," + menuBkColorEnd + ");" +
                "}\
            .new-title-bar {\
                   background-color: " + titleBarBkColor + " ;\
                   font-weight: bold;\
            }\
            .biblebook-selected {\
                   background-color: " + selectedBkColor + " ;\
                   color: " + selectedColor + " ;\
            }\
            .btn-do {\
                    color:" + btnColor + " ;\
                    background-color:" + btnBkColor + " ;\
                    border-color: " + btnBorderColor + " ;\
            }\
            .btn-do:hover, .btn-do:focus, .btn-do:active, .btn-do.active, .open .dropdown-toggle.btn-do {\
                    color: " + btnActiveColor + " ;\
                    background-color: " + btnActiveBkColor + " ;\
                    border-color: " + btnActiveBroderColor + " ;\
            }";


            $style.html(css);   //replace the current style in head by newbiblebook
            // alert(css);
            $('.biblebook-striped').removeClass('biblebook-striped').addClass('new-biblebook-striped');  // replace old class by the new one in style now
            $('.biblebook-hover').removeClass('biblebook-hover').addClass('new-biblebook-hover');  // replace old class by the new one in style now
            $('.menu-bar').removeClass('menu-bar').addClass('new-menu-bar');  // replace old class by the new one in style now
            $('.title-bar').removeClass('title-bar').addClass('new-title-bar');  // replace old class by the new one in style now       
        };
        //-------------------------------------
        this.init();

    }]);

})();