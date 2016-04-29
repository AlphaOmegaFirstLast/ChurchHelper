namespace ChurchHelper.BusinessModels
{
    public class ElasticSearchBibleDocument
    {
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