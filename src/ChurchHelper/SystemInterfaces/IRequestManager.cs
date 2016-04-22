using System.Threading.Tasks;
using ChurchHelper.SystemModels;

namespace ChurchHelper.SystemInterfaces
{
    public interface IRequestManager
    {
        Task<ApiResponse<T>> ExecuteRequest<T, TP>(EndPoint endpoint, TP objParam);
    }
}