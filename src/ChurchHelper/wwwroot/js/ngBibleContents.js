var app = angular.module('appBibleContents', ['ngRoute']);
/*---------------------------------------------------------------------------------------------------------
                                            app Run
--------------------------------------------------------------------------------------------------------- */
app.run(["serviceApiCalls", "$rootScope", function (serviceApiCalls, $rootScope) {

    $rootScope.bibleStructures = null;
    serviceApiCalls.getBibleStructure();

    $rootScope.typeOf = function (value) {
        return typeof value;
    };
}]);
/*---------------------------------------------------------------------------------------------------------
                                            Factory overrides ExceptionHandler
--------------------------------------------------------------------------------------------------------- */
app.factory('$exceptionHandler', function() {
    return function(exception, cause) {
        $('#dvMessage').html ( "Angular error: " + decodeURI(exception.message) + " :" + cause + "<br/>" + exception.fileName.substring(exception.fileName.lastIndexOf('/')) + " :" + exception.lineNumber );
    }
});
/*---------------------------------------------------------------------------------------------------------
                                            Service Display
--------------------------------------------------------------------------------------------------------- */

app.service('serviceDisplay', function () {
    var me = this;
    this.publish = [];
    this.arDisplay = [];
    this.goDisplay = false;

    this.registerSubscriber = function (callback) {
        me.publish.push(callback);
    };

    this.setDisplay = function (inputDisplay) {
        me.arDisplay = inputDisplay;
        me.publish.forEach(function (p) {
            p();
        });
    }

    this.startDisplay = function () {
        me.goDisplay = true;
        me.publish.forEach(function (p) {  // fir a signal to dstart display
            p();
        });
        me.goDisplay = false;
    }

});
/*---------------------------------------------------------------------------------------------------------
                                            conrtoller Display
--------------------------------------------------------------------------------------------------------- */

app.controller('controllerDisplay', ["serviceDisplay", "serviceBibleSettings", function (serviceDisplay, serviceSettings) {
    var me = this;
    this.publish = [];
    this.arDisplay = [];
    this.step = 2;
    this.fromIndex = 1;
    this.toIndex = this.fromIndex + this.step;
    this.currentIndex = 1;

    // init ---------------------------------------------------------------------
    this.init = function() {
        serviceDisplay.registerSubscriber(me.updateSubscriber); 
        serviceBibleSettings.registerSubscriber(me.updateSubscriber);  // when bible translation changes, let us know
    }
    //---------------------------------------------------------------------------
    this.updateSubscriber = function() {           // services will notify controllerDisplay if data or step have changed.
        me.arDisplay = serviceDisplay.arDisplay;
        var newStep = serviceSettings.settings.versesPerPage;

        if (me.step != newStep) {
            me.step = parseInt(newStep);
        }

        me.setDisplayRange('start', me.currentIndex);

        if (serviceDisplay.goDisplay) {
            $('#menuTabs a[href= "#divDisplay"]').tab("show");  // switch to display tab
        }

    };
    this.setStartDisplay = function (index) {
        me.currentIndex = index;                    // in this case verse number = verse index
        me.setDisplayRange('start', me.currentIndex);
    }

    this.setDisplayRange = function (operation, startIndex) {  // operation : start | next | back
        var minIndex = 1;
        var maxIndex = me.arDisplay.length;
        var myCurrentIndex = startIndex ? parseInt(startIndex) : minIndex;  // if startIndex==null then take minVerse

        if (operation == 'next') {
            myCurrentIndex = me.currentIndex + me.step;
        }
        if (operation == 'back') {
            myCurrentIndex = me.currentIndex - me.step;
        }
        myCurrentIndex = myCurrentIndex < minIndex ? minIndex : myCurrentIndex;
        myCurrentIndex = myCurrentIndex > maxIndex ? maxIndex : myCurrentIndex;

        me.currentIndex = myCurrentIndex;
        me.fromIndex = myCurrentIndex;
        me.toIndex = myCurrentIndex + me.step - 1;

        if (me.toIndex > maxIndex) me.toIndex = maxIndex;
    }

    this.getDisplayItems = function () {
        var selectedDisplay = [];
        for (var i = me.fromIndex - 1; i <= me.toIndex - 1; i++) {
            selectedDisplay.push(me.arDisplay[i]);
        }
        return selectedDisplay;
    }

}]);
/*---------------------------------------------------------------------------------------------------------
                                            Service Api Call
--------------------------------------------------------------------------------------------------------- */
app.service('serviceApiCalls', ['$http', '$rootScope', function ($http, $rootScope) {
    var apiPath = "http://localhost:54379/apiBible/"; // "http://churchhelper.azurewebsites.net/apiBible/";  
    //--------------------------------------------------------------------------------------
    this.getBibleStructure = function () {  // get bible structure in 2 lang once at the begining of the angular app

        $http.get(apiPath + "GetBibleStructure")

            .then(function (response) {
                var apiResponse = response.data;
                if (apiResponse.Status.Ok) {
                    $rootScope.bibleStructures = apiResponse.Data;  //intended to be 2 bible structures each in a different language
                    $rootScope.bibleStructures.unshift(apiResponse.Data[0]); //add an extra bible at the position of 0 as default and to make switch between bible versions easier
                } else {
                    $("#dvMessage").text("api Failure: " + apiResponse.Status.Id + " : " + apiResponse.Status.Info);
                }
            }
            , this.failureHttpRequest);
    }
    //--------------------------------------------------------------------------------------
    this.getVerseOfChapter = function (bibleId, bookId, chapterId , callBack) {

        $http.get( apiPath + "GetVersesOfChapter/" + bibleId + "/" + bookId + "/" + chapterId)

            .then(function (response) {
                var apiResponse = response.data;
                if (apiResponse.Status.Ok) {
                    callBack(apiResponse.Data);
                } else {
                    $("#dvMessage").text("api Failure: " + apiResponse.Status.Id + " : " + apiResponse.Status.Info);
                }
            }
            , this.failureHttpRequest);
    }
    //--------------------------------------------------------------------------------------
    this.doSearch = function (jsonData , callBack) {

        $http.post( apiPath + "DoSearch", jsonData)

            .then(function (response) {
                var apiResponse = response.data;
                if (apiResponse.Status.Ok) {
                    callBack(apiResponse.Data, apiResponse.Pagination);
                } else {
                    $("#dvMessage").text("api Failure: " + apiResponse.Status.Id + " : " + apiResponse.Status.Info);
                }
            }
            , this.failureHttpRequest);
    }
    //--------------------------------------------------------------------------------------
    this.failureHttpRequest = function (response) {
        $("#dvMessage").text("http Failure: " + response.status + " : " + response.statusText);
    };
    //--------------------------------------------------------------------------------------

}]);
/*---------------------------------------------------------------------------------------------------------
                                            controller BibleContents
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerBibleContents', ["serviceApiCalls", "serviceBibleSettings","serviceDisplay", "$rootScope", "$scope", function (serviceApiCalls, serviceSettings,serviceDisplay, $rootScope , $scope) {
    var me = this;
    this.bibleStructure = {};
    this.books = [];
    this.chapters = [];
    this.verses = [];

    me.current = { bibleId: 0, book: { Id: "", Name: "", ChapterCount: 1 }, chapter: 1, verse: 1, fromVerse: 1, toVerse: 1 };
    me.step = 1;
    var watchStructure = null;

    // init ---------------------------------------------------------------------------------------------------
    this.init = function () {

        serviceSettings.registerSubscriber(me.updateSubscriber);  // when bible translation changes, let us know

        //watch $rootScope.bibleStructures, when it gets populated then populate me.bibleStructure
        watchStructure = $scope.$watch(function () {
            return $rootScope.bibleStructures;
        }, function () {
            if ($rootScope.bibleStructures != null) {
                me.getBibleStructure($rootScope.bibleStructures[0]);    //fill the controller objects with data from $rootScope
    //            me.setVersesRange('start', 1);                          // fill me.verses for display
                watchStructure();                                       //after getting structure then clear watch - so code is not re-called
            }
        }, true);

    };

    //----------------------------------------------------------------------------------------------------------
    this.getBibleStructure = function (data) {
        me.bibleStructure = data;

        this.books = [];
        me.bibleStructure.Testments.forEach(function (testment) {
            testment.Groups.forEach(function (group) {
                group.Books.forEach(function (book) {
                    book.boolSelected = false;
                    me.books.push(book);
                });
            });
        });
        me.clickBook(me.books[0]);
    };

    this.updateSubscriber = function () {       // subscribe to the service so it notifies us with any updates to the bible settings
        var newBiblId = serviceSettings.settings.bibleId;
        var newStep = serviceSettings.settings.versesPerPage;

        if (me.current.bibleId.Id != newBiblId) {
            me.current.bibleId = newBiblId ;
            if ($rootScope.bibleStructures != null && $rootScope.bibleStructures[me.current.bibleId] != null) {
                me.getBibleStructure($rootScope.bibleStructures[me.current.bibleId]);
                me.clickChapter(me.current.chapter, me.current.verse);
            }
        }

        //if (me.step != newStep) {
        //    me.step = parseInt(newStep);
        //    me.setVersesRange('start', me.current.verse);
        //}
    }
        // display contents Events --------------------------------------------------------------------------------

    this.currentTitle = function () {
        if (me.current.fromVerse == me.current.toVerse) {
            return me.current.book.Name + " " + me.current.chapter + " : " + me.current.verse;
        } else {
            return me.current.book.Name + " " + me.current.chapter + " : " + me.current.fromVerse + " - " + me.current.toVerse;
        }
    }

    this.clickBook = function (book) {
        if (me.current.book.Id != book.Id) {
            me.current.book = book;
            me.current.chapter = 1;
            me.chapters = [];
            for (var i = 1; i <= book.ChapterCount; i++) {
                me.chapters.push(i);
            }
            me.clickChapter(me.chapters[0]);
        }
    }

    this.clickChapter = function (chapter, verse) {
        me.current.chapter = chapter;
        if (verse == null) {
            me.current.verse = 1;
        } else {
            me.current.verse = verse;
        }
        serviceApiCalls.getVerseOfChapter(me.current.bibleId, me.current.book.Id, me.current.chapter, me.getVersesOfChapter);
    }

    this.clickVerse = function (verse) {
        serviceDisplay.startDisplay(verse.VerseNo);
    }

    this.getVersesOfChapter = function (data) {
        me.verses = data;
        serviceDisplay.setDisplay(data);

    //    me.setVersesRange('start', me.current.verse);
    };



    //this.clickVerse = function (verse) {
    //    me.current.verse = verse.VerseNo;                    // in this case verse number = verse index
    //    $('#menuTabs a[href= "#divDisplay"]').tab("show");  // switch to display tab
    //    me.setVersesRange('start', me.current.verse);
    //}

    //this.clickVersesPerPage = function() {
    //    me.setVersesRange('start', me.current.verse);
    //}

    //this.setVersesRange = function (operation, startVerse) {  // operation : start | next | back
    //    var minVerse = 1;
    //    var maxVerse = me.verses.length;
    //    var myCurrentVerse = startVerse ? parseInt(startVerse) : minVerse;  // if startVerse==null then take minVerse

    //    if (operation == 'next') {
    //        myCurrentVerse = me.current.verse + me.step;
    //    }
    //    if (operation == 'back') {
    //        myCurrentVerse = me.current.verse - me.step;
    //    }
    //    myCurrentVerse = myCurrentVerse < minVerse ? minVerse : myCurrentVerse;
    //    myCurrentVerse = myCurrentVerse > maxVerse ? maxVerse : myCurrentVerse;

    //    me.current.verse = myCurrentVerse;
    //    me.current.fromVerse = myCurrentVerse;
    //    me.current.toVerse = myCurrentVerse + me.step - 1;

    //    if (me.current.toVerse > maxVerse) me.current.toVerse = maxVerse;
    //}

    //this.displayVerses = function () {
    //    var selectedVerses = [];
    //    for (var i = me.current.fromVerse - 1; i <= me.current.toVerse - 1; i++) {
    //        selectedVerses.push(me.verses[i]);
    //    }
    //    return selectedVerses;
    //}

    // General -------------------------------------------------------------------------------------

    this.cloneObject = function (obj) {
        var cloneOfObj = JSON.parse(JSON.stringify(obj));  //clone properties not methods
        return cloneOfObj;
    }

    this.range= function(min, max, step) {
        var arInt = [];
        for (var i = min; i <= max ;  i+= step)
            arInt.push(i);
        return arInt;
    }

    //----------------------------------------------------------------------------------------------

    this.init();
}
]);
/*---------------------------------------------------------------------------------------------------------
                                            controller Search
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerSearch', ["serviceApiCalls", "serviceBibleSettings", "$rootScope", "$scope", function (serviceApiCalls, serviceSettings, $rootScope, $scope) {

    var me = this;
    this.bibleStructure = {};
    this.currentBibleId = 1;
    this.searchTerm = '' ;
    this.searchResult = [];
    this.searchOptions = [
      { id: 1, name: 'term', caption: 'must exact match' }
    , { id: 2, name: 'prefix', caption: 'must start with' }
    , { id: 3, name: 'wildcard', caption: 'must contain' }
    , { id: 4, name: 'fuzzy', caption: 'should look like' }
    , { id: 5, name: 'mustnot', caption: 'must not contain' }
    ];
    this.selectedSearchOption = this.searchOptions[0];
    this.pagination = {};

    var watchStructure = null;

    this.init = function () {
        serviceSettings.registerSubscriber(me.updateSubscriber);  // when bible translation changes, let us know

        watchStructure= $scope.$watch(function () {
            return $rootScope.bibleStructures;
        }, function () {
            if ($rootScope.bibleStructures != null) {
                me.bibleStructure = $rootScope.bibleStructures[0] ;
                watchStructure(); //after getting structure then clear watch - so code is not re-called
            }
        }, true);

    };

    this.updateSubscriber = function () {       // subscribe to the service so it notifies us with any updates to the bible settings
        me.currentBibleId = parseInt(serviceSettings.settings.bibleId);
        if ($rootScope.bibleStructures != null && $rootScope.bibleStructures[me.currentBibleId] != null) {
            me.bibleStructure = $rootScope.bibleStructures[me.currentBibleId];
        }
    }

    // Filter Events -------------------------------------------------------------------------------

    this.clickBible = function () {
        me.bibleStructure.Selected = me.bibleStructure.Selected == 1 ? 0 : 1;        // toggle selection          
        me.bibleStructure.Testments.forEach(function (testment) {
            me.clickTestment(testment, me.bibleStructure.Selected);
        });
    }

    this.clickTestment = function (testment, parentStatus) {
        if (parentStatus == null) {
            testment.Selected = testment.Selected == 1 ? 0 : 1;                      // toggle selection  
        } else {
            testment.Selected = parentStatus;                                        // inherit parent selection status
        }
        testment.Groups.forEach(function (group) {
            me.clickGroup(group, testment.Selected);
        });
    }

    this.clickGroup = function (group, parentStatus) {
        if (parentStatus == null) {
            group.Selected = group.Selected == 1 ? 0 : 1;                           // toggle selection  
        } else {
            group.Selected = parentStatus;                                          // inherit parent selection status
        }
        group.Books.forEach(function (book) {
            book.Selected = group.Selected;
            book.boolSelected = group.Selected == 1 ? true : false;
        });
    }

    this.clickBook = function (book) {
        book.Selected = book.boolSelected ? 1 : 0;                                  // toggle selection  
    }

    this.showGroup = function (colId) {
        var groupsToShow = [];
        if (me.bibleStructure.Testments != null && me.bibleStructure.Testments != 'undefined') {
            me.bibleStructure.Testments.forEach(function (testment) {
                testment.Groups.forEach(function (group) {
                    var show = false;
                    show = show || (colId == 1 && (group.Id == 1 || group.Id == 2 || group.Id == 3));
                    show = show || (colId == 2 && (group.Id == 4 || group.Id == 5));
                    show = show || (colId == 3 && (group.Id == 6 || group.Id == 7 || group.Id == 8));
                    show = show || (colId == 4 && (group.Id == 9 || group.Id == 10));
                    if (show)
                        groupsToShow.push(group);

                });
            });
        }
        return groupsToShow;
    }

    this.getBookName = function (bookId) {
        var intBookId = parseInt(bookId);
        var bookName = "";
        me.bibleStructure.Testments.forEach(function (testment) {
            testment.Groups.forEach(function (group) {
                group.Books.forEach(function (book) {
                    if (parseInt(book.Id) == intBookId) {
                        bookName = book.Name.trim();
                    }
                });
            });
        });
        return bookName;
    }
    // Search Events -------------------------------------------------------------------------------

    this.doSearch = function (pageIndex) {
        if (pageIndex == "." || pageIndex == "..") {
        } else {
            var data = { pageIndex: pageIndex, bibleIds: [me.currentBibleId], bibleFilter: me.bibleStructure, searchCriteria: { searchItems: [{ searchTerm: me.searchTerm }] } };
            var jsonData = angular.toJson(data);

            serviceApiCalls.doSearch(jsonData, me.successDoSearch);
        }
    }

    this.successDoSearch = function (data , pagination) {
        me.searchResult = data;
        me.pagination = pagination;
    };

    this.getPagination = function () {
        var arPages = [];
        var tooMany = me.pagination.TotalPageCount > 20;
        var buttonDone = false;
        
        for (var i = 1; i <= me.pagination.TotalPageCount; i++) {
            if ((tooMany) && i > 4 && i <= (me.pagination.TotalPageCount - 4)) {
                if (!buttonDone) {
                    arPages.push("..");
                    buttonDone = true;
                }
            } else {
                arPages.push(i);
            }
        }

        return arPages;
    }
    //--------------------------------------------------------------------------------------

    this.init();
}]);
/*---------------------------------------------------------------------------------------------------------
                                            service StyleSettings
--------------------------------------------------------------------------------------------------------- */
app.service('serviceStyleSettings', ['serviceBibleSettings' , function (serviceBibleSettings) {

    var me = this;
    this.publish = [];  // array of function pointers that are subscribed to the service and will be called on updates by the service
    this.settings = { backgroundColor: "aliceblue", backgroundImage: "none", fontColor: "black", fontSize: "18", align:"left" , language:"english"};

    this.getSettings = function() {
        return me.settings;
    };

    this.registerSubscriber = function(callback) {
        me.publish.push(callback);              // register subscribers
    };

    this.initSettings = function() {
        var settings = getCookie("styleSettings");
        if (settings != null && settings != '')
            me.settings = JSON.parse(settings);

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
    }

    this.setFontColor = function (fontColor) {
        me.settings.fontColor = fontColor;
        me.publish.forEach(function (p) {
            p();
        });
    }

    this.displayStyle = function () {
        var style = {};
        style["background-color"] = me.settings.backgroundColor;
        style["color"] = me.settings.fontColor;
        style["font-size"] = me.settings.fontSize + "px";
        style["text-align"] = me.settings.align;
        style["height"] = "100%";
        return style;
    }

    this.init();

}]);
/*---------------------------------------------------------------------------------------------------------
                                            controller StyleSettings
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerStyles', ["serviceStyleSettings", function (serviceSettings) {

    var me = this;
    this.settings = {};
    this.visibleContentLeft = true;
    this.visibleContentRight = false;

    this.init = function () {
        serviceSettings.registerSubscriber(me.updateSubscriber);
        serviceSettings.initSettings();
    };

    this.updateSubscriber = function () { // read from serviceSettings
        me.settings = serviceSettings.getSettings();
        me.visibleContentLeft = (serviceSettings.settings.align == "left");
        me.visibleContentRight = (serviceSettings.settings.align == "right");
    }

    this.clickSaveSettings = function () {
        serviceSettings.saveSettings();
    }

    this.setFontSize = function () { // write to serviceSettings
        serviceSettings.setFontSize(me.settings.fontSize);
    }
    this.setBackgroundColor = function () { // write to serviceSettings
        serviceSettings.setBackgroundColor(me.settings.backgroundColor);
    }

    this.setFontColor = function () { // write to serviceSettings
        serviceSettings.setFontColor(me.settings.fontColor);
    }

    this.displayStyle = function () { // read from serviceSettings
        return serviceSettings.displayStyle();
    }

    //--------------------------------------------------------------

    this.init();

}]);
/*---------------------------------------------------------------------------------------------------------
                                            service Bible Settings
--------------------------------------------------------------------------------------------------------- */
app.service('serviceBibleSettings', ['$rootScope', function ($rootScope) {
    var me = this;
    this.publish = [];
    this.settings = { versesPerPage: 2, bibleId:1 , align:"right", language:"arabic"};

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
                                            controller BibleSettings
--------------------------------------------------------------------------------------------------------- */
app.controller("controllerBibleSettings", ["serviceBibleSettings", "$scope", function (serviceSettings, $scope) {
    var me = this;
    this.settings = {};
    this.bibles = [{ id: 1, name: "Van-Dyke" }, { id: 2, name: "KJV" }];

    this.init = function () {
        serviceSettings.registerSubscriber(me.updateSubscriber);
        serviceSettings.initSettings();
    };

    this.updateSubscriber = function () { // subscribe to & read from serviceSettings
        me.settings = serviceSettings.getSettings();
    }

    this.clickSaveSettings = function () {
        serviceSettings.saveSettings();
    }

    this.setBibleId = function (bibleId) { // write to serviceSettings
        serviceSettings.setBibleId(bibleId);
    }
    this.setVersesPerPage = function () { // write to serviceSettings
        serviceSettings.setVersesPerPage(me.settings.versesPerPage);
    }
    //----------------------------------------------------------------
    this.init();
}]);
/*---------------------------------------------------------------------------------------------------------
                                            Directive 
--------------------------------------------------------------------------------------------------------- */
app.directive('stringToNumber', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(value) {
                return '' + value;
            });
            ngModel.$formatters.push(function(value) {
                return parseFloat(value, 10);
            });
        }
    };
});
/*--------------------------------------------------------------------------------------------------------- */
