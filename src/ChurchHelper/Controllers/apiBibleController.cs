using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChurchHelper.BusinessInterfaces;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemModels;
using Microsoft.AspNet.Mvc;
using Microsoft.Framework.OptionsModel;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace ChurchHelper.Controllers
{
    public class apiBibleController : Controller
    {
        private readonly List<Bible> _bibleList;
        private readonly IBibleManager _bibleManager;

        public apiBibleController(IOptions<List<Bible>> bibleList, IBibleManager bibleManager)
        {
            _bibleManager = bibleManager;
            _bibleList = bibleList.Value;
        }

        [HttpGet]
        public ApiResponse<List<Bible>> GetBibleStructure()
        {
            var response = new ApiResponse<List<Bible>>();
            response.Data = _bibleList.OrderBy(x=> x.Id).ToList();  // order important and no gaps as id will be used in front end as an array index
            return response;
        }

        [HttpGet]
        [Route("apiBible/GetVersesOfChapter/{bibleId}/{bookId}/{chapterId}")]
        public async Task<ApiResponse<List<BibleVerse>>> GetVersesOfChapter(int bibleId, int bookId, int chapterId)
        {
            return await _bibleManager.GetVersesOfChapter(bibleId, bookId, chapterId);
        }

        [HttpPost]
        public async Task<ApiResponse<List<BibleVerse>>> DoSearch([FromBody]BibleSearch bibleSearch)
        {
            return await _bibleManager.DoSearch(bibleSearch);
        }

        [HttpGet]
        [Route("apiBible/ReindexVanDyke")]
        public async Task<ApiResponse<string>> ReindexVanDyke()
        {
            return await _bibleManager.ReindexVanDyke();
        }

        [HttpGet]
        [Route("apiBible/ReindexKJV")]
        public async Task<ApiResponse<string>> ReindexKJV()
        {
            return await _bibleManager.ReindexKJV();
        }

        [HttpGet]
        [Route("apiBible/VerifyReindex")]
        public async Task<ApiResponse<List<dynamic>>> VerifyReindex()
        {
            return await _bibleManager.VerifyReindex();
        }
    }
}
