using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ChurchHelper.BusinessHelpers;
using ChurchHelper.BusinessInterfaces;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemInterfaces;
using ChurchHelper.SystemModels;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Framework.OptionsModel;
using Newtonsoft.Json;

namespace ChurchHelper.BusinessManagers
{
    class BibleRepository : IBibleRepository
    {
        private readonly IOptions<Config> _config;
        private readonly IOptions<List<Bible>> _bibleList;
        private readonly IRequestManager _requestManager;
        private string _readIndex;
        private string _writeIndex;

        public BibleRepository(IOptions<Config> config , IOptions<List<Bible>> bibleList, IRequestManager requestClient)
        {
            _bibleList = bibleList;
            _requestManager = requestClient;
            _config = config;
            _readIndex = ((Config)_config.Value).ElasticSearchReadIndex;
            _writeIndex = ((Config)_config.Value).ElasticSearchWriteIndex;
        }

        public string ReadIndex
        {
            get { return _readIndex; }
            set { _readIndex = value; }
        }

        public string WriteIndex
        {
            get { return _writeIndex; }
            set { _writeIndex = value; }
        }

        public void DeleteIndex()
        {
            throw new System.NotImplementedException();
        }

        public async Task<ApiResponse<string>> AddDocument(BibleVerse doc)
        {
            var response = new ApiResponse<string>();
            var docId = doc.BibleId.ToString("00") + doc.BookId.ToString("00") + doc.ChapterId.ToString("000") + doc.VerseNo.ToString("000");
            var endpoint = new EndPoint();
            endpoint.ApiMethod = _writeIndex + docId;
            endpoint.HttpMethod = "POST";
            var jsonDoc = JsonConvert.SerializeObject(doc);
            var esResponse = await _requestManager.ExecuteRequest<ElasticSearchResponse<ElasticSearchBibleDocument>, string>(endpoint, jsonDoc);
            response.Status = esResponse.Status;
            response.Data = jsonDoc;
            return response;

        }

        public Task<ApiResponse<string>> UpdateDocument()
        {
            throw new System.NotImplementedException();
        }

        public Task<ApiResponse<string>> DeleteDocument()
        {
            throw new System.NotImplementedException();
        }

        public async Task<ApiResponse<List<BibleVerse>>> GetDocuments(int bibleId, int bookId, int chapterId)
        {
            var response = new ApiResponse<List<BibleVerse>>();

            var query = string.Empty;
            query = query + "( ";
            query = query + " 'query': ('bool': (";
            query = query + " 'must' : [  ( 'term' : ( 'BibleId': {0}) ), ( 'term' : ( 'BookId': '{1}') ), ( 'term' : ( 'ChapterId': '{2}') )]";
            query = query + ")) ";
            query = query + ", 'sort' : [ 'BibleId' , 'BookId' , 'ChapterId' , 'VerseNo' ]";
            query = query + ", 'from' : {3} ";
            query = query + ", 'size' : {4} ";
            query = query + ")";

            query = string.Format(query, bibleId, bookId.ToString("00"), chapterId.ToString("000"), 0, 1000);

            query = query.Replace("(", "{").Replace(")", "}").Replace("'", "\"");

            var endpoint = new EndPoint();
            endpoint.ApiMethod = _readIndex + "_search";
            endpoint.HttpMethod = "POST";

            var esResponse = await _requestManager.ExecuteRequest<ElasticSearchResponse<ElasticSearchBibleDocument>, string>(endpoint, query);
            if (esResponse.Status.Ok)
            {
                response.Data = new List<BibleVerse>();
                foreach (var hit in esResponse.Data.hits.hits)
                {
                    var verse = new BibleVerse() { VerseNo = Convert.ToInt16(hit._source.VerseNo), VerseText = hit._source.VerseText };
                    response.Data.Add(verse);
                }
            }
            else
            {
                response.Status = esResponse.Status;
            }
            return response;
        }
        public async Task<ApiResponse<List<BibleVerse>>> GetDocuments(int[] bibleIds, int bookId, int chapterId, int verseNo)
        {
            var response = new ApiResponse<List<BibleVerse>>();

            var query = string.Empty;
            query = query + "( ";
            query = query + " 'query' : ('bool': (";
            query = query + " 'must'  : [ ( 'term' : ( 'BookId': '{0}') ), ( 'term' : ( 'ChapterId': '{1}')) , ( 'term' : ( 'VerseNo': '{2}')) ]";
            query = query + ")) ";
            query = query + ", 'sort' : [ 'BibleId' , 'BookId' , 'ChapterId' , 'VerseNo' ]";   //todo filter by bibleIds
            query = query + ", 'from' : {3} ";
            query = query + ", 'size' : {4} ";
            query = query + ")";

            query = string.Format(query, bookId.ToString("00"), chapterId.ToString("000"), verseNo.ToString("000"), 0,1000);

            query = query.Replace("(", "{").Replace(")", "}").Replace("'", "\"");

            var endpoint = new EndPoint();
            endpoint.ApiMethod = _readIndex + "_search";
            endpoint.HttpMethod = "POST";

            var esResponse = await _requestManager.ExecuteRequest<ElasticSearchResponse<ElasticSearchBibleDocument>, string>(endpoint, query);
            if (esResponse.Status.Ok)
            {
                response.Data = new List<BibleVerse>();
                foreach (var hit in esResponse.Data.hits.hits)
                {
                    var verse = new BibleVerse() { VerseNo = Convert.ToInt16(hit._source.VerseNo), VerseText = hit._source.VerseText };
                    response.Data.Add(verse);
                }
            }
            else
            {
                response.Status = esResponse.Status;
            }
            return response;
        }

        public async Task<ApiResponse<List<BibleVerse>>> Query(int pageIndex, List<int> bibleIds, Bible bibleFilter, SearchCriteria searchCriteria)
        {
            var response = new ApiResponse<List<BibleVerse>>();
            var currentPage = pageIndex;
            var recPerPage = 20;
            var startIndex = recPerPage * (currentPage - 1) ;
            var searchTerm = searchCriteria.SearchItems[0].SearchTerm;

            if (bibleFilter.Language.Equals("arabic", StringComparison.OrdinalIgnoreCase))
            {
                searchTerm = ArabicHelper.MapArabicToEnglishLetters(searchCriteria.SearchItems[0].SearchTerm);
            }

            var filterItems = GetFilter(bibleIds , bibleFilter);

            var searchStart         =  $" ( ";

            var boolQueryStart      =  $" 'query' : ( 'bool' : (";
            var queryMustClause     =  $"   'must'     : [ ('wildcard' : ('SearchText' :  '*{searchTerm}*' )) ]";  // must works like and
            var boolQueryEnd        =  $" )) ";

            var boolFilterStart     = $" , 'filter'   : ( 'bool' : (";
            var filterShouldClause  = $"   'should'   : [] ";       //should works like or
            var filterMustClause    = $" , 'must'     : [ {filterItems.Item1} ] ";         //must works like and   
            var filterMustNotClause = $" , 'must_not' : [ {filterItems.Item2} ]";     //must_not works like and not
            var boolFilterEnd       = $" )) ";

            var sort            =  $" , 'sort' : ['BookId' , 'ChapterId' , 'VerseNo' ]"; 
            var from            =  $" , 'from' : {startIndex} ";
            var size            =  $" , 'size' : {recPerPage} ";

            var searchEnd       =  $" ) ";

            var boolQuery  = $" {boolQueryStart}  {queryMustClause} {boolQueryEnd} ";
            var boolFilter = $" {boolFilterStart} {filterShouldClause} {filterMustClause} {filterMustNotClause} {boolFilterEnd} ";

            var query = $"{searchStart} {boolQuery} {boolFilter} {sort} {from} {size} {searchEnd} ";
            query = query.Replace("(", "{").Replace(")", "}").Replace("'", "\"");

            var endpoint = new EndPoint();
            endpoint.ApiMethod = _readIndex + "_search";
            endpoint.HttpMethod = "POST";

            var esResponse = await _requestManager.ExecuteRequest<ElasticSearchResponse<ElasticSearchBibleDocument>, string>(endpoint, query);
            if (esResponse.Status.Ok)
            {
                response.Pagination = new ApiPagination
                {
                    RecPerPage = recPerPage,
                    CurrentPage = currentPage,
                    TotalRecCount = esResponse.Data.hits.total,
                    TotalPageCount = Convert.ToInt16(Math.Ceiling(Convert.ToDecimal(esResponse.Data.hits.total)/recPerPage))
                };

                response.Data = new List<BibleVerse>();
                foreach (var hit in esResponse.Data.hits.hits)
                {
                    var verse = new BibleVerse()
                    {
                        BibleId = Convert.ToInt16(hit._source.BibleId)
                                                    ,
                        BookId = Convert.ToInt16(hit._source.BookId)
                                                    ,
                        ChapterId = Convert.ToInt16(hit._source.ChapterId)
                                                    ,
                        VerseNo = Convert.ToInt16(hit._source.VerseNo)
                                                    ,
                        VerseText = hit._source.VerseText
                    };
                    response.Data.Add(verse);
                }
            }
            else
            {
                response.Status = esResponse.Status;
            }
            return response;
        }

        private Tuple<string, string> GetFilter(List<int> bibleIds, Bible bibleFilter)
        {
            var mustNotFilter = new StringBuilder();
            var shouldBooks = new StringBuilder();
            var shouldGroups = new StringBuilder();
            var shouldTestments = new StringBuilder();
            var shouldBibles = new StringBuilder();

            foreach (var testment in bibleFilter.Testments)
            {
                foreach (var group in testment.Groups)
                {
                    var selectedBooks = group.Books.Count(b => b.Selected == 1);
                    var unSelectedBooks = group.Books.Count(b => b.Selected == 0);
                    group.Selected = 2;    // partial selection                
                    group.Selected = selectedBooks == group.Books.Count() ? 1 : group.Selected;
                    group.Selected = unSelectedBooks == group.Books.Count() ? 0 : group.Selected;
                }

                var selectedGroups = testment.Groups.Count(g => g.Selected == 1);
                var unSelectedGroups = testment.Groups.Count(g => g.Selected == 0);
                testment.Selected = 2;    // partial selection , children decide for themselves                
                testment.Selected = selectedGroups == testment.Groups.Count() ? 1 : testment.Selected;
                testment.Selected = unSelectedGroups == testment.Groups.Count() ? 0 : testment.Selected;

            }
            // (book1 or book2 or book 3) and (group1 or group2) and (testment1 or testment2) and (bible1 or bible2)
            // bool : must [bool:shouldBook , bool:shouldGroup , bool:shouldTestment , bool:shouldBible]
            foreach (var testment in bibleFilter.Testments)
            {
                switch (testment.Selected)
                {
                    case 0:
                        mustNotFilter.Append($" , ( 'term' : ('TestmentId':'{testment.Id}') )");
                        break;
                    case 1:
                        shouldTestments.Append($" , ( 'term' : ('TestmentId':'{testment.Id}') )");
                        break;
                    default: //if selected = 2 which is partially selected
                        foreach (var group in testment.Groups)
                        {
                            switch (group.Selected)
                            {
                                case 0:
                                    mustNotFilter.Append($" , ( 'term' : ('GroupId':'{ group.Id}') )");
                                    break;
                                case 1:
                                    shouldGroups.Append($" , ( 'term' : ('GroupId':'{ group.Id}') )");
                                    break;
                                default:
                                    foreach (var book in group.Books)
                                    {
                                        switch (book.Selected)
                                        {
                                            case 0:
                                                mustNotFilter.Append($" , ( 'term' : ('BookId':'{book.Id}') )");
                                                break;
                                            case 1:
                                                shouldBooks.Append($" , ( 'term' : ('BookId':'{book.Id}') )");
                                                break;
                                        }
                                    }
                                    break;
                            }
                        }
                        break;
                }
            }
            foreach (var bibleId in bibleIds)
            {
                shouldBibles.Append($" , ( 'term' : ('BibleId':'{bibleId}') )");
            }
            //----------------------------------------------
            // convert strinBuilders to strings and remove the first space and colon

            var sShouldBibles = getCleanString(shouldBibles.ToString());
            var shouldFilter = getCleanString (shouldBooks.ToString() + shouldGroups.ToString() + shouldTestments.ToString());
            //----------------------------------------------

            if (!string.IsNullOrEmpty(shouldFilter))
                shouldFilter = $" , ('bool':('should':[{shouldFilter}] ))";

            if (!string.IsNullOrEmpty(sShouldBibles))
                sShouldBibles = $" , ('bool':('should':[{sShouldBibles}] ))";

            var smustFilter = shouldFilter + sShouldBibles ;
            smustFilter = getCleanString(smustFilter);

            var smustNotFilter = getCleanString(mustNotFilter.ToString());

            return Tuple.Create(smustFilter, smustNotFilter);
        }

        private string getCleanString(string s)
        {
  
            if (!string.IsNullOrEmpty(s))
                s = s.Substring(2);   // remove the first space and colon
            return s;
        }

    }
}