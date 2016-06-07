using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemModels;

namespace ChurchHelper.BusinessInterfaces
{
    public interface IPresentationManager
    {
        Task<ApiResponse<Presentation>> GetPresentationById(PresentationHeader presentationHeader);
        Task<ApiResponse<List<string>>> GetPresentationByWriter(PresentationHeader presentationHeader);
        Task<ApiResponse<string>> SavePresentation(Presentation presentation);
    }
}
