using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ChurchHelper.BusinessInterfaces;
using ChurchHelper.BusinessModels;
using ChurchHelper.SystemInterfaces;
using ChurchHelper.SystemModels;
using Microsoft.Framework.OptionsModel;

namespace ChurchHelper.BusinessManagers
{
    public class PresentationManger:IPresentationManager
    {
        private readonly IOptions<Config> _config;
        private readonly ITextFileManager _textFileManager;
        private readonly ISerializer _serializer;

        public PresentationManger(IOptions<Config> config, ITextFileManager textFileManager, ISerializer serializer)
        {
            _config = config;
            _textFileManager = textFileManager;
            _serializer = serializer;
        }

        public async Task<ApiResponse<Presentation>> GetPresentationById(PresentationHeader presentationHeader)
        {
            var filePath = $"{_config.Value.PresentationPath}\\{presentationHeader.Organisation}\\{presentationHeader.Writer}\\{presentationHeader.Id}.txt";
            var serializationResponse =  await _textFileManager.ReadText(filePath);
            if (serializationResponse.Status.Ok)
            {
              return  _serializer.Deserialize<Presentation>(serializationResponse.Data);
            }
            return new ApiResponse<Presentation>() {Status = serializationResponse.Status };
        }

        public async Task<ApiResponse<List<string>>> GetPresentationByWriter(PresentationHeader presentationHeader)
        {
            var response = new ApiResponse<List<string>>();
            var filePath = $"{_config.Value.PresentationPath}\\{presentationHeader.Organisation}\\{presentationHeader.Writer}";
            try
            {
                var filesPathsList = await Task.Run(() => System.IO.Directory.GetFiles(filePath,"*.txt"));
                var filesList = filesPathsList.Select(x => Path.GetFileName(x).Replace(Path.GetExtension(x),string.Empty));
                response.Data = filesList.ToList();
            }
            catch (Exception e)
            {
                response.Status.SetError(-1,e.Message , e);
            }
            return response;
        }

        public async Task<ApiResponse<string>> SavePresentation(Presentation presentation)
        {
            if (presentation != null && presentation.PresentationItems != null)
            {
                var serializationResponse = _serializer.Serialize(presentation);
                var filePath = $"{_config.Value.PresentationPath}\\{presentation.PresentationHeader.Organisation}\\{presentation.PresentationHeader.Writer}\\{presentation.PresentationHeader.Id}.txt";
                return await _textFileManager.WriteText(filePath, serializationResponse.Data);
            }
            var response =  new ApiResponse<string>() { Status = { Id = -1, Info = "" } };
            response.Status.SetError(-1, "error. cannot save an empty presentation", null);
            return response;
        }
    }
}
