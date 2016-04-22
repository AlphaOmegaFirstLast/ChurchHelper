using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChurchHelper.SystemModels
{
    public class ApiResponse<T>
    {
        public ApiStatus Status { get; set; }
        public T Data { get; set; }
        public ApiRequestInfo RequestInfo { get; set; }
        public ApiPagination Pagination { get; set; }

        public ApiResponse()
        {
            Status = new ApiStatus();
            RequestInfo = new ApiRequestInfo();
            Pagination = new ApiPagination();
        }
    }
}
