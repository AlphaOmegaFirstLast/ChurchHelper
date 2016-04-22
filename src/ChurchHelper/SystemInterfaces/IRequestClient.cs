using System.Collections.Generic;
using System.Threading.Tasks;
using ChurchHelper.SystemModels;

namespace ChurchHelper.SystemInterfaces
{
    public interface IRequestClient
    {
        Task<ApiResponse<string>> GetAsync(string url, Dictionary<string, string> headers = null);
        Task<ApiResponse<string>> PostAsync<T>(string url, string sParam, Dictionary<string, string> headers = null);
        Task<ApiResponse<string>> DownloadFileAsync(string url, string fileName, Dictionary<string, string> headers = null);
    }
}