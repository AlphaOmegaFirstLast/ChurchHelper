var app = angular.module("appBibleContents", ["ngRoute", "appServices"]);
/*---------------------------------------------------------------------------------------------------------
                                            app Run
--------------------------------------------------------------------------------------------------------- */
app.run(["serviceApiCalls", "$rootScope", function (serviceApiCalls, $rootScope) {

    $rootScope.bibleStructures = null;
    serviceApiCalls.getBibleStructure();  //get bible structure and raise event so everyone knows to update their structure.

    $rootScope.typeOf = function (value) {   //works with the directive stringToNumber
        return typeof value;
    };
}]);
/*---------------------------------------------------------------------------------------------------------
                                            Factory overrides ExceptionHandler
--------------------------------------------------------------------------------------------------------- */
app.factory('$exceptionHandler', function() {   //override the default globalErrorHandler to log info
    return function(exception, cause) {
        $('#dvMessage').html ( "Angular error: " + decodeURI(exception.message) + " :" + cause + "<br/>" + exception.fileName.substring(exception.fileName.lastIndexOf('/')) + " :" + exception.lineNumber );
        $('#btnClearMessage').show();
    }
});
/*---------------------------------------------------------------------------------------------------------
                                            conrtoller Display
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerDisplay', ["serviceDisplay", "serviceBibleSettings", '$scope', function (serviceDisplay, serviceSettings, $scope) {
    var me = this;
    this.displayItems = [];
    this.displaySets = {};
    this.currentDisplaySetId = "";
    this.currentDisplaySet = { id: "", data: [], index: 1, titlePrefix: "", iconId: "" };

    this.step = 2;
    this.fromIndex = 1;
    this.toIndex = this.fromIndex + this.step;
    
    // init ---------------------------------------------------------------------
    this.init = function () {                                             // serviceS will notify controllerDisplay if data, currentIndex or step have changed.
        serviceSettings.registerSubscriber(me.updateSettingsSubscriber);  // when bible translation changes, let us know
    }
    //---------------------------------------------------------------------------
    $scope.$on('serviceDisplay-displayDataChanged', function (event, obj) {
        me.currentDisplaySetId = obj.id;
        me.displaySets[me.currentDisplaySetId] = obj;
        me.currentDisplaySet = obj ;
        me.setDisplayData();
    });

    $scope.$on('serviceDisplay-displayStarted', function (event, obj) {
        me.currentDisplaySetId = obj.id;
        me.currentDisplaySet = me.displaySets[me.currentDisplaySetId];
        me.currentDisplaySet.index = obj.index;
        me.setDisplayData();
        $('#menuTabs a[href= "#divDisplay"]').tab("show");          // switch to display tab
    });

    this.updateSettingsSubscriber = function () {           
        var newStep = serviceSettings.settings.itemsPerPage;       //update from serviceSettings  

        if (me.step != newStep) {
            me.step = parseInt(newStep);
            me.setDisplayRange('start', me.currentDisplaySet.index);
        }
    };

    this.displaySetChanged = function() {
        me.displaySets[me.currentDisplaySet.id].index = me.currentDisplaySet.index;   // maintain index value among datasets switches
        me.currentDisplaySet = me.displaySets[me.currentDisplaySetId];
        me.setDisplayData();

    };

    this.setDisplayData = function() {
        me.setDisplayRange('start', me.currentDisplaySet.index);
        $("#spanIcon").removeClass().addClass(me.currentDisplaySet.iconId);
    };

    this.setDisplayRange = function (operation, startIndex) {  // operation : start | next | back
        var minIndex = 1;
        var maxIndex = me.currentDisplaySet.data.length;
        var myCurrentIndex = startIndex ? parseInt(startIndex) : minIndex;  // if startIndex==null then take minVerse

        if (operation == 'next') {
            myCurrentIndex = me.currentDisplaySet.index + me.step;
        }
        if (operation == 'back') {
            myCurrentIndex = me.currentDisplaySet.index - me.step;
        }
        myCurrentIndex = myCurrentIndex < minIndex ? minIndex : myCurrentIndex;
        myCurrentIndex = myCurrentIndex > maxIndex ? maxIndex : myCurrentIndex;

        me.currentDisplaySet.index = myCurrentIndex;
        me.fromIndex = myCurrentIndex;
        me.toIndex = myCurrentIndex + me.step - 1;

        if (me.toIndex > maxIndex) me.toIndex = maxIndex;
        // --------------- display items ------------------------
        me.displayItems = [];
        for (var i = me.fromIndex - 1; i <= me.toIndex - 1; i++) {
            me.displayItems.push(me.currentDisplaySet.data[i]);
        }
    }

    this.currentTitle = function () {
        if (me.fromIndex == me.toIndex) {
            return me.fromIndex;
        } else {
            return me.fromIndex + " - " + me.toIndex;
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

    //---------------------------------------------------------------------------------------------------
    this.init = function () {
        // put any initialization code here. i call it at the end of the controller.  
    };

   // user Events --------------------------------------------------------------------------------

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
        serviceDisplay.startDisplay(me.current.verse, "content");
    }

    this.getVersesOfChapter = function (data) {
        me.verses = data;
        var arDisplay = [];
        me.verses.forEach(function (resultVerse) {
            arDisplay.push({ TextBefore: resultVerse.VerseNo, ItemText: resultVerse.VerseText , Align:"inherit" });
        });
        serviceDisplay.setDisplayData(arDisplay, me.current.verse, me.currentTitle(), "content");
    };

    this.currentTitle = function () {
        var title = me.current.book.Name + " " + me.current.chapter;
        return title;
    }

    this.sendToService = function (bibleId, bookId, chapterId, verseNo, verseText) {
        $rootScope.$broadcast('controllerBibleContents-sendToService', { bibleId: bibleId, bookId: bookId, bookName: me.current.book.Name, chapterId: chapterId, verseNo: verseNo, verseText: verseText });   //raise event to controllerBibleContent to handle (will make it to listen)
    }

    //Code events---------------------------------------------------------------------------------------------------

    $scope.$on('serviceApiCalls-bibleStructurePopulated', function (event) {                     //handler to event raised by serviceBibleSettings
        if ($rootScope.bibleStructures != null) {
            me.getBibleStructure($rootScope.bibleStructures[0]);                                //fill the controller objects with data from $rootScope
            me.setBook(me.books[0], false);
        }
    });

    $scope.$on('serviceBibleSettings-bibleChanged', function (event, obj) {                     //handler to event raised by serviceBibleSettings
        var newBiblId = obj.bibleId;

        if (me.current.bibleId != newBiblId) {
            me.current.bibleId = newBiblId;
            if ($rootScope.bibleStructures != null && $rootScope.bibleStructures[me.current.bibleId] != null) {
                me.getBibleStructure($rootScope.bibleStructures[me.current.bibleId]);
                me.setBook(me.current.book, true);
            }
        }
    });

    $scope.$on('controllerSearch-goContext', function (event, obj) {
        me.current.book = me.getBookById(obj.bookId);  // same id different name in different language
        me.setChapter(obj.chapterId, obj.verseNo);
        serviceDisplay.startDisplay(me.current.verse, "content");
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
    this.arDisplay = [];
    //--------------------------------------------------------------------------------------------
    this.init = function () {
        // put any initialization code here. i call it at the end of the controller.  
    };

    // user Events -------------------------------------------------------------------------------

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
        if (pageIndex == "." || pageIndex == "..") {   //pagination requesting page no
        } else {
            var data = { pageIndex: pageIndex, bibleIds: [me.currentBibleId], bibleFilter: me.bibleStructure, searchCriteria: { searchItems: [{ searchTerm: me.searchTerm }] } };
            var jsonData = angular.toJson(data);

            serviceApiCalls.doSearch(jsonData, me.successDoSearch);
        }
    }

    this.successDoSearch = function (data, pagination) {
        me.searchResult = data;
        me.pagination = pagination;
        me.arDisplay = [];
        me.searchResult.forEach(function (resultVerse) {
            me.arDisplay.push({ TextBefore: me.getBookName(resultVerse.BookId) + " " + resultVerse.ChapterId + " : " + resultVerse.VerseNo, ItemText: resultVerse.VerseText, Align:"inherit" });
        });
    };

    this.getTranslations = function (bibleIds, bookId, chapterId, verseNo) {

        var data = { bibleIds: [1, 2], bookId: bookId, chapterId: chapterId, verseNo: verseNo };
        var jsonData = angular.toJson(data);

        serviceApiCalls.GetVerseTranslations(jsonData, me.successGetTranslations);
    }

    this.successGetTranslations = function (data, pagination) {
        var translationResult = data;
        var arTranslation = [];
        translationResult.forEach(function (resultVerse) {
            arTranslation.push(resultVerse.VerseText);
        });
        alert(arTranslation);
    };


    this.startDisplay = function (index) {
        serviceDisplay.setDisplayData(me.arDisplay, index, "search results page [" + me.pagination.CurrentPage + "]", "search");
        serviceDisplay.startDisplay(index , "search");
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

    //Raise events ---------------------------------------------------------------------------------

    this.goContext = function (bookId, chapterId, verseNo) {
        $rootScope.$broadcast('controllerSearch-goContext', { bookId: bookId, chapterId: chapterId, verseNo: verseNo });   //raise event to controllerBibleContent to handle (will make it to listen)
    };

    this.sendToService = function (bibleId, bookId, chapterId, verseNo, verseText) {
        $rootScope.$broadcast('controllerSearch-sendToService', { bibleId: bibleId, bookId: bookId, bookName: me.getBookName(bookId), chapterId: chapterId, verseNo: verseNo, verseText: verseText });   //raise event to controllerBibleContent to handle (will make it to listen)
    }

    //Code events ----------------------------------------------------------------------------------

    $scope.$on('serviceApiCalls-bibleStructurePopulated', function (event) {                     //handler to event raised by serviceBibleSettings
        if ($rootScope.bibleStructures != null) {
            me.bibleStructure = $rootScope.bibleStructures[0];
        }
    });

    $scope.$on('serviceBibleSettings-bibleChanged', function (event, obj) {                     //handler to event raised by serviceBibleSettings
        me.currentBibleId = parseInt(obj.bibleId);

        if ($rootScope.bibleStructures != null && $rootScope.bibleStructures[me.currentBibleId] != null) {
            me.bibleStructure = $rootScope.bibleStructures[me.currentBibleId];
        }
    });
    //--------------------------------------------------------------------------------------------

    this.init();
}]);
/*---------------------------------------------------------------------------------------------------------
                                            controller StyleSettings
--------------------------------------------------------------------------------------------------------- */
app.controller('controllerStyles', ["serviceStyleSettings","$scope", function (serviceSettings,$scope) {

    var me = this;
    this.settings = {};
    this.visibleContentLeft = true;
    this.visibleContentRight = false;

    this.init = function () {
        serviceSettings.initSettings();
    };

    $scope.$on('serviceStyleSettings-styleChanged', function (event, obj) {                     //handler to event raised by serviceStyleSettings
        me.settings = obj.styleSettings;
        me.visibleContentLeft = (me.settings.align == "left");
        me.visibleContentRight = (me.settings.align == "right");
    });

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
        serviceSettings.initSettings();
    };

    $scope.$on('serviceBibleSettings-init', function(event, obj) {
        me.settings = obj.settings;
    });

    this.clickSaveSettings = function () {
        serviceSettings.saveSettings();
    }

    this.setBibleId = function (bibleId) { // write to serviceSettings
        serviceSettings.setBibleId(bibleId);
    }
    this.setItemsPerPage = function () { // write to serviceSettings
        serviceSettings.setItemsPerPage(me.settings.itemsPerPage);
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
    this.presentationFiles = [];
    this.presentationHeader = { organization: "", writer: "", presentationId:"" };

    this.itemTypes = ['Text', 'Verse', 'Song', 'Separator'];
    this.itemAlignments = ['center', 'left', 'right'];

    this.organizations = ['Merryland', 'Manshyat el sadr'];
    this.writers = ['Suzette', 'Hamdy'];
      
    this.init = function () {
        me.arDisplay.push({ ItemText: "New Service Title", itemType: me.itemTypes[0].id });
    };

    this.newItem = function (index) {
        var temp = [];
        me.arDisplay.forEach(function (obj, i) {
            if (i == index) {
                temp.push(obj);
                temp.push({ itemType: me.itemTypes[0].id });  //insert at index new item
            } else {
                temp.push(obj);
            }
        });
        me.arDisplay = temp;
    };

    this.deleteItem = function (index) {
        var temp = [];
        me.arDisplay.forEach(function (obj, i) {
            if (i != index) {
                temp.push(obj);
            }
        });
        me.arDisplay = temp;
    };

    this.startDisplay = function (index) {
        serviceDisplay.setDisplayData(me.arDisplay, 1, "service page [1]", "service");
        serviceDisplay.startDisplay(index, "service");
    };

    this.newPresentation = function () {
        me.arDisplay = [];
    };

    this.savePresentation = function (index) {
        var presentation = { presentationHeader: { organisation: "Merryland", writer: "Suzette", id: "3" }, PresentationItems: me.arDisplay }
        var presentationJson = angular.toJson(presentation);
        serviceApiCalls.savePresentation(presentationJson, me.successSavePresentation);
    };

    this.successSavePresentation = function () {
    };

    this.findPresentation = function () {
        var header = { organisation: me.presentationHeader.organization, writer: me.presentationHeader.writer };
        var headerJson = angular.toJson(header);
        serviceApiCalls.GetPresentationByWriter(headerJson, me.successFindPresentation);
    };

    this.successFindPresentation = function (data) {
        me.presentationFiles = data;
    };

    this.getPresentation = function () {
        var header = { organisation: me.presentationHeader.organization, writer: me.presentationHeader.writer, id: me.presentationHeader.presentationId };
        var headerJson = angular.toJson(header);
        serviceApiCalls.GetPresentationById(headerJson, me.successGetPresentation);
    };

    this.successGetPresentation = function (data) {
        me.arDisplay = data.PresentationItems;
    };

    $scope.$on('controllerSearch-sendToService', function (event, obj) { //handler to event raised by serviceBibleSettings
        var presentationItem = {};
        presentationItem.itemType = me.itemTypes[1].id;
        presentationItem.ItemText = obj.verseText;
        presentationItem.TextBefore = obj.bookName + " " + obj.chapterId + ":" + obj.verseNo;
        presentationItem.TextAfter = "";
        presentationItem.Align = me.itemAlignments[1];

        me.arDisplay.push(presentationItem);
    });
    $scope.$on('controllerBibleContents-sendToService', function (event, obj) { //handler to event raised by serviceBibleSettings
        var presentationItem = {};
        presentationItem.ItemType = me.itemTypes[1].id;
        presentationItem.ItemText = obj.verseText;
        presentationItem.TextBefore = obj.bookName + " " + obj.chapterId + ":" + obj.verseNo;
        presentationItem.TextAfter = "";
        presentationItem.Align = me.itemAlignments[2];

        me.arDisplay.push(presentationItem);
    });
    //--------------------------------------------------------------------------------------

    this.init();
}]);
