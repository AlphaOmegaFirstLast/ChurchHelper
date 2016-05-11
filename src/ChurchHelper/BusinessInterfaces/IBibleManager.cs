using System.Collections.Generic;
using System.Threading.Tasks;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemModels;

namespace ChurchHelper.BusinessInterfaces
{
    public interface IBibleManager
    {
        Task<ApiResponse<List<BibleVerse>>> GetVersesOfChapter(int bibleId, int bookId, int chapterId);
        Task<ApiResponse<List<BibleVerse>>> GetVerseTranslations(int[] bibleIds, int bookId, int chapterId, int verseNo);
        Task<ApiResponse<List<BibleVerse>>> DoSearch(BibleSearch bibleSearch);
        Task<ApiResponse<string>> ReindexVanDyke();
        Task<ApiResponse<string>> ReindexNKJV();
        Task<ApiResponse<List<dynamic>>> VerifyReindex();
    }
}