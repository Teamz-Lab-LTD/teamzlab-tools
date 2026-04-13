#!/usr/bin/env python3
"""
Generate 9 DNQP Expertenstandards landing pages + hub index for the German market.

Run: python3 build-expertenstandards.py
Output: /apps/always-ready-care/de/expertenstandards/<slug>/index.html + hub index.
"""
import os, json, html

BASE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE, 'de', 'expertenstandards')
BASE_URL = 'https://tool.teamzlab.com/apps/always-ready-care/de/expertenstandards'

# 9 DNQP Expertenstandards — official order, current versions
STANDARDS = [
    {
        'slug': 'dekubitusprophylaxe',
        'name': 'Dekubitusprophylaxe in der Pflege',
        'short': 'Dekubitusprophylaxe',
        'keyword': 'expertenstandard dekubitusprophylaxe',
        'version': '2. Aktualisierung 2017',
        'qpr': 'QB 2 — Krankheits-/Therapieanforderungen',
        'qpr_code': 'QB 2',
        'intro': 'Der Expertenstandard Dekubitusprophylaxe des DNQP ist die zentrale fachliche Grundlage zur Vorbeugung von Druckgeschwüren in deutschen Pflegeeinrichtungen. Er richtet sich an alle beruflich Pflegenden in stationären und ambulanten Einrichtungen.',
        'why': 'Dekubitus ist einer der sensibelsten Indikatoren in der indikatorengestützten Qualitätsprüfung des MD. Neu aufgetretene Dekubitalgeschwüre führen regelmäßig zu Beanstandungen und fließen als Qualitätsindikator in die Prüfergebnisse ein.',
        'tools': 'Braden-Skala, Waterlow-Skala, Norton-Skala — standardisierte Risikoeinschätzung. Bewegungspläne nach individuellem Bedarf (z. B. 30°-Lagerung, Mikrobewegung).',
        'requirements': [
            ('Risikoeinschätzung', 'Bei Pflegebeginn und bei jeder Zustandsänderung mit standardisiertem Instrument (z. B. Braden).'),
            ('Bewegungsförderung', 'Individueller Bewegungsplan für jeden Bewohner mit Dekubitusrisiko.'),
            ('Druckverteilung', 'Einsatz von druckverteilenden Hilfsmitteln entsprechend Risikostufe.'),
            ('Hautinspektion', 'Regelmäßige Inspektion gefährdeter Körperstellen, Dokumentation im Verlauf.'),
            ('Ernährungs- & Flüssigkeitsstatus', 'Assessment als Risikofaktor, Maßnahmen bei Mangel.'),
            ('Information & Beratung', 'Bewohner und Angehörige über Risiko und Maßnahmen aufklären.'),
            ('Auswertung & Anpassung', 'Wirksamkeit der Maßnahmen regelmäßig evaluieren und dokumentieren.')
        ],
        'faqs': [
            ('Ab wann gilt ein Bewohner als dekubitusgefährdet?', 'Sobald das standardisierte Assessment (z. B. Braden-Skala Score ≤ 18) ein Risiko anzeigt — unabhängig von sichtbaren Hautveränderungen. Die Einschätzung erfolgt individuell, nicht schematisch.'),
            ('Wie oft muss umgelagert werden?', 'Der Expertenstandard schreibt keine starre Frequenz vor. Maßgeblich ist der individuelle Bewegungsplan basierend auf Risiko, Hautzustand und Eigenmobilität. Typisch: 2–4 Stunden bei Hochrisiko, häufiger bei sichtbarer Rötung.'),
            ('Welche Assessments erkennt der MD an?', 'Braden, Waterlow und Norton sind etabliert. Wichtig: konsistente Anwendung, nachvollziehbare Dokumentation und Ableitung konkreter Maßnahmen aus dem Score.')
        ]
    },
    {
        'slug': 'sturzprophylaxe',
        'name': 'Sturzprophylaxe in der Pflege',
        'short': 'Sturzprophylaxe',
        'keyword': 'expertenstandard sturzprophylaxe',
        'version': '2. Aktualisierung 2022',
        'qpr': 'QB 1 — Mobilität & Selbstversorgung',
        'qpr_code': 'QB 1',
        'intro': 'Der Expertenstandard Sturzprophylaxe des DNQP beschreibt, wie Pflegeeinrichtungen systematisch Stürze verhindern und die Mobilität ihrer Bewohner erhalten. Er ist einer der am häufigsten geprüften Standards in der MD-Prüfung.',
        'why': 'Stürze zählen zu den häufigsten Pflegeproblemen und sind direkter Qualitätsindikator (QDVS). Jeder Sturz mit Folgen muss dokumentiert, analysiert und in Maßnahmen überführt werden.',
        'tools': 'Sturzrisiko-Assessment (z. B. Tinetti-Test, Timed-Up-and-Go), Sturzprotokoll, Sturzrisikokarte, Bewegungsförderungsplan.',
        'requirements': [
            ('Sturzrisikoeinschätzung', 'Bei Einzug, nach jedem Sturz und bei Zustandsänderung.'),
            ('Individueller Bewegungsplan', 'Ressourcenorientierte Maßnahmen zur Mobilitätserhaltung.'),
            ('Umgebungsanpassung', 'Stolperfallen entfernen, Licht, Haltegriffe, sicheres Schuhwerk.'),
            ('Sturzprotokoll', 'Jeder Sturz dokumentiert mit Hergang, Zeit, Ort, Folgen und Maßnahmen.'),
            ('Medikationsreview', 'Sturzfördernde Medikamente (Sedativa, Blutdrucksenker) ärztlich prüfen lassen.'),
            ('Information & Beratung', 'Bewohner und Angehörige einbeziehen, Aufklärung über Risiken.'),
            ('Kontinuierliche Evaluation', 'Wirksamkeit prüfen, Plan anpassen, QM-Rückkopplung.')
        ],
        'faqs': [
            ('Wie oft muss das Sturzrisiko neu eingeschätzt werden?', 'Bei Einzug, nach jedem Sturz und bei Zustandsveränderungen (z. B. neue Medikation, Operation, Demenzprogress). Eine starre Jahresfrequenz reicht nicht.'),
            ('Sind freiheitsentziehende Maßnahmen Sturzprophylaxe?', 'Nein. FEM (Bettgitter, Gurte) sind letztes Mittel, richterlich genehmigungspflichtig und keine Prophylaxe. Der Expertenstandard fordert ressourcenorientierte, freiheitserhaltende Alternativen.'),
            ('Was erwartet der MD bei der Sturzprotokollierung?', 'Vollständige Erfassung jedes Sturzes mit Hergang, Verletzungsfolgen, Ursachenanalyse und konkreten Ableitungen für die weitere Pflege.')
        ]
    },
    {
        'slug': 'schmerzmanagement',
        'name': 'Schmerzmanagement in der Pflege',
        'short': 'Schmerzmanagement',
        'keyword': 'expertenstandard schmerzmanagement',
        'version': 'Akuter Schmerz 2020 / Chronischer Schmerz 2020',
        'qpr': 'QB 2 — Krankheits-/Therapieanforderungen',
        'qpr_code': 'QB 2',
        'intro': 'Der Expertenstandard Schmerzmanagement umfasst zwei Teile: akuter Schmerz und chronischer Schmerz. Ziel ist eine systematische, evidenzbasierte Schmerzerfassung und -linderung in allen Pflegesettings.',
        'why': 'Unbehandelter Schmerz ist sowohl medizinisch als auch ethisch ein Kernproblem. Der MD prüft explizit, ob Schmerz standardisiert erfasst, dokumentiert und wirksam behandelt wird — besonders bei demenzerkrankten Bewohnern.',
        'tools': 'NRS (numerische Rating-Skala), VAS (visuelle Analogskala), BESD (bei Demenz), ECPA, Schmerztagebuch.',
        'requirements': [
            ('Schmerzassessment', 'Bei Pflegebeginn und regelmäßig — mit Instrument passend zur Kognition.'),
            ('BESD/ECPA bei Demenz', 'Fremdeinschätzung über Beobachtung bei nicht verbal auskunftsfähigen Bewohnern.'),
            ('Schmerzmanagementplan', 'Individueller Plan mit Medikation, nicht-medikamentösen Maßnahmen, Evaluation.'),
            ('Bedarfsmedikation', 'Eindeutige ärztliche Anordnung, dokumentierte Gabe und Wirkungsevaluation.'),
            ('Interprofessionelle Abstimmung', 'Regelmäßige Abstimmung mit Arzt/Palliativteam.'),
            ('Schulung', 'Pflegepersonal regelmäßig zu Schmerzerfassung und -behandlung qualifizieren.'),
            ('Dokumentation im Verlauf', 'Schmerz-Scores und Wirkung über Zeit erkennbar, nicht nur Momentaufnahmen.')
        ],
        'faqs': [
            ('Welches Instrument bei Demenzerkrankten?', 'BESD (Beurteilung von Schmerzen bei Demenz) oder ECPA. Beide sind Fremdeinschätzungsinstrumente über Beobachtung von Mimik, Körperhaltung, Lautäußerungen und sozialem Verhalten.'),
            ('Wie oft muss Schmerz erfasst werden?', 'Mindestens einmal pro Schicht bei bekannten Schmerzen, zusätzlich vor/nach schmerzhaften Pflegehandlungen und nach Bedarfsmedikation zur Wirkungsevaluation.'),
            ('Gilt der Standard auch bei akutem Schmerz nach Sturz?', 'Ja. Der Teilstandard „Akuter Schmerz" deckt Situationen nach Operationen, Unfällen, Stürzen oder akuten Erkrankungen ab.')
        ]
    },
    {
        'slug': 'ernaehrungsmanagement',
        'name': 'Ernährungsmanagement in der Pflege',
        'short': 'Ernährungsmanagement',
        'keyword': 'expertenstandard ernährungsmanagement',
        'version': '1. Aktualisierung 2017',
        'qpr': 'QB 1 — Mobilität & Selbstversorgung',
        'qpr_code': 'QB 1',
        'intro': 'Der Expertenstandard Ernährungsmanagement zielt auf die Sicherung und Förderung der oralen Ernährung in der Pflege. Er ist zentrales Instrument zur Vermeidung von Mangelernährung und Dehydratation.',
        'why': 'Mangelernährung ist Qualitätsindikator in der indikatorengestützten Prüfung. Ungewollter Gewichtsverlust über 5 % in drei Monaten oder 10 % in sechs Monaten gilt als Warnzeichen und muss erfasst werden.',
        'tools': 'MNA-SF (Mini Nutritional Assessment Short Form), Trinkprotokoll, Ernährungsprotokoll, BMI-Verlauf, Gewichtskontrolle.',
        'requirements': [
            ('Ernährungsscreening', 'Bei Einzug und regelmäßig (3–6 Monate) mit MNA-SF oder vergleichbarem Instrument.'),
            ('Gewichts- & BMI-Verlauf', 'Kontinuierliche Dokumentation, Abweichungen (≥ 5 %) dokumentieren.'),
            ('Individueller Ernährungsplan', 'Bei Risiko mit Diätassistent/Arzt abgestimmter Plan.'),
            ('Trink- und Essprotokoll', 'Bei gefährdeten Bewohnern quantitative Erfassung.'),
            ('Essumgebung', 'Ruhige Atmosphäre, angemessene Essenszeiten, individuelle Hilfsmittel.'),
            ('Kaugerechte Kost & Schlucken', 'Konsistenzanpassung, ggf. logopädisches Assessment.'),
            ('Evaluation', 'Wirksamkeit der Maßnahmen (Gewicht, Trinkmenge) im Verlauf bewerten.')
        ],
        'faqs': [
            ('Welche Mangelernährungszeichen erfasst der MD?', 'Ungewollter Gewichtsverlust, BMI unter 20, sichtbar verminderte Nahrungsaufnahme, reduzierte Trinkmenge, Kau-/Schluckprobleme ohne dokumentierte Intervention.'),
            ('Muss jeder Bewohner ein Trinkprotokoll haben?', 'Nein. Nur bei festgestelltem Risiko (z. B. Demenz, Schluckstörung, festgestellter reduzierter Zufuhr). Flächendeckend ist nicht vorgegeben.'),
            ('Was tun bei Verweigerung von Nahrungsaufnahme?', 'Ursachenanalyse, Arztkonsultation, Alternativen anbieten (Anreicherung, Wunschkost, Trinknahrung), Palliativkontext beachten und dokumentieren.')
        ]
    },
    {
        'slug': 'kontinenzfoerderung',
        'name': 'Förderung der Harnkontinenz in der Pflege',
        'short': 'Kontinenzförderung',
        'keyword': 'expertenstandard kontinenzförderung',
        'version': '1. Aktualisierung 2014',
        'qpr': 'QB 1 — Mobilität & Selbstversorgung',
        'qpr_code': 'QB 1',
        'intro': 'Der Expertenstandard Kontinenzförderung beschreibt, wie Pflegekräfte Harnkontinenz erhalten oder wiederherstellen und mit Inkontinenz fachgerecht umgehen.',
        'why': 'Kontinenz ist ein direkt lebensqualitätsrelevanter Bereich. Der MD prüft, ob standardisiert eingeschätzt, individuell gefördert und mit angemessenen Hilfsmitteln versorgt wird — statt pauschaler Windelversorgung.',
        'tools': 'Miktionsprotokoll, Kontinenzprofil nach DNQP (6 Profile von Kontinenz bis abhängig kompensierte Inkontinenz), Beckenbodentraining, Toilettentraining.',
        'requirements': [
            ('Kontinenzeinschätzung', 'Zuordnung zum Kontinenzprofil (1–6) bei Einzug und bei Veränderungen.'),
            ('Ursachenanalyse', 'Unterscheidung Belastungs-, Drang-, Mischinkontinenz, neurogen.'),
            ('Individueller Förderplan', 'Mit konkreten Interventionen und Zielen je Profil.'),
            ('Toilettentraining', 'Geplante Toilettengänge nach individuellem Rhythmus.'),
            ('Hilfsmittel angepasst', 'Saugstärke, Form und Wechselintervall an Bedarf, nicht Routine.'),
            ('Beratung & Information', 'Bewohner, Angehörige, interprofessionelles Team einbeziehen.'),
            ('Wirksamkeitsprüfung', 'Kontinenzprofil im Verlauf, Ziele regelmäßig überprüfen.')
        ],
        'faqs': [
            ('Was ist das Kontinenzprofil?', 'Eine sechsstufige Klassifikation (1 = kontinent bis 6 = abhängig kompensierte Inkontinenz), die individuelle Bedarfe und Ressourcen beschreibt und den Pflegeplan steuert.'),
            ('Sind Windeln Standard bei Inkontinenz?', 'Nein. Der Expertenstandard fordert individuelle Förderung und Hilfsmittel nach Bedarf, nicht pauschale Versorgung. Fehlende Differenzierung wird vom MD beanstandet.'),
            ('Wer erstellt den Förderplan?', 'Pflegefachkraft in Absprache mit Arzt, bei Bedarf Uro-Gynäkologen oder spezialisierter Kontinenzberatung.')
        ]
    },
    {
        'slug': 'wundversorgung',
        'name': 'Pflege von Menschen mit chronischen Wunden',
        'short': 'Chronische Wunden',
        'keyword': 'expertenstandard chronische wunden',
        'version': '2. Aktualisierung 2015',
        'qpr': 'QB 2 — Krankheits-/Therapieanforderungen',
        'qpr_code': 'QB 2',
        'intro': 'Der Expertenstandard chronische Wunden umfasst Dekubitus, Ulcus cruris venosum und diabetisches Fußsyndrom. Er steuert fachgerechte Versorgung, Dokumentation und interdisziplinäre Zusammenarbeit.',
        'why': 'Chronische Wunden sind ein Hochrisikobereich für MD-Beanstandungen. Fehlende Wunddokumentation mit Fotos, ungeeignete Verbandsmaterialien und fehlende Ursachenbehandlung sind typische Prüfergebnisse.',
        'tools': 'Wundassessment (Größe, Tiefe, Exsudat, Umgebung, Geruch), Fotodokumentation, W.A.R.-Score, Ursachenanalyse, phasengerechte Wundversorgung (Exsudation/Granulation/Epithelisierung).',
        'requirements': [
            ('Wundassessment', 'Standardisierte Einschätzung mit Foto bei Aufnahme und regelmäßig.'),
            ('Ursachendiagnostik', 'Arzt/Facharzt einbeziehen: venös, arteriell, Druck, Diabetes.'),
            ('Phasengerechte Versorgung', 'Verbandsmaterial nach Wundphase, nicht nach Routine.'),
            ('Wunddokumentation', 'Größe, Tiefe, Exsudat, Wundrand, Umgebung — mit Foto und Datum.'),
            ('Schmerzmanagement', 'Vor/nach Verbandswechsel, dokumentiert nach Schmerz-Expertenstandard.'),
            ('Ernährung', 'Unterstützung der Wundheilung durch adäquate Ernährung und Flüssigkeit.'),
            ('Schulung & Beratung', 'Bewohner, Angehörige und Personal zur Wundpflege schulen.')
        ],
        'faqs': [
            ('Wann gilt eine Wunde als chronisch?', 'In der Regel nach 4–12 Wochen ohne Heilungstendenz bzw. wenn zugrundeliegende Erkrankungen (Diabetes, CVI, pAVK) die Heilung behindern.'),
            ('Muss jede Wunde fotografiert werden?', 'Der Expertenstandard fordert standardisierte Verlaufsdokumentation. Fotografie ist de-facto-Standard zur objektiven Dokumentation und wird vom MD erwartet.'),
            ('Wer darf Wundversorgung delegieren?', 'Ärztlich verordnete Wundversorgung wird in der Regel an Pflegefachkräfte delegiert — inklusive entsprechender Qualifikation (Wundexperte ICW o. ä. empfehlenswert).')
        ]
    },
    {
        'slug': 'entlassungsmanagement',
        'name': 'Entlassungsmanagement in der Pflege',
        'short': 'Entlassungsmanagement',
        'keyword': 'expertenstandard entlassungsmanagement',
        'version': '2. Aktualisierung 2019',
        'qpr': 'QB 5 — Fachliche Anforderungen',
        'qpr_code': 'QB 5',
        'intro': 'Der Expertenstandard Entlassungsmanagement sichert die kontinuierliche Versorgung beim Übergang aus dem Krankenhaus in die häusliche oder stationäre Pflege — oder umgekehrt.',
        'why': 'Übergänge sind die häufigsten Ursachen für Informationsverluste, Medikationsfehler und Versorgungsbrüche. Der MD prüft den Übergang und die interprofessionelle Zusammenarbeit.',
        'tools': 'Überleitungsbogen, Entlassungsmanagement-Assessment, Medikationsabgleich, Hilfsmittel-Versorgungskoordination.',
        'requirements': [
            ('Assessment bei Aufnahme', 'Früherkennung von Überleitungsbedarf — Unterstützungsbedarf, soziales Umfeld, Ressourcen.'),
            ('Entlassungsplanung', 'Frühzeitig begonnen, mit Bewohner und Angehörigen abgestimmt.'),
            ('Information & Beratung', 'Umfassende Aufklärung zu Pflege, Medikation, Hilfsmitteln, Nachsorge.'),
            ('Überleitungsbogen', 'Vollständige Weitergabe pflegerelevanter Informationen (nach Expertenstandard).'),
            ('Medikationsabgleich', 'Aktuelle Medikation bei Übergabe abgleichen, Veränderungen dokumentieren.'),
            ('Koordination', 'Hilfsmittel, häusliche Pflege, Pflegedienst rechtzeitig organisiert.'),
            ('Evaluation', 'Rückmeldungsprozess mit nachversorgender Einrichtung etablieren.')
        ],
        'faqs': [
            ('Gilt der Standard auch für die Verlegung zwischen Pflegeeinrichtungen?', 'Ja. Jeder Wechsel des Versorgungssettings — Krankenhaus → Pflegeheim, Pflegeheim → ambulant, Kurzzeitpflege → stationär — fällt unter den Standard.'),
            ('Welche Informationen gehören in den Überleitungsbogen?', 'Medikation, Hilfsmittel, aktuelle Pflegeprobleme, Ressourcen, SIS-Themenfelder, Kontaktdaten, ärztliche Verordnungen, Wundstatus, Schmerzanamnese.'),
            ('Wer ist verantwortlich?', 'Die jeweils entlassende Einrichtung. Pflegefachkraft mit entsprechender Qualifikation koordiniert, Pflegedienstleitung verantwortet den Prozess.')
        ]
    },
    {
        'slug': 'demenz',
        'name': 'Beziehungsgestaltung in der Pflege von Menschen mit Demenz',
        'short': 'Demenz',
        'keyword': 'expertenstandard demenz',
        'version': '1. Auflage 2018',
        'qpr': 'QB 4 — Besondere Versorgungssituationen',
        'qpr_code': 'QB 4',
        'intro': 'Der Expertenstandard Beziehungsgestaltung in der Pflege von Menschen mit Demenz richtet den Fokus auf personzentrierte Pflege und therapeutische Beziehung — statt nur auf medizinisch-funktionale Versorgung.',
        'why': 'Rund zwei Drittel der Heimbewohner haben eine Demenzerkrankung. Der MD prüft, wie personzentriert gearbeitet wird, ob Biografie einbezogen und herausforderndes Verhalten professionell begleitet wird.',
        'tools': 'Biografiearbeit, Validation (nach Feil), DCM (Dementia Care Mapping), Mäeutik, Lebensweltorientierung, Assessments wie MMSE/DemTect zur Einschätzung der kognitiven Situation.',
        'requirements': [
            ('Biografische Anamnese', 'Lebensgeschichte, Gewohnheiten, Vorlieben, Abneigungen dokumentiert.'),
            ('Personzentrierter Pflegeplan', 'Bedürfnisorientierte Maßnahmen statt Standardablauf.'),
            ('Beziehungsgestaltung', 'Kontinuierliche Bezugspflege soweit möglich, Tagesstruktur an Gewohnheit.'),
            ('Herausforderndes Verhalten', 'Assessment (NPI-NH, CMAI), Ursachenanalyse, nicht-medikamentöse Interventionen zuerst.'),
            ('Kommunikationsansatz', 'Validation/Mäeutik, wertschätzende Kommunikation, nonverbale Signale.'),
            ('Angehörigenarbeit', 'Einbeziehung in Versorgungsgestaltung und Entscheidungen.'),
            ('Schulung des Teams', 'Regelmäßige Fortbildung zu Demenz, Kommunikation und Ethik.')
        ],
        'faqs': [
            ('Was ist personzentrierte Pflege?', 'Ein Ansatz nach Tom Kitwood: der Mensch mit Demenz steht mit seiner Biografie, Persönlichkeit und Bedürfnissen im Mittelpunkt — nicht die Diagnose. Psychosoziale Bedürfnisse gelten gleichrangig mit medizinischen.'),
            ('Sind Psychopharmaka bei herausforderndem Verhalten erlaubt?', 'Nur wenn nicht-medikamentöse Interventionen ausgeschöpft sind, auf ärztliche Verordnung mit klarem Ziel und regelmäßiger Evaluation. Routineverordnung wird vom MD beanstandet.'),
            ('Welche Rolle spielt Biografiearbeit?', 'Zentrale Rolle: Sie ermöglicht individuelle Ansprache, erleichtert Kommunikation bei weit fortgeschrittener Demenz und reduziert Agitation durch Bezug auf vertraute Themen.')
        ]
    },
    {
        'slug': 'mobilitaet',
        'name': 'Erhaltung und Förderung der Mobilität in der Pflege',
        'short': 'Mobilität',
        'keyword': 'expertenstandard mobilität',
        'version': '1. Auflage 2014',
        'qpr': 'QB 1 — Mobilität & Selbstversorgung',
        'qpr_code': 'QB 1',
        'intro': 'Der Expertenstandard Mobilität legt fest, wie Pflegeeinrichtungen die individuelle Mobilität erhalten und fördern. Er ist die Basis für QB 1 der QPR und zentraler Qualitätsindikator.',
        'why': 'Mobilität ist mit Sturz, Dekubitus, Kontinenz und Selbstversorgung eng verknüpft. Mobilitätsverlust ist einer der wichtigsten indikatorgestützten QDVS-Werte in der MD-Prüfung.',
        'tools': 'Tinetti-Test, Timed-Up-and-Go, Mobilitäts-Assessment, Bewegungsplan, Barthel-Index als Verlaufsmaß der Selbstständigkeit.',
        'requirements': [
            ('Mobilitätsassessment', 'Einschätzung bei Einzug und bei Veränderung mit standardisiertem Instrument.'),
            ('Ressourcenorientierung', 'Vorhandene Fähigkeiten nutzen und fördern, nicht übernehmen.'),
            ('Bewegungsplan', 'Individueller Plan mit konkreten Übungen und Zielen.'),
            ('Alltagsaktivierung', 'Alltagshandlungen als Bewegungsgelegenheit nutzen (Transfers, Gehen zum Speisesaal).'),
            ('Hilfsmittel', 'Angepasste Hilfsmittel (Rollator, Gehstock, Haltegriffe) einsetzen.'),
            ('Interdisziplinäre Zusammenarbeit', 'Mit Physiotherapie, Ergotherapie und Arzt abgestimmt.'),
            ('Dokumentation & Evaluation', 'Verlauf erkennbar, Ziele regelmäßig überprüft und angepasst.')
        ],
        'faqs': [
            ('Was bedeutet ressourcenorientierte Pflege?', 'Pflege orientiert sich an dem, was der Bewohner selbst kann — und fördert diese Fähigkeit, statt Tätigkeiten zu übernehmen. Ziel ist Selbstständigkeit und Würde.'),
            ('Ist Bettruhe sinnvoll?', 'Nur in begründeten medizinischen Ausnahmen. Längere Bettruhe verursacht Dekubitus, Kontrakturen und Mobilitätsverlust und wird vom MD kritisch bewertet.'),
            ('Wie wird Mobilität dokumentiert?', 'Verlaufskurven zu Assessment-Scores (Tinetti, TUG, Barthel), Bewegungsplan mit Evaluation, SIS-Themenfeld Mobilität aktuell geführt.')
        ]
    },
]

PAGE_TMPL = '''<!DOCTYPE html>
<html lang="de-DE" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{meta_title}</title>
    <meta name="description" content="{meta_desc}">
    <link rel="canonical" href="{canonical}">
    <meta property="og:title" content="{og_title}">
    <meta property="og:description" content="{meta_desc}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical}">
    <meta property="og:site_name" content="AlwaysReady Care">
    <meta property="og:image" content="https://tool.teamzlab.com/apps/always-ready-care/icons/icon-512.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{og_title}">
    <meta name="twitter:description" content="{meta_desc}">
    <meta name="keywords" content="{keywords}">
    <link rel="alternate" hreflang="de-DE" href="{canonical}">
    <link rel="alternate" hreflang="x-default" href="{canonical}">
    <script type="application/ld+json">
{article_schema}
    </script>
    <script type="application/ld+json">
{breadcrumb_schema}
    </script>
    <script type="application/ld+json">
{faq_schema}
    </script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="../../manifest.json">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../../../css/app.css">
    <script>localStorage.setItem('arc-region','de');</script>
    <style>
      .es-wrap{{max-width:900px;margin:0 auto;padding:24px 20px 64px;}}
      .es-breadcrumb{{font-size:13px;color:var(--text-muted);margin-bottom:16px;}}
      .es-breadcrumb a{{color:var(--text-muted);text-decoration:none;}}
      .es-breadcrumb a:hover{{color:var(--accent);}}
      .es-hero{{padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .es-badge{{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--border);color:var(--text-muted);font-size:12px;margin-bottom:12px;}}
      .es-hero h1{{font:700 clamp(24px,4vw,32px)/1.25 Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .es-hero p{{color:var(--text-muted);max-width:720px;margin:0;line-height:1.6;}}
      .es-section{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 24px;margin-bottom:18px;}}
      .es-section h2{{font:600 20px Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .es-section p{{color:var(--text);line-height:1.65;margin:0 0 10px;}}
      .es-progress{{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:var(--text);}}
      .es-progress strong{{color:var(--heading);font-size:18px;}}
      .es-progress-bar{{height:8px;background:var(--bg);border-radius:999px;overflow:hidden;border:1px solid var(--border);}}
      .es-progress-fill{{height:100%;background:var(--accent);width:0;transition:width .3s;}}
      .es-item{{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--border);}}
      .es-item:first-of-type{{border-top:0;}}
      .es-item input[type=checkbox]{{width:20px;height:20px;margin-top:2px;accent-color:var(--accent);flex-shrink:0;cursor:pointer;}}
      .es-item label{{flex:1;cursor:pointer;color:var(--text);line-height:1.5;}}
      .es-item label strong{{color:var(--heading);display:block;margin-bottom:2px;font-weight:600;}}
      .es-item label small{{color:var(--text-muted);font-size:13px;}}
      .es-item input:checked + label strong{{text-decoration:line-through;opacity:.6;}}
      .es-cta{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin-top:28px;text-align:center;}}
      .es-cta a{{display:inline-block;padding:12px 22px;border-radius:10px;background:var(--accent);color:var(--accent-text);text-decoration:none;font:600 15px Poppins,sans-serif;}}
      .es-faq details{{border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden;background:var(--surface);}}
      .es-faq summary{{padding:14px 18px;cursor:pointer;font:600 15px Poppins,sans-serif;color:var(--heading);list-style:none;}}
      .es-faq summary::-webkit-details-marker{{display:none;}}
      .es-faq summary::after{{content:"+";float:right;}}
      .es-faq details[open] summary::after{{content:"\u2212";}}
      .es-faq details p{{padding:14px 18px;margin:0;color:var(--text);line-height:1.6;}}
      .es-related{{margin-top:32px;padding-top:24px;border-top:1px solid var(--border);}}
      .es-related h2{{font:600 18px Poppins,sans-serif;color:var(--heading);margin:0 0 14px;}}
      .es-related ul{{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;}}
      .es-related a{{display:block;padding:12px 14px;border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--heading);background:var(--surface);font-size:14px;}}
      .es-related a:hover{{border-color:var(--accent);}}
      @media (max-width:600px){{.es-wrap{{padding:16px 14px 48px;}}.es-section{{padding:16px;}}}}
    </style>
</head>
<body>
    <a id="lang-toggle-en" href="#" role="button" aria-label="Switch to English" title="Translate to English via Google" style="position:fixed;top:14px;right:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:var(--accent,#D9FE06);color:var(--accent-text,#12151A);font:600 13px/1 Poppins,system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.18);border:1px solid rgba(0,0,0,.12);" onclick="var h=location.hostname;if(h==='localhost'||/^127\\.|^192\\.168\\.|^10\\.|^172\\.(1[6-9]|2[0-9]|3[01])\\./.test(h)||h===''){alert('Auto-Übersetzung funktioniert nur auf der Live-Website tool.teamzlab.com.\\n\\nAuto-translate works only on the live site, not on localhost.');return false;}window.location='https://'+h.replace(/\\./g,'-')+'.translate.goog'+location.pathname+'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';return false;"><span style="font-size:14px;line-height:1;">EN</span><span>Translate</span></a>
    <a href="../../" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>
    <main class="es-wrap">
        <nav class="es-breadcrumb" aria-label="Breadcrumb"><a href="../../">AlwaysReady Care</a> &rsaquo; <a href="../">Expertenstandards</a> &rsaquo; {short}</nav>
        <header class="es-hero">
            <span class="es-badge">{qpr} &middot; {version}</span>
            <h1>{name}</h1>
            <p>{intro}</p>
        </header>

        <section class="es-section">
            <h2>Warum dieser Expertenstandard für die MD-Prüfung zählt</h2>
            <p>{why}</p>
        </section>

        <section class="es-section">
            <h2>Empfohlene Assessments & Instrumente</h2>
            <p>{tools}</p>
        </section>

        <section class="es-section">
            <h2>Umsetzungs-Check: {short}</h2>
            <div class="es-progress"><span>Ihre Umsetzung: <strong id="es-percent">0 %</strong></span><span><span id="es-done">0</span> / {req_count} Anforderungen</span></div>
            <div class="es-progress-bar"><div class="es-progress-fill" id="es-fill"></div></div>
            <div id="es-items" style="margin-top:14px;">{requirements_html}</div>
        </section>

        <div class="es-cta">
            <p style="color:var(--text-muted);margin:0 0 12px;">Alle 9 Expertenstandards in einer Anwendung \u2014 mit 24 QPR-Kategorien, SIS-Vorlagen und MD-Pr\u00fcfungsmappe.</p>
            <a href="../../">AlwaysReady Care kostenlos starten</a>
        </div>

        <section class="es-section es-faq">
            <h2>H\u00e4ufige Fragen zum Expertenstandard {short}</h2>
            {faq_html}
        </section>

        <section class="es-related">
            <h2>Weitere DNQP-Expertenstandards</h2>
            <ul>{related_html}</ul>
        </section>
    </main>
    <script>
    (function(){{
      var STORAGE_KEY = 'arc-es-{slug}';
      var state = {{}};
      try {{ state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{{}}') || {{}}; }} catch(e){{ state = {{}}; }}
      var inputs = document.querySelectorAll('#es-items input[type=checkbox]');
      inputs.forEach(function(i){{ if (state[i.id]) i.checked = true; }});
      function recalc(){{
        var done = 0;
        inputs.forEach(function(i){{ if (i.checked) done++; }});
        var pct = inputs.length ? Math.round((done / inputs.length) * 100) : 0;
        document.getElementById('es-done').textContent = done;
        document.getElementById('es-percent').textContent = pct + ' %';
        document.getElementById('es-fill').style.width = pct + '%';
      }}
      document.getElementById('es-items').addEventListener('change', function(e){{
        if (e.target.type !== 'checkbox') return;
        if (e.target.checked) state[e.target.id] = 1; else delete state[e.target.id];
        try {{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }} catch(err){{}}
        recalc();
      }});
      recalc();
    }})();
    </script>
</body>
</html>
'''

def render_page(std, all_stds):
    canonical = f'{BASE_URL}/{std["slug"]}/'
    meta_title = f'Expertenstandard {std["short"]} — DNQP 2026 | AlwaysReady Care'
    if len(meta_title) > 70:
        meta_title = f'Expertenstandard {std["short"]} — Umsetzung & MD-Check'
    meta_desc = (f'{std["short"]}: DNQP-Expertenstandard im Überblick. Anforderungen, Assessments, '
                 f'Umsetzungs-Check und MD-Prüfbezug. Kostenlos, DSGVO-konform.')[:155]
    og_title = f'Expertenstandard {std["short"]} — DNQP'
    keywords = (f'{std["keyword"]}, expertenstandard {std["short"].lower()}, dnqp {std["short"].lower()}, '
                f'md prüfung {std["short"].lower()}, pflege expertenstandard, {std["short"].lower()} checkliste')

    article_schema = json.dumps({
        '@context': 'https://schema.org', '@type': 'Article',
        'headline': f'Expertenstandard {std["short"]} (DNQP)',
        'description': std['intro'],
        'inLanguage': 'de-DE',
        'author': {'@type': 'Organization', 'name': 'Teamz Lab Ltd'},
        'publisher': {'@type': 'Organization', 'name': 'Teamz Lab Ltd'},
        'mainEntityOfPage': canonical,
        'about': {'@type': 'DefinedTerm', 'name': std['name'], 'termCode': std['qpr_code']}
    }, ensure_ascii=False, indent=2)

    breadcrumb_schema = json.dumps({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Startseite', 'item': 'https://tool.teamzlab.com/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'AlwaysReady Care DE', 'item': 'https://tool.teamzlab.com/apps/always-ready-care/de/'},
            {'@type': 'ListItem', 'position': 3, 'name': 'Expertenstandards', 'item': f'{BASE_URL}/'},
            {'@type': 'ListItem', 'position': 4, 'name': std['short'], 'item': canonical}
        ]
    }, ensure_ascii=False, indent=2)

    faq_schema = json.dumps({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}}
            for q, a in std['faqs']
        ]
    }, ensure_ascii=False, indent=2)

    req_html = ''.join(
        f'<div class="es-item"><input type="checkbox" id="es-req-{i}"><label for="es-req-{i}"><strong>{html.escape(t)}</strong><small>{html.escape(d)}</small></label></div>'
        for i, (t, d) in enumerate(std['requirements'])
    )

    faq_html = ''.join(
        f'<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>'
        for q, a in std['faqs']
    )

    related = [s for s in all_stds if s['slug'] != std['slug']][:6]
    related_html = ''.join(
        f'<li><a href="../{s["slug"]}/">{html.escape(s["short"])}</a></li>'
        for s in related
    )

    return PAGE_TMPL.format(
        meta_title=html.escape(meta_title), meta_desc=html.escape(meta_desc),
        og_title=html.escape(og_title), canonical=canonical, keywords=html.escape(keywords),
        article_schema=article_schema, breadcrumb_schema=breadcrumb_schema, faq_schema=faq_schema,
        name=html.escape(std['name']), short=html.escape(std['short']),
        intro=html.escape(std['intro']), why=html.escape(std['why']), tools=html.escape(std['tools']),
        qpr=html.escape(std['qpr']), version=html.escape(std['version']),
        req_count=len(std['requirements']), requirements_html=req_html,
        faq_html=faq_html, related_html=related_html, slug=std['slug']
    )


HUB_TMPL = '''<!DOCTYPE html>
<html lang="de-DE" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNQP Expertenstandards Pflege — Alle 9 im Überblick</title>
    <meta name="description" content="Alle 9 DNQP-Expertenstandards kompakt: Dekubitus, Sturz, Schmerz, Ernährung, Kontinenz, Wunden, Entlassung, Demenz, Mobilität. Mit Umsetzungs-Checklisten.">
    <link rel="canonical" href="{base_url}/">
    <meta property="og:title" content="DNQP Expertenstandards Pflege — Alle 9 im Überblick">
    <meta property="og:description" content="Alle 9 Expertenstandards kompakt mit Assessments, Anforderungen und Umsetzungs-Check. Kostenlos, DSGVO-konform.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{base_url}/">
    <meta property="og:image" content="https://tool.teamzlab.com/apps/always-ready-care/icons/icon-512.png">
    <meta name="keywords" content="dnqp expertenstandards, expertenstandards pflege, expertenstandards übersicht, alle expertenstandards, pflege expertenstandards liste, expertenstandards 2026">
    <link rel="alternate" hreflang="de-DE" href="{base_url}/">
    <link rel="alternate" hreflang="x-default" href="{base_url}/">
    <script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "DNQP Expertenstandards Pflege",
  "inLanguage": "de-DE",
  "description": "Übersicht aller 9 DNQP-Expertenstandards mit Umsetzungshilfen und Assessments.",
  "hasPart": [{has_parts}]
}}
    </script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2312151A'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%23D9FE06'>&#x2665;</text></svg>">
    <link rel="manifest" href="../manifest.json">
    <meta name="theme-color" content="#12151A">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../../css/app.css">
    <script>localStorage.setItem('arc-region','de');</script>
    <style>
      .hub{{max-width:1000px;margin:0 auto;padding:24px 20px 64px;}}
      .hub-hero{{padding:20px 0 24px;border-bottom:1px solid var(--border);margin-bottom:28px;}}
      .hub-hero h1{{font:700 clamp(24px,4vw,34px)/1.25 Poppins,sans-serif;color:var(--heading);margin:0 0 12px;}}
      .hub-hero p{{color:var(--text-muted);max-width:720px;margin:0;line-height:1.6;}}
      .hub-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;}}
      .hub-card{{display:block;padding:20px;border:1px solid var(--border);border-radius:14px;background:var(--surface);text-decoration:none;color:var(--text);transition:border-color .2s,transform .2s;}}
      .hub-card:hover{{border-color:var(--accent);transform:translateY(-2px);}}
      .hub-card-badge{{display:inline-block;padding:3px 8px;border-radius:999px;background:var(--bg);border:1px solid var(--border);color:var(--text-muted);font-size:11px;margin-bottom:10px;}}
      .hub-card h2{{font:600 17px Poppins,sans-serif;color:var(--heading);margin:0 0 8px;}}
      .hub-card p{{font-size:14px;line-height:1.5;margin:0;color:var(--text-muted);}}
      .hub-arrow{{display:inline-block;margin-top:10px;color:var(--accent);font-weight:600;font-size:13px;}}
      .hub-content{{margin-top:36px;padding-top:24px;border-top:1px solid var(--border);color:var(--text);line-height:1.7;}}
      .hub-content h2{{font:600 22px Poppins,sans-serif;color:var(--heading);margin:24px 0 10px;}}
      .hub-cta{{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin-top:28px;text-align:center;}}
      .hub-cta a{{display:inline-block;padding:12px 22px;border-radius:10px;background:var(--accent);color:var(--accent-text);text-decoration:none;font:600 15px Poppins,sans-serif;}}
      @media (max-width:600px){{.hub{{padding:16px 14px 48px;}}}}
    </style>
</head>
<body>
    <a id="lang-toggle-en" href="#" role="button" aria-label="Switch to English" title="Translate to English via Google" style="position:fixed;top:14px;right:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:var(--accent,#D9FE06);color:var(--accent-text,#12151A);font:600 13px/1 Poppins,system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.18);border:1px solid rgba(0,0,0,.12);" onclick="var h=location.hostname;if(h==='localhost'||/^127\\.|^192\\.168\\.|^10\\.|^172\\.(1[6-9]|2[0-9]|3[01])\\./.test(h)||h===''){alert('Auto-Übersetzung funktioniert nur auf der Live-Website tool.teamzlab.com.\\n\\nAuto-translate works only on the live site, not on localhost.');return false;}window.location='https://'+h.replace(/\\./g,'-')+'.translate.goog'+location.pathname+'?_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';return false;"><span style="font-size:14px;line-height:1;">EN</span><span>Translate</span></a>
    <a href="../" id="back-to-app" style="position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--surface);color:var(--heading);font:600 13px/1 Poppins,sans-serif;text-decoration:none;border:1px solid var(--border);"><i class="fas fa-arrow-left"></i> <span>AlwaysReady Care</span></a>
    <main class="hub">
        <header class="hub-hero">
            <h1>DNQP Expertenstandards Pflege — alle 9 im Überblick</h1>
            <p>Die Expertenstandards des Deutschen Netzwerks für Qualitätsentwicklung in der Pflege (DNQP) sind der fachliche Bezugsrahmen für die Qualitätsprüfung durch den Medizinischen Dienst (MD). Hier finden Sie alle 9 Standards kompakt zusammengefasst — jeweils mit Assessments, Kernanforderungen und einem interaktiven Umsetzungs-Check.</p>
        </header>

        <div class="hub-grid">
            {cards}
        </div>

        <section class="hub-content">
            <h2>Was sind die DNQP-Expertenstandards?</h2>
            <p>Die Expertenstandards werden vom Deutschen Netzwerk für Qualitätsentwicklung in der Pflege (DNQP) an der Hochschule Osnabrück entwickelt. Sie definieren auf Basis aktueller pflegewissenschaftlicher Evidenz Mindestanforderungen an die Pflegequalität und sind für alle Pflegeeinrichtungen nach § 113a SGB XI verbindlich.</p>

            <h2>Wie binden Sie Expertenstandards in den Pflegealltag ein?</h2>
            <p>Jeder Expertenstandard folgt einem vergleichbaren Aufbau: Zielsetzung, Struktur-, Prozess- und Ergebniskriterien, Kommentierungen und Literaturgrundlagen. Die Umsetzung erfolgt in einem sechsstufigen Implementierungsprozess — von der Fortbildung über die Anpassung interner Standards bis zur kontinuierlichen Evaluation.</p>

            <h2>Expertenstandards und MD-Prüfung</h2>
            <p>Der Medizinische Dienst prüft indikatorengestützt, ob die Anforderungen der Expertenstandards im Pflegealltag umgesetzt werden. Besonderes Augenmerk liegt auf standardisierten Assessments (z. B. Braden, BESD, Tinetti), individueller Ableitung von Maßnahmen und deren kontinuierlicher Evaluation. Fehlende oder pauschale Anwendung führt regelmäßig zu Beanstandungen.</p>
        </section>

        <div class="hub-cta">
            <p style="color:var(--text-muted);margin:0 0 12px;">Alle Expertenstandards digital umsetzen — mit Vorlagen, Assessments und MD-Prüfungsmappe in AlwaysReady Care.</p>
            <a href="../">AlwaysReady Care kostenlos starten</a>
        </div>
    </main>
</body>
</html>
'''

def render_hub():
    cards = []
    has_parts = []
    for s in STANDARDS:
        cards.append(
            f'<a class="hub-card" href="{s["slug"]}/">'
            f'<span class="hub-card-badge">{html.escape(s["qpr_code"])}</span>'
            f'<h2>{html.escape(s["short"])}</h2>'
            f'<p>{html.escape(s["intro"][:130])}…</p>'
            f'<span class="hub-arrow">Zum Standard →</span>'
            f'</a>'
        )
        has_parts.append(json.dumps({
            '@type': 'WebPage',
            'name': f'Expertenstandard {s["short"]}',
            'url': f'{BASE_URL}/{s["slug"]}/'
        }, ensure_ascii=False))
    return HUB_TMPL.format(
        base_url=BASE_URL,
        cards='\n            '.join(cards),
        has_parts=','.join(has_parts)
    )


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for std in STANDARDS:
        page_dir = os.path.join(OUT_DIR, std['slug'])
        os.makedirs(page_dir, exist_ok=True)
        with open(os.path.join(page_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(render_page(std, STANDARDS))
        print(f'BUILT: de/expertenstandards/{std["slug"]}/index.html')
    with open(os.path.join(OUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(render_hub())
    print(f'BUILT: de/expertenstandards/index.html (hub)')


if __name__ == '__main__':
    main()
