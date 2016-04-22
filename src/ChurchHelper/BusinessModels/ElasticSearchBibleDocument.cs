namespace ChurchHelper.BusinessModels
{
    public class ElasticSearchBibleDocument
    {
        //public string translation { get; set; }
        //public string testment { get; set; }
        //public string group { get; set; }
        //public string book { get; set; }
        //public string bookNameEnglish { get; set; }
        //public string bookNameArabic { get; set; }
        //public string ppsDir { get; set; }
        //public string chapter { get; set; }
        //public string number { get; set; }
        //public string englishVerse { get; set; }
        //public string arabicVerse { get; set; }

        public int BibleId { get; set; }
        public int TestmentId { get; set; }
        public int GroupId { get; set; }
        public int BookId { get; set; }
        public int ChapterId { get; set; }
        public int VerseNo { get; set; }
        public string VerseText { get; set; }
        public string SearchText { get; set; } // for arabic search        

    }
}