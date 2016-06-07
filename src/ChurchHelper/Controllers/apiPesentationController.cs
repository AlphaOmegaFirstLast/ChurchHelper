using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChurchHelper.BusinessInterfaces;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemModels;
using Microsoft.AspNet.Mvc;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace ChurchHelper.Controllers
{
    public class apiPesentationController : Controller
    {
        private readonly IPresentationManager _presentationManager;

        public apiPesentationController(IPresentationManager presentationManager)
        {
            _presentationManager = presentationManager;
        }


        [HttpPost]
        [Route("apiPresentation/GetPresentationById")]
        public async Task<ApiResponse<Presentation>> GetPresentationById([FromBody]PresentationHeader presentationHeader)
        {
            return await _presentationManager.GetPresentationById(presentationHeader);
        }


        [HttpPost]
        [Route("apiPresentation/GetPresentationByWriter")]
        public async Task<ApiResponse<List<string>>> GetPresentationByWriter([FromBody]PresentationHeader presentationHeader)
        {
            return await _presentationManager.GetPresentationByWriter(presentationHeader);
        }

        [HttpPost]
        [Route("apiPresentation/SavePresentation")]
        public async Task<ApiResponse<string>> SavePresentation([FromBody]Presentation presentation)
        {
            return await _presentationManager.SavePresentation(presentation);
        }
    }
}
