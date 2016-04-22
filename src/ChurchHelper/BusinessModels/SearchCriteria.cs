using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChurchHelper.BusinessModels
{
    public class SearchCriteria
    {
        public int LogicalOperation { get; set; }
        public List<SearchItem> SearchItems { get; set; }
    }

    public class SearchItem
    {
        public string SearchTerm { get; set; }
        public int SearchOption { get; set; }  // todo should be enum
    }
    
}
