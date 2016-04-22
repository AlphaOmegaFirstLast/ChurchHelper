using System.Collections.Generic;
using System.Xml.Serialization;

namespace ChurchHelper.SystemModels
{
    [XmlRoot(ElementName = "EndPoints")]
    public class EndPoints
    {
        [XmlElement(ElementName = "EndPoint")]
        public List<EndPoint> EndPoint { get; set; }
    }

    [XmlRoot(ElementName = "EndPoint")]
    public class EndPoint
    {
        [XmlElement(ElementName = "apiMethod")]
        public string ApiMethod { get; set; }
        [XmlElement(ElementName = "Headers")]
        public Headers Headers { get; set; }
        [XmlAttribute(AttributeName = "Name")]
        public string Name { get; set; }
        [XmlAttribute(AttributeName = "HttpMethod")]
        public string HttpMethod { get; set; }
    }

    [XmlRoot(ElementName = "Headers")]
    public class Headers
    {
        [XmlElement(ElementName = "Header")]
        public List<Header> Header { get; set; }
    }

    [XmlRoot(ElementName = "Header")]
    public class Header
    {
        [XmlAttribute(AttributeName = "key")]
        public string Key { get; set; }
        [XmlAttribute(AttributeName = "value")]
        public string Value { get; set; }
    }


}