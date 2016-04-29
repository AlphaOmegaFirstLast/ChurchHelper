using System.Collections.Generic;
using System.Threading.Tasks;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemModels;

namespace ChurchHelper.BusinessInterfaces
{
    public interface IBibleRepository
    {
        Task<ApiResponse<string>> AddDocument(BibleVerse doc);
        Task<ApiResponse<string>> UpdateDocument();
        Task<ApiResponse<string>> DeleteDocument();
        Task<ApiResponse<List<BibleVerse>>> GetDocuments(int bibleId, int bookId, int chapterId);
        Task<ApiResponse<List<BibleVerse>>> Query(int pageIndex, List<int> bibleIds, Bible bibleFilter, SearchCriteria searchCriteria);
    }
}