using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using ChurchHelper.SystemInterfaces;
using ChurchHelper.SystemModels;

namespace ChurchHelper.SystemManagers
{
    public class RequestClient : IRequestClient
    {

        /*-----------------------------------------------------------------------------------------------------------*/

        public async Task<ApiResponse<string>> GetAsync(string url, Dictionary<string, string> headers = null)
        {
            var response = new ApiResponse<string>();
            try
            {
                using (var httpClient = new HttpClient())
                {
                    if (headers != null)
                    {
                        foreach (var h in headers)
                        {
                            httpClient.DefaultRequestHeaders.Add(h.Key, h.Value);
                        }
                    }
                    using (var httpResponse = await httpClient.GetAsync(url))
                    {

                        if (httpResponse.StatusCode == HttpStatusCode.OK) //todo check for other codes like found & create
                        {
                            using (var httpContent = httpResponse.Content)
                            {
                                response.Data = await httpContent.ReadAsStringAsync();
                            }
                        }
                        else
                        {
                            response.Status.SetError(-1, $"Get request error. Http Response code:{httpResponse.StatusCode}. url:{url}");
                        }
                    }
                }
            }
            catch (Exception e)
            {
                response.Status.SetError(-1, "Get request error", e);
            }
            return response;
        }

        /*-----------------------------------------------------------------------------------------------------------*/

        public async Task<ApiResponse<string>> PostAsync<T>(string url, string sParam, Dictionary<string, string> headers = null)
        {
            var response = new ApiResponse<string>();
            try
            {
                using (var httpClient = new HttpClient())
                {
                    if (headers != null)
                    {
                        foreach (var h in headers)
                        {
                            httpClient.DefaultRequestHeaders.Add(h.Key, h.Value);
                        }
                    }
                    
                    var stringContent = new StringContent(sParam);
                    using (var httpResponse = await httpClient.PostAsync(url, stringContent))     // HttpClientExtensions.PostAsJsonAsync webApiCompatShim
                    {
                        if (httpResponse.StatusCode == HttpStatusCode.OK) //todo check for other codes like found & create
                        {
                            using (var httpContent = httpResponse.Content)
                            {
                                response.Data = await httpContent.ReadAsStringAsync();
                            }
                        }
                        else
                        {
                            var bodycontent = await httpResponse.Content.ReadAsStringAsync();
                            response.Status.SetError(-1, $"Post request error. Http Response code:{httpResponse.StatusCode}. body {bodycontent} url:{url}");
                        }
                    }
                }

            }
            catch (Exception e)
            {
                response.Status.SetError(-1, "Post request error", e);
            }
            return response;
        }

        /*-----------------------------------------------------------------------------------------------------------*/

        public async Task<ApiResponse<string>> DownloadFileAsync(string url, string fileName, Dictionary<string, string> headers = null)
        {
            var response = new ApiResponse<string>();
            try
            {
                using (var webClient = new WebClient())
                {
                    if (headers != null)
                    {
                        foreach (var h in headers)
                        {
                            webClient.Headers.Add(h.Key, h.Value);
                        }
                    }

                    await webClient.DownloadFileTaskAsync(url, fileName);
                }
            }
            catch (Exception e)
            {
                response.Status.SetError(-1, "DownloadFile request error", e);
            }
            return response;
        }

    }
}
