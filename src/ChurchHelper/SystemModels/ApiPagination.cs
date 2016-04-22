using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChurchHelper.SystemModels
{
    public class ApiPagination
    {
        public int TotalRecCount { get; set; }
        public int TotalPageCount { get; set; }
        public string CurrentPage { get; set; }

    }
}
