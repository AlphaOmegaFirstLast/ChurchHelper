using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using ChurchHelper.BusinessHelpers;
using ChurchHelper.BusinessInterfaces;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemModels;
using Microsoft.AspNet.DataProtection.Repositories;
using Microsoft.Framework.OptionsModel;
using Newtonsoft.Json;

namespace ChurchHelper.BusinessManagers
{
    public class BibleManager : IBibleManager
    {
        private readonly IOptions<List<Bible>> _bibleList;
        private readonly IBibleRepository _bibleRepository;

        public BibleManager(IOptions<List<Bible>> _bibleList, IBibleRepository bibleRepository)
        {
            this._bibleList = _bibleList;
            _bibleRepository = bibleRepository;
        }

        public async Task<ApiResponse<List<BibleVerse>>> GetVersesOfChapter(int bibleId, int bookId, int chapterId)
        {
            var response = await _bibleRepository.GetDocuments(bibleId, bookId, chapterId);
            return response;
        }
        public async Task<ApiResponse<List<BibleVerse>>> DoSearch(BibleSearch bibleSearch)
        {
            var response = await _bibleRepository.Query(bibleSearch.PageIndex, bibleSearch.BibleIds, bibleSearch.BibleFilter, bibleSearch.SearchCriteria);
            return response;
        }

        public async Task<ApiResponse<string>> ReindexVanDyke()
        {
            var directoryName = @"..\App_Data\Bibles\VanDyke\";// @"C:\Suzette\TheArabicBible\The Arabic Bible\BibleCopies\VanDyke\";  
            var books = System.IO.Directory.GetFiles(directoryName);

            foreach (var book in books)
            {
                var bookText = string.Empty;
                using (var reader = new System.IO.StreamReader(book))
                {
                    bookText = reader.ReadToEnd();
                }
                if (!string.IsNullOrEmpty(bookText))
                {
                    var bookId = Convert.ToInt16(book.Replace(directoryName, "").Substring(0, 2));
                    var groupId = GetGroupId(bookId);

                    bookText = bookText.Replace("الأصحَاحُ", "@");
                    bookText = System.Text.RegularExpressions.Regex.Replace(bookText, "[0-9]", "$");    //replace verse number/digit with $
                    bookText = bookText.Replace("$$$", "$").Replace("$$", "$");   //if verse number has more than digit replace them all with one $

                    var chapters = bookText.Split('@');
                    var chapterCounter = 0;
                    foreach (var chapter in chapters)
                    {
                        var verses = chapter.Split('$');
                        var verseCounter = 0;
                        for (var i = 1; i < verses.Count(); i++)
                        {
                            var verse = verses[i];

                            var trimedVerse = verse.Replace("\n", "").Replace("\r", "").Trim();
                            var doc = new BibleVerse()
                            {
                                BibleId = 1
                                ,
                                TestmentId = (bookId <= 39 ? 1 : 2)
                                ,
                                GroupId = groupId
                                ,
                                BookId = bookId
                                ,
                                ChapterId = chapterCounter
                                ,
                                VerseNo = i
                                ,
                                VerseText = trimedVerse
                                ,
                                SearchText = ArabicHelper.MapArabicToEnglishLetters(trimedVerse)
                            };
                            if (!string.IsNullOrEmpty(trimedVerse))
                            {
                                chapterCounter = chapterCounter == 0 ? 1 : chapterCounter;
                                verseCounter = verseCounter == 0 ? 1 : verseCounter;
                               // return new ApiResponse<string>() { Data = JsonConvert.SerializeObject(doc) };
                                 var response = await _bibleRepository.AddDocument(doc);
                            }
                            verseCounter++;
                        }
                        chapterCounter++;
                    }

                }
            }
            return new ApiResponse<string>();//todo set status to false
        }

        public async Task<ApiResponse<string>> ReindexNKJV()
        {
            var fileName = @"C:\Suzette\TheArabicBible\The Arabic Bible\BibleCopies\KJV\King-James-Bible-KJV-Bible-Clean.txt";

            var bibleText = string.Empty;
            using (var reader = new System.IO.StreamReader(fileName))
            {
                bibleText = reader.ReadToEnd();
            }

            var books = bibleText.Split('@');
            var bookCounter = 1;
            foreach (var book in books)
            {
                var bookText = book.Replace("�","").Replace("\n", " ").Replace("\r", " ").Replace("    ", " ").Replace("   ", " ").Replace("  ", " ");
                if (!string.IsNullOrWhiteSpace(bookText))
                {
                    var verses = bookText.Split('{');
                    foreach (var verse in verses)
                    {
                        var verseInfo = verse.Split('}');
                        var verseIds = verseInfo[0].Split(':');
                        if (verseIds.Length > 1)
                        {
                            var verseText = verseInfo[1];
                            var doc = new BibleVerse()
                            {
                                BibleId = 2
                                                        ,
                                TestmentId = (bookCounter <= 39 ? 1 : 2)
                                                        ,
                                GroupId = GetGroupId(bookCounter)
                                                        ,
                                BookId = bookCounter
                                                        ,
                                ChapterId = Convert.ToInt16(verseIds[0])
                                                        ,
                                VerseNo = Convert.ToInt16(verseIds[1])
                                                        ,
                                VerseText = verseText
                                                        ,
                                SearchText = verseText
                            };

                            // return new ApiResponse<string>() { Data = JsonConvert.SerializeObject(doc) };
                            var response = await _bibleRepository.AddDocument(doc);
                        }
                    }
                    bookCounter++;
                }
            }
            return new ApiResponse<string>();//todo set status to false
        }

        private int GetGroupId(int bookId)
        {
            var groupId = 0;
            foreach (var testment in _bibleList.Value[0].Testments)
            {
                foreach (var group in testment.Groups)
                {
                    foreach (var book in group.Books)
                    {
                        if (book.Id == bookId)
                        {
                            groupId = group.Id;
                        }
                    }
                }
            }

            return groupId;
        }

        public async Task<ApiResponse<List<dynamic>>> VerifyReindex()
        {
            var response = new ApiResponse<List<dynamic>>();
            response.Data = new List<dynamic>();
            var versesSum1 = 0;
            var versesSum2 = 0;

            var bible = _bibleList.Value[0];
            {
                foreach (var testment in bible.Testments)
                {
                    foreach (var group in testment.Groups)
                    {
                        foreach (var book in group.Books)
                        {
                            for (var i = 1; i <= book.ChapterCount; i++)
                            {
                                var responseVerses1 = await GetVersesOfChapter(1, book.Id, i);
                                var responseVerses2 = await GetVersesOfChapter(2, book.Id, i);
                                var versesCount1 = 0;
                                var versesCount2 = 0;
                                if (responseVerses1 != null && responseVerses1.Data != null)
                                    versesCount1 = responseVerses1.Data.Count;
                                if (responseVerses2 != null && responseVerses2.Data != null)
                                    versesCount2 = responseVerses2.Data.Count;
                                if (versesCount1 != versesCount2)
                                {
                                    var info = new
                                    {
                                        bookId = book.Id,
                                        bookName = book.Name,
                                        chapter = i,
                                        VanDykeVerses = responseVerses1.Data.Count,
                                        KjvVerses = responseVerses2.Data.Count
                                    };
                                    response.Data.Add(info);
                                }
                                versesSum1 = versesSum1 + responseVerses1.Data.Count;
                                versesSum2 = versesSum2 + responseVerses2.Data.Count;
                            }
                        }

                    }
                }
            }
            return response;
        }

    }
}
