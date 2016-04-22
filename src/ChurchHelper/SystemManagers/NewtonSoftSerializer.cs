using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using ChurchHelper.SystemInterfaces;
using ChurchHelper.SystemModels;

namespace ChurchHelper.SystemManagers
{
    public class NewtonSoftSerializer : ISerializer
    {
        public ApiResponse<string> Serialize<T>(T obj)
        {
            var response = new ApiResponse<string>();
            try
            {
                var json = JsonConvert.SerializeObject(obj);
                response.Data = json;
            }
            catch (Exception e)
            {
                response.Status.SetError(-1, "Serialization error" , e);
            }
          
            return response;
        }

        public ApiResponse<T> Deserialize<T>(string json)
        {
            var response = new ApiResponse<T>();
            try
            {
                var obj = JsonConvert.DeserializeObject<T>(json);
                response.Data = obj;
            }
            catch (Exception e)
            {
                response.Status.SetError(-1, "Deserialization error", e);
            }

            return response;
        }
    }
}
