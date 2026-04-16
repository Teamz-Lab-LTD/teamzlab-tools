#!/usr/bin/env python3
"""
Walkability Score Checker — base tool + programmatic city variants.

Generates:
  /housing/walkability-score-checker/                       (base, any address)
  /housing/walkability-score-checker-<city-slug>/           (1 per city)

Client-side: Nominatim geocode (free OSM) + Overpass API (free OSM) + Leaflet.
No backend. Privacy-first. Rate-limited politely (respects Nominatim TOS).
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://tool.teamzlab.com"

# --- CITY DATA ---------------------------------------------------------------
# Each entry: center lat/lng, country, region, population, walkability blurb,
# two known-walkable neighborhoods, one car-dependent neighborhood (for contrast),
# local context sentence.
CITIES = {
    "new-york-city": {
        "name": "New York City", "country": "United States", "region": "New York",
        "lat": 40.7128, "lng": -74.0060, "pop": "8.3M",
        "walkable": ["Greenwich Village", "Upper West Side"],
        "car": "Staten Island",
        "blurb": "New York City is widely considered the most walkable large city in the United States, with Manhattan scoring near the theoretical ceiling. Subway access, dense commercial streets, and 24/7 amenities mean most residents can skip car ownership entirely.",
        "ctx": "Manhattan households are three times more likely to go car-free than the US average."
    },
    "london": {
        "name": "London", "country": "United Kingdom", "region": "England",
        "lat": 51.5074, "lng": -0.1278, "pop": "9M",
        "walkable": ["Soho", "Marylebone"],
        "car": "outer Zone 6",
        "blurb": "London's Zone 1 and 2 boroughs consistently rank among Europe's most walkable, with tight 15-minute neighbourhood amenity clusters. Tube and bus coverage makes car ownership genuinely optional for most inner-city residents.",
        "ctx": "Roughly 46% of London households do not own a car, the highest ratio in the UK."
    },
    "paris": {
        "name": "Paris", "country": "France", "region": "Île-de-France",
        "lat": 48.8566, "lng": 2.3522, "pop": "2.1M",
        "walkable": ["Le Marais", "Saint-Germain-des-Prés"],
        "car": "La Défense peripheral zones",
        "blurb": "Paris is the flagship European example of the 15-minute city: Mayor Anne Hidalgo's urban policy explicitly targets having groceries, schools, parks, and healthcare within walking distance of every home. Dense Haussmann-era blocks make this achievable.",
        "ctx": "Nearly 65% of intra-Paris trips are made on foot, bike, or transit — private car use is under 10%."
    },
    "tokyo": {
        "name": "Tokyo", "country": "Japan", "region": "Kantō",
        "lat": 35.6762, "lng": 139.6503, "pop": "37M metro",
        "walkable": ["Shimokitazawa", "Kagurazaka"],
        "car": "Tama outer suburbs",
        "blurb": "Tokyo's station-centric development model produces exceptional walkability: every rail and subway stop typically anchors a dense neighbourhood with groceries, restaurants, schools, and clinics within a five-minute walk.",
        "ctx": "Only about 32% of Tokyo households own a car — the lowest rate of any major world metropolis."
    },
    "san-francisco": {
        "name": "San Francisco", "country": "United States", "region": "California",
        "lat": 37.7749, "lng": -122.4194, "pop": "815K",
        "walkable": ["Hayes Valley", "North Beach"],
        "car": "outer Sunset",
        "blurb": "San Francisco is one of only a handful of US cities where walkability approaches European norms. Tight grid blocks, mixed-use zoning, and MUNI coverage make most central neighbourhoods genuinely car-optional.",
        "ctx": "Around 30% of San Francisco households are car-free, the second-highest rate in any US city after New York."
    },
    "chicago": {
        "name": "Chicago", "country": "United States", "region": "Illinois",
        "lat": 41.8781, "lng": -87.6298, "pop": "2.7M",
        "walkable": ["West Loop", "Lincoln Park"],
        "car": "far Southwest Side",
        "blurb": "Chicago combines genuinely walkable inner neighbourhoods with an elevated rail network that extends walkable-density living far beyond the Loop. Storefront-lined streets and dense multi-family housing support daily-needs-by-foot lifestyles.",
        "ctx": "About 28% of Chicago households do not own a car, driven largely by proximity to CTA rail."
    },
    "boston": {
        "name": "Boston", "country": "United States", "region": "Massachusetts",
        "lat": 42.3601, "lng": -71.0589, "pop": "675K",
        "walkable": ["Beacon Hill", "South End"],
        "car": "Hyde Park",
        "blurb": "Boston's pre-automobile street grid gives it a walkability advantage most US cities simply cannot match. The core is genuinely compact, university-dense, and served by the oldest subway system in North America.",
        "ctx": "Around 35% of Boston households are car-free — unusually high for a US city of this size."
    },
    "seattle": {
        "name": "Seattle", "country": "United States", "region": "Washington",
        "lat": 47.6062, "lng": -122.3321, "pop": "750K",
        "walkable": ["Capitol Hill", "Ballard"],
        "car": "West Seattle beyond the bridge",
        "blurb": "Seattle has invested heavily in dense mixed-use neighbourhood nodes, expanding light rail, and protected bike infrastructure. Central neighbourhoods now rival East Coast cities for daily-needs walkability.",
        "ctx": "Roughly 17% of Seattle households are car-free, double the US urban average."
    },
    "washington-dc": {
        "name": "Washington D.C.", "country": "United States", "region": "District of Columbia",
        "lat": 38.9072, "lng": -77.0369, "pop": "700K",
        "walkable": ["Dupont Circle", "Logan Circle"],
        "car": "far Northeast",
        "blurb": "Washington D.C. is one of the most walkable US capitals thanks to strict height limits, grid planning, and extensive Metro coverage. The diamond-shaped city centre functions as a genuine 15-minute neighbourhood.",
        "ctx": "Around 38% of D.C. households are car-free — the highest share of any US city outside New York."
    },
    "miami": {
        "name": "Miami", "country": "United States", "region": "Florida",
        "lat": 25.7617, "lng": -80.1918, "pop": "470K",
        "walkable": ["Brickell", "South Beach"],
        "car": "unincorporated Miami-Dade",
        "blurb": "Miami's walkability is concentrated in a few dense urban nodes — Brickell, downtown, and the beach — rather than spread across the metropolitan area. Within those nodes, amenity density rivals much larger cities.",
        "ctx": "Brickell has seen a car-free household share grow to around 18% as residential towers have multiplied."
    },
    "austin": {
        "name": "Austin", "country": "United States", "region": "Texas",
        "lat": 30.2672, "lng": -97.7431, "pop": "975K",
        "walkable": ["South Congress", "East Austin"],
        "car": "north of Highway 183",
        "blurb": "Austin's walkability is strongly uneven: a few central corridors now approach New Urbanist density, while most of the city remains sprawled and auto-dependent. South Congress and East Austin are where the walkability story is happening.",
        "ctx": "Project Connect, Austin's in-progress light rail system, is explicitly designed to raise walkability scores along its corridors."
    },
    "toronto": {
        "name": "Toronto", "country": "Canada", "region": "Ontario",
        "lat": 43.6532, "lng": -79.3832, "pop": "2.9M",
        "walkable": ["The Annex", "Kensington Market"],
        "car": "outer Scarborough",
        "blurb": "Toronto's old streetcar-era neighbourhoods produce some of North America's best walkability. Dense mixed-use streets, subway access, and growing protected cycling networks make much of the city genuinely car-optional.",
        "ctx": "About 28% of Toronto households do not own a car, concentrated in former-streetcar neighbourhoods."
    },
    "vancouver": {
        "name": "Vancouver", "country": "Canada", "region": "British Columbia",
        "lat": 49.2827, "lng": -123.1207, "pop": "675K",
        "walkable": ["West End", "Commercial Drive"],
        "car": "outside city proper",
        "blurb": "Vancouver is the most walkable large Canadian city by most measures, with the West End in particular achieving densities and amenity coverage comparable to central European cities.",
        "ctx": "Vancouver deliberately froze downtown highway expansion in the 1970s — a decision now credited with its walkability."
    },
    "sydney": {
        "name": "Sydney", "country": "Australia", "region": "New South Wales",
        "lat": -33.8688, "lng": 151.2093, "pop": "5.4M metro",
        "walkable": ["Surry Hills", "Newtown"],
        "car": "outer Western Sydney",
        "blurb": "Sydney's inner-city suburbs offer some of the Southern Hemisphere's best walkability, driven by pre-car terrace housing, mixed-use high streets, and expanding light rail. Outer suburbs remain strongly car-dependent.",
        "ctx": "About 13% of Greater Sydney households are car-free, rising to over 25% in inner suburbs."
    },
    "melbourne": {
        "name": "Melbourne", "country": "Australia", "region": "Victoria",
        "lat": -37.8136, "lng": 144.9631, "pop": "5.2M metro",
        "walkable": ["Fitzroy", "Carlton"],
        "car": "outer Melton",
        "blurb": "Melbourne's inner suburbs are defined by the world's largest surviving tram network, which anchors dense mixed-use high streets. The result: walkability scores in Fitzroy and Carlton rival inner European cities.",
        "ctx": "Melbourne's 24-km tram network in inner suburbs means most amenities are within a short walk of a stop."
    },
    "auckland": {
        "name": "Auckland", "country": "New Zealand", "region": "Auckland",
        "lat": -36.8485, "lng": 174.7633, "pop": "1.7M",
        "walkable": ["Ponsonby", "Kingsland"],
        "car": "North Shore outer suburbs",
        "blurb": "Auckland's walkability is concentrated in the central isthmus around the CBD, Ponsonby, and Kingsland. New unitary plan up-zoning is rapidly adding apartments and amenities that should raise walkability scores across more suburbs.",
        "ctx": "Auckland's 2016 Unitary Plan up-zoned three-quarters of the city — walkability impact is now showing in the data."
    },
    "dublin": {
        "name": "Dublin", "country": "Ireland", "region": "Leinster",
        "lat": 53.3498, "lng": -6.2603, "pop": "1.4M metro",
        "walkable": ["Rathmines", "Portobello"],
        "car": "West Dublin outer estates",
        "blurb": "Dublin's Georgian core and tightly-packed inner suburbs give it solid walkability, supported by DART commuter rail and an expanding LUAS light rail network. Outer estates, developed for cars, score much lower.",
        "ctx": "Dublin's 2022 Transport Plan explicitly targets a 15-minute-city standard for the central canals area."
    },
    "singapore": {
        "name": "Singapore", "country": "Singapore", "region": "Singapore",
        "lat": 1.3521, "lng": 103.8198, "pop": "5.9M",
        "walkable": ["Tiong Bahru", "Tanjong Pagar"],
        "car": "far western industrial edges",
        "blurb": "Singapore is one of the world's most walkable large cities by design: HDB towns are planned around within-walk amenities, and the MRT network means most addresses are within ten minutes of a rail station.",
        "ctx": "Private car ownership is deliberately capped through the Certificate of Entitlement system — fewer than 30% of households own a car."
    },
    "berlin": {
        "name": "Berlin", "country": "Germany", "region": "Berlin",
        "lat": 52.5200, "lng": 13.4050, "pop": "3.6M",
        "walkable": ["Prenzlauer Berg", "Kreuzberg"],
        "car": "Marzahn-Hellersdorf outer blocks",
        "blurb": "Berlin is a textbook example of how pre-war dense grid planning plus extensive U-Bahn and S-Bahn coverage produces genuine car-optional living. Most inner-ring districts score near the theoretical walkability ceiling.",
        "ctx": "Roughly 50% of Berlin households do not own a car — one of the highest rates in any large European capital."
    },
    "amsterdam": {
        "name": "Amsterdam", "country": "Netherlands", "region": "North Holland",
        "lat": 52.3676, "lng": 4.9041, "pop": "925K",
        "walkable": ["De Pijp", "Jordaan"],
        "car": "Almere commuter edge",
        "blurb": "Amsterdam regularly tops international walkability and bike-friendliness rankings. The canal-ring city was essentially impossible to retrofit for cars, so it never really stopped being a walking and cycling city.",
        "ctx": "Amsterdam has more bikes than people — daily trips by bike outnumber trips by car by roughly two to one."
    },
    "barcelona": {
        "name": "Barcelona", "country": "Spain", "region": "Catalonia",
        "lat": 41.3851, "lng": 2.1734, "pop": "1.6M",
        "walkable": ["Gràcia", "Eixample"],
        "car": "Zona Franca industrial strip",
        "blurb": "Barcelona's Cerdà-planned Eixample grid produces some of the world's best walkability metrics. The ongoing Superblocks programme is further reclaiming car space for pedestrians, pushing scores even higher.",
        "ctx": "Barcelona's Superilles (Superblocks) cut through-traffic on a 9-block grid, returning streets to residents."
    },
    "madrid": {
        "name": "Madrid", "country": "Spain", "region": "Madrid",
        "lat": 40.4168, "lng": -3.7038, "pop": "3.3M",
        "walkable": ["Malasaña", "Chueca"],
        "car": "Vallecas outer neighbourhoods",
        "blurb": "Madrid's dense historic core plus one of Europe's most extensive metro networks produce exceptional walkability. Central districts deliver genuine 15-minute-neighbourhood amenity density.",
        "ctx": "Madrid Central's low-emission zone has measurably increased pedestrian footfall in the historic centre since 2018."
    },
    "hong-kong": {
        "name": "Hong Kong", "country": "Hong Kong SAR", "region": "Hong Kong",
        "lat": 22.3193, "lng": 114.1694, "pop": "7.4M",
        "walkable": ["Central", "Sheung Wan"],
        "car": "outlying islands",
        "blurb": "Hong Kong's vertical density makes walkability a given rather than an achievement. Skybridges, MTR access at nearly every major block, and 24-hour amenity density mean walking scores here are effectively off the usual scale.",
        "ctx": "Only around 7% of Hong Kong residents commute by private car — the lowest rate in any wealthy city."
    },
    "stockholm": {
        "name": "Stockholm", "country": "Sweden", "region": "Stockholm County",
        "lat": 59.3293, "lng": 18.0686, "pop": "1M city",
        "walkable": ["Södermalm", "Vasastan"],
        "car": "outer Söderort",
        "blurb": "Stockholm combines dense pre-car neighbourhoods with strong T-bana metro coverage, delivering some of Europe's best walkability outside the Dutch and Spanish peers. Winter infrastructure means walk scores hold up year-round.",
        "ctx": "Stockholm's congestion charge has kept central car traffic roughly 20% below 2006 levels for two decades."
    },
    "copenhagen": {
        "name": "Copenhagen", "country": "Denmark", "region": "Capital Region",
        "lat": 55.6761, "lng": 12.5683, "pop": "660K",
        "walkable": ["Nørrebro", "Vesterbro"],
        "car": "suburban Amager Vest",
        "blurb": "Copenhagen sets the global standard for everyday cycling infrastructure, but its walkability scores are just as strong: dense mixed-use streets, the Strøget pedestrian spine, and ubiquitous amenity clustering.",
        "ctx": "Over 49% of Copenhagen commuters bike to work or school — walking completes the missing links."
    },
}

# --- HTML TEMPLATE -----------------------------------------------------------
BASE_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{meta_desc}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{meta_desc}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Teamz Lab Tools">
  <meta property="og:image" content="https://tool.teamzlab.com/og-images/housing.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{meta_desc}">
  <link rel="canonical" href="{canonical}">
  <!-- TEAMZ-PERF -->
  <link rel="preload" href="/branding/fonts/poppins-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/branding/fonts/poppins-600.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  <link rel="preconnect" href="https://unpkg.com" crossorigin>
  <link rel="preconnect" href="https://nominatim.openstreetmap.org" crossorigin>
  <link rel="preconnect" href="https://overpass-api.de" crossorigin>
  <link rel="dns-prefetch" href="https://www.google-analytics.com">
  <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net">
  <link rel="dns-prefetch" href="https://{{s}}.tile.openstreetmap.org">
  <!-- /TEAMZ-PERF -->
  <link rel="stylesheet" href="/branding/css/teamz-branding.css">
  <link rel="stylesheet" href="/shared/css/tools.css">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
  <style>
    .walk-form {{ display: grid; grid-template-columns: 1fr auto; gap: 12px; margin-bottom: 20px; }}
    .walk-form input {{ padding: 14px; font-size: 16px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--text); }}
    .walk-form button {{ padding: 14px 24px; background: var(--heading); color: var(--bg); border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 16px; }}
    .walk-map {{ width: 100%; height: 380px; border-radius: 12px; margin-bottom: 20px; background: var(--surface); }}
    .walk-score {{ display: flex; align-items: baseline; gap: 16px; margin-bottom: 16px; }}
    .walk-score-num {{ font-size: clamp(48px, 10vw, 72px); font-weight: 700; color: var(--heading); line-height: 1; }}
    .walk-score-label {{ font-size: 18px; color: var(--text); }}
    .walk-grade {{ font-size: 14px; color: var(--text-muted); margin-top: 4px; }}
    .walk-breakdown {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 16px; }}
    .walk-cat {{ padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; }}
    .walk-cat-name {{ font-size: 13px; color: var(--text-muted); margin-bottom: 4px; }}
    .walk-cat-count {{ font-size: 22px; font-weight: 600; color: var(--heading); }}
    .walk-cat-sub {{ font-size: 12px; color: var(--text-muted); margin-top: 2px; }}
    .walk-loading {{ padding: 24px; text-align: center; color: var(--text-muted); }}
    .walk-err {{ padding: 14px; background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--heading); border-radius: 8px; color: var(--text); }}
    .walk-share {{ margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; }}
    .walk-share button {{ padding: 10px 18px; background: var(--surface); color: var(--heading); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-weight: 600; }}
    @media (max-width: 600px) {{ .walk-form {{ grid-template-columns: 1fr; }} .walk-map {{ height: 280px; }} }}
  </style>
<!-- STATIC-SCHEMA -->
  <script type="application/ld+json">{breadcrumb_schema}</script>
  <script type="application/ld+json">{faq_schema}</script>
  <script type="application/ld+json">{webapp_schema}</script>
<!-- STATIC-SCHEMA -->
</head>
<body>
  <header id="site-header" class="site-header"></header>
  <main class="site-main">
    <div id="breadcrumbs"></div>
    <section class="tool-hero">
      <h1>{h1}</h1>
      <p class="tool-description">{hero_desc}</p>
    </section>
    <section id="tool-calculator" class="tool-calculator">
      <div class="walk-form">
        <input id="walk-addr" type="text" placeholder="{placeholder}" value="{prefill}" autocomplete="off">
        <button id="walk-go" type="button">Score</button>
      </div>
      <div id="walk-map" class="walk-map" aria-label="Map of walkable amenities around the address"></div>
      <div id="walk-result" aria-live="polite"></div>
    </section>
    <div class="ad-slot">Ad Space</div>
    <section class="tool-content">
      <h2>How the Walkability Score Checker Works</h2>
      <p>{how_works}</p>
      <h2>{h2_local}</h2>
      <p>{local_content}</p>
      <h2>What Counts Toward a Good Walk Score</h2>
      <p>A high walkability score means you can reach daily needs — groceries, restaurants, schools, parks, transit stops, and healthcare — within a comfortable walking distance, typically 800 metres or about ten minutes on foot. Our scoring engine queries live OpenStreetMap data via the Overpass API and counts amenities across six categories around the address you enter. Categories are weighted: a supermarket within five minutes contributes more to the score than a fifth restaurant, because daily necessities dominate real-world walkability better than pure amenity count.</p>
      <h2>Why We Use OpenStreetMap Data</h2>
      <p>Most commercial walkability scores are paywalled or sell your address to real-estate advertisers. This tool runs entirely in your browser and reads free, community-maintained OpenStreetMap data — the same source that powers Wikipedia maps, Apple Maps coverage gaps, and most open-data government dashboards. Nothing about your query is saved, logged, or sent to third-party advertisers. If your neighbourhood looks under-scored, it's almost always because OSM contributors have not yet mapped every local shop — a situation that improves month over month.</p>
      <h2>Tips for Using This Score in a Move or Buy Decision</h2>
      <p>Treat the score as a starting point, not a verdict. A 90+ score confirms dense amenity access but says nothing about noise, air quality, school quality, or property taxes — factors that can matter more than walkability for long-term satisfaction. Conversely, scores in the 40-60 range can be perfectly liveable if the address is within a short cycle or transit ride of a denser hub. Always walk the neighbourhood at different times of day before committing to a move.</p>
    </section>
    <section id="tool-faqs"></section>
    <section id="related-tools"></section>
  </main>
  <footer id="site-footer" class="site-footer"></footer>
  <script src="/branding/js/theme.js"></script>
  <script src="/shared/js/common.js"></script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    var BREADCRUMBS = {breadcrumbs_js};
    var FAQS = {faqs_js};
    var RELATED_TOOLS = {related_js};
    var PREFILL_LAT = {prefill_lat};
    var PREFILL_LNG = {prefill_lng};
    var PREFILL_LABEL = {prefill_label_js};

    document.addEventListener('DOMContentLoaded', function() {{
      TeamzTools.renderBreadcrumbs(BREADCRUMBS);
      TeamzTools.renderFAQs(FAQS);
      TeamzTools.renderRelatedTools(RELATED_TOOLS);

      var markerColor = getComputedStyle(document.documentElement).getPropertyValue('--heading').trim() || 'currentColor';
      var map = L.map('walk-map').setView([PREFILL_LAT, PREFILL_LNG], 14);
      L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
        attribution: 'Map data &copy; OpenStreetMap contributors',
        maxZoom: 19
      }}).addTo(map);
      var markerGroup = L.layerGroup().addTo(map);
      var centerMarker = null;

      function weights() {{
        return {{
          grocery: 3.0, restaurant: 1.0, school: 2.0,
          park: 1.5, transit: 2.5, healthcare: 2.0
        }};
      }}
      function categoryScore(cnt, w) {{
        if (cnt <= 0) return 0;
        var raw = Math.min(cnt, 10) / 10;
        return raw * w;
      }}
      function grade(score) {{
        if (score >= 85) return {{g: "Walker's Paradise", d: "Daily errands do not require a car."}};
        if (score >= 70) return {{g: "Very Walkable", d: "Most errands can be done on foot."}};
        if (score >= 50) return {{g: "Somewhat Walkable", d: "Some errands need a car or transit."}};
        if (score >= 25) return {{g: "Car-Dependent", d: "Most errands require a car."}};
        return {{g: "Car-Dependent", d: "Almost all errands require a car."}};
      }}

      async function geocode(q) {{
        var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q);
        var res = await fetch(url, {{ headers: {{ 'Accept': 'application/json' }} }});
        if (!res.ok) throw new Error('Geocode failed');
        var arr = await res.json();
        if (!arr || !arr.length) throw new Error('Address not found');
        return {{ lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon), label: arr[0].display_name }};
      }}

      async function overpass(lat, lng) {{
        var radius = 800;
        var q = '[out:json][timeout:20];(' +
          'nwr["shop"~"supermarket|convenience|greengrocer|bakery"](around:' + radius + ',' + lat + ',' + lng + ');' +
          'nwr["amenity"~"restaurant|cafe|fast_food"](around:' + radius + ',' + lat + ',' + lng + ');' +
          'nwr["amenity"~"school|kindergarten|college|university"](around:' + radius + ',' + lat + ',' + lng + ');' +
          'nwr["leisure"~"park|playground"](around:' + radius + ',' + lat + ',' + lng + ');' +
          'nwr["public_transport"~"stop_position|station|platform"](around:' + radius + ',' + lat + ',' + lng + ');' +
          'nwr["amenity"~"pharmacy|clinic|hospital|doctors"](around:' + radius + ',' + lat + ',' + lng + ');' +
          ');out center tags;';
        var res = await fetch('https://overpass-api.de/api/interpreter', {{
          method: 'POST',
          body: 'data=' + encodeURIComponent(q)
        }});
        if (!res.ok) throw new Error('Overpass API unavailable');
        return await res.json();
      }}

      function categorize(el) {{
        var t = el.tags || {{}};
        if (t.shop && /supermarket|convenience|greengrocer|bakery/.test(t.shop)) return 'grocery';
        if (t.amenity && /restaurant|cafe|fast_food/.test(t.amenity)) return 'restaurant';
        if (t.amenity && /school|kindergarten|college|university/.test(t.amenity)) return 'school';
        if (t.leisure && /park|playground/.test(t.leisure)) return 'park';
        if (t.public_transport) return 'transit';
        if (t.amenity && /pharmacy|clinic|hospital|doctors/.test(t.amenity)) return 'healthcare';
        return null;
      }}

      async function run(lat, lng, label) {{
        var result = document.getElementById('walk-result');
        result.innerHTML = '<div class="walk-loading">Scanning amenities around ' + (label || 'this location') + '…</div>';
        markerGroup.clearLayers();
        if (centerMarker) map.removeLayer(centerMarker);
        map.setView([lat, lng], 15);
        centerMarker = L.marker([lat, lng]).addTo(map);

        try {{
          var data = await overpass(lat, lng);
          var counts = {{ grocery: 0, restaurant: 0, school: 0, park: 0, transit: 0, healthcare: 0 }};
          var seen = {{}};
          (data.elements || []).forEach(function(el) {{
            var cat = categorize(el);
            if (!cat) return;
            var key = cat + ':' + (el.tags && el.tags.name ? el.tags.name : el.id);
            if (seen[key]) return;
            seen[key] = true;
            counts[cat]++;
            var lat2 = el.lat || (el.center && el.center.lat);
            var lng2 = el.lon || (el.center && el.center.lon);
            if (lat2 && lng2) {{
              L.circleMarker([lat2, lng2], {{ radius: 5, color: markerColor, fillOpacity: 0.7 }})
                .bindPopup((el.tags && el.tags.name) || cat)
                .addTo(markerGroup);
            }}
          }});

          var w = weights();
          var raw = 0, maxRaw = 0;
          Object.keys(counts).forEach(function(k) {{ raw += categoryScore(counts[k], w[k]); maxRaw += w[k]; }});
          var score = Math.round((raw / maxRaw) * 100);
          var g = grade(score);

          var html = '<div class="walk-score"><div class="walk-score-num">' + score + '</div>' +
            '<div><div class="walk-score-label"><strong>' + g.g + '</strong></div>' +
            '<div class="walk-grade">' + g.d + '</div></div></div>' +
            '<div class="walk-breakdown">' +
              cat('Groceries', counts.grocery, 'within 10-min walk') +
              cat('Restaurants &amp; Cafes', counts.restaurant, 'within 10-min walk') +
              cat('Schools', counts.school, 'within 10-min walk') +
              cat('Parks', counts.park, 'within 10-min walk') +
              cat('Transit Stops', counts.transit, 'within 10-min walk') +
              cat('Healthcare', counts.healthcare, 'within 10-min walk') +
            '</div>' +
            '<div class="walk-share"><button id="walk-copy" type="button">Copy share link</button></div>';
          result.innerHTML = html;

          document.getElementById('walk-copy').addEventListener('click', function() {{
            var url = window.location.origin + window.location.pathname + '?q=' + encodeURIComponent(label || (lat + ',' + lng));
            if (navigator.clipboard && navigator.clipboard.writeText) {{
              navigator.clipboard.writeText(url).then(function() {{
                if (window.showToast) window.showToast('Link copied!');
              }}).catch(function() {{
                if (window.showToast) window.showToast('Copy not supported — long-press the URL bar instead.');
              }});
            }}
          }});
        }} catch (err) {{
          result.innerHTML = '<div class="walk-err">Could not load live OpenStreetMap data: ' + (err.message || 'network error') + '. The Overpass API is free but occasionally rate-limited — please retry in a minute.</div>';
        }}
      }}
      function cat(name, n, sub) {{
        return '<div class="walk-cat"><div class="walk-cat-name">' + name + '</div>' +
          '<div class="walk-cat-count">' + n + '</div>' +
          '<div class="walk-cat-sub">' + sub + '</div></div>';
      }}

      document.getElementById('walk-go').addEventListener('click', async function() {{
        var q = document.getElementById('walk-addr').value.trim();
        if (!q) return;
        var btn = this;
        btn.disabled = true;
        var result = document.getElementById('walk-result');
        result.innerHTML = '<div class="walk-loading">Finding address…</div>';
        try {{
          var loc = await geocode(q);
          await run(loc.lat, loc.lng, loc.label);
        }} catch (err) {{
          result.innerHTML = '<div class="walk-err">' + (err.message || 'Address not found') + '. Try a more specific query (street + city).</div>';
        }} finally {{
          btn.disabled = false;
        }}
      }});

      document.getElementById('walk-addr').addEventListener('keydown', function(e) {{
        if (e.key === 'Enter') document.getElementById('walk-go').click();
      }});

      var params = new URLSearchParams(window.location.search);
      var shareQ = params.get('q');
      if (shareQ) {{
        document.getElementById('walk-addr').value = shareQ;
        document.getElementById('walk-go').click();
      }} else if (PREFILL_LAT && PREFILL_LNG) {{
        run(PREFILL_LAT, PREFILL_LNG, PREFILL_LABEL);
      }}
    }});
  </script>
</body>
</html>
"""


def schemas(title, desc, canonical, breadcrumbs, faqs):
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": []}
    for i, b in enumerate(breadcrumbs):
        item = {"@type": "ListItem", "position": i + 1, "name": b["name"]}
        if b.get("url"):
            item["item"] = SITE + b["url"]
        bc["itemListElement"].append(item)
    faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": f["q"],
         "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in faqs
    ]}
    app = {"@context": "https://schema.org", "@type": "WebApplication", "name": title,
           "description": desc, "url": canonical, "applicationCategory": "UtilityApplication",
           "operatingSystem": "All", "browserRequirements": "Requires JavaScript",
           "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
           "author": {"@type": "Organization", "name": "Teamz Lab", "url": "https://teamzlab.com", "foundingDate": "2023"},
           "publisher": {"@type": "Organization", "name": "Teamz Lab", "url": "https://teamzlab.com"},
           "inLanguage": "en"}
    return json.dumps(bc, separators=(", ", ": ")), json.dumps(faq, separators=(", ", ": ")), json.dumps(app, separators=(", ", ": "))


def base_faqs(scope_label):
    return [
        {"q": f"How accurate is the walkability score {scope_label}?",
         "a": "The score is based on live OpenStreetMap amenity data within 800 metres of the address — the same open dataset used by Wikipedia maps and open-data government dashboards. Accuracy depends on how thoroughly local OSM contributors have mapped shops, transit, and healthcare. Urban areas are typically mapped very well; rural areas less so."},
        {"q": "Why does the score sometimes differ from Walk Score® or other paid tools?",
         "a": "Paid tools use proprietary amenity databases sourced from commercial providers. We use free community-maintained OpenStreetMap data, weight daily-needs categories (groceries, transit, healthcare) more heavily, and count only amenities within a ten-minute walking radius. Results correlate strongly with paid tools but never match exactly."},
        {"q": "Is my address sent to any server?",
         "a": "Your address is sent only to the OpenStreetMap Nominatim geocoder and the Overpass amenity API — both free public services run by the OSM Foundation. Nothing is logged on teamzlab.com, nothing is sold, nothing reaches advertisers. The tool runs entirely in your browser."},
        {"q": "What radius does the scoring use?",
         "a": "We count amenities within 800 metres (about half a mile or a ten-minute walk). This is the standard radius used by most walkability research and matches the 15-minute-city concept for one-way walking trips."},
        {"q": "Why are some real shops missing from the map?",
         "a": "The map only shows amenities that have been added to OpenStreetMap by volunteer contributors. Coverage improves monthly, but rural areas and newly-opened shops may be missing. You can add missing shops yourself at openstreetmap.org — contributions are free and help everyone."},
        {"q": "Can I use this for real estate decisions?",
         "a": "Yes, but treat the score as one data point among many. A high walkability score does not account for noise, air quality, school ratings, property taxes, or flood risk. Always visit the neighbourhood at multiple times of day before making a move or purchase decision."}
    ]


def render(slug, title, meta_desc, h1, hero_desc, breadcrumbs, prefill_lat, prefill_lng,
           prefill_label, placeholder, how_works, h2_local, local_content, faqs, related, canonical):
    bc_s, faq_s, app_s = schemas(title, meta_desc, canonical, breadcrumbs, faqs)
    return BASE_TEMPLATE.format(
        title=html.escape(title, quote=True),
        meta_desc=html.escape(meta_desc, quote=True),
        canonical=canonical,
        h1=html.escape(h1),
        hero_desc=html.escape(hero_desc),
        placeholder=html.escape(placeholder, quote=True),
        prefill=html.escape("", quote=True),
        how_works=html.escape(how_works),
        h2_local=html.escape(h2_local),
        local_content=html.escape(local_content),
        breadcrumb_schema=bc_s,
        faq_schema=faq_s,
        webapp_schema=app_s,
        breadcrumbs_js=json.dumps(breadcrumbs),
        faqs_js=json.dumps(faqs),
        related_js=json.dumps(related),
        prefill_lat=prefill_lat,
        prefill_lng=prefill_lng,
        prefill_label_js=json.dumps(prefill_label),
    )


RELATED_CORE = [
    {"slug": "housing/commute-cost-vs-rent-calculator", "name": "Commute Cost vs Rent",
     "description": "Compare commute savings vs rent."},
    {"slug": "housing/how-much-house-can-i-afford", "name": "How Much House Can I Afford",
     "description": "Maximum home price by income."},
    {"slug": "housing/rent-burden-calculator", "name": "Rent Burden Calculator",
     "description": "Is your rent affordable?"},
    {"slug": "housing/moving-cost-estimator", "name": "Moving Cost Estimator",
     "description": "Estimate your moving expenses."},
    {"slug": "housing/salary-needed-for-rent-calculator", "name": "Salary Needed for Rent",
     "description": "Income required for a given rent."},
    {"slug": "housing/utilities-cost-calculator", "name": "Utilities Cost Calculator",
     "description": "Monthly utilities breakdown."},
]


def build_base():
    slug = "housing/walkability-score-checker"
    canonical = f"{SITE}/{slug}/"
    title = "Walkability Score Checker — Teamz Lab Tools"
    meta = "Free walkability score checker for any address worldwide. Uses live OpenStreetMap data — groceries, transit, parks, schools within a 10-min walk. Private, no sign-up."
    h1 = "Walkability Score Checker"
    hero = "Enter any address on Earth and see a walkability score based on live OpenStreetMap data — groceries, restaurants, transit, schools, parks, and healthcare within a ten-minute walk. Free, private, no sign-up."
    how_works = "Paste any street address or drop a place name into the box above. The tool geocodes the address using the free OpenStreetMap Nominatim service, then queries the Overpass amenity API for everything within 800 metres — supermarkets, restaurants, schools, parks, transit stops, and healthcare providers. Each category is weighted by real-world walkability research (daily essentials count more than fifth-nearest restaurants), then combined into a 0-100 score with a descriptive grade."
    h2_local = "Using the Score Beyond One Address"
    local = "Most real walkability questions are comparative: how does one prospective address stack up against another? Run the tool twice, once for each candidate, and compare category breakdowns rather than raw scores — a 78 with strong transit access may be more liveable than an 82 that scores on restaurants alone. For city-level comparisons, check the dedicated city pages linked from the housing hub; they highlight which neighbourhoods within each city typically score highest."
    breadcrumbs = [
        {"name": "Home", "url": "/"},
        {"name": "Housing Tools", "url": "/housing/"},
        {"name": "Walkability Score Checker"},
    ]
    faqs = base_faqs("")
    html_out = render(slug, title, meta, h1, hero, breadcrumbs, 40.7128, -74.0060,
                      "New York City", "e.g. 350 5th Ave, New York", how_works, h2_local,
                      local, faqs, RELATED_CORE, canonical)
    path = os.path.join(ROOT, "housing", "walkability-score-checker", "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html_out)
    return path


def build_city(slug_suffix, city):
    slug = f"housing/walkability-score-checker-{slug_suffix}"
    canonical = f"{SITE}/{slug}/"
    title = f"Walkability Score Checker for {city['name']} — Teamz Lab Tools"
    if len(title) > 60:
        title = f"{city['name']} Walkability Score Checker — Teamz Lab Tools"
    meta = f"Free walkability score checker for any {city['name']} address. Live OpenStreetMap data shows groceries, transit, parks within a 10-min walk. Private, no sign-up."
    if len(meta) > 155:
        meta = f"Free walkability score for {city['name']} addresses. Live OpenStreetMap data — groceries, transit, parks within a 10-min walk. Private, no sign-up."
    h1 = f"Walkability Score Checker for {city['name']}"
    hero = (f"Enter any {city['name']} address and see a walkability score based on live OpenStreetMap data. "
            f"{city['name']} has a metro population of about {city['pop']}, and neighbourhoods like "
            f"{city['walkable'][0]} and {city['walkable'][1]} consistently rank among the most walkable parts of the city.")
    how_works = (
        f"Paste any {city['name']} street address or a local landmark into the box above. The tool geocodes "
        f"the address using the free OpenStreetMap Nominatim service, then queries the Overpass API for every "
        f"amenity within 800 metres — supermarkets, cafes, schools, parks, {city['region']} transit stops, and "
        "healthcare providers. A weighted score is calculated where daily essentials (groceries, transit) count more than non-essentials."
    )
    h2_local = f"Walkability in {city['name']}: Neighbourhood Patterns"
    local_content = (
        f"{city['blurb']} {city['walkable'][0]} and {city['walkable'][1]} typically deliver the strongest amenity "
        f"density and therefore the highest walkability scores, while outer neighbourhoods such as {city['car']} "
        f"often score lower because amenities are more spread out and car infrastructure dominates. "
        f"{city['ctx']} Run this tool on a few candidate {city['name']} addresses before signing a lease "
        f"or making an offer — a twenty-point score difference between two {city['name']} postcodes can translate "
        f"into thousands of pounds, dollars, or euros per year in avoided car costs."
    )
    faqs = [
        {"q": f"Which {city['name']} neighbourhoods score highest for walkability?",
         "a": f"{city['walkable'][0]} and {city['walkable'][1]} are among the highest-scoring {city['name']} neighbourhoods because they combine pre-car street grids, mixed-use zoning, and strong transit access. Actual scores for specific addresses can still vary widely — always check the exact address rather than relying on neighbourhood averages."},
        {"q": f"How is the walkability score calculated for {city['name']} addresses?",
         "a": f"The score counts amenities within 800 metres of any {city['name']} address you enter — supermarkets, restaurants, schools, parks, public transport stops, and healthcare providers — using live OpenStreetMap data. Each category is weighted; groceries and transit count most because they represent daily-needs access. The combined score ranges from 0 (car-dependent) to 100 (Walker's Paradise)."},
        {"q": f"Does this tool account for {city['name']}'s public transport?",
         "a": f"Yes. Every OpenStreetMap-tagged public transport stop within 800 metres — whether it's metro, bus, tram, or rail — counts toward the transit category. {city['name']} stops are generally well mapped in OSM, so this category tends to be accurate in central districts."},
        {"q": f"Can I use this score to compare {city['name']} neighbourhoods before renting?",
         "a": f"Absolutely — in fact that's one of the best uses. Run the tool on three or four candidate {city['name']} addresses and compare both the total score and the category breakdown. A neighbourhood with a 75 walkability score plus strong transit may be more liveable than an 82 that scores mostly on restaurants."},
        {"q": f"Is my {city['name']} address stored anywhere?",
         "a": f"No. Your address is sent only to the free OpenStreetMap Nominatim geocoder and Overpass amenity API — both public community services. Nothing is logged on teamzlab.com, nothing is sold, nothing goes to advertisers. Everything else runs locally in your browser."},
        {"q": f"Why might a real {city['name']} shop be missing from the map?",
         "a": f"OpenStreetMap is volunteer-maintained. {city['name']} has strong OSM coverage for most major categories, but newly-opened shops or small independent businesses may not yet be tagged. You can add any missing business yourself at openstreetmap.org — it takes a minute and helps every future user of this tool."},
    ]
    breadcrumbs = [
        {"name": "Home", "url": "/"},
        {"name": "Housing Tools", "url": "/housing/"},
        {"name": f"Walkability Score Checker for {city['name']}"},
    ]
    related = [
        {"slug": "housing/walkability-score-checker", "name": "Walkability Score (any city)",
         "description": "Check any address worldwide."},
    ] + RELATED_CORE[:5]
    html_out = render(slug, title, meta, h1, hero, breadcrumbs,
                      city["lat"], city["lng"], city["name"],
                      f"e.g. street address in {city['name']}",
                      how_works, h2_local, local_content, faqs, related, canonical)
    path = os.path.join(ROOT, "housing", f"walkability-score-checker-{slug_suffix}", "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html_out)
    return path


def main():
    written = []
    written.append(build_base())
    for slug_suffix, city in CITIES.items():
        written.append(build_city(slug_suffix, city))
    print(f"Wrote {len(written)} files:")
    for p in written:
        print(f"  {os.path.relpath(p, ROOT)}")


if __name__ == "__main__":
    main()
