using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChurchHelper.BusinessModels
{
    public class BibleSearch
    {
        public Bible BibleFilter { get; set; } 
        public SearchCriteria SearchCriteria { get; set; }
    }
}
