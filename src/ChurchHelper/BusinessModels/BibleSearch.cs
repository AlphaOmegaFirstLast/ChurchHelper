using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChurchHelper.BusinessModels
{
    public class BibleSearch
    {
        public int PageIndex { get; set; }
        public List<int> BibleIds { get; set; }
        public Bible BibleFilter { get; set; } 
        public SearchCriteria SearchCriteria { get; set; }
    }
}
