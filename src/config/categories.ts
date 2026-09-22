import type { CategoryConfig, CategoryKey, FieldSchema, SubcategoryConfig } from '@/types';

// ---------------------------------------------------------------------------
// UNIVERSAL FIELDS — present on every listing regardless of category.
// Rendered separately by <ListingForm/> around the category-specific block,
// so they are NOT included in the schemas below.
// ---------------------------------------------------------------------------
export const UNIVERSAL_FIELD_NAMES = ['title', 'price', 'city', 'address', 'description'] as const;

// ---------------------------------------------------------------------------
// DAŞINMAZ ƏMLAK (Real Estate)
// ---------------------------------------------------------------------------
const realEstateFields: FieldSchema[] = [
  { name: 'propertyType', label: 'Əmlak növü', type: 'select', required: true, colSpan: 1, options: [
    { label: 'Yeni tikili mənzil', value: 'new_apartment' }, { label: 'Köhnə tikili mənzil', value: 'old_apartment' },
    { label: 'Həyət evi / villa', value: 'house' }, { label: 'Ofis', value: 'office' },
    { label: 'Torpaq sahəsi', value: 'land' },
  ]},
  { name: 'rooms', label: 'Otaq sayı', type: 'select', colSpan: 1,
    showIf: { field: 'propertyType', in: ['new_apartment', 'old_apartment', 'house'] },
    options: [1, 2, 3, 4, 5, 6].map((n) => ({ label: `${n}`, value: String(n) })) },
  { name: 'area', label: 'Sahə (m²)', type: 'number', required: true, colSpan: 1, min: 1 },
  { name: 'floor', label: 'Mərtəbə', type: 'number', colSpan: 1,
    showIf: { field: 'propertyType', in: ['new_apartment', 'old_apartment', 'office'] } },
  { name: 'totalFloors', label: 'Ümumi mərtəbə sayı', type: 'number', colSpan: 1,
    showIf: { field: 'propertyType', in: ['new_apartment', 'old_apartment', 'office'] } },
  { name: 'renovation', label: 'Təmir vəziyyəti', type: 'select', colSpan: 1, options: [
    { label: 'Əla təmirli', value: 'euro' }, { label: 'Orta təmirli', value: 'normal' },
    { label: 'Təmirsiz', value: 'none' },
  ]},
  { name: 'documents', label: 'Sənədlər', type: 'select', colSpan: 1, options: [
    { label: 'Çıxarış (Kupça)', value: 'extract' }, { label: 'Müqavilə', value: 'contract' },
    { label: 'Sənədsiz', value: 'none' },
  ]},
  { name: 'mortgage', label: 'İpoteka mümkündür', type: 'switch', colSpan: 1 },
];

// ---------------------------------------------------------------------------
// İŞ ELANLARI (Vacancies) — first-class category per spec §6
// ---------------------------------------------------------------------------
const vacancyFields: FieldSchema[] = [
  { name: 'positionTitle', label: 'Vəzifə adı', type: 'text', required: true, colSpan: 2, placeholder: 'Məs: Baş mühasib' },
  { name: 'companyName', label: 'Şirkət adı', type: 'text', required: true, colSpan: 1 },
  { name: 'employmentType', label: 'Məşğulluq növü', type: 'select', required: true, colSpan: 1, options: [
    { label: 'Tam ştat', value: 'full_time' }, { label: 'Yarım ştat', value: 'part_time' },
    { label: 'Növbəli', value: 'shift' }, { label: 'Frilans', value: 'freelance' },
    { label: 'Müvəqqəti', value: 'temporary' }, { label: 'Təcrübə (internship)', value: 'internship' },
  ]},
  { name: 'workSchedule', label: 'İş qrafiki', type: 'select', colSpan: 1,
    showIf: { field: 'employmentType', in: ['full_time', 'part_time', 'shift'] },
    options: [
      { label: '5 günlük', value: '5_day' }, { label: '6 günlük', value: '6_day' },
      { label: '7 günlük', value: '7_day' }, { label: 'Növbəli', value: 'shift' },
      { label: 'Sərbəst', value: 'flexible' },
    ]},
  { name: 'workLocation', label: 'İş yeri formatı', type: 'radio', colSpan: 1, options: [
    { label: 'Ofis', value: 'office' }, { label: 'Uzaqdan', value: 'remote' },
    { label: 'Hibrid', value: 'hybrid' }, { label: 'Sahədə', value: 'field' },
  ]},
  { name: 'salaryHidden', label: 'Maaşı gizlət', type: 'switch', colSpan: 1 },
  { name: 'salaryType', label: 'Maaş növü', type: 'select', colSpan: 1,
    showIf: { field: 'salaryHidden', equals: false },
    options: [
      { label: 'Aylıq', value: 'monthly' }, { label: 'Günlük', value: 'daily' },
      { label: 'Saatlıq', value: 'hourly' }, { label: 'Layihə əsaslı', value: 'project' },
      { label: 'Razılaşma yolu ilə', value: 'negotiable' },
    ]},
  { name: 'salaryMin', label: 'Min. maaş (AZN)', type: 'number', colSpan: 1,
    showIf: { field: 'salaryHidden', equals: false } },
  { name: 'salaryMax', label: 'Maks. maaş (AZN)', type: 'number', colSpan: 1,
    showIf: { field: 'salaryHidden', equals: false } },
  { name: 'district', label: 'Rayon', type: 'text', colSpan: 1 },
  { name: 'experienceLevel', label: 'Təcrübə tələbi', type: 'select', colSpan: 1, options: [
    { label: 'Təcrübə tələb olunmur', value: 'none' }, { label: '1 ilə qədər', value: 'under_1' },
    { label: '1-3 il', value: '1_3' }, { label: '3-5 il', value: '3_5' },
    { label: '5 ildən çox', value: 'over_5' },
  ]},
  { name: 'education', label: 'Təhsil tələbi', type: 'select', colSpan: 1, options: [
    { label: 'Tələb olunmur', value: 'none' }, { label: 'Orta təhsil', value: 'secondary' },
    { label: 'Bakalavr', value: 'bachelor' }, { label: 'Magistr', value: 'master' },
  ]},
  { name: 'languages', label: 'Dil bilikləri', type: 'multiselect', colSpan: 1, options: [
    { label: 'Azərbaycan (yaxşı)', value: 'az' }, { label: 'Rus (yaxşı)', value: 'ru' },
    { label: 'İngilis (yaxşı)', value: 'en' }, { label: 'Türk (yaxşı)', value: 'tr' },
  ]},
  { name: 'skills', label: 'Bacarıqlar', type: 'tags', colSpan: 1, placeholder: 'Enter ilə əlavə et' },
  { name: 'gender', label: 'Cins (istəyə bağlı)', type: 'select', colSpan: 1, options: [
    { label: 'Fərq etməz', value: 'any' }, { label: 'Kişi', value: 'male' }, { label: 'Qadın', value: 'female' },
  ]},
  { name: 'ageRange', label: 'Yaş aralığı (istəyə bağlı)', type: 'text', colSpan: 1, placeholder: 'Məs: 25-40' },
  { name: 'responsibilities', label: 'Vəzifə öhdəlikləri', type: 'textarea', colSpan: 2 },
  { name: 'requirements', label: 'Tələblər', type: 'textarea', colSpan: 2 },
  { name: 'benefits', label: 'Üstünlüklər', type: 'textarea', colSpan: 2 },
];

// ---------------------------------------------------------------------------
// XİDMƏTLƏR (Services)
// ---------------------------------------------------------------------------
const serviceFields: FieldSchema[] = [
  { name: 'serviceName', label: 'Xidmət adı', type: 'text', required: true, colSpan: 2 },
  { name: 'serviceType', label: 'Xidmət növü', type: 'select', colSpan: 1, options: [
    { label: 'Təmir və tikinti', value: 'repair' }, { label: 'Gözəllik və sağlamlıq', value: 'beauty' },
    { label: 'Təhsil', value: 'education' }, { label: 'Nəqliyyat', value: 'transport' },
    { label: 'IT və proqramlaşdırma', value: 'it' }, { label: 'Digər', value: 'other' },
  ]},
  { name: 'priceType', label: 'Qiymət növü', type: 'radio', colSpan: 1, options: [
    { label: 'Sabit', value: 'fixed' }, { label: 'Saatlıq', value: 'hourly' }, { label: 'Razılaşma', value: 'negotiable' },
  ]},
  { name: 'workingHours', label: 'İş saatları', type: 'text', colSpan: 1, placeholder: 'Məs: 09:00–18:00' },
  { name: 'experienceYears', label: 'Təcrübə (il)', type: 'number', colSpan: 1 },
];

// ---------------------------------------------------------------------------
// ELEKTRONİKA
// ---------------------------------------------------------------------------
const electronicsFields: FieldSchema[] = [
  { name: 'itemType', label: 'Məhsul növü', type: 'select', required: true, colSpan: 1, options: [
    { label: 'Telefon', value: 'phone' }, { label: 'Noutbuk', value: 'laptop' },
    { label: 'Televizor', value: 'tv' }, { label: 'Ev texnikası', value: 'appliance' },
    { label: 'Digər', value: 'other' },
  ]},
  { name: 'brand', label: 'Marka', type: 'text', colSpan: 1 },
  { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [
    { label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' },
  ]},
  { name: 'warranty', label: 'Zəmanət var', type: 'switch', colSpan: 1 },
];

// ---------------------------------------------------------------------------
// EV VƏ BAĞ (Home & Garden)
// ---------------------------------------------------------------------------
const homeGardenFields: FieldSchema[] = [
  { name: 'itemType', label: 'Kateqoriya', type: 'select', colSpan: 1, options: [
    { label: 'Mebel', value: 'furniture' }, { label: 'Bağ alətləri', value: 'garden_tools' },
    { label: 'İnteryer', value: 'interior' }, { label: 'Digər', value: 'other' },
  ]},
  { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [
    { label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' },
  ]},
  { name: 'material', label: 'Material', type: 'text', colSpan: 1 },
];

const marketplaceFields: FieldSchema[] = [
  { name: 'itemType', label: 'Məhsul və ya xidmət növü', type: 'text', colSpan: 1 },
  { name: 'brand', label: 'Marka', type: 'text', colSpan: 1 },
  { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [
    { label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' },
  ]},
];

const homeApplianceFields: FieldSchema[] = [
  { name: 'itemType', label: 'Texnika növü', type: 'radio', colSpan: 2, options: [
    { label: 'Soyuducular', value: 'refrigerator' }, { label: 'Paltaryuyanlar', value: 'washing_machine' },
    { label: 'Kondisionerlər', value: 'air_conditioner' }, { label: 'Tozsoranlar', value: 'vacuum_cleaner' },
    { label: 'Tikiş maşınları', value: 'sewing_machine' }, { label: 'Aspiratorlar', value: 'hood' },
    { label: 'Blenderlər, mikserlər, mətbəx kombaynları', value: 'kitchen_appliance' },
    { label: 'Blinçik və vafli aparatları', value: 'waffle_maker' },
    { label: 'Elektrik avadanlıqları və termostatlar', value: 'electrical_equipment' },
    { label: 'Su filtrləri və pompaları', value: 'water_filter' }, { label: 'Qəhvə maşınları', value: 'coffee_machine' },
    { label: 'Digər', value: 'other' },
  ]},
  { name: 'brand', label: 'Marka', type: 'text', colSpan: 1, placeholder: 'Marka axtarışı' },
  { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [{ label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' }] },
  { name: 'warranty', label: 'Zəmanət', type: 'radio', colSpan: 1, options: [{ label: 'Zəmanətli', value: 'yes' }, { label: 'Zəmanətsiz', value: 'no' }] },
];

const vehicleFields: FieldSchema[] = [
  { name: 'itemType', label: 'Nəqliyyat növü', type: 'select', colSpan: 1, options: [{ label: 'Minik avtomobili', value: 'car' }, { label: 'Motosiklet', value: 'motorcycle' }, { label: 'Yük avtomobili', value: 'truck' }, { label: 'Avtobus', value: 'bus' }, { label: 'Digər', value: 'other' }] },
  { name: 'brand', label: 'Marka', type: 'text', colSpan: 1 }, { name: 'model', label: 'Model', type: 'text', colSpan: 1 },
  { name: 'year', label: 'Buraxılış ili', type: 'number', colSpan: 1, min: 1900 },
  { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [{ label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' }] },
];

const sparePartFields: FieldSchema[] = [
  { name: 'itemType', label: 'Hissə və aksesuar növü', type: 'text', colSpan: 1, placeholder: 'Məs: mühərrik, təkər, yağ filteri' },
  { name: 'brand', label: 'Marka', type: 'text', colSpan: 1 }, { name: 'compatibleModel', label: 'Uyğun model', type: 'text', colSpan: 1 },
  { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [{ label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' }] },
];

const phoneFields: FieldSchema[] = [
  { name: 'itemType', label: 'Məhsul növü', type: 'select', colSpan: 1, options: [{ label: 'Smartfon', value: 'smartphone' }, { label: 'Planşet', value: 'tablet' }, { label: 'Telefon aksesuarları', value: 'accessory' }, { label: 'Smart saat', value: 'smartwatch' }] },
  { name: 'brand', label: 'Marka', type: 'text', colSpan: 1 }, { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [{ label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' }] },
  { name: 'memory', label: 'Yaddaş', type: 'text', colSpan: 1, placeholder: 'Məs: 128 GB' },
];

const personalItemFields: FieldSchema[] = [
  { name: 'itemType', label: 'Məhsul növü', type: 'select', colSpan: 1, options: [{ label: 'Geyim', value: 'clothing' }, { label: 'Ayaqqabı', value: 'shoes' }, { label: 'Çanta', value: 'bags' }, { label: 'Saat və aksesuar', value: 'accessories' }, { label: 'Digər', value: 'other' }] },
  { name: 'gender', label: 'Kim üçün', type: 'radio', colSpan: 1, options: [{ label: 'Qadın', value: 'female' }, { label: 'Kişi', value: 'male' }, { label: 'Uniseks', value: 'unisex' }] },
  { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [{ label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' }] },
];

const kidsFields: FieldSchema[] = [
  { name: 'itemType', label: 'Məhsul növü', type: 'select', colSpan: 1, options: [{ label: 'Geyim', value: 'clothing' }, { label: 'Oyuncaq', value: 'toys' }, { label: 'Uşaq arabası', value: 'stroller' }, { label: 'Məktəb ləvazimatı', value: 'school' }, { label: 'Digər', value: 'other' }] },
  { name: 'ageRange', label: 'Yaş qrupu', type: 'text', colSpan: 1, placeholder: 'Məs: 3-6 yaş' },
  { name: 'condition', label: 'Vəziyyəti', type: 'radio', colSpan: 1, options: [{ label: 'Yeni', value: 'new' }, { label: 'İşlənmiş', value: 'used' }] },
];

const animalFields: FieldSchema[] = [
  { name: 'itemType', label: 'Heyvan və ya məhsul növü', type: 'select', colSpan: 1, options: [{ label: 'İt', value: 'dog' }, { label: 'Pişik', value: 'cat' }, { label: 'Quş', value: 'bird' }, { label: 'Akvarium heyvanları', value: 'aquarium' }, { label: 'Yem və aksesuar', value: 'supplies' }, { label: 'Digər', value: 'other' }] },
  { name: 'breed', label: 'Cins', type: 'text', colSpan: 1 }, { name: 'age', label: 'Yaş', type: 'text', colSpan: 1 },
];

function makeSubcategories(items: Array<[string, string]>, fields: FieldSchema[]): SubcategoryConfig[] {
  return items.map(([key, label]) => ({ key, label, fields }));
}

const homeGardenSubcategories = makeSubcategories([
  ['mebel', 'Mebellər'], ['qab_qacaq', 'Qab-qacaq və mətbəx ləvazimatları'], ['dekor', 'Dekor və interyer'],
  ['bag_bostan', 'Bağ və bostan'], ['ev_tekstili', 'Ev tekstili'], ['xalcalar', 'Xalçalar və aksesuarlar'],
  ['isiqlandirma', 'Ev üçün işıqlandırma'], ['bitkiler', 'Bitkilər'],
], homeGardenFields);

const electronicsSubcategories = makeSubcategories([
  ['telefonlar', 'Telefonlar'], ['audio_video', 'Audio və video'], ['komponentler', 'Komponentlər və monitorlar'],
  ['noutbuklar', 'Noutbuklar və netbuklar'], ['komputer_aksesuarlar', 'Kompüter aksesuarları'],
  ['oyunlar', 'Oyunlar, pultlar və proqramlar'], ['televizorlar', 'Televizorlar və aksesuarlar'],
  ['sebekeler', 'Şəbəkə və server avadanlığı'], ['ofis_avadanligi', 'Ofis avadanlığı və istehlak materialları'],
  ['fototexnika', 'Fototexnika'], ['nomreler', 'Nömrələr və SIM-kartlar'], ['smart_saatlar', 'Smart saat və qolbaqlar'],
  ['masaustu_komputerler', 'Masaüstü kompüterlər'], ['plansetler', 'Planşet və elektron kitablar'],
], electronicsFields);

const transportSubcategories = makeSubcategories([
  ['minik_avtomobilleri', 'Minik avtomobilləri'], ['motosikletler', 'Motosikletlər'], ['yuk_avtomobilleri', 'Yük avtomobilləri'],
  ['avtobuslar', 'Avtobuslar'], ['xususi_texnika', 'Xüsusi texnika'], ['su_neqliyyati', 'Su nəqliyyatı'],
], vehicleFields);

const realEstateSubcategories = makeSubcategories([
  ['menziller', 'Mənzillər'], ['heyet_evleri', 'Həyət evləri və villalar'], ['torpaq', 'Torpaq sahələri'],
  ['ofisler', 'Ofislər'], ['obyektler', 'Obyektlər və mağazalar'], ['qarajlar', 'Qarajlar'],
], realEstateFields);

const serviceSubcategories = makeSubcategories([
  ['temir_tikinti', 'Təmir və tikinti'], ['gozellik_saglamliq', 'Gözəllik və sağlamlıq'], ['tehsil', 'Təhsil'],
  ['dasima', 'Daşıma və nəqliyyat'], ['it_proqramlasdirma', 'IT və proqramlaşdırma'], ['digər_xidmət', 'Digər xidmətlər'],
], serviceFields);

const jobSubcategories = makeSubcategories([
  ['it_proqramlasdirma', 'IT və proqramlaşdırma'], ['satis', 'Satış və müştəri xidmətləri'],
  ['ofis_idareetme', 'Ofis və idarəetmə'], ['maliyye', 'Maliyyə və mühasibatlıq'], ['xidmet', 'Xidmət və restoran'],
  ['tehsil_tibb', 'Təhsil və tibb'], ['digər_is', 'Digər vakansiyalar'],
], vacancyFields);

const sparePartSubcategories = makeSubcategories([
  ['muherrik_hisseleri', 'Mühərrik hissələri'], ['kuzov_hisseleri', 'Kuzov hissələri'], ['tekerler', 'Təkərlər və disklər'],
  ['elektrik', 'Elektrik avadanlığı'], ['yağ_filterleri', 'Yağ və hava filterləri'], ['aksesuarlar', 'Aksesuarlar'],
], sparePartFields);
const personalSubcategories = makeSubcategories([
  ['geyim', 'Geyim'], ['ayaqqabi', 'Ayaqqabı'], ['cantalar', 'Çantalar'], ['saatlar', 'Saatlar'], ['aksesuarlar', 'Aksesuarlar'],
], personalItemFields);
const hobbySubcategories = makeSubcategories([
  ['idman', 'İdman və fitnes'], ['musiqi', 'Musiqi alətləri'], ['kitablar', 'Kitablar və jurnallar'],
  ['ovculuq', 'Ovçuluq və balıqçılıq'], ['kolleksiya', 'Kolleksiya'], ['digər_hobbi', 'Digər hobbi məhsulları'],
], marketplaceFields);
const applianceSubcategories = makeSubcategories([
  ['soyuducular', 'Soyuducular'], ['paltaryuyanlar', 'Paltaryuyanlar'], ['kondisionerler', 'Kondisionerlər'],
  ['tozsoranlar', 'Tozsoranlar'], ['aspiratorlar', 'Aspiratorlar'], ['qehve_masinlari', 'Qəhvə maşınları'],
  ['su_filtrleri', 'Su filtrləri və pompaları'], ['metbex_texnikasi', 'Mətbəx texnikası'], ['diger_texnika', 'Digər məişət texnikası'],
], homeApplianceFields);
const phoneSubcategories = makeSubcategories([
  ['smartfonlar', 'Smartfonlar'], ['plansetler', 'Planşetlər'], ['telefon_aksesuarlar', 'Telefon aksesuarları'], ['smart_saatlar', 'Smart saatlar'],
], phoneFields);
const kidsSubcategories = makeSubcategories([
  ['usaq_geyimi', 'Uşaq geyimi'], ['oyuncaqlar', 'Oyuncaqlar'], ['arabalar', 'Uşaq arabaları'], ['mebel', 'Uşaq mebeli'], ['mekteb', 'Məktəb ləvazimatları'],
], kidsFields);
const animalSubcategories = makeSubcategories([
  ['itler', 'İtlər'], ['pisikler', 'Pişiklər'], ['quslar', 'Quşlar'], ['akvarium', 'Akvarium heyvanları'], ['yem_aksesuar', 'Yem və aksesuarlar'],
], animalFields);

export const CATEGORIES: CategoryConfig[] = [
  {
    key: 'ev_bağ', label: 'Ev və bağ üçün', icon: 'home', image: 'home-garden',
    subcategories: homeGardenSubcategories,
  },
  {
    key: 'elektronika', label: 'Elektronika', icon: 'laptop', image: 'electronics',
    subcategories: electronicsSubcategories,
  },
  {
    key: 'nəqliyyat', label: 'Nəqliyyat', icon: 'car', image: 'transport',
    subcategories: transportSubcategories,
  },
  {
    key: 'ehtiyat_hissələri', label: 'Ehtiyat hissələri və aksesuarlar', icon: 'tool', image: 'spare-parts',
    subcategories: sparePartSubcategories,
  },
  {
    key: 'daşınmaz_əmlak', label: 'Daşınmaz Əmlak', icon: 'home', image: 'real-estate',
    subcategories: realEstateSubcategories,
  },
  {
    key: 'iş_elanları', label: 'İş elanları', icon: 'briefcase', image: 'jobs',
    subcategories: jobSubcategories,
  },
  {
    key: 'xidmətlər', label: 'Xidmətlər', icon: 'tool', image: 'services-business',
    subcategories: serviceSubcategories,
  },
  {
    key: 'şəxsi_əşyalar', label: 'Şəxsi əşyalar', icon: 'gift', image: 'personal-items',
    subcategories: personalSubcategories,
  },
  {
    key: 'hobbi_asudə', label: 'Hobbi və asudə', icon: 'gift', image: 'hobby-leisure',
    subcategories: hobbySubcategories,
  },
  {
    key: 'məişət_texnikası', label: 'Məişət texnikası', icon: 'gift', image: 'home-appliances',
    subcategories: applianceSubcategories,
  },
  {
    key: 'telefonlar', label: 'Telefonlar', icon: 'laptop', image: 'phones',
    subcategories: phoneSubcategories,
  },
  {
    key: 'uşaq_aləmi', label: 'Uşaq aləmi', icon: 'gift', image: 'kids',
    subcategories: kidsSubcategories,
  },
  {
    key: 'heyvanlar', label: 'Heyvanlar', icon: 'gift', image: 'animals',
    subcategories: animalSubcategories,
  },
];

export function getCategory(key: CategoryKey | string | null | undefined) {
  return CATEGORIES.find((c) => c.key === key) ?? null;
}

export function getSubcategory(categoryKey: CategoryKey | string | null | undefined, subKey: string | null | undefined) {
  const cat = getCategory(categoryKey);
  return cat?.subcategories.find((s) => s.key === subKey) ?? null;
}

export type CategoryLanguage = 'az' | 'en' | 'ru';
type TranslationSet = { az: string; en: string; ru: string };

const categoryTranslations: Record<string, TranslationSet> = {
  'ev_bağ': { az: 'Ev və bağ üçün', en: 'Home and garden', ru: 'Для дома и сада' },
  elektronika: { az: 'Elektronika', en: 'Electronics', ru: 'Электроника' },
  nəqliyyat: { az: 'Nəqliyyat', en: 'Transport', ru: 'Транспорт' },
  ehtiyat_hissələri: { az: 'Ehtiyat hissələri və aksesuarlar', en: 'Spare parts and accessories', ru: 'Запчасти и аксессуары' },
  'daşınmaz_əmlak': { az: 'Daşınmaz əmlak', en: 'Real estate', ru: 'Недвижимость' },
  'iş_elanları': { az: 'İş elanları', en: 'Jobs', ru: 'Работа' },
  xidmətlər: { az: 'Xidmətlər', en: 'Services', ru: 'Услуги' },
  'şəxsi_əşyalar': { az: 'Şəxsi əşyalar', en: 'Personal items', ru: 'Личные вещи' },
  hobbi_asudə: { az: 'Hobbi və asudə', en: 'Hobbies and leisure', ru: 'Хобби и отдых' },
  məişət_texnikası: { az: 'Məişət texnikası', en: 'Home appliances', ru: 'Бытовая техника' },
  telefonlar: { az: 'Telefonlar', en: 'Phones', ru: 'Телефоны' },
  uşaq_aləmi: { az: 'Uşaq aləmi', en: 'Kids', ru: 'Детский мир' },
  heyvanlar: { az: 'Heyvanlar', en: 'Animals', ru: 'Животные' },
};

const subcategoryTranslations: Record<string, TranslationSet> = {
  mebel: { az: 'Mebellər', en: 'Furniture', ru: 'Мебель' }, qab_qacaq: { az: 'Qab-qacaq və mətbəx ləvazimatları', en: 'Tableware and kitchenware', ru: 'Посуда и кухонные принадлежности' }, dekor: { az: 'Dekor və interyer', en: 'Decor and interior', ru: 'Декор и интерьер' }, bag_bostan: { az: 'Bağ və bostan', en: 'Garden and outdoor', ru: 'Сад и огород' }, ev_tekstili: { az: 'Ev tekstili', en: 'Home textiles', ru: 'Домашний текстиль' }, xalcalar: { az: 'Xalçalar və aksesuarlar', en: 'Carpets and accessories', ru: 'Ковры и аксессуары' }, isiqlandirma: { az: 'Ev üçün işıqlandırma', en: 'Home lighting', ru: 'Освещение для дома' }, bitkiler: { az: 'Bitkilər', en: 'Plants', ru: 'Растения' },
  telefonlar: { az: 'Telefonlar', en: 'Phones', ru: 'Телефоны' }, audio_video: { az: 'Audio və video', en: 'Audio and video', ru: 'Аудио и видео' }, komponentler: { az: 'Komponentlər və monitorlar', en: 'Components and monitors', ru: 'Комплектующие и мониторы' }, noutbuklar: { az: 'Noutbuklar və netbuklar', en: 'Laptops and netbooks', ru: 'Ноутбуки и нетбуки' }, komputer_aksesuarlar: { az: 'Kompüter aksesuarları', en: 'Computer accessories', ru: 'Аксессуары для компьютеров' }, oyunlar: { az: 'Oyunlar, pultlar və proqramlar', en: 'Games, consoles and software', ru: 'Игры, приставки и программы' }, televizorlar: { az: 'Televizorlar və aksesuarlar', en: 'TVs and accessories', ru: 'Телевизоры и аксессуары' }, sebekeler: { az: 'Şəbəkə və server avadanlığı', en: 'Network and server equipment', ru: 'Сетевое и серверное оборудование' }, ofis_avadanligi: { az: 'Ofis avadanlığı və istehlak materialları', en: 'Office equipment and supplies', ru: 'Офисная техника и расходники' }, fototexnika: { az: 'Fototexnika', en: 'Photography equipment', ru: 'Фототехника' }, nomreler: { az: 'Nömrələr və SIM-kartlar', en: 'Numbers and SIM cards', ru: 'Номера и SIM-карты' }, smart_saatlar: { az: 'Smart saat və qolbaqlar', en: 'Smart watches and bands', ru: 'Смарт-часы и браслеты' }, masaustu_komputerler: { az: 'Masaüstü kompüterlər', en: 'Desktop computers', ru: 'Настольные компьютеры' }, plansetler: { az: 'Planşet və elektron kitablar', en: 'Tablets and e-readers', ru: 'Планшеты и электронные книги' },
  minik_avtomobilleri: { az: 'Minik avtomobilləri', en: 'Passenger cars', ru: 'Легковые автомобили' }, motosikletler: { az: 'Motosikletlər', en: 'Motorcycles', ru: 'Мотоциклы' }, yuk_avtomobilleri: { az: 'Yük avtomobilləri', en: 'Trucks', ru: 'Грузовые автомобили' }, avtobuslar: { az: 'Avtobuslar', en: 'Buses', ru: 'Автобусы' }, xususi_texnika: { az: 'Xüsusi texnika', en: 'Special equipment', ru: 'Спецтехника' }, su_neqliyyati: { az: 'Su nəqliyyatı', en: 'Water transport', ru: 'Водный транспорт' },
  muherrik_hisseleri: { az: 'Mühərrik hissələri', en: 'Engine parts', ru: 'Детали двигателя' }, kuzov_hisseleri: { az: 'Kuzov hissələri', en: 'Body parts', ru: 'Кузовные детали' }, tekerler: { az: 'Təkərlər və disklər', en: 'Tyres and wheels', ru: 'Шины и диски' }, elektrik: { az: 'Elektrik avadanlığı', en: 'Electrical equipment', ru: 'Электрооборудование' }, yağ_filterleri: { az: 'Yağ və hava filterləri', en: 'Oil and air filters', ru: 'Масляные и воздушные фильтры' }, aksesuarlar: { az: 'Aksesuarlar', en: 'Accessories', ru: 'Аксессуары' },
  menziller: { az: 'Mənzillər', en: 'Apartments', ru: 'Квартиры' }, heyet_evleri: { az: 'Həyət evləri və villalar', en: 'Houses and villas', ru: 'Дома и виллы' }, torpaq: { az: 'Torpaq sahələri', en: 'Land plots', ru: 'Земельные участки' }, ofisler: { az: 'Ofislər', en: 'Offices', ru: 'Офисы' }, obyektler: { az: 'Obyektlər və mağazalar', en: 'Commercial properties and shops', ru: 'Коммерческие объекты и магазины' }, qarajlar: { az: 'Qarajlar', en: 'Garages', ru: 'Гаражи' },
  vakansiyalar: { az: 'Vakansiyalar', en: 'Vacancies', ru: 'Вакансии' },
  temir_tikinti: { az: 'Təmir və tikinti', en: 'Repair and construction', ru: 'Ремонт и строительство' }, gozellik_saglamliq: { az: 'Gözəllik və sağlamlıq', en: 'Beauty and health', ru: 'Красота и здоровье' }, tehsil: { az: 'Təhsil', en: 'Education', ru: 'Образование' }, dasima: { az: 'Daşıma və nəqliyyat', en: 'Transport and delivery', ru: 'Перевозки и транспорт' }, it_proqramlasdirma: { az: 'IT və proqramlaşdırma', en: 'IT and programming', ru: 'IT и программирование' }, digər_xidmət: { az: 'Digər xidmətlər', en: 'Other services', ru: 'Другие услуги' },
  geyim: { az: 'Geyim', en: 'Clothing', ru: 'Одежда' }, ayaqqabi: { az: 'Ayaqqabı', en: 'Shoes', ru: 'Обувь' }, cantalar: { az: 'Çantalar', en: 'Bags', ru: 'Сумки' }, saatlar: { az: 'Saatlar', en: 'Watches', ru: 'Часы' },
  soyuducular: { az: 'Soyuducular', en: 'Refrigerators', ru: 'Холодильники' }, paltaryuyanlar: { az: 'Paltaryuyanlar', en: 'Washing machines', ru: 'Стиральные машины' }, kondisionerler: { az: 'Kondisionerlər', en: 'Air conditioners', ru: 'Кондиционеры' }, tozsoranlar: { az: 'Tozsoranlar', en: 'Vacuum cleaners', ru: 'Пылесосы' }, aspiratorlar: { az: 'Aspiratorlar', en: 'Extractor hoods', ru: 'Вытяжки' }, qehve_masinlari: { az: 'Qəhvə maşınları', en: 'Coffee machines', ru: 'Кофемашины' }, su_filtrleri: { az: 'Su filtrləri və pompaları', en: 'Water filters and pumps', ru: 'Фильтры и насосы для воды' }, metbex_texnikasi: { az: 'Mətbəx texnikası', en: 'Kitchen appliances', ru: 'Кухонная техника' }, diger_texnika: { az: 'Digər məişət texnikası', en: 'Other home appliances', ru: 'Другая бытовая техника' },
  smartfonlar: { az: 'Smartfonlar', en: 'Smartphones', ru: 'Смартфоны' }, telefon_aksesuarlar: { az: 'Telefon aksesuarları', en: 'Phone accessories', ru: 'Аксессуары для телефонов' },
  usaq_geyimi: { az: 'Uşaq geyimi', en: 'Children’s clothing', ru: 'Детская одежда' }, oyuncaqlar: { az: 'Oyuncaqlar', en: 'Toys', ru: 'Игрушки' }, arabalar: { az: 'Uşaq arabaları', en: 'Strollers', ru: 'Детские коляски' }, mekteb: { az: 'Məktəb ləvazimatları', en: 'School supplies', ru: 'Школьные принадлежности' },
  itler: { az: 'İtlər', en: 'Dogs', ru: 'Собаки' }, pisikler: { az: 'Pişiklər', en: 'Cats', ru: 'Кошки' }, quslar: { az: 'Quşlar', en: 'Birds', ru: 'Птицы' }, akvarium: { az: 'Akvarium heyvanları', en: 'Aquarium animals', ru: 'Аквариумные животные' }, yem_aksesuar: { az: 'Yem və aksesuarlar', en: 'Food and accessories', ru: 'Корма и аксессуары' },
};

export function categoryLabel(key: string, language: CategoryLanguage) {
  return categoryTranslations[key]?.[language] ?? getCategory(key)?.label ?? key;
}

export function subcategoryLabel(key: string, language: CategoryLanguage) {
  return subcategoryTranslations[key]?.[language] ?? getCategory(CATEGORIES.find((category) => category.subcategories.some((item) => item.key === key))?.key)?.subcategories.find((item) => item.key === key)?.label ?? key;
}
