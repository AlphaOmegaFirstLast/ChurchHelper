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
        private readonly IOptions<List<Bible>> _bibleList;
        private readonly IRequestManager _requestManager;
        private string _readIndex = "http://localhost:9200/bibles/"; //  "http://localhost:9200/bible/";
        private string _writeIndex = "http://localhost:9200/bibles/NKJV/";

        public BibleRepository(IOptions<List<Bible>> bibleList,IRequestManager requestClient)
        {
            _bibleList = bibleList;
            _requestManager = requestClient;
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
            //query = query + "( ";
            //query = query + " query: (bool: (";
            //query = query + " must : [  ( term : ( 'translation': {0}) ), ( term : ( 'book': '{1}') ), ( term : ( 'chapter': '{2}') )]";
            //query = query + ")) ";
            //query = query + ", sort : [ 'translation' , 'book' , 'chapter' , 'number' ]";
            //query = query + ", from : {3} " ;
            //query = query + ", size : {4} " ;
            //query = query + ")";
            query = query + "( ";
            query = query + " query: (bool: (";
            query = query + " must : [  ( term : ( 'BibleId': {0}) ), ( term : ( 'BookId': '{1}') ), ( term : ( 'ChapterId': '{2}') )]";
            query = query + ")) ";
            query = query + ", sort : [ 'BibleId' , 'BookId' , 'ChapterId' , 'VerseNo' ]";
            query = query + ", from : {3} ";
            query = query + ", size : {4} ";
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

        public async Task<ApiResponse<List<BibleVerse>>> Query(Bible bibleFilter, SearchCriteria searchCriteria)
        {
            var response = new ApiResponse<List<BibleVerse>>();
            var searchTerm = ArabicHelper.MapArabicToEnglishLetters(searchCriteria.SearchItems[0].SearchTerm) ;
            var filterItems = GetFilter(bibleFilter);
            var mustNotClause = string.Empty;
            var filter = string.Empty;

            var searchStart     =  $" ( ";
            var boolQueryStart  =  $" query: ( bool: (";
            var mustClause      =  $"   must     : [ (wildcard : ('SearchText' :  '*{searchTerm}*' )) ]";
            if (!string.IsNullOrEmpty(filterItems.Item2))
            {
                mustNotClause = $" , must_not : [ {filterItems.Item2} ]";
            }
            var boolQueryEnd    =  $" )) ";
            if (!string.IsNullOrEmpty(filterItems.Item1))
            {
                filter = $" , filter: ( or : [ {filterItems.Item1} ] ) ";
            }
            var sort            =  $" , sort : [ 'BibleId' , 'BookId' , 'ChapterId' , 'VerseNo' ]"; 
            var from            =  $" , from : 0 ";
            var size            =  $" , size: 20 ";
            var searchEnd       =  $" ) ";

            var boolQuery = $" {boolQueryStart} {mustClause} {mustNotClause} {boolQueryEnd}";

            var query = $"{searchStart} {boolQuery} {filter} {sort} {from} {size} {searchEnd} ";
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
                    //var verse = new BibleVerse() {  BibleId = Convert.ToInt16(hit._source.translation)
                    //                                , BookId = Convert.ToInt16(hit._source.book)
                    //                                , ChapterId = Convert.ToInt16(hit._source.chapter)
                    //                                , VerseNo = Convert.ToInt16(hit._source.number)
                    //                                , VerseText = hit._source.arabicVerse };
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

        private Tuple<string, string> GetFilter(Bible bibleFilter)
        {
            var mustFilter = new StringBuilder();
            var mustNotFilter = new StringBuilder();

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

            foreach (var testment in bibleFilter.Testments)
            {
                switch (testment.Selected)
                {
                    case 0:
                        mustNotFilter.Append($" , ( term : ('TestmentId':'{testment.Id}') )");
                        break;
                    case 1:
                        mustFilter.Append($" , ( term : ('TestmentId':'{testment.Id}') )");
                        break;
                    default:
                        foreach (var group in testment.Groups)
                        {
                            switch (group.Selected)
                            {
                                case 0:
                                    mustNotFilter.Append($" , ( term : ('GroupId':'{ group.Id}') )");
                                    break;
                                case 1:
                                    mustFilter.Append($" , ( term : ('GroupId':'{ group.Id}') )");
                                    break;
                                default:
                                    foreach (var book in group.Books)
                                    {
                                        switch (book.Selected)
                                        {
                                            case 0:
                                                mustNotFilter.Append($" , ( term : ('BookId':'{book.Id}') )");
                                                break;
                                            case 1:
                                                mustFilter.Append($" , ( term : ('BookId':'{book.Id}') )");
                                                break;
                                        }
                                    }
                                    break;
                            }
                        }
                        break;
                }
            }
            var smustFilter = mustFilter.ToString();
            if (!string.IsNullOrEmpty(smustFilter))
                smustFilter = smustFilter.Substring(2);

            var smustNotFilter = mustNotFilter.ToString();
            if (!string.IsNullOrEmpty(smustNotFilter))

                smustNotFilter = smustNotFilter.Substring(2);

            return Tuple.Create(smustFilter, smustNotFilter);
        }

    }
}