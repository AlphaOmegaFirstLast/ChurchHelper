using System.Threading.Tasks;
using ChurchHelper.SystemModels;

namespace ChurchHelper.SystemInterfaces
{
    public interface ITextFileManager
    {
        Task<ApiResponse<string>> ReadText(string fileName);
        Task<ApiResponse<string>> WriteText(string fileName, string txt);
    }
}