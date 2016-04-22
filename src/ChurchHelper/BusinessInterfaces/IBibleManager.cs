using System.Collections.Generic;
using System.Threading.Tasks;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemModels;

namespace ChurchHelper.BusinessInterfaces
{
    public interface IBibleManager
    {
        Task<ApiResponse<List<BibleVerse>>> GetVersesOfChapter(int bibleId, int bookId, int chapterId);
        Task<ApiResponse<List<BibleVerse>>> DoSearch(Bible bibleFilter, SearchCriteria searchCriteria);
        Task<ApiResponse<string>> ReindexVanDyke();
        Task<ApiResponse<string>> ReindexKJV();
        Task<ApiResponse<List<dynamic>>> VerifyReindex();
    }
}