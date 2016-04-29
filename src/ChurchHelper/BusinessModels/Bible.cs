using System.Collections.Generic;

namespace ChurchHelper.BusinessModels
{
    public class Bible
    {
        public int Id { get; set; }
        public string Name { get; set; }  //vandyke , kjv , niv , al-hayat
        public string Language { get; set; }  //arabic , english , hebrew , greek
        public string Title { get; set; }  //Bible , الكتاب المقدس
        public string Alignment { get; set; } // left/right
        public List<BibleTestment> Testments { get; set; }
        public int Selected { get; set; }
    }
}
