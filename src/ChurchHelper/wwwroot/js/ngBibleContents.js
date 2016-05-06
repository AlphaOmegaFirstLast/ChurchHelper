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
        $('#btnClearMessage').show();
    }
});
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

    this.setDisplayData = function (data , index , titlePrefix) {
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
                                            conrtoller Display
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerDisplay', ["serviceDisplay", "serviceBibleSettings", function (serviceDisplay, serviceSettings) {
    var me = this;
    this.publish = [];
    this.arDisplayData = [];
    this.selectedDisplay = [];
    this.titlePrefix = "";
    this.step = 2;
    this.currentIndex = 1;
    this.fromIndex = 1;
    this.toIndex = this.fromIndex + this.step;

    // init ---------------------------------------------------------------------
    this.init = function () {                                             // serviceS will notify controllerDisplay if data, currentIndex or step have changed.
        serviceDisplay.registerSubscriber(me.updateDisplaySubscriber); 
        serviceSettings.registerSubscriber(me.updateSettingsSubscriber);  // when bible translation changes, let us know
    }
    //---------------------------------------------------------------------------
    this.updateDisplaySubscriber = function (msg) {
        if (msg != null && msg == "dataChange") {
            me.arDisplayData = serviceDisplay.arDisplayData;                     //update from serviceDisplay
            me.currentIndex = serviceDisplay.currentIndex;
            me.titlePrefix = serviceDisplay.titlePrefix;
            me.setDisplayRange('start', me.currentIndex);
        }

        if (msg !=null && msg == "switchTab") {
            me.currentIndex = serviceDisplay.currentIndex;;
            me.setDisplayRange('start', me.currentIndex);
            $('#menuTabs a[href= "#divDisplay"]').tab("show");          // switch to display tab
        }

    };

    this.updateSettingsSubscriber = function () {           
        var newStep = serviceSettings.settings.versesPerPage;       //update from serviceSettings  

        if (me.step != newStep) {
            me.step = parseInt(newStep);
            me.setDisplayRange('start', me.currentIndex);
        }
    };

    this.setStartDisplay = function (index) {
        me.currentIndex = index;                    // in this case verse number = verse index
        me.setDisplayRange('start', me.currentIndex);
    }

    this.setDisplayRange = function (operation, startIndex) {  // operation : start | next | back
        var minIndex = 1;
        var maxIndex = me.arDisplayData.length;
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
        // --------------- display items ------------------------
        me.selectedDisplay = [];
        for (var i = me.fromIndex - 1; i <= me.toIndex - 1; i++) {
            me.selectedDisplay.push(me.arDisplayData[i]);
        }

    }

    this.currentTitle = function () {
        if (me.fromIndex == me.toIndex) {
            return me.titlePrefix + " : " + me.fromIndex;
        } else {
            return me.titlePrefix + " : " + me.fromIndex + " - " + me.toIndex;
        }
    }

    //----------------------------------------------------------------------------
    this.init();
}]);
/*---------------------------------------------------------------------------------------------------------
                                            Service Api Call
--------------------------------------------------------------------------------------------------------- */
app.service('serviceApiCalls', ['$http', '$rootScope', function ($http, $rootScope) {
    var apiPath = "http://localhost:54379/apiBible/";  // "http://churchhelper.azurewebsites.net/apiBible/"; 
    //--------------------------------------------------------------------------------------
    var me = this;

    this.getBibleStructure = function () {  // get bible structure in 2 lang once at the begining of the angular app

        $http.get(apiPath + "GetBibleStructure")

            .then(function (response) {
                var apiResponse = response.data;
                if (apiResponse.Status.Ok) {
                    $rootScope.bibleStructures = apiResponse.Data;  //intended to be 2 bible structures each in a different language
                    $rootScope.bibleStructures.unshift(apiResponse.Data[0]); //add an extra bible at the position of 0 as default and to make switch between bible versions easier
                } else {
                    me.failureApiCall(apiResponse);
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
                    me.failureApiCall(apiResponse);
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
                    me.failureApiCall(apiResponse);
                }
            }
            , this.failureHttpRequest);
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

    me.current = { bibleId: 0 , book: { Id:0 , Name: "", ChapterCount: 1 }, chapter: 1, verse: 1, fromVerse: 1, toVerse: 1 };
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
                me.setBook(me.books[0], false);
                watchStructure();                                       //after getting structure then clear watch - so code is not re-called
            }
        }, true);

    };
    //----------------------------------------------------------------------------------------------------------
    this.updateSubscriber = function () {       // subscribe to the service so it notifies us with any updates to the bible settings
        var newBiblId = serviceSettings.settings.bibleId;

        if (me.current.bibleId != newBiblId) {
            me.current.bibleId = newBiblId ;
            if ($rootScope.bibleStructures != null && $rootScope.bibleStructures[me.current.bibleId] != null) {
                me.getBibleStructure($rootScope.bibleStructures[me.current.bibleId]);
                me.setBook(me.current.book, true);
            }
        }
    }
    // display contents Events --------------------------------------------------------------------------------

    this.getBibleStructure = function (data) {
        me.bibleStructure = data;
        me.current.bibleId = me.bibleStructure.Id;
        this.books = [];
        me.bibleStructure.Testments.forEach(function (testment) {
            testment.Groups.forEach(function (group) {
                group.Books.forEach(function (book) {
                    book.boolSelected = false;
                    me.books.push(book);
                });
            });
        });
    };

    this.getBookById = function (bookId) {
        var matchedBook = {};
        me.books.forEach(function(book) {
                if (book.Id == bookId) {
                    matchedBook =  book;
                }
            });
        return matchedBook;
    };

    this.clickBook = function (book) {       //user event
        me.setBook(book , false);
    }

    this.setBook = function (book , bibleChanged ) {
        if (!bibleChanged) {
            if (me.current.book.Id != book.Id) {
                me.current.book = book;
                me.chapters = [];
                for (var i = 1; i <= book.ChapterCount; i++) {
                    me.chapters.push(i);
                }
                me.setChapter(me.chapters[0], 1);
            }
        } else {
            me.current.book = me.getBookById(book.Id);  // same id different name in different language
            me.setChapter(me.current.chapter, me.current.verse);
        }
    }

    this.clickChapter = function (chapter) {   //user event
        me.setChapter(chapter, 1);
    }

    this.setChapter = function (chapter , verseIndex) {
        me.current.chapter = chapter;
        me.current.verse = verseIndex;
        serviceApiCalls.getVerseOfChapter(me.current.bibleId, me.current.book.Id, me.current.chapter, me.getVersesOfChapter);
    }

    this.clickVerse = function (verse)
    {
        me.current.verse = verse.VerseNo;
        serviceDisplay.startDisplay(me.current.verse);
    }

    this.getVersesOfChapter = function (data) {
        me.verses = data;
        var arDisplay = [];
        me.verses.forEach(function (resultVerse) {
            arDisplay.push({ label: resultVerse.VerseNo, text: resultVerse.VerseText });
        });
        serviceDisplay.setDisplayData(arDisplay, me.current.verse, me.currentTitle());
    };

    this.currentTitle = function () {
        var title = me.current.book.Name + " " + me.current.chapter;
        return title;
    }

    $scope.$on('goContext', function(event, obj) {
        me.current.book = me.getBookById(obj.bookId);  // same id different name in different language
        me.setChapter(obj.chapterId, obj.verseNo);
        serviceDisplay.startDisplay(me.current.verse);
    });
    //----------------------------------------------------------------------------------------------

    this.init();
}
]);
/*---------------------------------------------------------------------------------------------------------
                                            controller Search
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerSearch', ["serviceApiCalls", "serviceBibleSettings", "serviceDisplay", "$rootScope", "$scope", function (serviceApiCalls, serviceSettings, serviceDisplay, $rootScope, $scope) {

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

    this.successDoSearch = function (data, pagination) {
        me.searchResult = data;
        me.pagination = pagination;
        var arDisplay = [];
        me.searchResult.forEach(function (resultVerse) {
            arDisplay.push({ label: me.getBookName(resultVerse.BookId) + " " + resultVerse.ChapterId + " : " + resultVerse.VerseNo, text: resultVerse.VerseText });
        });
        serviceDisplay.setDisplayData(arDisplay, 1, "Result Page : " + me.pagination.CurrentPage);
    };

    this.startDisplay = function (index) {
        serviceDisplay.startDisplay(index);
    };

    this.goContext = function (bookId, chapterId, verseNo) {
        $rootScope.$broadcast('goContext', { bookId: bookId, chapterId: chapterId, verseNo: verseNo });   //raise event to controllerBibleContent to handle (will make it to listen)
    };

    this.getTranslations = function (bibleId, bookId, chapterId, verseNo) {
        alert("getTranslations: " + bibleId + bookId + chapterId + verseNo);
    }
    this.sendToService = function (bibleId, bookId, chapterId, verseNo) {
        alert("sendToService: " + bibleId + bookId + chapterId + verseNo);
    }

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
        this.setCssClass(me.settings.fontColor, me.settings.backgroundColor);
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
        style["color"] = me.settings.fontColor;
        style["font-size"] = me.settings.fontSize + "px";
        style["text-align"] = me.settings.align;
        style["height"] = "100%";
        return style;
    }

    this.rgbToHsl = function(r, g, b) {
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

            h = h * 0.6 ;
        }
        h = (h * 100 + 0.5) | 0;
        s = ((s * 100 + 0.5) | 0);
        l = ((l * 100 + 0.5) | 0);
        return {h:h, s:s, l:l};
    };

    this.setCssClass = function (frontColor , backgroundColor) {
        var rgb = [];
        var hex = (backgroundColor+'').replace(/#/, '');

        for (var i = 0; i < 6; i += 2) {
            rgb.push(parseInt(hex.substr(i, 2), 16));
        }
        var hsl = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
        //--------------------------------------------
        var turningPoint = hsl.l > 50 ? -1 : +1;
        var bkGround     = hsl.l > 50 ? (hsl.l + "%") : " 95%";
        var bkGroundEnds = hsl.l > 50 ? " 95%" : (hsl.l + "%");
        //--------------------------------------------
        var $style = $("<style type='text/css'>").appendTo('head');
        var menuBkColorEnd = "hsl(" + hsl.h + ", 50% ," + bkGroundEnds + ")";                    // menu ends have lighter than base color to form the gradient
        var menuBkColor = "hsl(" + hsl.h + ", 50% ," + bkGround + ")";          // menu has a less staurated color than the base color
        var titleBarBkColor     = "hsl(" + hsl.h + ", 50% ," + (hsl.l + (turningPoint * 10)) + "%)";
        var stripedOddColor = "hsl(" + hsl.h + ", 50% ," + bkGround + ")";
        var stripedEvenColor    = "hsl(" + hsl.h + ", 50% ," + (hsl.l + (turningPoint * 10)) + "%)";
        var hoverBkColor        = "hsl(" + hsl.h + ", 30% ," + (hsl.l + (turningPoint * 60)) + "%)";
        var hoverColor          = "white";

        var css = "\
            .new-biblebook-striped > tbody > tr:nth-child(odd) > td,\
            .new-biblebook-striped > tbody > tr:nth-child(odd) > th {\
                  background-color: " + stripedOddColor + ";\
            }" +
            ".new-biblebook-striped > tbody > tr:nth-child(even) > td,\
            .new-biblebook-striped > tbody > tr:nth-child(even) > th {\
                  background-color: " + stripedEvenColor + ";\
            }" +
            ".new-biblebook-hover > tbody > tr:hover > td,\
            .new-biblebook-hover > tbody > tr:hover > th {\
                  background-color: " + hoverBkColor + " ;\
                  color: " + hoverColor + ";\
            }" +
            ".new-menu-bar {\
                 background-color: " + menuBkColor + " ;"+
                "background-image: -webkit-linear-gradient(top," + menuBkColorEnd + "," +  menuBkColor + "," + menuBkColorEnd + ");" +
                "background-image:    -moz-linear-gradient(top," + menuBkColorEnd + "," +  menuBkColor + "," + menuBkColorEnd + ");" +
                "background-image:      -o-linear-gradient(top," + menuBkColorEnd + "," +  menuBkColor + "," + menuBkColorEnd + ");" +
                "background-image:         linear-gradient(to bottom," + menuBkColorEnd + "," +  menuBkColor + "," + menuBkColorEnd + ");" +
            "}" +
            ".new-title-bar {\
                   background-color: " + titleBarBkColor + " ;\
                   color: " + frontColor + " ;\
                   font-weight: bold;\
            }"  ;
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
/*---------------------------------------------------------------------------------------------------------
                                            controller General
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerGeneral', function () {

    this.range = function (min, max, step) {
        var arInt = [];
        for (var i = min; i <= max ; i += step)
            arInt.push(i);
        return arInt;
    }

    this.cloneObject = function (obj) {
        var cloneOfObj = JSON.parse(JSON.stringify(obj));  //clone properties not methods
        return cloneOfObj;
    }

});
/*--------------------------------------------------------------------------------------------------------- */
