using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ChurchHelper.BusinessHelpers
{
    public static class ArabicHelper
    {
        public static string MapArabicToEnglishLetters(string arabicWord)
        {
            if (string.IsNullOrEmpty(arabicWord))
                return string.Empty;

            arabicWord = arabicWord.Replace(",", "");
            var charcaters = arabicWord.ToCharArray();
            for (var i = 0; i < charcaters.Count(); i++)
            {
                switch (charcaters[i])
                {

                    case ' ':
                        charcaters[i] = 'y'; break;
                    case 'ا':
                    case 'أ':
                    case 'ء':
                    case 'إ':
                    case 'آ':
                        charcaters[i] = 'a'; break;
                    case 'ب':
                        charcaters[i] = 'b'; break;
                    case 'ت':
                        charcaters[i] = 't'; break;
                    case 'ث':
                        charcaters[i] = '1'; break;
                    case 'ج':
                        charcaters[i] = 'g'; break;
                    case 'ح':
                        charcaters[i] = '2'; break;
                    case 'خ':
                        charcaters[i] = '3'; break;
                    case 'د':
                        charcaters[i] = 'd'; break;
                    case 'ذ':
                        charcaters[i] = 'z'; break;
                    case 'ر':
                        charcaters[i] = 'r'; break;
                    case 'ز':
                        charcaters[i] = '4'; break;

                    case 'س':
                        charcaters[i] = 's'; break;
                    case 'ش':
                        charcaters[i] = '5'; break;

                    case 'ص':
                        charcaters[i] = '6'; break;
                    case 'ض':
                        charcaters[i] = '7'; break;
                    case 'ط':
                        charcaters[i] = '8'; break;
                    case 'ظ':
                        charcaters[i] = '9'; break;
                    case 'ع':
                        charcaters[i] = '0'; break;
                    case 'غ':
                        charcaters[i] = 'x'; break;

                    case 'ف':
                        charcaters[i] = 'f'; break;
                    case 'ق':
                        charcaters[i] = 'q'; break;
                    case 'ك':
                        charcaters[i] = 'k'; break;
                    case 'ل':
                        charcaters[i] = 'l'; break;
                    case 'م':
                        charcaters[i] = 'm'; break;
                    case 'ن':
                        charcaters[i] = 'n'; break;
                    case 'ه':
                    case 'ة':
                        charcaters[i] = 'h'; break;
                    case 'و':
                    case 'ؤ':
                        charcaters[i] = 'o'; break;
                    case 'ي':
                    case 'ئ':
                    case 'ى':
                        charcaters[i] = 'i'; break;

                    default:
                        charcaters[i] = 'w'; break;
                }
            }

            var englishString = new StringBuilder();
            for (var i = 0; i < charcaters.Count(); i++)
            {
                englishString.Append(charcaters[i]);
            }
            return englishString.ToString().Replace("w", "");
        }
    }
}
