using System.Collections.Generic;

namespace ChurchHelper.BusinessModels
{
    public class BibleChapter
    {
        public int Id { get; set; }
        public List<BibleVerse> Verses { get; set; }
    }
}
