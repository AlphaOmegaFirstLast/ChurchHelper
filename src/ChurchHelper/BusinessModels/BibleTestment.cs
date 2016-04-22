using System.Collections.Generic;

namespace ChurchHelper.BusinessModels
{
    public class BibleTestment
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<BibleGroup> Groups { get; set; }
        public int Selected { get; set; }
    }
}
