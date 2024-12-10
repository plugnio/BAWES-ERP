import { Prisma } from '@prisma/client';

export const countries: Prisma.CountryCreateInput[] = [
    {
        code: 'AF',
        nameEn: 'Afghanistan',
        nameAr: 'أفغانستان',
        phoneCode: '+93',
        currencyCode: 'AFN',
        currencySymbol: '؋',
        isDeleted: false
    },
    {
        code: 'AL',
        nameEn: 'Albania',
        nameAr: 'ألبانيا',
        phoneCode: '+355',
        currencyCode: 'ALL',
        currencySymbol: 'L',
        isDeleted: false
    },
    {
        code: 'DZ',
        nameEn: 'Algeria',
        nameAr: 'الجزائر',
        phoneCode: '+213',
        currencyCode: 'DZD',
        currencySymbol: 'د.ج',
        isDeleted: false
    },
    {
        code: 'AD',
        nameEn: 'Andorra',
        nameAr: 'أندورا',
        phoneCode: '+376',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'AO',
        nameEn: 'Angola',
        nameAr: 'أنغولا',
        phoneCode: '+244',
        currencyCode: 'AOA',
        currencySymbol: 'Kz',
        isDeleted: false
    },
    {
        code: 'AG',
        nameEn: 'Antigua and Barbuda',
        nameAr: 'أنتيغوا وبربودا',
        phoneCode: '+1',
        currencyCode: 'XCD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'AR',
        nameEn: 'Argentina',
        nameAr: 'الأرجنتين',
        phoneCode: '+54',
        currencyCode: 'ARS',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'AM',
        nameEn: 'Armenia',
        nameAr: 'أرمينيا',
        phoneCode: '+374',
        currencyCode: 'AMD',
        currencySymbol: '֏',
        isDeleted: false
    },
    {
        code: 'AU',
        nameEn: 'Australia',
        nameAr: 'أستراليا',
        phoneCode: '+61',
        currencyCode: 'AUD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'AT',
        nameEn: 'Austria',
        nameAr: 'النمسا',
        phoneCode: '+43',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'AZ',
        nameEn: 'Azerbaijan',
        nameAr: 'أذربيجان',
        phoneCode: '+994',
        currencyCode: 'AZN',
        currencySymbol: '₼',
        isDeleted: false
    },
    {
        code: 'BS',
        nameEn: 'Bahamas',
        nameAr: 'الباهاما',
        phoneCode: '+1',
        currencyCode: 'BSD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'BH',
        nameEn: 'Bahrain',
        nameAr: 'البحرين',
        phoneCode: '+973',
        currencyCode: 'BHD',
        currencySymbol: '.د.ب',
        isDeleted: false
    },
    {
        code: 'BD',
        nameEn: 'Bangladesh',
        nameAr: 'بنغلاديش',
        phoneCode: '+880',
        currencyCode: 'BDT',
        currencySymbol: '৳',
        isDeleted: false
    },
    {
        code: 'BB',
        nameEn: 'Barbados',
        nameAr: 'بربادوس',
        phoneCode: '+1',
        currencyCode: 'BBD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'BY',
        nameEn: 'Belarus',
        nameAr: 'بيلاروس',
        phoneCode: '+375',
        currencyCode: 'BYN',
        currencySymbol: 'Br',
        isDeleted: false
    },
    {
        code: 'BE',
        nameEn: 'Belgium',
        nameAr: 'بلجيكا',
        phoneCode: '+32',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'BZ',
        nameEn: 'Belize',
        nameAr: 'بليز',
        phoneCode: '+501',
        currencyCode: 'BZD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'BJ',
        nameEn: 'Benin',
        nameAr: 'بنين',
        phoneCode: '+229',
        currencyCode: 'XOF',
        currencySymbol: 'CFA',
        isDeleted: false
    },
    {
        code: 'BT',
        nameEn: 'Bhutan',
        nameAr: 'بوتان',
        phoneCode: '+975',
        currencyCode: 'BTN',
        currencySymbol: 'Nu.',
        isDeleted: false
    },
    {
        code: 'BO',
        nameEn: 'Bolivia',
        nameAr: 'بوليفيا',
        phoneCode: '+591',
        currencyCode: 'BOB',
        currencySymbol: 'Bs.',
        isDeleted: false
    },
    {
        code: 'BA',
        nameEn: 'Bosnia and Herzegovina',
        nameAr: 'البوسنة والهرسك',
        phoneCode: '+387',
        currencyCode: 'BAM',
        currencySymbol: 'KM',
        isDeleted: false
    },
    {
        code: 'BW',
        nameEn: 'Botswana',
        nameAr: 'بوتسوانا',
        phoneCode: '+267',
        currencyCode: 'BWP',
        currencySymbol: 'P',
        isDeleted: false
    },
    {
        code: 'BR',
        nameEn: 'Brazil',
        nameAr: 'البرازيل',
        phoneCode: '+55',
        currencyCode: 'BRL',
        currencySymbol: 'R$',
        isDeleted: false
    },
    {
        code: 'BN',
        nameEn: 'Brunei',
        nameAr: 'بروناي',
        phoneCode: '+673',
        currencyCode: 'BND',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'BG',
        nameEn: 'Bulgaria',
        nameAr: 'بلغاريا',
        phoneCode: '+359',
        currencyCode: 'BGN',
        currencySymbol: 'лв',
        isDeleted: false
    },
    {
        code: 'BF',
        nameEn: 'Burkina Faso',
        nameAr: 'بوركينا فاسو',
        phoneCode: '+226',
        currencyCode: 'XOF',
        currencySymbol: 'CFA',
        isDeleted: false
    },
    {
        code: 'BI',
        nameEn: 'Burundi',
        nameAr: 'بوروندي',
        phoneCode: '+257',
        currencyCode: 'BIF',
        currencySymbol: 'FBu',
        isDeleted: false
    },
    {
        code: 'KH',
        nameEn: 'Cambodia',
        nameAr: 'كمبوديا',
        phoneCode: '+855',
        currencyCode: 'KHR',
        currencySymbol: '៛',
        isDeleted: false
    },
    {
        code: 'CM',
        nameEn: 'Cameroon',
        nameAr: 'الكاميرون',
        phoneCode: '+237',
        currencyCode: 'XAF',
        currencySymbol: 'FCFA',
        isDeleted: false
    },
    {
        code: 'CA',
        nameEn: 'Canada',
        nameAr: 'كندا',
        phoneCode: '+1',
        currencyCode: 'CAD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'CV',
        nameEn: 'Cape Verde',
        nameAr: 'الرأس الأخضر',
        phoneCode: '+238',
        currencyCode: 'CVE',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'CF',
        nameEn: 'Central African Republic',
        nameAr: 'جمهورية أفريقيا الوسطى',
        phoneCode: '+236',
        currencyCode: 'XAF',
        currencySymbol: 'FCFA',
        isDeleted: false
    },
    {
        code: 'TD',
        nameEn: 'Chad',
        nameAr: 'تشاد',
        phoneCode: '+235',
        currencyCode: 'XAF',
        currencySymbol: 'FCFA',
        isDeleted: false
    },
    {
        code: 'CL',
        nameEn: 'Chile',
        nameAr: 'تشيلي',
        phoneCode: '+56',
        currencyCode: 'CLP',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'CN',
        nameEn: 'China',
        nameAr: 'الصين',
        phoneCode: '+86',
        currencyCode: 'CNY',
        currencySymbol: '¥',
        isDeleted: false
    },
    {
        code: 'CO',
        nameEn: 'Colombia',
        nameAr: 'كولومبيا',
        phoneCode: '+57',
        currencyCode: 'COP',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'KM',
        nameEn: 'Comoros',
        nameAr: 'جزر القمر',
        phoneCode: '+269',
        currencyCode: 'KMF',
        currencySymbol: 'CF',
        isDeleted: false
    },
    {
        code: 'CG',
        nameEn: 'Congo',
        nameAr: 'الكونغو',
        phoneCode: '+242',
        currencyCode: 'XAF',
        currencySymbol: 'FCFA',
        isDeleted: false
    },
    {
        code: 'CD',
        nameEn: 'Congo, Democratic Republic',
        nameAr: 'جمهورية الكونغو الديمقراطية',
        phoneCode: '+243',
        currencyCode: 'CDF',
        currencySymbol: 'FC',
        isDeleted: false
    },
    {
        code: 'CR',
        nameEn: 'Costa Rica',
        nameAr: 'كوستاريكا',
        phoneCode: '+506',
        currencyCode: 'CRC',
        currencySymbol: '₡',
        isDeleted: false
    },
    {
        code: 'CI',
        nameEn: 'Côte d\'Ivoire',
        nameAr: 'ساحل العاج',
        phoneCode: '+225',
        currencyCode: 'XOF',
        currencySymbol: 'CFA',
        isDeleted: false
    },
    {
        code: 'HR',
        nameEn: 'Croatia',
        nameAr: 'كرواتيا',
        phoneCode: '+385',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'CU',
        nameEn: 'Cuba',
        nameAr: 'كوبا',
        phoneCode: '+53',
        currencyCode: 'CUP',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'CY',
        nameEn: 'Cyprus',
        nameAr: 'قبرص',
        phoneCode: '+357',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'CZ',
        nameEn: 'Czech Republic',
        nameAr: 'جمهورية التشيك',
        phoneCode: '+420',
        currencyCode: 'CZK',
        currencySymbol: 'Kč',
        isDeleted: false
    },
    {
        code: 'DK',
        nameEn: 'Denmark',
        nameAr: 'الدنمارك',
        phoneCode: '+45',
        currencyCode: 'DKK',
        currencySymbol: 'kr',
        isDeleted: false
    },
    {
        code: 'DJ',
        nameEn: 'Djibouti',
        nameAr: 'جيبوتي',
        phoneCode: '+253',
        currencyCode: 'DJF',
        currencySymbol: 'Fdj',
        isDeleted: false
    },
    {
        code: 'DM',
        nameEn: 'Dominica',
        nameAr: 'دومينيكا',
        phoneCode: '+1',
        currencyCode: 'XCD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'DO',
        nameEn: 'Dominican Republic',
        nameAr: 'جمهورية الدومينيكان',
        phoneCode: '+1',
        currencyCode: 'DOP',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'EC',
        nameEn: 'Ecuador',
        nameAr: 'الإكوادور',
        phoneCode: '+593',
        currencyCode: 'USD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'EG',
        nameEn: 'Egypt',
        nameAr: 'مصر',
        phoneCode: '+20',
        currencyCode: 'EGP',
        currencySymbol: 'ج.م',
        isDeleted: false
    },
    {
        code: 'SV',
        nameEn: 'El Salvador',
        nameAr: 'السلفادور',
        phoneCode: '+503',
        currencyCode: 'USD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'GQ',
        nameEn: 'Equatorial Guinea',
        nameAr: 'غينيا الاستوائية',
        phoneCode: '+240',
        currencyCode: 'XAF',
        currencySymbol: 'FCFA',
        isDeleted: false
    },
    {
        code: 'ER',
        nameEn: 'Eritrea',
        nameAr: 'إريتريا',
        phoneCode: '+291',
        currencyCode: 'ERN',
        currencySymbol: 'Nfk',
        isDeleted: false
    },
    {
        code: 'EE',
        nameEn: 'Estonia',
        nameAr: 'إستونيا',
        phoneCode: '+372',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'ET',
        nameEn: 'Ethiopia',
        nameAr: 'إثيوبيا',
        phoneCode: '+251',
        currencyCode: 'ETB',
        currencySymbol: 'Br',
        isDeleted: false
    },
    {
        code: 'FJ',
        nameEn: 'Fiji',
        nameAr: 'فيجي',
        phoneCode: '+679',
        currencyCode: 'FJD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'FI',
        nameEn: 'Finland',
        nameAr: 'فنلندا',
        phoneCode: '+358',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'FR',
        nameEn: 'France',
        nameAr: 'فرنسا',
        phoneCode: '+33',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'GA',
        nameEn: 'Gabon',
        nameAr: 'الغابون',
        phoneCode: '+241',
        currencyCode: 'XAF',
        currencySymbol: 'FCFA',
        isDeleted: false
    },
    {
        code: 'GM',
        nameEn: 'Gambia',
        nameAr: 'غامبيا',
        phoneCode: '+220',
        currencyCode: 'GMD',
        currencySymbol: 'D',
        isDeleted: false
    },
    {
        code: 'GE',
        nameEn: 'Georgia',
        nameAr: 'جورجيا',
        phoneCode: '+995',
        currencyCode: 'GEL',
        currencySymbol: '₾',
        isDeleted: false
    },
    {
        code: 'DE',
        nameEn: 'Germany',
        nameAr: 'ألمانيا',
        phoneCode: '+49',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'GH',
        nameEn: 'Ghana',
        nameAr: 'غانا',
        phoneCode: '+233',
        currencyCode: 'GHS',
        currencySymbol: '₵',
        isDeleted: false
    },
    {
        code: 'GR',
        nameEn: 'Greece',
        nameAr: 'اليونان',
        phoneCode: '+30',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'GD',
        nameEn: 'Grenada',
        nameAr: 'غرينادا',
        phoneCode: '+1',
        currencyCode: 'XCD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'GT',
        nameEn: 'Guatemala',
        nameAr: 'غواتيمالا',
        phoneCode: '+502',
        currencyCode: 'GTQ',
        currencySymbol: 'Q',
        isDeleted: false
    },
    {
        code: 'GN',
        nameEn: 'Guinea',
        nameAr: 'غينيا',
        phoneCode: '+224',
        currencyCode: 'GNF',
        currencySymbol: 'FG',
        isDeleted: false
    },
    {
        code: 'GW',
        nameEn: 'Guinea-Bissau',
        nameAr: 'غينيا بيساو',
        phoneCode: '+245',
        currencyCode: 'XOF',
        currencySymbol: 'CFA',
        isDeleted: false
    },
    {
        code: 'GY',
        nameEn: 'Guyana',
        nameAr: 'غيانا',
        phoneCode: '+592',
        currencyCode: 'GYD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'HT',
        nameEn: 'Haiti',
        nameAr: 'هايتي',
        phoneCode: '+509',
        currencyCode: 'HTG',
        currencySymbol: 'G',
        isDeleted: false
    },
    {
        code: 'HN',
        nameEn: 'Honduras',
        nameAr: 'هندوراس',
        phoneCode: '+504',
        currencyCode: 'HNL',
        currencySymbol: 'L',
        isDeleted: false
    },
    {
        code: 'HU',
        nameEn: 'Hungary',
        nameAr: 'المجر',
        phoneCode: '+36',
        currencyCode: 'HUF',
        currencySymbol: 'Ft',
        isDeleted: false
    },
    {
        code: 'IS',
        nameEn: 'Iceland',
        nameAr: 'آيسلندا',
        phoneCode: '+354',
        currencyCode: 'ISK',
        currencySymbol: 'kr',
        isDeleted: false
    },
    {
        code: 'IN',
        nameEn: 'India',
        nameAr: 'الهند',
        phoneCode: '+91',
        currencyCode: 'INR',
        currencySymbol: '₹',
        isDeleted: false
    },
    {
        code: 'ID',
        nameEn: 'Indonesia',
        nameAr: 'إندونيسيا',
        phoneCode: '+62',
        currencyCode: 'IDR',
        currencySymbol: 'Rp',
        isDeleted: false
    },
    {
        code: 'IR',
        nameEn: 'Iran',
        nameAr: 'إيران',
        phoneCode: '+98',
        currencyCode: 'IRR',
        currencySymbol: '﷼',
        isDeleted: false
    },
    {
        code: 'IQ',
        nameEn: 'Iraq',
        nameAr: 'العراق',
        phoneCode: '+964',
        currencyCode: 'IQD',
        currencySymbol: 'ع.د',
        isDeleted: false
    },
    {
        code: 'IE',
        nameEn: 'Ireland',
        nameAr: 'أيرلندا',
        phoneCode: '+353',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'IL',
        nameEn: 'Israel',
        nameAr: 'إسرائيل',
        phoneCode: '+972',
        currencyCode: 'ILS',
        currencySymbol: '₪',
        isDeleted: false
    },
    {
        code: 'IT',
        nameEn: 'Italy',
        nameAr: 'إيطاليا',
        phoneCode: '+39',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'JM',
        nameEn: 'Jamaica',
        nameAr: 'جامايكا',
        phoneCode: '+1',
        currencyCode: 'JMD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'JP',
        nameEn: 'Japan',
        nameAr: 'اليابان',
        phoneCode: '+81',
        currencyCode: 'JPY',
        currencySymbol: '¥',
        isDeleted: false
    },
    {
        code: 'JO',
        nameEn: 'Jordan',
        nameAr: 'الأردن',
        phoneCode: '+962',
        currencyCode: 'JOD',
        currencySymbol: 'د.ا',
        isDeleted: false
    },
    {
        code: 'KZ',
        nameEn: 'Kazakhstan',
        nameAr: 'كازاخستان',
        phoneCode: '+7',
        currencyCode: 'KZT',
        currencySymbol: '₸',
        isDeleted: false
    },
    {
        code: 'KE',
        nameEn: 'Kenya',
        nameAr: 'كينيا',
        phoneCode: '+254',
        currencyCode: 'KES',
        currencySymbol: 'KSh',
        isDeleted: false
    },
    {
        code: 'KI',
        nameEn: 'Kiribati',
        nameAr: 'كيريباتي',
        phoneCode: '+686',
        currencyCode: 'AUD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'KP',
        nameEn: 'Korea, North',
        nameAr: 'كوريا الشمالية',
        phoneCode: '+850',
        currencyCode: 'KPW',
        currencySymbol: '₩',
        isDeleted: false
    },
    {
        code: 'KR',
        nameEn: 'Korea, South',
        nameAr: 'كوريا الجنوبية',
        phoneCode: '+82',
        currencyCode: 'KRW',
        currencySymbol: '₩',
        isDeleted: false
    },
    {
        code: 'KW',
        nameEn: 'Kuwait',
        nameAr: 'الكويت',
        phoneCode: '+965',
        currencyCode: 'KWD',
        currencySymbol: 'د.ك',
        isDeleted: false
    },
    {
        code: 'KG',
        nameEn: 'Kyrgyzstan',
        nameAr: 'قيرغيزستان',
        phoneCode: '+996',
        currencyCode: 'KGS',
        currencySymbol: 'с',
        isDeleted: false
    },
    {
        code: 'LA',
        nameEn: 'Laos',
        nameAr: 'لاوس',
        phoneCode: '+856',
        currencyCode: 'LAK',
        currencySymbol: '₭',
        isDeleted: false
    },
    {
        code: 'LV',
        nameEn: 'Latvia',
        nameAr: 'لاتفيا',
        phoneCode: '+371',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'LB',
        nameEn: 'Lebanon',
        nameAr: 'لبنان',
        phoneCode: '+961',
        currencyCode: 'LBP',
        currencySymbol: 'ل.ل',
        isDeleted: false
    },
    {
        code: 'LS',
        nameEn: 'Lesotho',
        nameAr: 'ليسوتو',
        phoneCode: '+266',
        currencyCode: 'LSL',
        currencySymbol: 'L',
        isDeleted: false
    },
    {
        code: 'LR',
        nameEn: 'Liberia',
        nameAr: 'ليبيريا',
        phoneCode: '+231',
        currencyCode: 'LRD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'LY',
        nameEn: 'Libya',
        nameAr: 'ليبيا',
        phoneCode: '+218',
        currencyCode: 'LYD',
        currencySymbol: 'ل.د',
        isDeleted: false
    },
    {
        code: 'LI',
        nameEn: 'Liechtenstein',
        nameAr: 'ليختنشتاين',
        phoneCode: '+423',
        currencyCode: 'CHF',
        currencySymbol: 'Fr',
        isDeleted: false
    },
    {
        code: 'LT',
        nameEn: 'Lithuania',
        nameAr: 'ليتوانيا',
        phoneCode: '+370',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'LU',
        nameEn: 'Luxembourg',
        nameAr: 'لوكسمبورغ',
        phoneCode: '+352',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'MK',
        nameEn: 'North Macedonia',
        nameAr: 'مقدونيا الشمالية',
        phoneCode: '+389',
        currencyCode: 'MKD',
        currencySymbol: 'ден',
        isDeleted: false
    },
    {
        code: 'MG',
        nameEn: 'Madagascar',
        nameAr: 'مدغشقر',
        phoneCode: '+261',
        currencyCode: 'MGA',
        currencySymbol: 'Ar',
        isDeleted: false
    },
    {
        code: 'MW',
        nameEn: 'Malawi',
        nameAr: 'ملاوي',
        phoneCode: '+265',
        currencyCode: 'MWK',
        currencySymbol: 'MK',
        isDeleted: false
    },
    {
        code: 'MY',
        nameEn: 'Malaysia',
        nameAr: 'ماليزيا',
        phoneCode: '+60',
        currencyCode: 'MYR',
        currencySymbol: 'RM',
        isDeleted: false
    },
    {
        code: 'MV',
        nameEn: 'Maldives',
        nameAr: 'المالديف',
        phoneCode: '+960',
        currencyCode: 'MVR',
        currencySymbol: 'Rf',
        isDeleted: false
    },
    {
        code: 'ML',
        nameEn: 'Mali',
        nameAr: 'مالي',
        phoneCode: '+223',
        currencyCode: 'XOF',
        currencySymbol: 'CFA',
        isDeleted: false
    },
    {
        code: 'MT',
        nameEn: 'Malta',
        nameAr: 'مالطا',
        phoneCode: '+356',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'MH',
        nameEn: 'Marshall Islands',
        nameAr: 'جزر مارشال',
        phoneCode: '+692',
        currencyCode: 'USD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'MR',
        nameEn: 'Mauritania',
        nameAr: 'موريتانيا',
        phoneCode: '+222',
        currencyCode: 'MRU',
        currencySymbol: 'UM',
        isDeleted: false
    },
    {
        code: 'MU',
        nameEn: 'Mauritius',
        nameAr: 'موريشيوس',
        phoneCode: '+230',
        currencyCode: 'MUR',
        currencySymbol: '₨',
        isDeleted: false
    },
    {
        code: 'MX',
        nameEn: 'Mexico',
        nameAr: 'المكسيك',
        phoneCode: '+52',
        currencyCode: 'MXN',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'FM',
        nameEn: 'Micronesia',
        nameAr: 'ميكرونيزيا',
        phoneCode: '+691',
        currencyCode: 'USD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'MD',
        nameEn: 'Moldova',
        nameAr: 'مولدوفا',
        phoneCode: '+373',
        currencyCode: 'MDL',
        currencySymbol: 'L',
        isDeleted: false
    },
    {
        code: 'MC',
        nameEn: 'Monaco',
        nameAr: 'موناكو',
        phoneCode: '+377',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'MN',
        nameEn: 'Mongolia',
        nameAr: 'منغوليا',
        phoneCode: '+976',
        currencyCode: 'MNT',
        currencySymbol: '₮',
        isDeleted: false
    },
    {
        code: 'ME',
        nameEn: 'Montenegro',
        nameAr: 'الجبل الأسود',
        phoneCode: '+382',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'MA',
        nameEn: 'Morocco',
        nameAr: 'المغرب',
        phoneCode: '+212',
        currencyCode: 'MAD',
        currencySymbol: 'د.م.',
        isDeleted: false
    },
    {
        code: 'MZ',
        nameEn: 'Mozambique',
        nameAr: 'موزمبيق',
        phoneCode: '+258',
        currencyCode: 'MZN',
        currencySymbol: 'MT',
        isDeleted: false
    },
    {
        code: 'MM',
        nameEn: 'Myanmar',
        nameAr: 'ميانمار',
        phoneCode: '+95',
        currencyCode: 'MMK',
        currencySymbol: 'Ks',
        isDeleted: false
    },
    {
        code: 'NA',
        nameEn: 'Namibia',
        nameAr: 'ناميبيا',
        phoneCode: '+264',
        currencyCode: 'NAD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'NR',
        nameEn: 'Nauru',
        nameAr: 'ناورو',
        phoneCode: '+674',
        currencyCode: 'AUD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'NP',
        nameEn: 'Nepal',
        nameAr: 'نيبال',
        phoneCode: '+977',
        currencyCode: 'NPR',
        currencySymbol: '₨',
        isDeleted: false
    },
    {
        code: 'NL',
        nameEn: 'Netherlands',
        nameAr: 'هولندا',
        phoneCode: '+31',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'NZ',
        nameEn: 'New Zealand',
        nameAr: 'نيوزيلندا',
        phoneCode: '+64',
        currencyCode: 'NZD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'NI',
        nameEn: 'Nicaragua',
        nameAr: 'نيكاراغوا',
        phoneCode: '+505',
        currencyCode: 'NIO',
        currencySymbol: 'C$',
        isDeleted: false
    },
    {
        code: 'NE',
        nameEn: 'Niger',
        nameAr: 'النيجر',
        phoneCode: '+227',
        currencyCode: 'XOF',
        currencySymbol: 'CFA',
        isDeleted: false
    },
    {
        code: 'NG',
        nameEn: 'Nigeria',
        nameAr: 'نيجيريا',
        phoneCode: '+234',
        currencyCode: 'NGN',
        currencySymbol: '₦',
        isDeleted: false
    },
    {
        code: 'NO',
        nameEn: 'Norway',
        nameAr: 'النرويج',
        phoneCode: '+47',
        currencyCode: 'NOK',
        currencySymbol: 'kr',
        isDeleted: false
    },
    {
        code: 'OM',
        nameEn: 'Oman',
        nameAr: 'عمان',
        phoneCode: '+968',
        currencyCode: 'OMR',
        currencySymbol: 'ر.ع.',
        isDeleted: false
    },
    {
        code: 'PK',
        nameEn: 'Pakistan',
        nameAr: 'باكستان',
        phoneCode: '+92',
        currencyCode: 'PKR',
        currencySymbol: '₨',
        isDeleted: false
    },
    {
        code: 'PW',
        nameEn: 'Palau',
        nameAr: 'بالاو',
        phoneCode: '+680',
        currencyCode: 'USD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'PS',
        nameEn: 'Palestine',
        nameAr: 'فلسطين',
        phoneCode: '+970',
        currencyCode: 'ILS',
        currencySymbol: '₪',
        isDeleted: false
    },
    {
        code: 'PA',
        nameEn: 'Panama',
        nameAr: 'بنما',
        phoneCode: '+507',
        currencyCode: 'PAB',
        currencySymbol: 'B/.',
        isDeleted: false
    },
    {
        code: 'PG',
        nameEn: 'Papua New Guinea',
        nameAr: 'بابوا غينيا الجديدة',
        phoneCode: '+675',
        currencyCode: 'PGK',
        currencySymbol: 'K',
        isDeleted: false
    },
    {
        code: 'PY',
        nameEn: 'Paraguay',
        nameAr: 'باراغواي',
        phoneCode: '+595',
        currencyCode: 'PYG',
        currencySymbol: '₲',
        isDeleted: false
    },
    {
        code: 'PE',
        nameEn: 'Peru',
        nameAr: 'بيرو',
        phoneCode: '+51',
        currencyCode: 'PEN',
        currencySymbol: 'S/.',
        isDeleted: false
    },
    {
        code: 'PH',
        nameEn: 'Philippines',
        nameAr: 'الفلبين',
        phoneCode: '+63',
        currencyCode: 'PHP',
        currencySymbol: '₱',
        isDeleted: false
    },
    {
        code: 'PL',
        nameEn: 'Poland',
        nameAr: 'بولندا',
        phoneCode: '+48',
        currencyCode: 'PLN',
        currencySymbol: 'zł',
        isDeleted: false
    },
    {
        code: 'PT',
        nameEn: 'Portugal',
        nameAr: 'البرتغال',
        phoneCode: '+351',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'QA',
        nameEn: 'Qatar',
        nameAr: 'قطر',
        phoneCode: '+974',
        currencyCode: 'QAR',
        currencySymbol: 'ر.ق',
        isDeleted: false
    },
    {
        code: 'RO',
        nameEn: 'Romania',
        nameAr: 'رومانيا',
        phoneCode: '+40',
        currencyCode: 'RON',
        currencySymbol: 'lei',
        isDeleted: false
    },
    {
        code: 'RU',
        nameEn: 'Russia',
        nameAr: 'روسيا',
        phoneCode: '+7',
        currencyCode: 'RUB',
        currencySymbol: '₽',
        isDeleted: false
    },
    {
        code: 'RW',
        nameEn: 'Rwanda',
        nameAr: 'رواندا',
        phoneCode: '+250',
        currencyCode: 'RWF',
        currencySymbol: 'FRw',
        isDeleted: false
    },
    {
        code: 'KN',
        nameEn: 'Saint Kitts and Nevis',
        nameAr: 'سانت كيتس ونيفيس',
        phoneCode: '+1',
        currencyCode: 'XCD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'LC',
        nameEn: 'Saint Lucia',
        nameAr: 'سانت لوسيا',
        phoneCode: '+1',
        currencyCode: 'XCD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'VC',
        nameEn: 'Saint Vincent and the Grenadines',
        nameAr: 'سانت فنسنت والغرينادين',
        phoneCode: '+1',
        currencyCode: 'XCD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'WS',
        nameEn: 'Samoa',
        nameAr: 'ساموا',
        phoneCode: '+685',
        currencyCode: 'WST',
        currencySymbol: 'T',
        isDeleted: false
    },
    {
        code: 'SM',
        nameEn: 'San Marino',
        nameAr: 'سان مارينو',
        phoneCode: '+378',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'ST',
        nameEn: 'São Tomé and Príncipe',
        nameAr: 'ساو تومي وبرينسيبي',
        phoneCode: '+239',
        currencyCode: 'STN',
        currencySymbol: 'Db',
        isDeleted: false
    },
    {
        code: 'SA',
        nameEn: 'Saudi Arabia',
        nameAr: 'المملكة العربية السعودية',
        phoneCode: '+966',
        currencyCode: 'SAR',
        currencySymbol: 'ر.س',
        isDeleted: false
    },
    {
        code: 'SN',
        nameEn: 'Senegal',
        nameAr: 'السنغال',
        phoneCode: '+221',
        currencyCode: 'XOF',
        currencySymbol: 'CFA',
        isDeleted: false
    },
    {
        code: 'RS',
        nameEn: 'Serbia',
        nameAr: 'صربيا',
        phoneCode: '+381',
        currencyCode: 'RSD',
        currencySymbol: 'дин.',
        isDeleted: false
    },
    {
        code: 'SC',
        nameEn: 'Seychelles',
        nameAr: 'سيشل',
        phoneCode: '+248',
        currencyCode: 'SCR',
        currencySymbol: '₨',
        isDeleted: false
    },
    {
        code: 'SL',
        nameEn: 'Sierra Leone',
        nameAr: 'سيراليون',
        phoneCode: '+232',
        currencyCode: 'SLL',
        currencySymbol: 'Le',
        isDeleted: false
    },
    {
        code: 'SG',
        nameEn: 'Singapore',
        nameAr: 'سنغافورة',
        phoneCode: '+65',
        currencyCode: 'SGD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'SK',
        nameEn: 'Slovakia',
        nameAr: 'سلوفاكيا',
        phoneCode: '+421',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'SI',
        nameEn: 'Slovenia',
        nameAr: 'سلوفينيا',
        phoneCode: '+386',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'SB',
        nameEn: 'Solomon Islands',
        nameAr: 'جزر سليمان',
        phoneCode: '+677',
        currencyCode: 'SBD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'SO',
        nameEn: 'Somalia',
        nameAr: 'الصومال',
        phoneCode: '+252',
        currencyCode: 'SOS',
        currencySymbol: 'Sh',
        isDeleted: false
    },
    {
        code: 'ZA',
        nameEn: 'South Africa',
        nameAr: 'جنوب أفريقيا',
        phoneCode: '+27',
        currencyCode: 'ZAR',
        currencySymbol: 'R',
        isDeleted: false
    },
    {
        code: 'SS',
        nameEn: 'South Sudan',
        nameAr: 'جنوب السودان',
        phoneCode: '+211',
        currencyCode: 'SSP',
        currencySymbol: '£',
        isDeleted: false
    },
    {
        code: 'ES',
        nameEn: 'Spain',
        nameAr: 'إسبانيا',
        phoneCode: '+34',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'LK',
        nameEn: 'Sri Lanka',
        nameAr: 'سريلانكا',
        phoneCode: '+94',
        currencyCode: 'LKR',
        currencySymbol: '₨',
        isDeleted: false
    },
    {
        code: 'SD',
        nameEn: 'Sudan',
        nameAr: 'السودان',
        phoneCode: '+249',
        currencyCode: 'SDG',
        currencySymbol: 'ج.س.',
        isDeleted: false
    },
    {
        code: 'SR',
        nameEn: 'Suriname',
        nameAr: 'سورينام',
        phoneCode: '+597',
        currencyCode: 'SRD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'SE',
        nameEn: 'Sweden',
        nameAr: 'السويد',
        phoneCode: '+46',
        currencyCode: 'SEK',
        currencySymbol: 'kr',
        isDeleted: false
    },
    {
        code: 'CH',
        nameEn: 'Switzerland',
        nameAr: 'سويسرا',
        phoneCode: '+41',
        currencyCode: 'CHF',
        currencySymbol: 'Fr',
        isDeleted: false
    },
    {
        code: 'SY',
        nameEn: 'Syria',
        nameAr: 'سوريا',
        phoneCode: '+963',
        currencyCode: 'SYP',
        currencySymbol: '£',
        isDeleted: false
    },
    {
        code: 'TW',
        nameEn: 'Taiwan',
        nameAr: 'تايوان',
        phoneCode: '+886',
        currencyCode: 'TWD',
        currencySymbol: 'NT$',
        isDeleted: false
    },
    {
        code: 'TJ',
        nameEn: 'Tajikistan',
        nameAr: 'طاجيكستان',
        phoneCode: '+992',
        currencyCode: 'TJS',
        currencySymbol: 'ЅМ',
        isDeleted: false
    },
    {
        code: 'TZ',
        nameEn: 'Tanzania',
        nameAr: 'تنزانيا',
        phoneCode: '+255',
        currencyCode: 'TZS',
        currencySymbol: 'TSh',
        isDeleted: false
    },
    {
        code: 'TH',
        nameEn: 'Thailand',
        nameAr: 'تايلاند',
        phoneCode: '+66',
        currencyCode: 'THB',
        currencySymbol: '฿',
        isDeleted: false
    },
    {
        code: 'TL',
        nameEn: 'Timor-Leste',
        nameAr: 'تيمور الشرقية',
        phoneCode: '+670',
        currencyCode: 'USD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'TG',
        nameEn: 'Togo',
        nameAr: 'توغو',
        phoneCode: '+228',
        currencyCode: 'XOF',
        currencySymbol: 'CFA',
        isDeleted: false
    },
    {
        code: 'TO',
        nameEn: 'Tonga',
        nameAr: 'تونغا',
        phoneCode: '+676',
        currencyCode: 'TOP',
        currencySymbol: 'T$',
        isDeleted: false
    },
    {
        code: 'TT',
        nameEn: 'Trinidad and Tobago',
        nameAr: 'ترينيداد وتوباغو',
        phoneCode: '+1',
        currencyCode: 'TTD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'TN',
        nameEn: 'Tunisia',
        nameAr: 'تونس',
        phoneCode: '+216',
        currencyCode: 'TND',
        currencySymbol: 'د.ت',
        isDeleted: false
    },
    {
        code: 'TR',
        nameEn: 'Turkey',
        nameAr: 'تركيا',
        phoneCode: '+90',
        currencyCode: 'TRY',
        currencySymbol: '₺',
        isDeleted: false
    },
    {
        code: 'TM',
        nameEn: 'Turkmenistan',
        nameAr: 'تركمانستان',
        phoneCode: '+993',
        currencyCode: 'TMT',
        currencySymbol: 'm',
        isDeleted: false
    },
    {
        code: 'TV',
        nameEn: 'Tuvalu',
        nameAr: 'توفالو',
        phoneCode: '+688',
        currencyCode: 'AUD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'UG',
        nameEn: 'Uganda',
        nameAr: 'أوغندا',
        phoneCode: '+256',
        currencyCode: 'UGX',
        currencySymbol: 'USh',
        isDeleted: false
    },
    {
        code: 'UA',
        nameEn: 'Ukraine',
        nameAr: 'أوكرانيا',
        phoneCode: '+380',
        currencyCode: 'UAH',
        currencySymbol: '₴',
        isDeleted: false
    },
    {
        code: 'AE',
        nameEn: 'United Arab Emirates',
        nameAr: 'الإمارات العربية المتحدة',
        phoneCode: '+971',
        currencyCode: 'AED',
        currencySymbol: 'د.إ',
        isDeleted: false
    },
    {
        code: 'GB',
        nameEn: 'United Kingdom',
        nameAr: 'المملكة المتحدة',
        phoneCode: '+44',
        currencyCode: 'GBP',
        currencySymbol: '£',
        isDeleted: false
    },
    {
        code: 'US',
        nameEn: 'United States',
        nameAr: 'الولايات المتحدة الأمريكية',
        phoneCode: '+1',
        currencyCode: 'USD',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'UY',
        nameEn: 'Uruguay',
        nameAr: 'أوروغواي',
        phoneCode: '+598',
        currencyCode: 'UYU',
        currencySymbol: '$',
        isDeleted: false
    },
    {
        code: 'UZ',
        nameEn: 'Uzbekistan',
        nameAr: 'أوزبكستان',
        phoneCode: '+998',
        currencyCode: 'UZS',
        currencySymbol: 'so\'m',
        isDeleted: false
    },
    {
        code: 'VU',
        nameEn: 'Vanuatu',
        nameAr: 'فانواتو',
        phoneCode: '+678',
        currencyCode: 'VUV',
        currencySymbol: 'VT',
        isDeleted: false
    },
    {
        code: 'VA',
        nameEn: 'Vatican City',
        nameAr: 'الفاتيكان',
        phoneCode: '+379',
        currencyCode: 'EUR',
        currencySymbol: '€',
        isDeleted: false
    },
    {
        code: 'VE',
        nameEn: 'Venezuela',
        nameAr: 'فنزويلا',
        phoneCode: '+58',
        currencyCode: 'VES',
        currencySymbol: 'Bs.',
        isDeleted: false
    },
    {
        code: 'VN',
        nameEn: 'Vietnam',
        nameAr: 'فيتنام',
        phoneCode: '+84',
        currencyCode: 'VND',
        currencySymbol: '₫',
        isDeleted: false
    },
    {
        code: 'YE',
        nameEn: 'Yemen',
        nameAr: 'اليمن',
        phoneCode: '+967',
        currencyCode: 'YER',
        currencySymbol: '﷼',
        isDeleted: false
    },
    {
        code: 'ZM',
        nameEn: 'Zambia',
        nameAr: 'زامبيا',
        phoneCode: '+260',
        currencyCode: 'ZMW',
        currencySymbol: 'ZK',
        isDeleted: false
    },
    {
        code: 'ZW',
        nameEn: 'Zimbabwe',
        nameAr: 'زيمبابوي',
        phoneCode: '+263',
        currencyCode: 'ZWL',
        currencySymbol: '$',
        isDeleted: false
    }
]; 