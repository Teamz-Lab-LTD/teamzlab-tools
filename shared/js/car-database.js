/**
 * Teamz Lab Tools — Shared Car Database
 * Reusable across ALL auto tools (car cover, insurance, loan, depreciation, etc.)
 *
 * Usage:
 *   <script src="/shared/js/car-database.js"></script>
 *   var brands = TeamzCars.getBrands();
 *   var models = TeamzCars.getModels('Toyota');
 *   var car = TeamzCars.getCar('Toyota', 'Camry');
 *   var results = TeamzCars.search('cam');
 *   TeamzCars.addCustomCar({brand:'Custom', model:'MyCar', ...});
 */
var TeamzCars = (function() {
  'use strict';

  /* ===== CAR DATABASE =====
     Fields: brand, model, years, type, size (S/M/L/XL/XXL/3XL),
     lengthMm, widthMm, heightMm, category
     Size guide: S(<4200mm), M(4200-4600), L(4600-4900), XL(4900-5200), XXL(5200+), 3XL(trucks/SUVs 5400+)
  */
  var DB = [
    // ===== TOYOTA (18 models) =====
    {brand:'Toyota',model:'Corolla',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4630,widthMm:1780,heightMm:1435,category:'sedan'},
    {brand:'Toyota',model:'Corolla (E120)',years:'2000-2006',type:'Sedan',size:'M',lengthMm:4410,widthMm:1710,heightMm:1475,category:'sedan'},
    {brand:'Toyota',model:'Corolla (E140)',years:'2006-2013',type:'Sedan',size:'M',lengthMm:4540,widthMm:1760,heightMm:1470,category:'sedan'},
    {brand:'Toyota',model:'Corolla (E170)',years:'2013-2019',type:'Sedan',size:'M',lengthMm:4620,widthMm:1776,heightMm:1455,category:'sedan'},
    {brand:'Toyota',model:'Camry',years:'2018-2026',type:'Sedan',size:'L',lengthMm:4885,widthMm:1840,heightMm:1445,category:'sedan'},
    {brand:'Toyota',model:'Camry (XV30)',years:'2002-2006',type:'Sedan',size:'L',lengthMm:4815,widthMm:1795,heightMm:1490,category:'sedan'},
    {brand:'Toyota',model:'Camry (XV40)',years:'2006-2011',type:'Sedan',size:'L',lengthMm:4815,widthMm:1820,heightMm:1480,category:'sedan'},
    {brand:'Toyota',model:'Camry (XV50)',years:'2012-2017',type:'Sedan',size:'L',lengthMm:4850,widthMm:1825,heightMm:1480,category:'sedan'},
    {brand:'Toyota',model:'RAV4',years:'2019-2026',type:'SUV',size:'L',lengthMm:4600,widthMm:1855,heightMm:1685,category:'suv'},
    {brand:'Toyota',model:'RAV4 (XA30)',years:'2006-2012',type:'SUV',size:'M',lengthMm:4600,widthMm:1815,heightMm:1685,category:'suv'},
    {brand:'Toyota',model:'RAV4 (XA40)',years:'2013-2018',type:'SUV',size:'M',lengthMm:4570,widthMm:1845,heightMm:1660,category:'suv'},
    {brand:'Toyota',model:'Highlander',years:'2020-2026',type:'SUV',size:'XL',lengthMm:4950,widthMm:1930,heightMm:1755,category:'suv'},
    {brand:'Toyota',model:'Highlander (XU40)',years:'2008-2013',type:'SUV',size:'L',lengthMm:4785,widthMm:1910,heightMm:1760,category:'suv'},
    {brand:'Toyota',model:'Highlander (XU50)',years:'2014-2019',type:'SUV',size:'L',lengthMm:4855,widthMm:1925,heightMm:1730,category:'suv'},
    {brand:'Toyota',model:'Land Cruiser',years:'2022-2026',type:'SUV',size:'XL',lengthMm:4985,widthMm:1990,heightMm:1925,category:'suv'},
    {brand:'Toyota',model:'Land Cruiser (J200)',years:'2008-2021',type:'SUV',size:'XL',lengthMm:4950,widthMm:1980,heightMm:1910,category:'suv'},
    {brand:'Toyota',model:'Land Cruiser (J100)',years:'1998-2007',type:'SUV',size:'L',lengthMm:4890,widthMm:1940,heightMm:1890,category:'suv'},
    {brand:'Toyota',model:'Prius',years:'2023-2026',type:'Hatchback',size:'L',lengthMm:4600,widthMm:1780,heightMm:1430,category:'hatchback'},
    {brand:'Toyota',model:'Prius (XW30)',years:'2010-2015',type:'Hatchback',size:'M',lengthMm:4480,widthMm:1745,heightMm:1490,category:'hatchback'},
    {brand:'Toyota',model:'Prius (XW50)',years:'2016-2022',type:'Hatchback',size:'M',lengthMm:4540,widthMm:1760,heightMm:1470,category:'hatchback'},
    {brand:'Toyota',model:'Yaris',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:3940,widthMm:1695,heightMm:1500,category:'hatchback'},
    {brand:'Toyota',model:'Yaris (XP90)',years:'2006-2011',type:'Hatchback',size:'S',lengthMm:3825,widthMm:1695,heightMm:1510,category:'hatchback'},
    {brand:'Toyota',model:'Yaris (XP130)',years:'2011-2019',type:'Hatchback',size:'S',lengthMm:3945,widthMm:1695,heightMm:1500,category:'hatchback'},
    {brand:'Toyota',model:'Hilux',years:'2021-2026',type:'Pickup',size:'XXL',lengthMm:5325,widthMm:1855,heightMm:1815,category:'pickup'},
    {brand:'Toyota',model:'Hilux (AN10)',years:'2005-2015',type:'Pickup',size:'XXL',lengthMm:5255,widthMm:1835,heightMm:1810,category:'pickup'},
    {brand:'Toyota',model:'Supra',years:'2020-2026',type:'Coupe',size:'M',lengthMm:4379,widthMm:1854,heightMm:1292,category:'coupe'},
    {brand:'Toyota',model:'Tacoma',years:'2024-2026',type:'Pickup',size:'XXL',lengthMm:5392,widthMm:1910,heightMm:1800,category:'pickup'},
    {brand:'Toyota',model:'Tacoma (2nd Gen)',years:'2005-2015',type:'Pickup',size:'XL',lengthMm:5286,widthMm:1895,heightMm:1795,category:'pickup'},
    {brand:'Toyota',model:'Tacoma (3rd Gen)',years:'2016-2023',type:'Pickup',size:'XL',lengthMm:5392,widthMm:1910,heightMm:1793,category:'pickup'},
    {brand:'Toyota',model:'Tundra',years:'2022-2026',type:'Pickup',size:'3XL',lengthMm:5933,widthMm:2032,heightMm:1920,category:'pickup'},
    {brand:'Toyota',model:'Tundra (2nd Gen)',years:'2007-2021',type:'Pickup',size:'3XL',lengthMm:5815,widthMm:2029,heightMm:1925,category:'pickup'},
    {brand:'Toyota',model:'Avalon',years:'2019-2024',type:'Sedan',size:'XL',lengthMm:4975,widthMm:1850,heightMm:1445,category:'sedan'},
    {brand:'Toyota',model:'Avalon (XX40)',years:'2013-2018',type:'Sedan',size:'XL',lengthMm:4965,widthMm:1835,heightMm:1460,category:'sedan'},
    {brand:'Toyota',model:'C-HR',years:'2017-2026',type:'SUV',size:'M',lengthMm:4360,widthMm:1795,heightMm:1555,category:'suv'},
    {brand:'Toyota',model:'4Runner',years:'2010-2026',type:'SUV',size:'L',lengthMm:4831,widthMm:1925,heightMm:1807,category:'suv'},
    {brand:'Toyota',model:'Sequoia',years:'2023-2026',type:'SUV',size:'3XL',lengthMm:5286,widthMm:2032,heightMm:1956,category:'suv'},
    {brand:'Toyota',model:'Sequoia (2nd Gen)',years:'2008-2022',type:'SUV',size:'3XL',lengthMm:5210,widthMm:2030,heightMm:1955,category:'suv'},
    {brand:'Toyota',model:'Venza',years:'2021-2026',type:'SUV',size:'L',lengthMm:4740,widthMm:1855,heightMm:1590,category:'suv'},
    {brand:'Toyota',model:'Sienna',years:'2021-2026',type:'Van/Minivan',size:'XL',lengthMm:5175,widthMm:1995,heightMm:1775,category:'van'},
    {brand:'Toyota',model:'Sienna (XL30)',years:'2011-2020',type:'Van/Minivan',size:'XL',lengthMm:5085,widthMm:1985,heightMm:1795,category:'van'},
    {brand:'Toyota',model:'GR86',years:'2022-2026',type:'Coupe',size:'M',lengthMm:4265,widthMm:1775,heightMm:1310,category:'coupe'},

    // ===== HONDA (14 models) =====
    {brand:'Honda',model:'Civic',years:'2022-2026',type:'Sedan',size:'L',lengthMm:4674,widthMm:1802,heightMm:1415,category:'sedan'},
    {brand:'Honda',model:'Civic (8th Gen)',years:'2006-2011',type:'Sedan',size:'M',lengthMm:4540,widthMm:1755,heightMm:1435,category:'sedan'},
    {brand:'Honda',model:'Civic (9th Gen)',years:'2012-2015',type:'Sedan',size:'M',lengthMm:4545,widthMm:1755,heightMm:1435,category:'sedan'},
    {brand:'Honda',model:'Civic (10th Gen)',years:'2016-2021',type:'Sedan',size:'M',lengthMm:4630,widthMm:1799,heightMm:1416,category:'sedan'},
    {brand:'Honda',model:'Accord',years:'2023-2026',type:'Sedan',size:'XL',lengthMm:4971,widthMm:1862,heightMm:1450,category:'sedan'},
    {brand:'Honda',model:'Accord (8th Gen)',years:'2008-2012',type:'Sedan',size:'L',lengthMm:4860,widthMm:1846,heightMm:1475,category:'sedan'},
    {brand:'Honda',model:'Accord (9th Gen)',years:'2013-2017',type:'Sedan',size:'L',lengthMm:4862,widthMm:1849,heightMm:1465,category:'sedan'},
    {brand:'Honda',model:'Accord (10th Gen)',years:'2018-2022',type:'Sedan',size:'L',lengthMm:4880,widthMm:1862,heightMm:1449,category:'sedan'},
    {brand:'Honda',model:'CR-V',years:'2023-2026',type:'SUV',size:'L',lengthMm:4694,widthMm:1855,heightMm:1680,category:'suv'},
    {brand:'Honda',model:'CR-V (4th Gen)',years:'2012-2016',type:'SUV',size:'M',lengthMm:4545,widthMm:1820,heightMm:1685,category:'suv'},
    {brand:'Honda',model:'CR-V (5th Gen)',years:'2017-2022',type:'SUV',size:'L',lengthMm:4600,widthMm:1855,heightMm:1679,category:'suv'},
    {brand:'Honda',model:'HR-V',years:'2023-2026',type:'SUV',size:'M',lengthMm:4385,widthMm:1790,heightMm:1590,category:'suv'},
    {brand:'Honda',model:'HR-V (1st Gen)',years:'2015-2022',type:'SUV',size:'M',lengthMm:4294,widthMm:1772,heightMm:1605,category:'suv'},
    {brand:'Honda',model:'Pilot',years:'2023-2026',type:'SUV',size:'XL',lengthMm:5000,widthMm:1979,heightMm:1775,category:'suv'},
    {brand:'Honda',model:'Pilot (3rd Gen)',years:'2016-2022',type:'SUV',size:'XL',lengthMm:4938,widthMm:1996,heightMm:1773,category:'suv'},
    {brand:'Honda',model:'Fit/Jazz',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:4045,widthMm:1694,heightMm:1525,category:'hatchback'},
    {brand:'Honda',model:'Fit/Jazz (GK)',years:'2014-2020',type:'Hatchback',size:'S',lengthMm:3990,widthMm:1694,heightMm:1525,category:'hatchback'},
    {brand:'Honda',model:'Odyssey',years:'2018-2026',type:'Van/Minivan',size:'XL',lengthMm:5153,widthMm:1994,heightMm:1792,category:'van'},
    {brand:'Honda',model:'Odyssey (4th Gen)',years:'2011-2017',type:'Van/Minivan',size:'XL',lengthMm:5105,widthMm:1994,heightMm:1737,category:'van'},
    {brand:'Honda',model:'Ridgeline',years:'2017-2026',type:'Pickup',size:'XXL',lengthMm:5334,widthMm:1996,heightMm:1778,category:'pickup'},
    {brand:'Honda',model:'Passport',years:'2019-2026',type:'SUV',size:'L',lengthMm:4839,widthMm:1996,heightMm:1807,category:'suv'},
    {brand:'Honda',model:'Insight',years:'2019-2022',type:'Sedan',size:'L',lengthMm:4654,widthMm:1804,heightMm:1449,category:'sedan'},
    {brand:'Honda',model:'Element',years:'2003-2011',type:'SUV',size:'M',lengthMm:4300,widthMm:1815,heightMm:1788,category:'suv'},
    {brand:'Honda',model:'S2000',years:'2000-2009',type:'Convertible',size:'S',lengthMm:4135,widthMm:1750,heightMm:1285,category:'convertible'},

    // ===== FORD (14 models) =====
    {brand:'Ford',model:'F-150',years:'2021-2026',type:'Pickup',size:'3XL',lengthMm:5885,widthMm:2032,heightMm:1918,category:'pickup'},
    {brand:'Ford',model:'F-150 (12th Gen)',years:'2009-2014',type:'Pickup',size:'3XL',lengthMm:5890,widthMm:2029,heightMm:1935,category:'pickup'},
    {brand:'Ford',model:'F-150 (13th Gen)',years:'2015-2020',type:'Pickup',size:'3XL',lengthMm:5890,widthMm:2029,heightMm:1918,category:'pickup'},
    {brand:'Ford',model:'Mustang',years:'2024-2026',type:'Coupe',size:'L',lengthMm:4788,widthMm:1916,heightMm:1381,category:'coupe'},
    {brand:'Ford',model:'Mustang (S197)',years:'2005-2014',type:'Coupe',size:'L',lengthMm:4775,widthMm:1877,heightMm:1384,category:'coupe'},
    {brand:'Ford',model:'Mustang (S550)',years:'2015-2023',type:'Coupe',size:'L',lengthMm:4784,widthMm:1916,heightMm:1381,category:'coupe'},
    {brand:'Ford',model:'Explorer',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5050,widthMm:2004,heightMm:1778,category:'suv'},
    {brand:'Ford',model:'Explorer (5th Gen)',years:'2011-2019',type:'SUV',size:'XL',lengthMm:5006,widthMm:2004,heightMm:1803,category:'suv'},
    {brand:'Ford',model:'Escape',years:'2020-2026',type:'SUV',size:'M',lengthMm:4588,widthMm:1882,heightMm:1679,category:'suv'},
    {brand:'Ford',model:'Escape (3rd Gen)',years:'2013-2019',type:'SUV',size:'M',lengthMm:4524,widthMm:1838,heightMm:1684,category:'suv'},
    {brand:'Ford',model:'Ranger',years:'2024-2026',type:'Pickup',size:'XXL',lengthMm:5370,widthMm:1918,heightMm:1884,category:'pickup'},
    {brand:'Ford',model:'Ranger (T6)',years:'2012-2023',type:'Pickup',size:'XXL',lengthMm:5362,widthMm:1860,heightMm:1821,category:'pickup'},
    {brand:'Ford',model:'Bronco',years:'2021-2026',type:'SUV',size:'L',lengthMm:4810,widthMm:1938,heightMm:1845,category:'suv'},
    {brand:'Ford',model:'Focus (Mk3)',years:'2011-2018',type:'Sedan',size:'M',lengthMm:4534,widthMm:1823,heightMm:1484,category:'sedan'},
    {brand:'Ford',model:'Focus (Mk4)',years:'2019-2025',type:'Hatchback',size:'M',lengthMm:4378,widthMm:1825,heightMm:1471,category:'hatchback'},
    {brand:'Ford',model:'Fusion',years:'2013-2020',type:'Sedan',size:'L',lengthMm:4871,widthMm:1852,heightMm:1476,category:'sedan'},
    {brand:'Ford',model:'Fusion (1st Gen)',years:'2006-2012',type:'Sedan',size:'L',lengthMm:4837,widthMm:1835,heightMm:1500,category:'sedan'},
    {brand:'Ford',model:'Edge',years:'2015-2024',type:'SUV',size:'L',lengthMm:4778,widthMm:1928,heightMm:1742,category:'suv'},
    {brand:'Ford',model:'Expedition',years:'2018-2026',type:'SUV',size:'3XL',lengthMm:5336,widthMm:2123,heightMm:1961,category:'suv'},
    {brand:'Ford',model:'Maverick',years:'2022-2026',type:'Pickup',size:'XL',lengthMm:5072,widthMm:1844,heightMm:1745,category:'pickup'},
    {brand:'Ford',model:'Taurus',years:'2010-2019',type:'Sedan',size:'XL',lengthMm:5078,widthMm:1935,heightMm:1540,category:'sedan'},
    {brand:'Ford',model:'Bronco Sport',years:'2021-2026',type:'SUV',size:'M',lengthMm:4418,widthMm:1843,heightMm:1726,category:'suv'},

    // ===== CHEVROLET (15 models) =====
    {brand:'Chevrolet',model:'Silverado',years:'2019-2026',type:'Pickup',size:'3XL',lengthMm:5920,widthMm:2060,heightMm:1905,category:'pickup'},
    {brand:'Chevrolet',model:'Silverado (2nd Gen)',years:'2007-2013',type:'Pickup',size:'3XL',lengthMm:5843,widthMm:2032,heightMm:1880,category:'pickup'},
    {brand:'Chevrolet',model:'Silverado (3rd Gen)',years:'2014-2018',type:'Pickup',size:'3XL',lengthMm:5843,widthMm:2032,heightMm:1880,category:'pickup'},
    {brand:'Chevrolet',model:'Equinox',years:'2024-2026',type:'SUV',size:'L',lengthMm:4643,widthMm:1843,heightMm:1658,category:'suv'},
    {brand:'Chevrolet',model:'Equinox (3rd Gen)',years:'2018-2023',type:'SUV',size:'L',lengthMm:4643,widthMm:1843,heightMm:1684,category:'suv'},
    {brand:'Chevrolet',model:'Tahoe',years:'2021-2026',type:'SUV',size:'3XL',lengthMm:5356,widthMm:2045,heightMm:1934,category:'suv'},
    {brand:'Chevrolet',model:'Tahoe (4th Gen)',years:'2015-2020',type:'SUV',size:'XL',lengthMm:5179,widthMm:2045,heightMm:1890,category:'suv'},
    {brand:'Chevrolet',model:'Malibu',years:'2016-2024',type:'Sedan',size:'L',lengthMm:4923,widthMm:1854,heightMm:1462,category:'sedan'},
    {brand:'Chevrolet',model:'Malibu (8th Gen)',years:'2008-2012',type:'Sedan',size:'L',lengthMm:4872,widthMm:1827,heightMm:1466,category:'sedan'},
    {brand:'Chevrolet',model:'Corvette',years:'2020-2026',type:'Coupe',size:'L',lengthMm:4630,widthMm:1934,heightMm:1224,category:'coupe'},
    {brand:'Chevrolet',model:'Corvette (C6)',years:'2005-2013',type:'Coupe',size:'M',lengthMm:4435,widthMm:1844,heightMm:1245,category:'coupe'},
    {brand:'Chevrolet',model:'Corvette (C7)',years:'2014-2019',type:'Coupe',size:'M',lengthMm:4493,widthMm:1877,heightMm:1234,category:'coupe'},
    {brand:'Chevrolet',model:'Camaro',years:'2016-2024',type:'Coupe',size:'L',lengthMm:4783,widthMm:1897,heightMm:1349,category:'coupe'},
    {brand:'Chevrolet',model:'Camaro (5th Gen)',years:'2010-2015',type:'Coupe',size:'L',lengthMm:4836,widthMm:1918,heightMm:1376,category:'coupe'},
    {brand:'Chevrolet',model:'Traverse',years:'2018-2026',type:'SUV',size:'XL',lengthMm:5189,widthMm:1996,heightMm:1795,category:'suv'},
    {brand:'Chevrolet',model:'Trailblazer',years:'2021-2026',type:'SUV',size:'M',lengthMm:4414,widthMm:1808,heightMm:1658,category:'suv'},
    {brand:'Chevrolet',model:'Suburban',years:'2021-2026',type:'SUV',size:'3XL',lengthMm:5733,widthMm:2045,heightMm:1934,category:'suv'},
    {brand:'Chevrolet',model:'Colorado',years:'2023-2026',type:'Pickup',size:'XXL',lengthMm:5402,widthMm:1905,heightMm:1793,category:'pickup'},
    {brand:'Chevrolet',model:'Colorado (2nd Gen)',years:'2015-2022',type:'Pickup',size:'XXL',lengthMm:5386,widthMm:1882,heightMm:1790,category:'pickup'},
    {brand:'Chevrolet',model:'Blazer',years:'2019-2025',type:'SUV',size:'L',lengthMm:4857,widthMm:1943,heightMm:1693,category:'suv'},
    {brand:'Chevrolet',model:'Impala',years:'2014-2020',type:'Sedan',size:'XL',lengthMm:5113,widthMm:1854,heightMm:1496,category:'sedan'},
    {brand:'Chevrolet',model:'Cruze',years:'2016-2019',type:'Sedan',size:'M',lengthMm:4666,widthMm:1795,heightMm:1454,category:'sedan'},
    {brand:'Chevrolet',model:'Cruze (1st Gen)',years:'2008-2016',type:'Sedan',size:'M',lengthMm:4597,widthMm:1788,heightMm:1477,category:'sedan'},

    // ===== BMW (15 models) =====
    {brand:'BMW',model:'3 Series (G20)',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4709,widthMm:1827,heightMm:1442,category:'sedan'},
    {brand:'BMW',model:'3 Series (F30)',years:'2012-2018',type:'Sedan',size:'L',lengthMm:4624,widthMm:1811,heightMm:1429,category:'sedan'},
    {brand:'BMW',model:'3 Series (E90)',years:'2005-2011',type:'Sedan',size:'M',lengthMm:4520,widthMm:1817,heightMm:1421,category:'sedan'},
    {brand:'BMW',model:'3 Series (E46)',years:'2000-2005',type:'Sedan',size:'M',lengthMm:4471,widthMm:1739,heightMm:1415,category:'sedan'},
    {brand:'BMW',model:'5 Series (G60)',years:'2024-2026',type:'Sedan',size:'XL',lengthMm:5060,widthMm:1900,heightMm:1515,category:'sedan'},
    {brand:'BMW',model:'5 Series (G30)',years:'2017-2023',type:'Sedan',size:'XL',lengthMm:4936,widthMm:1868,heightMm:1479,category:'sedan'},
    {brand:'BMW',model:'5 Series (F10)',years:'2010-2016',type:'Sedan',size:'L',lengthMm:4899,widthMm:1860,heightMm:1464,category:'sedan'},
    {brand:'BMW',model:'7 Series (G70)',years:'2023-2026',type:'Sedan',size:'XL',lengthMm:5391,widthMm:1950,heightMm:1544,category:'sedan'},
    {brand:'BMW',model:'7 Series (G11)',years:'2016-2022',type:'Sedan',size:'XL',lengthMm:5120,widthMm:1902,heightMm:1479,category:'sedan'},
    {brand:'BMW',model:'X1 (U11)',years:'2023-2026',type:'SUV',size:'M',lengthMm:4500,widthMm:1845,heightMm:1642,category:'suv'},
    {brand:'BMW',model:'X1 (F48)',years:'2016-2022',type:'SUV',size:'M',lengthMm:4439,widthMm:1821,heightMm:1598,category:'suv'},
    {brand:'BMW',model:'X3 (G45)',years:'2024-2026',type:'SUV',size:'L',lengthMm:4755,widthMm:1920,heightMm:1660,category:'suv'},
    {brand:'BMW',model:'X3 (G01)',years:'2018-2023',type:'SUV',size:'L',lengthMm:4726,widthMm:1891,heightMm:1676,category:'suv'},
    {brand:'BMW',model:'X5 (G05)',years:'2019-2026',type:'SUV',size:'XL',lengthMm:4922,widthMm:2004,heightMm:1745,category:'suv'},
    {brand:'BMW',model:'X5 (F15)',years:'2014-2018',type:'SUV',size:'L',lengthMm:4886,widthMm:1938,heightMm:1762,category:'suv'},
    {brand:'BMW',model:'X7',years:'2019-2026',type:'SUV',size:'XL',lengthMm:5151,widthMm:2000,heightMm:1805,category:'suv'},
    {brand:'BMW',model:'4 Series',years:'2021-2026',type:'Coupe',size:'L',lengthMm:4773,widthMm:1852,heightMm:1395,category:'coupe'},
    {brand:'BMW',model:'M3 (G80)',years:'2021-2026',type:'Sedan',size:'L',lengthMm:4794,widthMm:1903,heightMm:1433,category:'sedan'},
    {brand:'BMW',model:'M5 (F90)',years:'2018-2024',type:'Sedan',size:'XL',lengthMm:4966,widthMm:1903,heightMm:1473,category:'sedan'},
    {brand:'BMW',model:'i4',years:'2022-2026',type:'Sedan',size:'L',lengthMm:4783,widthMm:1852,heightMm:1448,category:'sedan'},
    {brand:'BMW',model:'iX',years:'2022-2026',type:'SUV',size:'L',lengthMm:4953,widthMm:1967,heightMm:1696,category:'suv'},
    {brand:'BMW',model:'Z4 (G29)',years:'2019-2026',type:'Convertible',size:'M',lengthMm:4324,widthMm:1864,heightMm:1304,category:'convertible'},

    // ===== MERCEDES-BENZ (13 models) =====
    {brand:'Mercedes-Benz',model:'C-Class (W206)',years:'2022-2026',type:'Sedan',size:'L',lengthMm:4751,widthMm:1820,heightMm:1438,category:'sedan'},
    {brand:'Mercedes-Benz',model:'C-Class (W205)',years:'2015-2021',type:'Sedan',size:'L',lengthMm:4686,widthMm:1810,heightMm:1442,category:'sedan'},
    {brand:'Mercedes-Benz',model:'C-Class (W204)',years:'2008-2014',type:'Sedan',size:'M',lengthMm:4581,widthMm:1770,heightMm:1447,category:'sedan'},
    {brand:'Mercedes-Benz',model:'E-Class (W214)',years:'2024-2026',type:'Sedan',size:'XL',lengthMm:4949,widthMm:1880,heightMm:1468,category:'sedan'},
    {brand:'Mercedes-Benz',model:'E-Class (W213)',years:'2017-2023',type:'Sedan',size:'L',lengthMm:4923,widthMm:1852,heightMm:1468,category:'sedan'},
    {brand:'Mercedes-Benz',model:'E-Class (W212)',years:'2010-2016',type:'Sedan',size:'L',lengthMm:4868,widthMm:1854,heightMm:1471,category:'sedan'},
    {brand:'Mercedes-Benz',model:'S-Class (W223)',years:'2021-2026',type:'Sedan',size:'XL',lengthMm:5179,widthMm:1954,heightMm:1503,category:'sedan'},
    {brand:'Mercedes-Benz',model:'S-Class (W222)',years:'2014-2020',type:'Sedan',size:'XL',lengthMm:5116,widthMm:1899,heightMm:1497,category:'sedan'},
    {brand:'Mercedes-Benz',model:'A-Class',years:'2019-2025',type:'Hatchback',size:'M',lengthMm:4419,widthMm:1796,heightMm:1440,category:'hatchback'},
    {brand:'Mercedes-Benz',model:'GLA',years:'2021-2026',type:'SUV',size:'M',lengthMm:4410,widthMm:1834,heightMm:1611,category:'suv'},
    {brand:'Mercedes-Benz',model:'GLC (X254)',years:'2023-2026',type:'SUV',size:'L',lengthMm:4716,widthMm:1890,heightMm:1640,category:'suv'},
    {brand:'Mercedes-Benz',model:'GLC (X253)',years:'2016-2022',type:'SUV',size:'L',lengthMm:4658,widthMm:1890,heightMm:1644,category:'suv'},
    {brand:'Mercedes-Benz',model:'GLE (W167)',years:'2020-2026',type:'SUV',size:'XL',lengthMm:4924,widthMm:2018,heightMm:1796,category:'suv'},
    {brand:'Mercedes-Benz',model:'GLE (W166)',years:'2015-2019',type:'SUV',size:'L',lengthMm:4819,widthMm:1935,heightMm:1796,category:'suv'},
    {brand:'Mercedes-Benz',model:'GLS',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5207,widthMm:1956,heightMm:1823,category:'suv'},
    {brand:'Mercedes-Benz',model:'CLA',years:'2020-2026',type:'Sedan',size:'L',lengthMm:4688,widthMm:1830,heightMm:1439,category:'sedan'},
    {brand:'Mercedes-Benz',model:'AMG GT',years:'2019-2026',type:'Coupe',size:'L',lengthMm:4546,widthMm:1939,heightMm:1288,category:'coupe'},
    {brand:'Mercedes-Benz',model:'EQS',years:'2022-2026',type:'Sedan',size:'XL',lengthMm:5216,widthMm:1926,heightMm:1512,category:'sedan'},

    // ===== HYUNDAI (15 models) =====
    {brand:'Hyundai',model:'Elantra (CN7)',years:'2021-2026',type:'Sedan',size:'L',lengthMm:4650,widthMm:1810,heightMm:1415,category:'sedan'},
    {brand:'Hyundai',model:'Elantra (AD)',years:'2016-2020',type:'Sedan',size:'M',lengthMm:4570,widthMm:1800,heightMm:1440,category:'sedan'},
    {brand:'Hyundai',model:'Elantra (MD)',years:'2011-2015',type:'Sedan',size:'M',lengthMm:4530,widthMm:1775,heightMm:1435,category:'sedan'},
    {brand:'Hyundai',model:'Sonata (DN8)',years:'2020-2026',type:'Sedan',size:'L',lengthMm:4900,widthMm:1860,heightMm:1445,category:'sedan'},
    {brand:'Hyundai',model:'Sonata (LF)',years:'2015-2019',type:'Sedan',size:'L',lengthMm:4855,widthMm:1865,heightMm:1475,category:'sedan'},
    {brand:'Hyundai',model:'Sonata (YF)',years:'2010-2014',type:'Sedan',size:'L',lengthMm:4820,widthMm:1835,heightMm:1470,category:'sedan'},
    {brand:'Hyundai',model:'Tucson (NX4)',years:'2022-2026',type:'SUV',size:'M',lengthMm:4500,widthMm:1865,heightMm:1650,category:'suv'},
    {brand:'Hyundai',model:'Tucson (TL)',years:'2016-2021',type:'SUV',size:'M',lengthMm:4480,widthMm:1850,heightMm:1660,category:'suv'},
    {brand:'Hyundai',model:'Santa Fe (MX5)',years:'2024-2026',type:'SUV',size:'L',lengthMm:4830,widthMm:1900,heightMm:1720,category:'suv'},
    {brand:'Hyundai',model:'Santa Fe (TM)',years:'2019-2023',type:'SUV',size:'L',lengthMm:4770,widthMm:1890,heightMm:1680,category:'suv'},
    {brand:'Hyundai',model:'Palisade',years:'2020-2026',type:'SUV',size:'XL',lengthMm:4980,widthMm:1975,heightMm:1750,category:'suv'},
    {brand:'Hyundai',model:'Kona',years:'2023-2026',type:'SUV',size:'M',lengthMm:4355,widthMm:1825,heightMm:1575,category:'suv'},
    {brand:'Hyundai',model:'Kona (OS)',years:'2018-2022',type:'SUV',size:'M',lengthMm:4165,widthMm:1800,heightMm:1555,category:'suv'},
    {brand:'Hyundai',model:'Venue',years:'2020-2026',type:'SUV',size:'S',lengthMm:3995,widthMm:1770,heightMm:1590,category:'suv'},
    {brand:'Hyundai',model:'i10',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:3670,widthMm:1680,heightMm:1505,category:'hatchback'},
    {brand:'Hyundai',model:'i20',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:3995,widthMm:1775,heightMm:1505,category:'hatchback'},
    {brand:'Hyundai',model:'i30',years:'2017-2026',type:'Hatchback',size:'M',lengthMm:4340,widthMm:1795,heightMm:1455,category:'hatchback'},
    {brand:'Hyundai',model:'Creta',years:'2020-2026',type:'SUV',size:'M',lengthMm:4300,widthMm:1790,heightMm:1635,category:'suv'},
    {brand:'Hyundai',model:'Ioniq 5',years:'2022-2026',type:'SUV',size:'L',lengthMm:4635,widthMm:1890,heightMm:1605,category:'suv'},
    {brand:'Hyundai',model:'Ioniq 6',years:'2023-2026',type:'Sedan',size:'L',lengthMm:4855,widthMm:1880,heightMm:1495,category:'sedan'},

    // ===== NISSAN (15 models) =====
    {brand:'Nissan',model:'Altima',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4900,widthMm:1850,heightMm:1440,category:'sedan'},
    {brand:'Nissan',model:'Altima (L33)',years:'2013-2018',type:'Sedan',size:'L',lengthMm:4870,widthMm:1830,heightMm:1470,category:'sedan'},
    {brand:'Nissan',model:'Altima (L32)',years:'2007-2012',type:'Sedan',size:'L',lengthMm:4816,widthMm:1796,heightMm:1471,category:'sedan'},
    {brand:'Nissan',model:'Rogue (T33)',years:'2021-2026',type:'SUV',size:'L',lengthMm:4648,widthMm:1839,heightMm:1688,category:'suv'},
    {brand:'Nissan',model:'Rogue (T32)',years:'2014-2020',type:'SUV',size:'L',lengthMm:4630,widthMm:1839,heightMm:1685,category:'suv'},
    {brand:'Nissan',model:'Pathfinder',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5000,widthMm:1979,heightMm:1766,category:'suv'},
    {brand:'Nissan',model:'Pathfinder (R52)',years:'2013-2021',type:'SUV',size:'XL',lengthMm:5008,widthMm:1961,heightMm:1783,category:'suv'},
    {brand:'Nissan',model:'Sentra',years:'2020-2026',type:'Sedan',size:'L',lengthMm:4640,widthMm:1790,heightMm:1445,category:'sedan'},
    {brand:'Nissan',model:'Sentra (B17)',years:'2013-2019',type:'Sedan',size:'M',lengthMm:4575,widthMm:1760,heightMm:1495,category:'sedan'},
    {brand:'Nissan',model:'Maxima',years:'2016-2023',type:'Sedan',size:'L',lengthMm:4897,widthMm:1859,heightMm:1435,category:'sedan'},
    {brand:'Nissan',model:'Frontier',years:'2022-2026',type:'Pickup',size:'XXL',lengthMm:5260,widthMm:1890,heightMm:1803,category:'pickup'},
    {brand:'Nissan',model:'Titan',years:'2017-2025',type:'Pickup',size:'3XL',lengthMm:5817,widthMm:2029,heightMm:1940,category:'pickup'},
    {brand:'Nissan',model:'370Z',years:'2009-2020',type:'Coupe',size:'M',lengthMm:4250,widthMm:1845,heightMm:1315,category:'coupe'},
    {brand:'Nissan',model:'Z',years:'2023-2026',type:'Coupe',size:'M',lengthMm:4379,widthMm:1844,heightMm:1316,category:'coupe'},
    {brand:'Nissan',model:'Kicks',years:'2018-2026',type:'SUV',size:'M',lengthMm:4295,widthMm:1760,heightMm:1590,category:'suv'},
    {brand:'Nissan',model:'Murano',years:'2015-2025',type:'SUV',size:'L',lengthMm:4887,widthMm:1915,heightMm:1691,category:'suv'},
    {brand:'Nissan',model:'Leaf',years:'2018-2024',type:'Hatchback',size:'M',lengthMm:4480,widthMm:1790,heightMm:1540,category:'hatchback'},
    {brand:'Nissan',model:'Versa',years:'2020-2026',type:'Sedan',size:'M',lengthMm:4495,widthMm:1740,heightMm:1455,category:'sedan'},
    {brand:'Nissan',model:'Juke',years:'2020-2026',type:'SUV',size:'M',lengthMm:4210,widthMm:1800,heightMm:1595,category:'suv'},

    // ===== VOLKSWAGEN (13 models) =====
    {brand:'Volkswagen',model:'Golf (Mk8)',years:'2020-2026',type:'Hatchback',size:'M',lengthMm:4284,widthMm:1789,heightMm:1456,category:'hatchback'},
    {brand:'Volkswagen',model:'Golf (Mk7)',years:'2013-2019',type:'Hatchback',size:'M',lengthMm:4255,widthMm:1799,heightMm:1452,category:'hatchback'},
    {brand:'Volkswagen',model:'Golf (Mk6)',years:'2009-2012',type:'Hatchback',size:'M',lengthMm:4199,widthMm:1786,heightMm:1480,category:'hatchback'},
    {brand:'Volkswagen',model:'Golf (Mk5)',years:'2004-2008',type:'Hatchback',size:'M',lengthMm:4204,widthMm:1759,heightMm:1479,category:'hatchback'},
    {brand:'Volkswagen',model:'Passat (B9)',years:'2024-2026',type:'Sedan',size:'L',lengthMm:4917,widthMm:1849,heightMm:1507,category:'sedan'},
    {brand:'Volkswagen',model:'Passat (B8)',years:'2015-2023',type:'Sedan',size:'L',lengthMm:4866,widthMm:1832,heightMm:1477,category:'sedan'},
    {brand:'Volkswagen',model:'Passat (B7)',years:'2010-2014',type:'Sedan',size:'L',lengthMm:4769,widthMm:1820,heightMm:1477,category:'sedan'},
    {brand:'Volkswagen',model:'Tiguan',years:'2022-2026',type:'SUV',size:'M',lengthMm:4509,widthMm:1839,heightMm:1675,category:'suv'},
    {brand:'Volkswagen',model:'Tiguan (AD)',years:'2016-2021',type:'SUV',size:'M',lengthMm:4486,widthMm:1839,heightMm:1673,category:'suv'},
    {brand:'Volkswagen',model:'Atlas',years:'2021-2026',type:'SUV',size:'XL',lengthMm:5037,widthMm:1979,heightMm:1768,category:'suv'},
    {brand:'Volkswagen',model:'Polo (Mk6)',years:'2018-2026',type:'Hatchback',size:'S',lengthMm:4053,widthMm:1751,heightMm:1461,category:'hatchback'},
    {brand:'Volkswagen',model:'Polo (Mk5)',years:'2009-2017',type:'Hatchback',size:'S',lengthMm:3970,widthMm:1682,heightMm:1462,category:'hatchback'},
    {brand:'Volkswagen',model:'Jetta (Mk7)',years:'2019-2026',type:'Sedan',size:'M',lengthMm:4701,widthMm:1799,heightMm:1461,category:'sedan'},
    {brand:'Volkswagen',model:'Jetta (Mk6)',years:'2011-2018',type:'Sedan',size:'M',lengthMm:4628,widthMm:1778,heightMm:1453,category:'sedan'},
    {brand:'Volkswagen',model:'Arteon',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4862,widthMm:1871,heightMm:1427,category:'sedan'},
    {brand:'Volkswagen',model:'ID.4',years:'2021-2026',type:'SUV',size:'M',lengthMm:4584,widthMm:1852,heightMm:1640,category:'suv'},
    {brand:'Volkswagen',model:'Touareg',years:'2019-2026',type:'SUV',size:'L',lengthMm:4878,widthMm:1984,heightMm:1717,category:'suv'},
    {brand:'Volkswagen',model:'T-Roc',years:'2018-2026',type:'SUV',size:'M',lengthMm:4236,widthMm:1819,heightMm:1573,category:'suv'},
    {brand:'Volkswagen',model:'Taos',years:'2022-2026',type:'SUV',size:'M',lengthMm:4461,widthMm:1841,heightMm:1636,category:'suv'},

    // ===== TESLA (5 models) =====
    {brand:'Tesla',model:'Model 3',years:'2024-2026',type:'Sedan',size:'L',lengthMm:4720,widthMm:1849,heightMm:1441,category:'sedan'},
    {brand:'Tesla',model:'Model 3 (1st Gen)',years:'2017-2023',type:'Sedan',size:'L',lengthMm:4694,widthMm:1849,heightMm:1443,category:'sedan'},
    {brand:'Tesla',model:'Model Y',years:'2020-2026',type:'SUV',size:'L',lengthMm:4751,widthMm:1921,heightMm:1624,category:'suv'},
    {brand:'Tesla',model:'Model S',years:'2021-2026',type:'Sedan',size:'XL',lengthMm:4970,widthMm:1964,heightMm:1445,category:'sedan'},
    {brand:'Tesla',model:'Model S (Pre-refresh)',years:'2012-2020',type:'Sedan',size:'XL',lengthMm:4979,widthMm:1964,heightMm:1445,category:'sedan'},
    {brand:'Tesla',model:'Model X',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5057,widthMm:1999,heightMm:1680,category:'suv'},
    {brand:'Tesla',model:'Model X (Pre-refresh)',years:'2016-2021',type:'SUV',size:'XL',lengthMm:5037,widthMm:1999,heightMm:1684,category:'suv'},
    {brand:'Tesla',model:'Cybertruck',years:'2024-2026',type:'Pickup',size:'XXL',lengthMm:5682,widthMm:2200,heightMm:1791,category:'pickup'},

    // ===== KIA (10 models) =====
    {brand:'Kia',model:'Sportage (NQ5)',years:'2023-2026',type:'SUV',size:'M',lengthMm:4515,widthMm:1865,heightMm:1645,category:'suv'},
    {brand:'Kia',model:'Sportage (QL)',years:'2016-2022',type:'SUV',size:'M',lengthMm:4480,widthMm:1855,heightMm:1635,category:'suv'},
    {brand:'Kia',model:'Telluride',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5000,widthMm:1990,heightMm:1750,category:'suv'},
    {brand:'Kia',model:'Forte/K3',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4640,widthMm:1800,heightMm:1440,category:'sedan'},
    {brand:'Kia',model:'Seltos',years:'2020-2026',type:'SUV',size:'M',lengthMm:4370,widthMm:1800,heightMm:1615,category:'suv'},
    {brand:'Kia',model:'Sorento (MQ4)',years:'2021-2026',type:'SUV',size:'L',lengthMm:4810,widthMm:1900,heightMm:1700,category:'suv'},
    {brand:'Kia',model:'Sorento (UM)',years:'2015-2020',type:'SUV',size:'L',lengthMm:4780,widthMm:1890,heightMm:1685,category:'suv'},
    {brand:'Kia',model:'Soul',years:'2020-2026',type:'Hatchback',size:'M',lengthMm:4195,widthMm:1800,heightMm:1600,category:'hatchback'},
    {brand:'Kia',model:'Carnival/Sedona',years:'2022-2026',type:'Van/Minivan',size:'XL',lengthMm:5155,widthMm:1995,heightMm:1740,category:'van'},
    {brand:'Kia',model:'EV6',years:'2022-2026',type:'SUV',size:'L',lengthMm:4680,widthMm:1880,heightMm:1550,category:'suv'},
    {brand:'Kia',model:'Stinger',years:'2018-2023',type:'Sedan',size:'L',lengthMm:4830,widthMm:1870,heightMm:1400,category:'sedan'},
    {brand:'Kia',model:'Rio',years:'2018-2026',type:'Sedan',size:'M',lengthMm:4225,widthMm:1725,heightMm:1450,category:'sedan'},
    {brand:'Kia',model:'Niro',years:'2023-2026',type:'SUV',size:'M',lengthMm:4420,widthMm:1825,heightMm:1570,category:'suv'},

    // ===== AUDI (10 models) =====
    {brand:'Audi',model:'A4 (B9)',years:'2017-2026',type:'Sedan',size:'L',lengthMm:4762,widthMm:1847,heightMm:1431,category:'sedan'},
    {brand:'Audi',model:'A4 (B8)',years:'2008-2016',type:'Sedan',size:'L',lengthMm:4701,widthMm:1826,heightMm:1427,category:'sedan'},
    {brand:'Audi',model:'A6 (C8)',years:'2019-2026',type:'Sedan',size:'XL',lengthMm:4939,widthMm:1886,heightMm:1457,category:'sedan'},
    {brand:'Audi',model:'A6 (C7)',years:'2012-2018',type:'Sedan',size:'L',lengthMm:4933,widthMm:1874,heightMm:1455,category:'sedan'},
    {brand:'Audi',model:'A3',years:'2021-2026',type:'Sedan',size:'M',lengthMm:4495,widthMm:1816,heightMm:1425,category:'sedan'},
    {brand:'Audi',model:'Q5 (FY)',years:'2021-2026',type:'SUV',size:'L',lengthMm:4680,widthMm:1893,heightMm:1660,category:'suv'},
    {brand:'Audi',model:'Q5 (8R)',years:'2009-2017',type:'SUV',size:'M',lengthMm:4629,widthMm:1898,heightMm:1655,category:'suv'},
    {brand:'Audi',model:'Q7 (4M)',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5063,widthMm:1970,heightMm:1741,category:'suv'},
    {brand:'Audi',model:'Q3',years:'2019-2026',type:'SUV',size:'M',lengthMm:4484,widthMm:1856,heightMm:1616,category:'suv'},
    {brand:'Audi',model:'Q8',years:'2019-2026',type:'SUV',size:'XL',lengthMm:4986,widthMm:1995,heightMm:1705,category:'suv'},
    {brand:'Audi',model:'e-tron GT',years:'2022-2026',type:'Sedan',size:'XL',lengthMm:4989,widthMm:1964,heightMm:1396,category:'sedan'},
    {brand:'Audi',model:'TT',years:'2015-2024',type:'Coupe',size:'M',lengthMm:4191,widthMm:1832,heightMm:1353,category:'coupe'},

    // ===== SUBARU (8 models) =====
    {brand:'Subaru',model:'Outback',years:'2020-2026',type:'Wagon',size:'L',lengthMm:4860,widthMm:1854,heightMm:1680,category:'wagon'},
    {brand:'Subaru',model:'Outback (BS)',years:'2015-2019',type:'Wagon',size:'L',lengthMm:4815,widthMm:1840,heightMm:1675,category:'wagon'},
    {brand:'Subaru',model:'Forester (SK)',years:'2019-2026',type:'SUV',size:'M',lengthMm:4640,widthMm:1815,heightMm:1730,category:'suv'},
    {brand:'Subaru',model:'Forester (SJ)',years:'2013-2018',type:'SUV',size:'M',lengthMm:4595,widthMm:1795,heightMm:1735,category:'suv'},
    {brand:'Subaru',model:'Crosstrek',years:'2024-2026',type:'SUV',size:'M',lengthMm:4480,widthMm:1800,heightMm:1580,category:'suv'},
    {brand:'Subaru',model:'Crosstrek (GT)',years:'2018-2023',type:'SUV',size:'M',lengthMm:4465,widthMm:1800,heightMm:1615,category:'suv'},
    {brand:'Subaru',model:'Impreza',years:'2024-2026',type:'Hatchback',size:'M',lengthMm:4475,widthMm:1780,heightMm:1455,category:'hatchback'},
    {brand:'Subaru',model:'WRX',years:'2022-2026',type:'Sedan',size:'L',lengthMm:4669,widthMm:1825,heightMm:1468,category:'sedan'},
    {brand:'Subaru',model:'Ascent',years:'2019-2026',type:'SUV',size:'XL',lengthMm:4998,widthMm:1930,heightMm:1819,category:'suv'},
    {brand:'Subaru',model:'BRZ',years:'2022-2026',type:'Coupe',size:'M',lengthMm:4265,widthMm:1775,heightMm:1310,category:'coupe'},
    {brand:'Subaru',model:'Legacy',years:'2020-2024',type:'Sedan',size:'L',lengthMm:4840,widthMm:1840,heightMm:1500,category:'sedan'},

    // ===== MAZDA (8 models) =====
    {brand:'Mazda',model:'CX-5 (KF)',years:'2017-2026',type:'SUV',size:'M',lengthMm:4575,widthMm:1842,heightMm:1680,category:'suv'},
    {brand:'Mazda',model:'CX-5 (KE)',years:'2012-2016',type:'SUV',size:'M',lengthMm:4540,widthMm:1840,heightMm:1670,category:'suv'},
    {brand:'Mazda',model:'Mazda3 (BP)',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4660,widthMm:1797,heightMm:1440,category:'sedan'},
    {brand:'Mazda',model:'Mazda3 (BM)',years:'2014-2018',type:'Sedan',size:'M',lengthMm:4580,widthMm:1795,heightMm:1455,category:'sedan'},
    {brand:'Mazda',model:'CX-50',years:'2023-2026',type:'SUV',size:'L',lengthMm:4740,widthMm:1920,heightMm:1620,category:'suv'},
    {brand:'Mazda',model:'CX-90',years:'2024-2026',type:'SUV',size:'XL',lengthMm:5120,widthMm:1994,heightMm:1748,category:'suv'},
    {brand:'Mazda',model:'CX-30',years:'2020-2026',type:'SUV',size:'M',lengthMm:4395,widthMm:1795,heightMm:1540,category:'suv'},
    {brand:'Mazda',model:'MX-5 Miata',years:'2016-2026',type:'Convertible',size:'S',lengthMm:3915,widthMm:1735,heightMm:1230,category:'convertible'},
    {brand:'Mazda',model:'CX-9',years:'2016-2023',type:'SUV',size:'XL',lengthMm:5065,widthMm:1969,heightMm:1747,category:'suv'},
    {brand:'Mazda',model:'Mazda6',years:'2014-2021',type:'Sedan',size:'L',lengthMm:4865,widthMm:1840,heightMm:1450,category:'sedan'},

    // ===== JEEP (8 models) =====
    {brand:'Jeep',model:'Wrangler (JL)',years:'2018-2026',type:'SUV',size:'M',lengthMm:4334,widthMm:1894,heightMm:1841,category:'suv'},
    {brand:'Jeep',model:'Wrangler (JK)',years:'2007-2018',type:'SUV',size:'M',lengthMm:4223,widthMm:1873,heightMm:1800,category:'suv'},
    {brand:'Jeep',model:'Grand Cherokee (WL)',years:'2022-2026',type:'SUV',size:'L',lengthMm:4914,widthMm:1979,heightMm:1795,category:'suv'},
    {brand:'Jeep',model:'Grand Cherokee (WK2)',years:'2011-2021',type:'SUV',size:'L',lengthMm:4828,widthMm:1943,heightMm:1792,category:'suv'},
    {brand:'Jeep',model:'Cherokee (KL)',years:'2014-2024',type:'SUV',size:'M',lengthMm:4624,widthMm:1859,heightMm:1730,category:'suv'},
    {brand:'Jeep',model:'Compass',years:'2017-2026',type:'SUV',size:'M',lengthMm:4394,widthMm:1819,heightMm:1640,category:'suv'},
    {brand:'Jeep',model:'Renegade',years:'2015-2025',type:'SUV',size:'M',lengthMm:4236,widthMm:1805,heightMm:1667,category:'suv'},
    {brand:'Jeep',model:'Gladiator',years:'2020-2026',type:'Pickup',size:'XXL',lengthMm:5539,widthMm:1894,heightMm:1843,category:'pickup'},
    {brand:'Jeep',model:'Wagoneer',years:'2022-2026',type:'SUV',size:'XXL',lengthMm:5453,widthMm:2123,heightMm:1920,category:'suv'},

    // ===== RAM (4 models) =====
    {brand:'RAM',model:'1500 (DT)',years:'2019-2026',type:'Pickup',size:'3XL',lengthMm:5811,widthMm:2082,heightMm:1904,category:'pickup'},
    {brand:'RAM',model:'1500 (DS)',years:'2009-2018',type:'Pickup',size:'3XL',lengthMm:5817,widthMm:2017,heightMm:1900,category:'pickup'},
    {brand:'RAM',model:'2500',years:'2019-2026',type:'Pickup',size:'3XL',lengthMm:6142,widthMm:2082,heightMm:1991,category:'pickup'},
    {brand:'RAM',model:'ProMaster',years:'2014-2026',type:'Van/Minivan',size:'3XL',lengthMm:5981,widthMm:2095,heightMm:2731,category:'van'},

    // ===== GMC (6 models) =====
    {brand:'GMC',model:'Sierra 1500',years:'2019-2026',type:'Pickup',size:'3XL',lengthMm:5920,widthMm:2060,heightMm:1905,category:'pickup'},
    {brand:'GMC',model:'Sierra 1500 (K2)',years:'2014-2018',type:'Pickup',size:'3XL',lengthMm:5843,widthMm:2032,heightMm:1880,category:'pickup'},
    {brand:'GMC',model:'Yukon',years:'2021-2026',type:'SUV',size:'XXL',lengthMm:5356,widthMm:2045,heightMm:1934,category:'suv'},
    {brand:'GMC',model:'Yukon (4th Gen)',years:'2015-2020',type:'SUV',size:'XL',lengthMm:5179,widthMm:2045,heightMm:1890,category:'suv'},
    {brand:'GMC',model:'Terrain',years:'2018-2026',type:'SUV',size:'L',lengthMm:4652,widthMm:1843,heightMm:1684,category:'suv'},
    {brand:'GMC',model:'Acadia',years:'2017-2026',type:'SUV',size:'XL',lengthMm:4915,widthMm:1913,heightMm:1750,category:'suv'},
    {brand:'GMC',model:'Canyon',years:'2023-2026',type:'Pickup',size:'XXL',lengthMm:5402,widthMm:1905,heightMm:1793,category:'pickup'},

    // ===== LEXUS (8 models) =====
    {brand:'Lexus',model:'RX (5th Gen)',years:'2023-2026',type:'SUV',size:'L',lengthMm:4890,widthMm:1920,heightMm:1700,category:'suv'},
    {brand:'Lexus',model:'RX (4th Gen)',years:'2016-2022',type:'SUV',size:'L',lengthMm:4890,widthMm:1895,heightMm:1710,category:'suv'},
    {brand:'Lexus',model:'ES',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4975,widthMm:1865,heightMm:1445,category:'sedan'},
    {brand:'Lexus',model:'NX (2nd Gen)',years:'2022-2026',type:'SUV',size:'L',lengthMm:4660,widthMm:1865,heightMm:1660,category:'suv'},
    {brand:'Lexus',model:'NX (1st Gen)',years:'2015-2021',type:'SUV',size:'M',lengthMm:4630,widthMm:1845,heightMm:1645,category:'suv'},
    {brand:'Lexus',model:'IS',years:'2021-2026',type:'Sedan',size:'L',lengthMm:4710,widthMm:1840,heightMm:1435,category:'sedan'},
    {brand:'Lexus',model:'GX',years:'2024-2026',type:'SUV',size:'XL',lengthMm:4950,widthMm:1980,heightMm:1870,category:'suv'},
    {brand:'Lexus',model:'LX',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5100,widthMm:1990,heightMm:1885,category:'suv'},
    {brand:'Lexus',model:'UX',years:'2019-2026',type:'SUV',size:'M',lengthMm:4495,widthMm:1840,heightMm:1540,category:'suv'},
    {brand:'Lexus',model:'LC',years:'2018-2026',type:'Coupe',size:'L',lengthMm:4770,widthMm:1920,heightMm:1345,category:'coupe'},

    // ===== VOLVO (8 models) =====
    {brand:'Volvo',model:'XC90',years:'2015-2026',type:'SUV',size:'XL',lengthMm:4953,widthMm:2008,heightMm:1776,category:'suv'},
    {brand:'Volvo',model:'XC60 (SPA)',years:'2018-2026',type:'SUV',size:'L',lengthMm:4708,widthMm:1902,heightMm:1658,category:'suv'},
    {brand:'Volvo',model:'XC60 (Y20)',years:'2009-2017',type:'SUV',size:'L',lengthMm:4627,widthMm:1891,heightMm:1713,category:'suv'},
    {brand:'Volvo',model:'XC40',years:'2018-2026',type:'SUV',size:'M',lengthMm:4425,widthMm:1863,heightMm:1652,category:'suv'},
    {brand:'Volvo',model:'S60',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4761,widthMm:1850,heightMm:1437,category:'sedan'},
    {brand:'Volvo',model:'S90',years:'2017-2026',type:'Sedan',size:'XL',lengthMm:4963,widthMm:1890,heightMm:1443,category:'sedan'},
    {brand:'Volvo',model:'V60',years:'2019-2026',type:'Wagon',size:'L',lengthMm:4761,widthMm:1850,heightMm:1427,category:'wagon'},
    {brand:'Volvo',model:'EX30',years:'2024-2026',type:'SUV',size:'M',lengthMm:4233,widthMm:1837,heightMm:1550,category:'suv'},
    {brand:'Volvo',model:'EX90',years:'2024-2026',type:'SUV',size:'XL',lengthMm:5037,widthMm:1964,heightMm:1744,category:'suv'},

    // ===== PORSCHE (8 models) =====
    {brand:'Porsche',model:'911 (992)',years:'2019-2026',type:'Coupe',size:'M',lengthMm:4519,widthMm:1852,heightMm:1300,category:'coupe'},
    {brand:'Porsche',model:'911 (991)',years:'2012-2019',type:'Coupe',size:'M',lengthMm:4499,widthMm:1808,heightMm:1294,category:'coupe'},
    {brand:'Porsche',model:'Cayenne (E3)',years:'2019-2026',type:'SUV',size:'L',lengthMm:4926,widthMm:1983,heightMm:1696,category:'suv'},
    {brand:'Porsche',model:'Cayenne (958)',years:'2011-2018',type:'SUV',size:'L',lengthMm:4855,widthMm:1939,heightMm:1710,category:'suv'},
    {brand:'Porsche',model:'Macan (2nd Gen)',years:'2024-2026',type:'SUV',size:'L',lengthMm:4784,widthMm:1938,heightMm:1621,category:'suv'},
    {brand:'Porsche',model:'Macan (95B)',years:'2015-2023',type:'SUV',size:'L',lengthMm:4686,widthMm:1923,heightMm:1624,category:'suv'},
    {brand:'Porsche',model:'Taycan',years:'2020-2026',type:'Sedan',size:'L',lengthMm:4963,widthMm:1966,heightMm:1381,category:'sedan'},
    {brand:'Porsche',model:'Panamera',years:'2017-2026',type:'Sedan',size:'XL',lengthMm:5049,widthMm:1937,heightMm:1423,category:'sedan'},
    {brand:'Porsche',model:'Boxster/718',years:'2017-2026',type:'Convertible',size:'M',lengthMm:4379,widthMm:1801,heightMm:1262,category:'convertible'},

    // ===== DODGE (5 models) =====
    {brand:'Dodge',model:'Charger',years:'2024-2026',type:'Sedan',size:'XL',lengthMm:5050,widthMm:1905,heightMm:1480,category:'sedan'},
    {brand:'Dodge',model:'Charger (LD)',years:'2011-2023',type:'Sedan',size:'XL',lengthMm:5042,widthMm:1905,heightMm:1481,category:'sedan'},
    {brand:'Dodge',model:'Challenger',years:'2015-2023',type:'Coupe',size:'XL',lengthMm:5017,widthMm:1923,heightMm:1448,category:'coupe'},
    {brand:'Dodge',model:'Durango',years:'2021-2026',type:'SUV',size:'XL',lengthMm:5112,widthMm:1928,heightMm:1801,category:'suv'},
    {brand:'Dodge',model:'Durango (3rd Gen)',years:'2011-2020',type:'SUV',size:'XL',lengthMm:5112,widthMm:1928,heightMm:1801,category:'suv'},
    {brand:'Dodge',model:'Hornet',years:'2023-2026',type:'SUV',size:'M',lengthMm:4456,widthMm:1832,heightMm:1597,category:'suv'},

    // ===== SUZUKI (7 models) =====
    {brand:'Suzuki',model:'Swift (4th Gen)',years:'2017-2026',type:'Hatchback',size:'S',lengthMm:3845,widthMm:1735,heightMm:1480,category:'hatchback'},
    {brand:'Suzuki',model:'Swift (3rd Gen)',years:'2010-2017',type:'Hatchback',size:'S',lengthMm:3850,widthMm:1695,heightMm:1510,category:'hatchback'},
    {brand:'Suzuki',model:'Vitara',years:'2015-2026',type:'SUV',size:'S',lengthMm:4175,widthMm:1775,heightMm:1610,category:'suv'},
    {brand:'Suzuki',model:'Alto',years:'2015-2026',type:'Hatchback',size:'S',lengthMm:3395,widthMm:1475,heightMm:1475,category:'hatchback'},
    {brand:'Suzuki',model:'Jimny',years:'2019-2026',type:'SUV',size:'S',lengthMm:3645,widthMm:1645,heightMm:1720,category:'suv'},
    {brand:'Suzuki',model:'S-Cross',years:'2022-2026',type:'SUV',size:'M',lengthMm:4300,widthMm:1785,heightMm:1585,category:'suv'},
    {brand:'Suzuki',model:'Baleno',years:'2016-2026',type:'Hatchback',size:'S',lengthMm:3990,widthMm:1745,heightMm:1500,category:'hatchback'},
    {brand:'Suzuki',model:'Celerio',years:'2014-2026',type:'Hatchback',size:'S',lengthMm:3600,widthMm:1600,heightMm:1540,category:'hatchback'},
    {brand:'Suzuki',model:'Ertiga',years:'2018-2026',type:'Van/Minivan',size:'M',lengthMm:4395,widthMm:1735,heightMm:1690,category:'van'},

    // ===== MITSUBISHI (6 models) =====
    {brand:'Mitsubishi',model:'Outlander (4th Gen)',years:'2022-2026',type:'SUV',size:'L',lengthMm:4710,widthMm:1862,heightMm:1740,category:'suv'},
    {brand:'Mitsubishi',model:'Outlander (3rd Gen)',years:'2013-2021',type:'SUV',size:'L',lengthMm:4695,widthMm:1810,heightMm:1710,category:'suv'},
    {brand:'Mitsubishi',model:'Pajero Sport',years:'2016-2026',type:'SUV',size:'L',lengthMm:4825,widthMm:1815,heightMm:1835,category:'suv'},
    {brand:'Mitsubishi',model:'ASX/Outlander Sport',years:'2020-2026',type:'SUV',size:'M',lengthMm:4365,widthMm:1810,heightMm:1640,category:'suv'},
    {brand:'Mitsubishi',model:'Eclipse Cross',years:'2018-2026',type:'SUV',size:'M',lengthMm:4405,widthMm:1805,heightMm:1685,category:'suv'},
    {brand:'Mitsubishi',model:'Triton/L200',years:'2019-2026',type:'Pickup',size:'XXL',lengthMm:5305,widthMm:1815,heightMm:1795,category:'pickup'},
    {brand:'Mitsubishi',model:'Xpander',years:'2018-2026',type:'Van/Minivan',size:'M',lengthMm:4475,widthMm:1750,heightMm:1700,category:'van'},

    // ===== LAND ROVER (7 models) =====
    {brand:'Land Rover',model:'Range Rover (L460)',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5052,widthMm:2047,heightMm:1870,category:'suv'},
    {brand:'Land Rover',model:'Range Rover (L405)',years:'2013-2021',type:'SUV',size:'XL',lengthMm:5000,widthMm:2073,heightMm:1869,category:'suv'},
    {brand:'Land Rover',model:'Range Rover Sport',years:'2023-2026',type:'SUV',size:'L',lengthMm:4946,widthMm:2047,heightMm:1803,category:'suv'},
    {brand:'Land Rover',model:'Range Rover Sport (L494)',years:'2014-2022',type:'SUV',size:'L',lengthMm:4879,widthMm:2073,heightMm:1803,category:'suv'},
    {brand:'Land Rover',model:'Range Rover Evoque',years:'2020-2026',type:'SUV',size:'M',lengthMm:4371,widthMm:1904,heightMm:1649,category:'suv'},
    {brand:'Land Rover',model:'Defender (L663)',years:'2020-2026',type:'SUV',size:'L',lengthMm:4758,widthMm:2008,heightMm:1967,category:'suv'},
    {brand:'Land Rover',model:'Discovery Sport',years:'2015-2026',type:'SUV',size:'L',lengthMm:4597,widthMm:1904,heightMm:1727,category:'suv'},
    {brand:'Land Rover',model:'Discovery',years:'2017-2026',type:'SUV',size:'XL',lengthMm:4956,widthMm:2220,heightMm:1888,category:'suv'},

    // ===== RENAULT (6 models) =====
    {brand:'Renault',model:'Clio (Mk5)',years:'2019-2026',type:'Hatchback',size:'S',lengthMm:4050,widthMm:1798,heightMm:1440,category:'hatchback'},
    {brand:'Renault',model:'Clio (Mk4)',years:'2012-2019',type:'Hatchback',size:'S',lengthMm:4062,widthMm:1732,heightMm:1448,category:'hatchback'},
    {brand:'Renault',model:'Duster',years:'2024-2026',type:'SUV',size:'M',lengthMm:4341,widthMm:1813,heightMm:1656,category:'suv'},
    {brand:'Renault',model:'Captur',years:'2020-2026',type:'SUV',size:'M',lengthMm:4227,widthMm:1797,heightMm:1576,category:'suv'},
    {brand:'Renault',model:'Megane E-Tech',years:'2022-2026',type:'SUV',size:'M',lengthMm:4200,widthMm:1768,heightMm:1505,category:'suv'},
    {brand:'Renault',model:'Arkana',years:'2021-2026',type:'SUV',size:'M',lengthMm:4568,widthMm:1821,heightMm:1571,category:'suv'},
    {brand:'Renault',model:'Kadjar',years:'2015-2022',type:'SUV',size:'M',lengthMm:4449,widthMm:1836,heightMm:1607,category:'suv'},

    // ===== PEUGEOT (6 models) =====
    {brand:'Peugeot',model:'208 (P21)',years:'2019-2026',type:'Hatchback',size:'S',lengthMm:4055,widthMm:1745,heightMm:1430,category:'hatchback'},
    {brand:'Peugeot',model:'308 (P51)',years:'2022-2026',type:'Hatchback',size:'M',lengthMm:4367,widthMm:1852,heightMm:1441,category:'hatchback'},
    {brand:'Peugeot',model:'3008 (P64)',years:'2024-2026',type:'SUV',size:'M',lengthMm:4542,widthMm:1895,heightMm:1641,category:'suv'},
    {brand:'Peugeot',model:'3008 (P84)',years:'2017-2023',type:'SUV',size:'M',lengthMm:4447,widthMm:1841,heightMm:1624,category:'suv'},
    {brand:'Peugeot',model:'2008',years:'2020-2026',type:'SUV',size:'M',lengthMm:4300,widthMm:1770,heightMm:1530,category:'suv'},
    {brand:'Peugeot',model:'5008',years:'2017-2026',type:'SUV',size:'L',lengthMm:4641,widthMm:1844,heightMm:1646,category:'suv'},
    {brand:'Peugeot',model:'508',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4750,widthMm:1859,heightMm:1403,category:'sedan'},

    // ===== FIAT (4 models) =====
    {brand:'Fiat',model:'500 Electric',years:'2021-2026',type:'Hatchback',size:'S',lengthMm:3631,widthMm:1683,heightMm:1527,category:'hatchback'},
    {brand:'Fiat',model:'500 (312)',years:'2007-2020',type:'Hatchback',size:'S',lengthMm:3571,widthMm:1627,heightMm:1488,category:'hatchback'},
    {brand:'Fiat',model:'500X',years:'2015-2024',type:'SUV',size:'M',lengthMm:4248,widthMm:1796,heightMm:1598,category:'suv'},
    {brand:'Fiat',model:'Panda',years:'2012-2026',type:'Hatchback',size:'S',lengthMm:3653,widthMm:1643,heightMm:1551,category:'hatchback'},
    {brand:'Fiat',model:'Tipo',years:'2016-2026',type:'Sedan',size:'M',lengthMm:4532,widthMm:1792,heightMm:1497,category:'sedan'},

    // ===== MINI (5 models) =====
    {brand:'MINI',model:'Cooper (F66)',years:'2024-2026',type:'Hatchback',size:'S',lengthMm:3862,widthMm:1744,heightMm:1460,category:'hatchback'},
    {brand:'MINI',model:'Cooper (F56)',years:'2014-2023',type:'Hatchback',size:'S',lengthMm:3821,widthMm:1727,heightMm:1414,category:'hatchback'},
    {brand:'MINI',model:'Countryman (U25)',years:'2024-2026',type:'SUV',size:'M',lengthMm:4433,widthMm:1843,heightMm:1656,category:'suv'},
    {brand:'MINI',model:'Countryman (F60)',years:'2017-2023',type:'SUV',size:'M',lengthMm:4299,widthMm:1822,heightMm:1557,category:'suv'},
    {brand:'MINI',model:'Clubman',years:'2016-2024',type:'Wagon',size:'M',lengthMm:4253,widthMm:1800,heightMm:1441,category:'wagon'},

    // ===== BUICK (5 models) =====
    {brand:'Buick',model:'Enclave',years:'2018-2026',type:'SUV',size:'XL',lengthMm:5189,widthMm:2003,heightMm:1823,category:'suv'},
    {brand:'Buick',model:'Encore GX',years:'2020-2026',type:'SUV',size:'M',lengthMm:4463,widthMm:1813,heightMm:1640,category:'suv'},
    {brand:'Buick',model:'Envision',years:'2021-2025',type:'SUV',size:'L',lengthMm:4635,widthMm:1818,heightMm:1658,category:'suv'},
    {brand:'Buick',model:'Envista',years:'2024-2026',type:'SUV',size:'M',lengthMm:4468,widthMm:1820,heightMm:1544,category:'suv'},
    {brand:'Buick',model:'LaCrosse',years:'2010-2019',type:'Sedan',size:'XL',lengthMm:5002,widthMm:1857,heightMm:1496,category:'sedan'},

    // ===== CADILLAC (6 models) =====
    {brand:'Cadillac',model:'Escalade',years:'2021-2026',type:'SUV',size:'3XL',lengthMm:5382,widthMm:2059,heightMm:1948,category:'suv'},
    {brand:'Cadillac',model:'Escalade (4th Gen)',years:'2015-2020',type:'SUV',size:'XXL',lengthMm:5179,widthMm:2045,heightMm:1890,category:'suv'},
    {brand:'Cadillac',model:'XT5',years:'2017-2026',type:'SUV',size:'L',lengthMm:4812,widthMm:1903,heightMm:1675,category:'suv'},
    {brand:'Cadillac',model:'XT4',years:'2019-2026',type:'SUV',size:'M',lengthMm:4599,widthMm:1881,heightMm:1627,category:'suv'},
    {brand:'Cadillac',model:'CT5',years:'2020-2026',type:'Sedan',size:'L',lengthMm:4924,widthMm:1883,heightMm:1453,category:'sedan'},
    {brand:'Cadillac',model:'Lyriq',years:'2023-2026',type:'SUV',size:'L',lengthMm:4996,widthMm:1977,heightMm:1623,category:'suv'},

    // ===== LINCOLN (5 models) =====
    {brand:'Lincoln',model:'Navigator',years:'2018-2026',type:'SUV',size:'3XL',lengthMm:5336,widthMm:2123,heightMm:1961,category:'suv'},
    {brand:'Lincoln',model:'Aviator',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5080,widthMm:2007,heightMm:1773,category:'suv'},
    {brand:'Lincoln',model:'Corsair',years:'2020-2026',type:'SUV',size:'M',lengthMm:4615,widthMm:1887,heightMm:1627,category:'suv'},
    {brand:'Lincoln',model:'Nautilus',years:'2019-2026',type:'SUV',size:'L',lengthMm:4849,widthMm:1936,heightMm:1693,category:'suv'},
    {brand:'Lincoln',model:'Continental',years:'2017-2020',type:'Sedan',size:'XL',lengthMm:5116,widthMm:1911,heightMm:1486,category:'sedan'},

    // ===== ACURA (6 models) =====
    {brand:'Acura',model:'MDX',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5039,widthMm:1999,heightMm:1724,category:'suv'},
    {brand:'Acura',model:'MDX (3rd Gen)',years:'2014-2020',type:'SUV',size:'L',lengthMm:4935,widthMm:1962,heightMm:1716,category:'suv'},
    {brand:'Acura',model:'RDX',years:'2019-2026',type:'SUV',size:'L',lengthMm:4699,widthMm:1882,heightMm:1651,category:'suv'},
    {brand:'Acura',model:'Integra',years:'2023-2026',type:'Hatchback',size:'L',lengthMm:4674,widthMm:1802,heightMm:1415,category:'hatchback'},
    {brand:'Acura',model:'TLX',years:'2021-2026',type:'Sedan',size:'L',lengthMm:4843,widthMm:1861,heightMm:1417,category:'sedan'},
    {brand:'Acura',model:'NSX Type S',years:'2022-2022',type:'Coupe',size:'M',lengthMm:4494,widthMm:1940,heightMm:1215,category:'coupe'},

    // ===== INFINITI (5 models) =====
    {brand:'Infiniti',model:'QX60',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5034,widthMm:1963,heightMm:1771,category:'suv'},
    {brand:'Infiniti',model:'QX80',years:'2018-2026',type:'SUV',size:'XXL',lengthMm:5340,widthMm:2030,heightMm:1925,category:'suv'},
    {brand:'Infiniti',model:'QX50',years:'2019-2026',type:'SUV',size:'L',lengthMm:4693,widthMm:1903,heightMm:1679,category:'suv'},
    {brand:'Infiniti',model:'Q50',years:'2014-2024',type:'Sedan',size:'L',lengthMm:4800,widthMm:1823,heightMm:1440,category:'sedan'},
    {brand:'Infiniti',model:'Q60',years:'2017-2022',type:'Coupe',size:'L',lengthMm:4683,widthMm:1850,heightMm:1384,category:'coupe'},

    // ===== GENESIS (5 models) =====
    {brand:'Genesis',model:'G70',years:'2022-2026',type:'Sedan',size:'L',lengthMm:4685,widthMm:1850,heightMm:1400,category:'sedan'},
    {brand:'Genesis',model:'G80',years:'2021-2026',type:'Sedan',size:'XL',lengthMm:4995,widthMm:1925,heightMm:1465,category:'sedan'},
    {brand:'Genesis',model:'G90',years:'2023-2026',type:'Sedan',size:'XL',lengthMm:5275,widthMm:1930,heightMm:1490,category:'sedan'},
    {brand:'Genesis',model:'GV70',years:'2022-2026',type:'SUV',size:'L',lengthMm:4715,widthMm:1875,heightMm:1630,category:'suv'},
    {brand:'Genesis',model:'GV80',years:'2021-2026',type:'SUV',size:'XL',lengthMm:4945,widthMm:1975,heightMm:1715,category:'suv'},
    {brand:'Genesis',model:'Electrified GV70',years:'2023-2026',type:'SUV',size:'L',lengthMm:4715,widthMm:1875,heightMm:1630,category:'suv'},

    // ===== TATA (5 models — India) =====
    {brand:'Tata',model:'Nexon',years:'2020-2026',type:'SUV',size:'S',lengthMm:3993,widthMm:1811,heightMm:1607,category:'suv'},
    {brand:'Tata',model:'Harrier',years:'2019-2026',type:'SUV',size:'M',lengthMm:4598,widthMm:1894,heightMm:1706,category:'suv'},
    {brand:'Tata',model:'Safari',years:'2021-2026',type:'SUV',size:'L',lengthMm:4661,widthMm:1894,heightMm:1786,category:'suv'},
    {brand:'Tata',model:'Punch',years:'2021-2026',type:'SUV',size:'S',lengthMm:3827,widthMm:1742,heightMm:1615,category:'suv'},
    {brand:'Tata',model:'Altroz',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:3990,widthMm:1755,heightMm:1523,category:'hatchback'},

    // ===== MAHINDRA (5 models — India) =====
    {brand:'Mahindra',model:'XUV700',years:'2021-2026',type:'SUV',size:'L',lengthMm:4695,widthMm:1890,heightMm:1755,category:'suv'},
    {brand:'Mahindra',model:'Thar',years:'2020-2026',type:'SUV',size:'S',lengthMm:3985,widthMm:1820,heightMm:1844,category:'suv'},
    {brand:'Mahindra',model:'Scorpio-N',years:'2022-2026',type:'SUV',size:'L',lengthMm:4662,widthMm:1917,heightMm:1870,category:'suv'},
    {brand:'Mahindra',model:'XUV300',years:'2019-2026',type:'SUV',size:'S',lengthMm:3995,widthMm:1821,heightMm:1627,category:'suv'},
    {brand:'Mahindra',model:'Bolero',years:'2011-2026',type:'SUV',size:'S',lengthMm:4116,widthMm:1745,heightMm:1880,category:'suv'},

    // ===== MARUTI SUZUKI (8 models — India) =====
    {brand:'Maruti Suzuki',model:'Alto K10',years:'2022-2026',type:'Hatchback',size:'S',lengthMm:3530,widthMm:1490,heightMm:1520,category:'hatchback'},
    {brand:'Maruti Suzuki',model:'Swift',years:'2018-2026',type:'Hatchback',size:'S',lengthMm:3845,widthMm:1735,heightMm:1530,category:'hatchback'},
    {brand:'Maruti Suzuki',model:'Dzire',years:'2017-2026',type:'Sedan',size:'S',lengthMm:3995,widthMm:1735,heightMm:1515,category:'sedan'},
    {brand:'Maruti Suzuki',model:'Baleno',years:'2022-2026',type:'Hatchback',size:'S',lengthMm:3990,widthMm:1745,heightMm:1500,category:'hatchback'},
    {brand:'Maruti Suzuki',model:'Brezza',years:'2022-2026',type:'SUV',size:'S',lengthMm:3995,widthMm:1790,heightMm:1685,category:'suv'},
    {brand:'Maruti Suzuki',model:'Ertiga',years:'2018-2026',type:'Van/Minivan',size:'M',lengthMm:4395,widthMm:1735,heightMm:1690,category:'van'},
    {brand:'Maruti Suzuki',model:'WagonR',years:'2019-2026',type:'Hatchback',size:'S',lengthMm:3655,widthMm:1620,heightMm:1675,category:'hatchback'},
    {brand:'Maruti Suzuki',model:'Grand Vitara',years:'2022-2026',type:'SUV',size:'M',lengthMm:4345,widthMm:1795,heightMm:1645,category:'suv'},

    // ===== PROTON (4 models — Malaysia) =====
    {brand:'Proton',model:'Saga',years:'2016-2026',type:'Sedan',size:'M',lengthMm:4331,widthMm:1689,heightMm:1491,category:'sedan'},
    {brand:'Proton',model:'X50',years:'2020-2026',type:'SUV',size:'M',lengthMm:4330,widthMm:1800,heightMm:1609,category:'suv'},
    {brand:'Proton',model:'X70',years:'2018-2026',type:'SUV',size:'M',lengthMm:4519,widthMm:1831,heightMm:1694,category:'suv'},
    {brand:'Proton',model:'X90',years:'2023-2026',type:'SUV',size:'L',lengthMm:4771,widthMm:1860,heightMm:1736,category:'suv'},

    // ===== PERODUA (4 models — Malaysia) =====
    {brand:'Perodua',model:'Myvi',years:'2018-2026',type:'Hatchback',size:'S',lengthMm:3895,widthMm:1735,heightMm:1515,category:'hatchback'},
    {brand:'Perodua',model:'Axia',years:'2023-2026',type:'Hatchback',size:'S',lengthMm:3760,widthMm:1665,heightMm:1545,category:'hatchback'},
    {brand:'Perodua',model:'Ativa',years:'2021-2026',type:'SUV',size:'S',lengthMm:3995,widthMm:1695,heightMm:1620,category:'suv'},
    {brand:'Perodua',model:'Aruz',years:'2019-2026',type:'SUV',size:'M',lengthMm:4435,widthMm:1695,heightMm:1705,category:'suv'},
    {brand:'Perodua',model:'Bezza',years:'2020-2026',type:'Sedan',size:'M',lengthMm:4205,widthMm:1660,heightMm:1520,category:'sedan'},

    // ===== ADDITIONAL GENERATIONS & MODELS =====

    // Toyota extras
    {brand:'Toyota',model:'Corolla (E100)',years:'2000-2002',type:'Sedan',size:'M',lengthMm:4350,widthMm:1695,heightMm:1390,category:'sedan'},
    {brand:'Toyota',model:'Land Cruiser Prado',years:'2009-2026',type:'SUV',size:'L',lengthMm:4820,widthMm:1885,heightMm:1890,category:'suv'},
    {brand:'Toyota',model:'Fortuner',years:'2016-2026',type:'SUV',size:'L',lengthMm:4795,widthMm:1855,heightMm:1835,category:'suv'},
    {brand:'Toyota',model:'Innova',years:'2016-2026',type:'Van/Minivan',size:'L',lengthMm:4735,widthMm:1830,heightMm:1795,category:'van'},
    {brand:'Toyota',model:'Rush',years:'2018-2026',type:'SUV',size:'M',lengthMm:4435,widthMm:1695,heightMm:1705,category:'suv'},
    {brand:'Toyota',model:'Alphard',years:'2023-2026',type:'Van/Minivan',size:'XL',lengthMm:4995,widthMm:1850,heightMm:1935,category:'van'},
    {brand:'Toyota',model:'Corolla Cross',years:'2022-2026',type:'SUV',size:'M',lengthMm:4460,widthMm:1825,heightMm:1620,category:'suv'},
    {brand:'Toyota',model:'bZ4X',years:'2023-2026',type:'SUV',size:'L',lengthMm:4690,widthMm:1860,heightMm:1650,category:'suv'},

    // Honda extras
    {brand:'Honda',model:'City',years:'2020-2026',type:'Sedan',size:'M',lengthMm:4553,widthMm:1748,heightMm:1467,category:'sedan'},
    {brand:'Honda',model:'BR-V',years:'2022-2026',type:'SUV',size:'M',lengthMm:4490,widthMm:1780,heightMm:1685,category:'suv'},
    {brand:'Honda',model:'WR-V',years:'2023-2026',type:'SUV',size:'S',lengthMm:3999,widthMm:1790,heightMm:1608,category:'suv'},
    {brand:'Honda',model:'Civic (7th Gen)',years:'2001-2005',type:'Sedan',size:'M',lengthMm:4475,widthMm:1725,heightMm:1450,category:'sedan'},
    {brand:'Honda',model:'Accord (7th Gen)',years:'2003-2007',type:'Sedan',size:'L',lengthMm:4835,widthMm:1820,heightMm:1480,category:'sedan'},

    // Ford extras
    {brand:'Ford',model:'Focus (Mk2)',years:'2005-2010',type:'Sedan',size:'M',lengthMm:4342,widthMm:1840,heightMm:1497,category:'sedan'},
    {brand:'Ford',model:'EcoSport',years:'2013-2022',type:'SUV',size:'S',lengthMm:4096,widthMm:1765,heightMm:1647,category:'suv'},
    {brand:'Ford',model:'Territory',years:'2019-2026',type:'SUV',size:'M',lengthMm:4580,widthMm:1936,heightMm:1674,category:'suv'},
    {brand:'Ford',model:'Everest/Endeavour',years:'2015-2026',type:'SUV',size:'L',lengthMm:4892,widthMm:1862,heightMm:1837,category:'suv'},
    {brand:'Ford',model:'Puma',years:'2020-2026',type:'SUV',size:'M',lengthMm:4207,widthMm:1805,heightMm:1536,category:'suv'},

    // Chevrolet extras
    {brand:'Chevrolet',model:'Tracker/Trax',years:'2021-2026',type:'SUV',size:'M',lengthMm:4270,widthMm:1791,heightMm:1627,category:'suv'},
    {brand:'Chevrolet',model:'Spark',years:'2016-2022',type:'Hatchback',size:'S',lengthMm:3636,widthMm:1597,heightMm:1517,category:'hatchback'},
    {brand:'Chevrolet',model:'Bolt EV',years:'2017-2023',type:'Hatchback',size:'M',lengthMm:4166,widthMm:1765,heightMm:1595,category:'hatchback'},
    {brand:'Chevrolet',model:'Bolt EUV',years:'2022-2023',type:'SUV',size:'M',lengthMm:4306,widthMm:1770,heightMm:1616,category:'suv'},

    // BMW extras
    {brand:'BMW',model:'2 Series Gran Coupe',years:'2020-2026',type:'Sedan',size:'M',lengthMm:4526,widthMm:1800,heightMm:1420,category:'sedan'},
    {brand:'BMW',model:'X2',years:'2024-2026',type:'SUV',size:'M',lengthMm:4554,widthMm:1845,heightMm:1590,category:'suv'},
    {brand:'BMW',model:'X4',years:'2019-2026',type:'SUV',size:'L',lengthMm:4752,widthMm:1918,heightMm:1621,category:'suv'},
    {brand:'BMW',model:'X6',years:'2020-2026',type:'SUV',size:'XL',lengthMm:4935,widthMm:2004,heightMm:1696,category:'suv'},

    // Mercedes extras
    {brand:'Mercedes-Benz',model:'GLB',years:'2020-2026',type:'SUV',size:'M',lengthMm:4634,widthMm:1834,heightMm:1659,category:'suv'},
    {brand:'Mercedes-Benz',model:'EQE',years:'2023-2026',type:'Sedan',size:'XL',lengthMm:4946,widthMm:1906,heightMm:1512,category:'sedan'},
    {brand:'Mercedes-Benz',model:'EQB',years:'2022-2026',type:'SUV',size:'M',lengthMm:4684,widthMm:1834,heightMm:1667,category:'suv'},
    {brand:'Mercedes-Benz',model:'C-Class (W203)',years:'2001-2007',type:'Sedan',size:'M',lengthMm:4526,widthMm:1728,heightMm:1426,category:'sedan'},

    // Hyundai extras
    {brand:'Hyundai',model:'Elantra (HD)',years:'2006-2010',type:'Sedan',size:'M',lengthMm:4505,widthMm:1775,heightMm:1480,category:'sedan'},
    {brand:'Hyundai',model:'Verna/Accent',years:'2018-2026',type:'Sedan',size:'M',lengthMm:4440,widthMm:1729,heightMm:1460,category:'sedan'},
    {brand:'Hyundai',model:'Tucson (LM)',years:'2010-2015',type:'SUV',size:'M',lengthMm:4410,widthMm:1820,heightMm:1655,category:'suv'},
    {brand:'Hyundai',model:'Santa Cruz',years:'2022-2026',type:'Pickup',size:'XL',lengthMm:4971,widthMm:1906,heightMm:1681,category:'pickup'},
    {brand:'Hyundai',model:'Staria',years:'2022-2026',type:'Van/Minivan',size:'XL',lengthMm:5253,widthMm:1997,heightMm:1990,category:'van'},

    // Nissan extras
    {brand:'Nissan',model:'X-Trail (T33)',years:'2022-2026',type:'SUV',size:'L',lengthMm:4681,widthMm:1840,heightMm:1725,category:'suv'},
    {brand:'Nissan',model:'X-Trail (T32)',years:'2014-2021',type:'SUV',size:'L',lengthMm:4640,widthMm:1820,heightMm:1715,category:'suv'},
    {brand:'Nissan',model:'Navara/Frontier (D23)',years:'2015-2021',type:'Pickup',size:'XXL',lengthMm:5255,widthMm:1850,heightMm:1815,category:'pickup'},
    {brand:'Nissan',model:'Qashqai',years:'2022-2026',type:'SUV',size:'M',lengthMm:4425,widthMm:1838,heightMm:1625,category:'suv'},
    {brand:'Nissan',model:'Magnite',years:'2021-2026',type:'SUV',size:'S',lengthMm:3994,widthMm:1758,heightMm:1572,category:'suv'},

    // Kia extras
    {brand:'Kia',model:'Sportage (SL)',years:'2011-2015',type:'SUV',size:'M',lengthMm:4440,widthMm:1855,heightMm:1635,category:'suv'},
    {brand:'Kia',model:'Optima/K5',years:'2021-2026',type:'Sedan',size:'L',lengthMm:4905,widthMm:1860,heightMm:1445,category:'sedan'},
    {brand:'Kia',model:'Ceed',years:'2018-2026',type:'Hatchback',size:'M',lengthMm:4310,widthMm:1800,heightMm:1450,category:'hatchback'},
    {brand:'Kia',model:'Picanto',years:'2017-2026',type:'Hatchback',size:'S',lengthMm:3595,widthMm:1595,heightMm:1485,category:'hatchback'},
    {brand:'Kia',model:'EV9',years:'2024-2026',type:'SUV',size:'XL',lengthMm:5010,widthMm:1980,heightMm:1755,category:'suv'},

    // Volkswagen extras
    {brand:'Volkswagen',model:'T-Cross',years:'2019-2026',type:'SUV',size:'M',lengthMm:4235,widthMm:1760,heightMm:1580,category:'suv'},
    {brand:'Volkswagen',model:'Virtus',years:'2022-2026',type:'Sedan',size:'M',lengthMm:4561,widthMm:1751,heightMm:1487,category:'sedan'},
    {brand:'Volkswagen',model:'ID.3',years:'2020-2026',type:'Hatchback',size:'M',lengthMm:4261,widthMm:1809,heightMm:1552,category:'hatchback'},
    {brand:'Volkswagen',model:'ID.7',years:'2024-2026',type:'Sedan',size:'L',lengthMm:4961,widthMm:1862,heightMm:1536,category:'sedan'},

    // Audi extras
    {brand:'Audi',model:'A4 (B7)',years:'2005-2008',type:'Sedan',size:'L',lengthMm:4586,widthMm:1772,heightMm:1427,category:'sedan'},
    {brand:'Audi',model:'Q2',years:'2017-2024',type:'SUV',size:'M',lengthMm:4191,widthMm:1794,heightMm:1508,category:'suv'},
    {brand:'Audi',model:'A1',years:'2019-2024',type:'Hatchback',size:'S',lengthMm:4029,widthMm:1740,heightMm:1409,category:'hatchback'},
    {brand:'Audi',model:'RS e-tron GT',years:'2022-2026',type:'Sedan',size:'XL',lengthMm:4989,widthMm:1964,heightMm:1396,category:'sedan'},

    // Subaru extras
    {brand:'Subaru',model:'Outback (BR)',years:'2010-2014',type:'Wagon',size:'L',lengthMm:4775,widthMm:1820,heightMm:1660,category:'wagon'},
    {brand:'Subaru',model:'Forester (SH)',years:'2008-2012',type:'SUV',size:'M',lengthMm:4560,widthMm:1780,heightMm:1700,category:'suv'},
    {brand:'Subaru',model:'Solterra',years:'2023-2026',type:'SUV',size:'L',lengthMm:4690,widthMm:1860,heightMm:1650,category:'suv'},

    // Mazda extras
    {brand:'Mazda',model:'Mazda2',years:'2015-2026',type:'Hatchback',size:'S',lengthMm:4060,widthMm:1695,heightMm:1500,category:'hatchback'},
    {brand:'Mazda',model:'CX-60',years:'2022-2026',type:'SUV',size:'L',lengthMm:4745,widthMm:1890,heightMm:1680,category:'suv'},
    {brand:'Mazda',model:'CX-3',years:'2015-2024',type:'SUV',size:'M',lengthMm:4275,widthMm:1765,heightMm:1535,category:'suv'},

    // Renault extras
    {brand:'Renault',model:'Kwid',years:'2016-2026',type:'Hatchback',size:'S',lengthMm:3731,widthMm:1579,heightMm:1478,category:'hatchback'},
    {brand:'Renault',model:'Koleos',years:'2017-2024',type:'SUV',size:'L',lengthMm:4672,widthMm:1843,heightMm:1678,category:'suv'},
    {brand:'Renault',model:'Triber',years:'2019-2026',type:'Van/Minivan',size:'S',lengthMm:3990,widthMm:1739,heightMm:1643,category:'van'},

    // Peugeot extras
    {brand:'Peugeot',model:'108',years:'2014-2022',type:'Hatchback',size:'S',lengthMm:3475,widthMm:1615,heightMm:1460,category:'hatchback'},
    {brand:'Peugeot',model:'408',years:'2023-2026',type:'Sedan',size:'L',lengthMm:4687,widthMm:1859,heightMm:1479,category:'sedan'},

    // Fiat extras
    {brand:'Fiat',model:'Pulse',years:'2022-2026',type:'SUV',size:'S',lengthMm:4069,widthMm:1780,heightMm:1569,category:'suv'},
    {brand:'Fiat',model:'Cronos',years:'2018-2026',type:'Sedan',size:'M',lengthMm:4368,widthMm:1760,heightMm:1489,category:'sedan'},

    // Volvo extras
    {brand:'Volvo',model:'V90',years:'2017-2026',type:'Wagon',size:'XL',lengthMm:4936,widthMm:1879,heightMm:1475,category:'wagon'},
    {brand:'Volvo',model:'C40 Recharge',years:'2022-2026',type:'SUV',size:'M',lengthMm:4440,widthMm:1873,heightMm:1596,category:'suv'},

    // Genesis extras
    {brand:'Genesis',model:'G70 (IK)',years:'2018-2021',type:'Sedan',size:'L',lengthMm:4672,widthMm:1850,heightMm:1400,category:'sedan'},
    {brand:'Genesis',model:'GV60',years:'2022-2026',type:'SUV',size:'M',lengthMm:4515,widthMm:1890,heightMm:1580,category:'suv'},

    // Dodge extras
    {brand:'Dodge',model:'Charger (LX)',years:'2006-2010',type:'Sedan',size:'XL',lengthMm:5082,widthMm:1880,heightMm:1478,category:'sedan'},
    {brand:'Dodge',model:'Challenger (LC)',years:'2008-2014',type:'Coupe',size:'XL',lengthMm:5023,widthMm:1923,heightMm:1450,category:'coupe'},
    {brand:'Dodge',model:'Grand Caravan',years:'2008-2020',type:'Van/Minivan',size:'XL',lengthMm:5143,widthMm:1954,heightMm:1750,category:'van'},

    // Land Rover extras
    {brand:'Land Rover',model:'Range Rover Velar',years:'2018-2026',type:'SUV',size:'L',lengthMm:4803,widthMm:2145,heightMm:1665,category:'suv'},

    // Cadillac extras
    {brand:'Cadillac',model:'CT4',years:'2020-2026',type:'Sedan',size:'L',lengthMm:4760,widthMm:1824,heightMm:1429,category:'sedan'},
    {brand:'Cadillac',model:'XT6',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5056,widthMm:1964,heightMm:1776,category:'suv'},

    // Lincoln extras
    {brand:'Lincoln',model:'MKZ',years:'2013-2020',type:'Sedan',size:'L',lengthMm:4925,widthMm:1864,heightMm:1476,category:'sedan'},

    // Tata extras
    {brand:'Tata',model:'Tiago',years:'2016-2026',type:'Hatchback',size:'S',lengthMm:3765,widthMm:1677,heightMm:1535,category:'hatchback'},
    {brand:'Tata',model:'Tigor',years:'2017-2026',type:'Sedan',size:'S',lengthMm:3993,widthMm:1677,heightMm:1537,category:'sedan'},

    // Mahindra extras
    {brand:'Mahindra',model:'XUV400',years:'2023-2026',type:'SUV',size:'M',lengthMm:4200,widthMm:1821,heightMm:1627,category:'suv'},

    // Maruti Suzuki extras
    {brand:'Maruti Suzuki',model:'Celerio',years:'2021-2026',type:'Hatchback',size:'S',lengthMm:3695,widthMm:1655,heightMm:1555,category:'hatchback'},
    {brand:'Maruti Suzuki',model:'Ignis',years:'2017-2026',type:'Hatchback',size:'S',lengthMm:3700,widthMm:1690,heightMm:1595,category:'hatchback'},
    {brand:'Maruti Suzuki',model:'Ciaz',years:'2014-2026',type:'Sedan',size:'M',lengthMm:4490,widthMm:1730,heightMm:1485,category:'sedan'},
    {brand:'Maruti Suzuki',model:'XL6',years:'2019-2026',type:'Van/Minivan',size:'M',lengthMm:4445,widthMm:1775,heightMm:1700,category:'van'},
    {brand:'Maruti Suzuki',model:'Fronx',years:'2023-2026',type:'SUV',size:'S',lengthMm:3995,widthMm:1765,heightMm:1550,category:'suv'},
    {brand:'Maruti Suzuki',model:'Invicto',years:'2023-2026',type:'Van/Minivan',size:'L',lengthMm:4735,widthMm:1830,heightMm:1795,category:'van'},

    // Proton extras
    {brand:'Proton',model:'Persona',years:'2016-2026',type:'Sedan',size:'M',lengthMm:4386,widthMm:1689,heightMm:1516,category:'sedan'},
    {brand:'Proton',model:'Iriz',years:'2014-2026',type:'Hatchback',size:'S',lengthMm:3960,widthMm:1728,heightMm:1524,category:'hatchback'},

    // Perodua extras
    {brand:'Perodua',model:'Alza',years:'2022-2026',type:'Van/Minivan',size:'M',lengthMm:4425,widthMm:1730,heightMm:1700,category:'van'},
    {brand:'Perodua',model:'Myvi (3rd Gen)',years:'2011-2017',type:'Hatchback',size:'S',lengthMm:3895,widthMm:1685,heightMm:1530,category:'hatchback'},

    // ===== ADDITIONAL POPULAR MODELS =====

    // Acura extras
    {brand:'Acura',model:'RDX (3rd Gen)',years:'2013-2018',type:'SUV',size:'M',lengthMm:4611,widthMm:1849,heightMm:1655,category:'suv'},
    {brand:'Acura',model:'ILX',years:'2013-2022',type:'Sedan',size:'M',lengthMm:4545,widthMm:1795,heightMm:1417,category:'sedan'},
    {brand:'Acura',model:'ZDX',years:'2024-2026',type:'SUV',size:'XL',lengthMm:5029,widthMm:1999,heightMm:1620,category:'suv'},

    // Infiniti extras
    {brand:'Infiniti',model:'QX55',years:'2022-2026',type:'SUV',size:'L',lengthMm:4727,widthMm:1903,heightMm:1606,category:'suv'},
    {brand:'Infiniti',model:'Q50 (V36)',years:'2007-2013',type:'Sedan',size:'L',lengthMm:4783,widthMm:1823,heightMm:1440,category:'sedan'},

    // Lexus extras
    {brand:'Lexus',model:'RX (3rd Gen)',years:'2010-2015',type:'SUV',size:'L',lengthMm:4770,widthMm:1885,heightMm:1720,category:'suv'},
    {brand:'Lexus',model:'TX',years:'2024-2026',type:'SUV',size:'XL',lengthMm:5070,widthMm:1990,heightMm:1780,category:'suv'},

    // Porsche extras
    {brand:'Porsche',model:'Cayenne (9PA)',years:'2003-2010',type:'SUV',size:'L',lengthMm:4798,widthMm:1928,heightMm:1699,category:'suv'},

    // GMC extras
    {brand:'GMC',model:'Hummer EV',years:'2022-2026',type:'Pickup',size:'3XL',lengthMm:5507,widthMm:2201,heightMm:2030,category:'pickup'},

    // RAM extras
    {brand:'RAM',model:'1500 Classic',years:'2019-2026',type:'Pickup',size:'3XL',lengthMm:5817,widthMm:2017,heightMm:1900,category:'pickup'}
  ];

  /* ===== CUSTOM CARS (localStorage) ===== */
  var STORAGE_KEY = 'teamz_custom_cars';

  function getCustomCars() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch(e) { return []; }
  }

  function saveCustomCars(cars) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cars)); } catch(e) {}
  }

  /* ===== PUBLIC API ===== */
  return {
    /** Get all cars (built-in + custom) */
    getAll: function() {
      return DB.concat(getCustomCars());
    },

    /** Get unique brand list sorted */
    getBrands: function() {
      var all = this.getAll();
      var brands = {};
      all.forEach(function(c) { brands[c.brand] = true; });
      return Object.keys(brands).sort();
    },

    /** Get models for a brand */
    getModels: function(brand) {
      return this.getAll().filter(function(c) {
        return c.brand.toLowerCase() === brand.toLowerCase();
      }).sort(function(a, b) { return a.model.localeCompare(b.model); });
    },

    /** Get specific car */
    getCar: function(brand, model) {
      return this.getAll().find(function(c) {
        return c.brand.toLowerCase() === brand.toLowerCase() &&
               c.model.toLowerCase() === model.toLowerCase();
      }) || null;
    },

    /** Search by any text (brand, model, type) */
    search: function(query) {
      var q = query.toLowerCase().trim();
      if (!q) return [];
      return this.getAll().filter(function(c) {
        return c.brand.toLowerCase().indexOf(q) !== -1 ||
               c.model.toLowerCase().indexOf(q) !== -1 ||
               c.type.toLowerCase().indexOf(q) !== -1 ||
               (c.brand + ' ' + c.model).toLowerCase().indexOf(q) !== -1;
      }).slice(0, 20);
    },

    /** Add custom car (saved to localStorage) */
    addCustomCar: function(car) {
      if (!car.brand || !car.model) return false;
      var customs = getCustomCars();
      // Prevent duplicates
      var exists = customs.find(function(c) {
        return c.brand === car.brand && c.model === car.model;
      });
      if (exists) return false;
      car.custom = true;
      customs.push(car);
      saveCustomCars(customs);
      return true;
    },

    /** Remove custom car */
    removeCustomCar: function(brand, model) {
      var customs = getCustomCars().filter(function(c) {
        return !(c.brand === brand && c.model === model);
      });
      saveCustomCars(customs);
    },

    /** Get cover size label from dimensions */
    getCoverSize: function(lengthMm) {
      if (lengthMm < 4200) return 'S';
      if (lengthMm < 4600) return 'M';
      if (lengthMm < 4900) return 'L';
      if (lengthMm < 5200) return 'XL';
      if (lengthMm < 5400) return 'XXL';
      return '3XL';
    },

    /** Get size description */
    getSizeLabel: function(size) {
      var labels = {
        'S': 'Small (Hatchbacks & City Cars)',
        'M': 'Medium (Compact Sedans & Small SUVs)',
        'L': 'Large (Mid-size Sedans & SUVs)',
        'XL': 'Extra Large (Full-size Sedans & Large SUVs)',
        'XXL': 'XXL (Full-size SUVs & Mid-size Trucks)',
        '3XL': '3XL (Full-size Trucks & XL SUVs)'
      };
      return labels[size] || size;
    },

    /** Render searchable car selector (reusable UI component) */
    renderCarSelector: function(containerId, onSelect) {
      var container = document.getElementById(containerId);
      if (!container) return;

      var self = this;
      container.innerHTML =
        '<div style="position:relative;">' +
          '<input type="text" id="' + containerId + '-search" placeholder="Search car... (e.g. Toyota Camry)" style="width:100%;padding:0.7rem 1rem;font-size:0.95rem;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-family:inherit;box-sizing:border-box;">' +
          '<div id="' + containerId + '-results" style="position:absolute;top:100%;left:0;right:0;max-height:250px;overflow-y:auto;background:var(--surface);border:1px solid var(--border);border-radius:0 0 8px 8px;display:none;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.15);"></div>' +
        '</div>' +
        '<div style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted);">Or <button type="button" id="' + containerId + '-custom-btn" style="background:none;border:none;color:var(--heading);cursor:pointer;font-size:0.8rem;text-decoration:underline;font-family:inherit;padding:0;">add your car manually</button></div>' +
        '<div id="' + containerId + '-custom-form" style="display:none;margin-top:0.75rem;padding:0.75rem;border:1px solid var(--border);border-radius:8px;background:var(--bg);">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">' +
            '<input type="text" id="' + containerId + '-cbrand" placeholder="Brand" style="padding:0.5rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-family:inherit;">' +
            '<input type="text" id="' + containerId + '-cmodel" placeholder="Model" style="padding:0.5rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-family:inherit;">' +
            '<input type="number" id="' + containerId + '-clength" placeholder="Length (mm)" style="padding:0.5rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-family:inherit;">' +
            '<input type="number" id="' + containerId + '-cwidth" placeholder="Width (mm)" style="padding:0.5rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-family:inherit;">' +
          '</div>' +
          '<button type="button" class="btn-primary" id="' + containerId + '-cadd" style="margin-top:0.5rem;padding:0.5rem 1rem;font-size:0.85rem;">Add Car</button>' +
        '</div>';

      var searchInput = document.getElementById(containerId + '-search');
      var resultsDiv = document.getElementById(containerId + '-results');
      var customBtn = document.getElementById(containerId + '-custom-btn');
      var customForm = document.getElementById(containerId + '-custom-form');
      var addBtn = document.getElementById(containerId + '-cadd');

      searchInput.addEventListener('input', function() {
        var q = this.value.trim();
        if (q.length < 2) { resultsDiv.style.display = 'none'; return; }
        var results = self.search(q);
        if (results.length === 0) {
          resultsDiv.innerHTML = '<div style="padding:0.6rem 1rem;color:var(--text-muted);font-size:0.85rem;">No results. Try adding your car manually.</div>';
        } else {
          resultsDiv.innerHTML = results.map(function(c) {
            return '<div class="car-result-item" data-brand="' + c.brand + '" data-model="' + c.model + '" style="padding:0.6rem 1rem;cursor:pointer;font-size:0.9rem;border-bottom:1px solid var(--border);transition:background 0.1s;">' +
              '<strong>' + c.brand + ' ' + c.model + '</strong> <span style="color:var(--text-muted);font-size:0.8rem;">' + c.type + ' · ' + c.years + ' · ' + c.size + '</span>' +
            '</div>';
          }).join('');
        }
        resultsDiv.style.display = '';

        resultsDiv.querySelectorAll('.car-result-item').forEach(function(item) {
          item.addEventListener('click', function() {
            var car = self.getCar(this.dataset.brand, this.dataset.model);
            searchInput.value = car.brand + ' ' + car.model;
            resultsDiv.style.display = 'none';
            if (onSelect) onSelect(car);
          });
          item.addEventListener('mouseenter', function() { this.style.background = 'var(--bg)'; });
          item.addEventListener('mouseleave', function() { this.style.background = ''; });
        });
      });

      searchInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 2) resultsDiv.style.display = '';
      });

      document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) resultsDiv.style.display = 'none';
      });

      customBtn.addEventListener('click', function() {
        customForm.style.display = customForm.style.display === 'none' ? '' : 'none';
      });

      addBtn.addEventListener('click', function() {
        var brand = document.getElementById(containerId + '-cbrand').value.trim();
        var model = document.getElementById(containerId + '-cmodel').value.trim();
        var length = parseInt(document.getElementById(containerId + '-clength').value) || 4500;
        var width = parseInt(document.getElementById(containerId + '-cwidth').value) || 1800;
        if (!brand || !model) {
          if (window.showToast) window.showToast('Please enter brand and model');
          return;
        }
        var car = {
          brand: brand, model: model, years: '2026', type: 'Custom',
          size: self.getCoverSize(length), lengthMm: length, widthMm: width,
          heightMm: 1500, category: 'custom'
        };
        self.addCustomCar(car);
        searchInput.value = brand + ' ' + model;
        customForm.style.display = 'none';
        if (onSelect) onSelect(car);
        if (window.showToast) window.showToast(brand + ' ' + model + ' added!');
      });
    },

    /** Total car count */
    count: function() {
      return this.getAll().length;
    }
  };
})();
