using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChurchHelper.BusinessModels
{
    public class Presentation
    {
        public PresentationHeader PresentationHeader { get; set; }
        public List<PresentationItem> PresentationItems { get; set; }
    }

    public class PresentationHeader
    {
        public string Organisation { get; set; }
        public string Writer { get; set; }
        public string Id { get; set; }
    }

    public class PresentationItem
    {
        public string ItemType { get; set; }
        public string ItemText { get; set; }
        public string TextBefore { get; set; }
        public string TextAfter { get; set; }
    }
}
