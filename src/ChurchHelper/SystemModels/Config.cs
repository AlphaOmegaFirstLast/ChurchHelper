using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChurchHelper.SystemModels
{
    public class Config
    {
        public string ElasticSearchReadIndex { get; set; }
        public string ElasticSearchWriteIndex { get; set; }
        public string ApiPath { get; set; }
    }
}
