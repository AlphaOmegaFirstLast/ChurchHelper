using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using ChurchHelper.SystemInterfaces;
using ChurchHelper.SystemModels;

namespace ChurchHelper.SystemManagers
{
    public class RequestManager : IRequestManager
    {
        private readonly IRequestClient _requestClient;
        private readonly ISerializer _serializer;

        public RequestManager(IRequestClient requestClient, ISerializer serializer)
        {
            _requestClient = requestClient;
            _serializer = serializer;
        }

        public async Task<ApiResponse<T>> ExecuteRequest<T, TP>(SystemModels.EndPoint endpoint, TP objParam)
        {
            var response = new ApiResponse<T>();
            var webResponse = new ApiResponse<string>();

            //------------------------- Get Headers ---------------------------------

            Dictionary<string,string> headers = null;
            if (endpoint.Headers != null && endpoint.Headers.Header != null)
            {
                headers = endpoint.Headers.Header.ToDictionary(x => x.Key, x => x.Value);
            }
            //------------------------- Send Request ---------------------------------

            switch (endpoint.HttpMethod.ToUpper())
            {
                case "GET":
                    var url = GetRequestUrl<TP>(endpoint.ApiMethod, objParam);
                    webResponse = await _requestClient.GetAsync(url, headers);  //todo pass param
                    break;
                case "POST":
                    var content = string.Empty;
                    if (typeof (TP) == typeof (String))
                    {
                        content = objParam.ToString();
                    }
                    else { 
                    var jsonResponse = _serializer.Serialize(objParam);
                        content = jsonResponse.Data;
                    }
                    webResponse = await _requestClient.PostAsync<TP>(endpoint.ApiMethod, content , headers);
                    break;
            }
            //------------------------- Deserialize Response -----------------------------

            if (webResponse.Status.Ok && webResponse.Data != null) // desrialize 
            {
                response = _serializer.Deserialize<T>(webResponse.Data);
            }
            else
            {
                response.Status = webResponse.Status;
            }
            //------------------------------------------------------------------------
            return response;
        }

        //--------------------------------------------------------------------------------------------------


        private static string GetRequestUrl<T>(string requestUrl, T param)  
        {
            if (param != null)
            {
                foreach (var p in param.GetType().GetProperties())
                {
                    if (p.GetValue(param) != null)
                    {
                        var parameterValue = p.GetValue(param).ToString();
                        if (!string.IsNullOrEmpty(parameterValue))
                        {
                            requestUrl = requestUrl.Replace("#" + p.Name.ToUpper() + "#", parameterValue);
                        }
                    }
                }
            }
            return requestUrl;
        }


    }
}
