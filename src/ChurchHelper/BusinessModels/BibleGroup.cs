using System.Collections.Generic;

namespace ChurchHelper.BusinessModels
{
    public class BibleGroup
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<BibleBook> Books { get; set; }
        public int Selected { get; set; }
    }
}
