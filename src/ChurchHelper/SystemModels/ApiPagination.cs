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
        public int CurrentPage { get; set; }
        public int RecPerPage { get; set; }

    }
}
