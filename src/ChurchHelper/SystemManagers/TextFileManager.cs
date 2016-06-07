using System;
using System.IO;
using System.Threading.Tasks;
using ChurchHelper.SystemInterfaces;
using ChurchHelper.SystemModels;

namespace ChurchHelper.SystemManagers
{
    public class TextFileManager: ITextFileManager
    {

        public async Task<ApiResponse<string>> ReadText(string fileName)
        {
            var response = new ApiResponse<string>();
            string fileSysName = fileName;
            try
            {
                using (var sr = new StreamReader(fileSysName))
                {
                    response.Data = await sr.ReadToEndAsync();
                }
            }
            catch (Exception e)
            {
                response.Status.SetError(-1, $"Read Text {fileName}", e);
            }
            return response;
        }
        //--------------------------------------------------------------------

        public async Task<ApiResponse<string>> WriteText(string fileName, string txt)
        {

            var response = new ApiResponse<string>();
            string fileSysName = fileName;
            try
            {
                using (var sw = new StreamWriter(fileSysName))
                {
                   await sw.WriteAsync(txt);
                }
            }
            catch (Exception e)
            {
                response.Status.SetError(-1, $"Write Text {fileName}", e);
            }
            return response;
        }


    }
}
