var app = angular.module("appBibleContents", ["ngRoute", "appServices"]);
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

    this.setBackgroundImage = function () { // write to serviceSettings
        serviceSettings.setBackgroundImage(me.settings.backgroundImage);
    }

    this.setBackgroundRepeat = function () { // write to serviceSettings
        serviceSettings.setBackgroundRepeat(me.settings.backgroundRepeat);
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

/*---------------------------------------------------------------------------------------------------------
                                            controller Service
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerService', ["serviceApiCalls", "serviceBibleSettings", "serviceDisplay", "$rootScope", "$scope", function (serviceApiCalls, serviceSettings, serviceDisplay, $rootScope, $scope) {

    var me = this;
    this.arDisplay = [];

    this.init = function () {
        me.FillData();
    };

    this.FillData = function (d) {
        
        me.arDisplay.push({ text: "hello", label:"Hala" });
        me.arDisplay.push({ text: "good", label: "Magdi" });
        me.arDisplay.push({ text: "happy", label: "Abeer" });
    };

    this.startDisplay = function (index) {
        serviceDisplay.setDisplayData(me.arDisplay, 1, "Service");
        serviceDisplay.startDisplay(index);
    };

    //--------------------------------------------------------------------------------------

    this.init();
}]);
