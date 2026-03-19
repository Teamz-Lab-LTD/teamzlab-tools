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
    // ===== TOYOTA =====
    {brand:'Toyota',model:'Corolla',years:'2019-2026',type:'Sedan',size:'M',lengthMm:4630,widthMm:1780,heightMm:1435,category:'sedan'},
    {brand:'Toyota',model:'Camry',years:'2018-2026',type:'Sedan',size:'L',lengthMm:4885,widthMm:1840,heightMm:1445,category:'sedan'},
    {brand:'Toyota',model:'RAV4',years:'2019-2026',type:'SUV',size:'L',lengthMm:4600,widthMm:1855,heightMm:1685,category:'suv'},
    {brand:'Toyota',model:'Highlander',years:'2020-2026',type:'SUV',size:'XL',lengthMm:4950,widthMm:1930,heightMm:1755,category:'suv'},
    {brand:'Toyota',model:'Land Cruiser',years:'2022-2026',type:'SUV',size:'XXL',lengthMm:4985,widthMm:1990,heightMm:1925,category:'suv'},
    {brand:'Toyota',model:'Prius',years:'2023-2026',type:'Hatchback',size:'M',lengthMm:4600,widthMm:1780,heightMm:1430,category:'hatchback'},
    {brand:'Toyota',model:'Yaris',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:3940,widthMm:1695,heightMm:1500,category:'hatchback'},
    {brand:'Toyota',model:'Hilux',years:'2021-2026',type:'Pickup',size:'XXL',lengthMm:5325,widthMm:1855,heightMm:1815,category:'pickup'},
    {brand:'Toyota',model:'Supra',years:'2020-2026',type:'Coupe',size:'M',lengthMm:4379,widthMm:1854,heightMm:1292,category:'coupe'},
    {brand:'Toyota',model:'Tacoma',years:'2024-2026',type:'Pickup',size:'XL',lengthMm:5392,widthMm:1910,heightMm:1800,category:'pickup'},

    // ===== HONDA =====
    {brand:'Honda',model:'Civic',years:'2022-2026',type:'Sedan',size:'M',lengthMm:4674,widthMm:1802,heightMm:1415,category:'sedan'},
    {brand:'Honda',model:'Accord',years:'2023-2026',type:'Sedan',size:'L',lengthMm:4971,widthMm:1862,heightMm:1450,category:'sedan'},
    {brand:'Honda',model:'CR-V',years:'2023-2026',type:'SUV',size:'L',lengthMm:4694,widthMm:1855,heightMm:1680,category:'suv'},
    {brand:'Honda',model:'HR-V',years:'2023-2026',type:'SUV',size:'M',lengthMm:4385,widthMm:1790,heightMm:1590,category:'suv'},
    {brand:'Honda',model:'Pilot',years:'2023-2026',type:'SUV',size:'XL',lengthMm:5000,widthMm:1979,heightMm:1775,category:'suv'},
    {brand:'Honda',model:'Fit/Jazz',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:4045,widthMm:1694,heightMm:1525,category:'hatchback'},

    // ===== BMW =====
    {brand:'BMW',model:'3 Series',years:'2019-2026',type:'Sedan',size:'M',lengthMm:4709,widthMm:1827,heightMm:1442,category:'sedan'},
    {brand:'BMW',model:'5 Series',years:'2024-2026',type:'Sedan',size:'L',lengthMm:5060,widthMm:1900,heightMm:1515,category:'sedan'},
    {brand:'BMW',model:'X3',years:'2022-2026',type:'SUV',size:'L',lengthMm:4726,widthMm:1891,heightMm:1676,category:'suv'},
    {brand:'BMW',model:'X5',years:'2019-2026',type:'SUV',size:'XL',lengthMm:4922,widthMm:2004,heightMm:1745,category:'suv'},
    {brand:'BMW',model:'X7',years:'2019-2026',type:'SUV',size:'XXL',lengthMm:5151,widthMm:2000,heightMm:1805,category:'suv'},

    // ===== MERCEDES-BENZ =====
    {brand:'Mercedes-Benz',model:'C-Class',years:'2022-2026',type:'Sedan',size:'M',lengthMm:4751,widthMm:1820,heightMm:1438,category:'sedan'},
    {brand:'Mercedes-Benz',model:'E-Class',years:'2024-2026',type:'Sedan',size:'L',lengthMm:4949,widthMm:1880,heightMm:1468,category:'sedan'},
    {brand:'Mercedes-Benz',model:'S-Class',years:'2021-2026',type:'Sedan',size:'XL',lengthMm:5179,widthMm:1954,heightMm:1503,category:'sedan'},
    {brand:'Mercedes-Benz',model:'GLC',years:'2023-2026',type:'SUV',size:'L',lengthMm:4716,widthMm:1890,heightMm:1640,category:'suv'},
    {brand:'Mercedes-Benz',model:'GLE',years:'2020-2026',type:'SUV',size:'XL',lengthMm:4924,widthMm:2018,heightMm:1796,category:'suv'},

    // ===== FORD =====
    {brand:'Ford',model:'F-150',years:'2021-2026',type:'Pickup',size:'3XL',lengthMm:5885,widthMm:2032,heightMm:1918,category:'pickup'},
    {brand:'Ford',model:'Mustang',years:'2024-2026',type:'Coupe',size:'M',lengthMm:4788,widthMm:1916,heightMm:1381,category:'coupe'},
    {brand:'Ford',model:'Explorer',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5050,widthMm:2004,heightMm:1778,category:'suv'},
    {brand:'Ford',model:'Escape',years:'2020-2026',type:'SUV',size:'M',lengthMm:4588,widthMm:1882,heightMm:1679,category:'suv'},
    {brand:'Ford',model:'Ranger',years:'2024-2026',type:'Pickup',size:'XXL',lengthMm:5370,widthMm:1918,heightMm:1884,category:'pickup'},
    {brand:'Ford',model:'Bronco',years:'2021-2026',type:'SUV',size:'L',lengthMm:4810,widthMm:1938,heightMm:1845,category:'suv'},

    // ===== CHEVROLET =====
    {brand:'Chevrolet',model:'Silverado',years:'2019-2026',type:'Pickup',size:'3XL',lengthMm:5920,widthMm:2060,heightMm:1905,category:'pickup'},
    {brand:'Chevrolet',model:'Equinox',years:'2024-2026',type:'SUV',size:'M',lengthMm:4643,widthMm:1843,heightMm:1658,category:'suv'},
    {brand:'Chevrolet',model:'Tahoe',years:'2021-2026',type:'SUV',size:'3XL',lengthMm:5356,widthMm:2045,heightMm:1934,category:'suv'},
    {brand:'Chevrolet',model:'Malibu',years:'2019-2024',type:'Sedan',size:'L',lengthMm:4923,widthMm:1854,heightMm:1462,category:'sedan'},
    {brand:'Chevrolet',model:'Corvette',years:'2020-2026',type:'Coupe',size:'M',lengthMm:4630,widthMm:1934,heightMm:1224,category:'coupe'},

    // ===== HYUNDAI =====
    {brand:'Hyundai',model:'Elantra',years:'2021-2026',type:'Sedan',size:'M',lengthMm:4650,widthMm:1810,heightMm:1415,category:'sedan'},
    {brand:'Hyundai',model:'Sonata',years:'2020-2026',type:'Sedan',size:'L',lengthMm:4900,widthMm:1860,heightMm:1445,category:'sedan'},
    {brand:'Hyundai',model:'Tucson',years:'2022-2026',type:'SUV',size:'M',lengthMm:4500,widthMm:1865,heightMm:1650,category:'suv'},
    {brand:'Hyundai',model:'Santa Fe',years:'2024-2026',type:'SUV',size:'L',lengthMm:4830,widthMm:1900,heightMm:1720,category:'suv'},
    {brand:'Hyundai',model:'Palisade',years:'2020-2026',type:'SUV',size:'XL',lengthMm:4980,widthMm:1975,heightMm:1750,category:'suv'},
    {brand:'Hyundai',model:'i10',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:3670,widthMm:1680,heightMm:1505,category:'hatchback'},
    {brand:'Hyundai',model:'Creta',years:'2020-2026',type:'SUV',size:'M',lengthMm:4300,widthMm:1790,heightMm:1635,category:'suv'},

    // ===== KIA =====
    {brand:'Kia',model:'Sportage',years:'2023-2026',type:'SUV',size:'M',lengthMm:4515,widthMm:1865,heightMm:1645,category:'suv'},
    {brand:'Kia',model:'Telluride',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5000,widthMm:1990,heightMm:1750,category:'suv'},
    {brand:'Kia',model:'Forte/K3',years:'2019-2026',type:'Sedan',size:'M',lengthMm:4640,widthMm:1800,heightMm:1440,category:'sedan'},
    {brand:'Kia',model:'Seltos',years:'2020-2026',type:'SUV',size:'M',lengthMm:4370,widthMm:1800,heightMm:1615,category:'suv'},

    // ===== NISSAN =====
    {brand:'Nissan',model:'Altima',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4900,widthMm:1850,heightMm:1440,category:'sedan'},
    {brand:'Nissan',model:'Rogue',years:'2021-2026',type:'SUV',size:'L',lengthMm:4648,widthMm:1839,heightMm:1688,category:'suv'},
    {brand:'Nissan',model:'Pathfinder',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5000,widthMm:1979,heightMm:1766,category:'suv'},
    {brand:'Nissan',model:'Sentra',years:'2020-2026',type:'Sedan',size:'M',lengthMm:4640,widthMm:1790,heightMm:1445,category:'sedan'},

    // ===== VOLKSWAGEN =====
    {brand:'Volkswagen',model:'Golf',years:'2020-2026',type:'Hatchback',size:'M',lengthMm:4284,widthMm:1789,heightMm:1456,category:'hatchback'},
    {brand:'Volkswagen',model:'Passat',years:'2020-2026',type:'Sedan',size:'L',lengthMm:4866,widthMm:1832,heightMm:1477,category:'sedan'},
    {brand:'Volkswagen',model:'Tiguan',years:'2022-2026',type:'SUV',size:'M',lengthMm:4509,widthMm:1839,heightMm:1675,category:'suv'},
    {brand:'Volkswagen',model:'Atlas',years:'2021-2026',type:'SUV',size:'XL',lengthMm:5037,widthMm:1979,heightMm:1768,category:'suv'},
    {brand:'Volkswagen',model:'Polo',years:'2018-2026',type:'Hatchback',size:'S',lengthMm:4053,widthMm:1751,heightMm:1461,category:'hatchback'},

    // ===== TESLA =====
    {brand:'Tesla',model:'Model 3',years:'2024-2026',type:'Sedan',size:'M',lengthMm:4720,widthMm:1849,heightMm:1441,category:'sedan'},
    {brand:'Tesla',model:'Model Y',years:'2020-2026',type:'SUV',size:'L',lengthMm:4751,widthMm:1921,heightMm:1624,category:'suv'},
    {brand:'Tesla',model:'Model S',years:'2021-2026',type:'Sedan',size:'XL',lengthMm:4970,widthMm:1964,heightMm:1445,category:'sedan'},
    {brand:'Tesla',model:'Model X',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5057,widthMm:1999,heightMm:1680,category:'suv'},
    {brand:'Tesla',model:'Cybertruck',years:'2024-2026',type:'Pickup',size:'XXL',lengthMm:5682,widthMm:2200,heightMm:1791,category:'pickup'},

    // ===== AUDI =====
    {brand:'Audi',model:'A4',years:'2020-2026',type:'Sedan',size:'M',lengthMm:4762,widthMm:1847,heightMm:1431,category:'sedan'},
    {brand:'Audi',model:'A6',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4939,widthMm:1886,heightMm:1457,category:'sedan'},
    {brand:'Audi',model:'Q5',years:'2021-2026',type:'SUV',size:'L',lengthMm:4680,widthMm:1893,heightMm:1660,category:'suv'},
    {brand:'Audi',model:'Q7',years:'2020-2026',type:'SUV',size:'XL',lengthMm:5063,widthMm:1970,heightMm:1741,category:'suv'},

    // ===== SUBARU =====
    {brand:'Subaru',model:'Outback',years:'2020-2026',type:'Wagon',size:'L',lengthMm:4860,widthMm:1854,heightMm:1680,category:'wagon'},
    {brand:'Subaru',model:'Forester',years:'2019-2026',type:'SUV',size:'M',lengthMm:4640,widthMm:1815,heightMm:1730,category:'suv'},
    {brand:'Subaru',model:'Crosstrek',years:'2024-2026',type:'SUV',size:'M',lengthMm:4480,widthMm:1800,heightMm:1580,category:'suv'},
    {brand:'Subaru',model:'Impreza',years:'2024-2026',type:'Hatchback',size:'M',lengthMm:4475,widthMm:1780,heightMm:1455,category:'hatchback'},

    // ===== MAZDA =====
    {brand:'Mazda',model:'CX-5',years:'2022-2026',type:'SUV',size:'M',lengthMm:4575,widthMm:1842,heightMm:1680,category:'suv'},
    {brand:'Mazda',model:'Mazda3',years:'2019-2026',type:'Sedan',size:'M',lengthMm:4660,widthMm:1797,heightMm:1440,category:'sedan'},
    {brand:'Mazda',model:'CX-50',years:'2023-2026',type:'SUV',size:'L',lengthMm:4740,widthMm:1920,heightMm:1620,category:'suv'},
    {brand:'Mazda',model:'CX-90',years:'2024-2026',type:'SUV',size:'XL',lengthMm:5120,widthMm:1994,heightMm:1748,category:'suv'},

    // ===== JEEP =====
    {brand:'Jeep',model:'Wrangler',years:'2018-2026',type:'SUV',size:'M',lengthMm:4334,widthMm:1894,heightMm:1841,category:'suv'},
    {brand:'Jeep',model:'Grand Cherokee',years:'2022-2026',type:'SUV',size:'L',lengthMm:4914,widthMm:1979,heightMm:1795,category:'suv'},
    {brand:'Jeep',model:'Cherokee',years:'2019-2024',type:'SUV',size:'M',lengthMm:4624,widthMm:1859,heightMm:1730,category:'suv'},

    // ===== RAM =====
    {brand:'RAM',model:'1500',years:'2019-2026',type:'Pickup',size:'3XL',lengthMm:5811,widthMm:2082,heightMm:1904,category:'pickup'},

    // ===== GMC =====
    {brand:'GMC',model:'Sierra',years:'2019-2026',type:'Pickup',size:'3XL',lengthMm:5920,widthMm:2060,heightMm:1905,category:'pickup'},
    {brand:'GMC',model:'Yukon',years:'2021-2026',type:'SUV',size:'3XL',lengthMm:5356,widthMm:2045,heightMm:1934,category:'suv'},

    // ===== LEXUS =====
    {brand:'Lexus',model:'RX',years:'2023-2026',type:'SUV',size:'L',lengthMm:4890,widthMm:1920,heightMm:1700,category:'suv'},
    {brand:'Lexus',model:'ES',years:'2019-2026',type:'Sedan',size:'L',lengthMm:4975,widthMm:1865,heightMm:1445,category:'sedan'},
    {brand:'Lexus',model:'NX',years:'2022-2026',type:'SUV',size:'M',lengthMm:4660,widthMm:1865,heightMm:1660,category:'suv'},

    // ===== VOLVO =====
    {brand:'Volvo',model:'XC90',years:'2020-2026',type:'SUV',size:'XL',lengthMm:4953,widthMm:2008,heightMm:1776,category:'suv'},
    {brand:'Volvo',model:'XC60',years:'2022-2026',type:'SUV',size:'L',lengthMm:4708,widthMm:1902,heightMm:1658,category:'suv'},
    {brand:'Volvo',model:'XC40',years:'2019-2026',type:'SUV',size:'M',lengthMm:4425,widthMm:1863,heightMm:1652,category:'suv'},

    // ===== PORSCHE =====
    {brand:'Porsche',model:'911',years:'2019-2026',type:'Coupe',size:'M',lengthMm:4519,widthMm:1852,heightMm:1300,category:'coupe'},
    {brand:'Porsche',model:'Cayenne',years:'2019-2026',type:'SUV',size:'L',lengthMm:4926,widthMm:1983,heightMm:1696,category:'suv'},
    {brand:'Porsche',model:'Macan',years:'2024-2026',type:'SUV',size:'M',lengthMm:4784,widthMm:1938,heightMm:1621,category:'suv'},

    // ===== SUZUKI =====
    {brand:'Suzuki',model:'Swift',years:'2017-2026',type:'Hatchback',size:'S',lengthMm:3845,widthMm:1735,heightMm:1480,category:'hatchback'},
    {brand:'Suzuki',model:'Vitara',years:'2019-2026',type:'SUV',size:'M',lengthMm:4175,widthMm:1775,heightMm:1610,category:'suv'},
    {brand:'Suzuki',model:'Alto',years:'2015-2026',type:'Hatchback',size:'S',lengthMm:3395,widthMm:1475,heightMm:1475,category:'hatchback'},

    // ===== MITSUBISHI =====
    {brand:'Mitsubishi',model:'Outlander',years:'2022-2026',type:'SUV',size:'L',lengthMm:4710,widthMm:1862,heightMm:1740,category:'suv'},
    {brand:'Mitsubishi',model:'Pajero Sport',years:'2020-2026',type:'SUV',size:'L',lengthMm:4825,widthMm:1815,heightMm:1835,category:'suv'},

    // ===== LAND ROVER =====
    {brand:'Land Rover',model:'Range Rover',years:'2022-2026',type:'SUV',size:'XL',lengthMm:5052,widthMm:2047,heightMm:1870,category:'suv'},
    {brand:'Land Rover',model:'Defender',years:'2020-2026',type:'SUV',size:'L',lengthMm:4758,widthMm:2008,heightMm:1967,category:'suv'},
    {brand:'Land Rover',model:'Discovery Sport',years:'2020-2026',type:'SUV',size:'M',lengthMm:4597,widthMm:1904,heightMm:1727,category:'suv'},

    // ===== RENAULT =====
    {brand:'Renault',model:'Clio',years:'2019-2026',type:'Hatchback',size:'S',lengthMm:4050,widthMm:1798,heightMm:1440,category:'hatchback'},
    {brand:'Renault',model:'Duster',years:'2024-2026',type:'SUV',size:'M',lengthMm:4341,widthMm:1813,heightMm:1656,category:'suv'},

    // ===== PEUGEOT =====
    {brand:'Peugeot',model:'208',years:'2019-2026',type:'Hatchback',size:'S',lengthMm:4055,widthMm:1745,heightMm:1430,category:'hatchback'},
    {brand:'Peugeot',model:'3008',years:'2024-2026',type:'SUV',size:'M',lengthMm:4542,widthMm:1895,heightMm:1641,category:'suv'},

    // ===== FIAT =====
    {brand:'Fiat',model:'500',years:'2020-2026',type:'Hatchback',size:'S',lengthMm:3571,widthMm:1627,heightMm:1488,category:'hatchback'},

    // ===== MINI =====
    {brand:'MINI',model:'Cooper',years:'2024-2026',type:'Hatchback',size:'S',lengthMm:3862,widthMm:1744,heightMm:1460,category:'hatchback'},
    {brand:'MINI',model:'Countryman',years:'2024-2026',type:'SUV',size:'M',lengthMm:4433,widthMm:1843,heightMm:1656,category:'suv'}
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
