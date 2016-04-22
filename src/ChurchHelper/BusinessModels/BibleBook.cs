namespace ChurchHelper.BusinessModels
{
    public class BibleBook
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Abbreviation { get; set; }
        public int ChapterCount { get; set; }
        public int Selected { get; set; }
    }
}
