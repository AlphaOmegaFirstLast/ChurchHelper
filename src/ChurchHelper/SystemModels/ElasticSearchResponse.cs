using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChurchHelper.SystemModels
{

    public class ElasticSearchResponse<T>
    {
        public int took { get; set; }
        public bool timed_out { get; set; }
        public Shards _shards { get; set; }
        public Hits<T> hits { get; set; }
    }

    public class Shards
    {
        public int total { get; set; }
        public int successful { get; set; }
        public int failed { get; set; }
    }

    public class Hits<T>
    {
        public int total { get; set; }
        public float? max_score { get; set; }
        public Hit<T>[] hits { get; set; }
    }

    public class Hit<T>
    {
        public string _index { get; set; }
        public string _type { get; set; }
        public string _id { get; set; }
        public float? _score { get; set; }
        public T _source { get; set; }
    }
}
