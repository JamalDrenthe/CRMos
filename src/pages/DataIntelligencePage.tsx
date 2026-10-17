import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Building2,
  Route,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Cpu,
  Globe2,
  Lock,
} from 'lucide-react';

export function DataIntelligencePage() {
  const navigate = useNavigate();
  const [activePillar, setActivePillar] = useState<'bag' | 'osm' | 'vector' | 'osrm'>('bag');

  const comparisonData = [
    {
      feature: 'Kosten per lead / pand',
      crmos: '€ 0,00 (100% inbegrepen)',
      databrokers: '€ 0,45 - € 2,50 per adres',
      kvk: '€ 0,20 - € 1,00 per exportregel',
    },
    {
      feature: 'Automatische Woonhuis-Filter',
      crmos: 'Ja (100% uitsluiting woonfuncties)',
      databrokers: 'Vaak vervuild met zolderkamers',
      kvk: 'Nee (bevat alle ZZP thuisadressen)',
    },
    {
      feature: 'Fysieke pand- en loopkaarten',
      crmos: 'Ja (60fps MapLibre vector maps)',
      databrokers: 'Nee (alleen CSV/Excel dumps)',
      kvk: 'Nee (geen GPS-coördinaten)',
    },
    {
      feature: 'Pandoppervlakte in m² & Gebruiksdoel',
      crmos: 'Ja (Kadaster BAG overheidsdata)',
      databrokers: 'Zelden of tegen meerprijs',
      kvk: 'Nee',
    },
    {
      feature: 'Algoritmische Looproute (D2D)',
      crmos: 'Ja (Ingebouwde OSRM routing)',
      databrokers: 'Nee',
      kvk: 'Nee',
    },
    {
      feature: 'AVG / GDPR & Privacy Compliant',
      crmos: '100% Open Data & B2B Registraties',
      databrokers: 'Vaak twijfelachtige scraping',
      kvk: 'Handmatige opt-out vereist',
    },
  ];

  const pillars = [
    {
      id: 'bag',
      title: 'Kadaster & BAG Registratie',
      subtitle: 'Fysieke gebouwkenmerken & 0% woonhuizen',
      icon: Building2,
      badge: 'Basisregistratie Overheid',
      color: 'from-blue-600 to-cyan-600',
      description:
        'CRMos koppelt direct aan het officiële Nederlandse Kadaster (Basisregistratie Adressen en Gebouwen). Hierdoor identificeren we direct fysieke bedrijfspanden op basis van wettelijke gebruiksfuncties.',
      details: [
        'Filtert 100% reguliere woonhuizen weg om database-vervuiling en zinloze D2D-routes te voorkomen.',
        'Herkenning van winkelfuncties, kantoorfuncties, industriefuncties, logiesfuncties en horeca.',
        'Exacte oppervlakte in vierkante meters (m²), bouwjaar en unieke verblijfsobjectidentificatie.',
        'Automatische omzetting van kadastrale centroïden naar haarscherpe GPS-kaartcoördinaten.',
      ],
      marketingStat: '2.5M+ zakelijke panden direct inzichtelijk',
    },
    {
      id: 'osm',
      title: 'OpenStreetMap & Overpass Intelligence',
      subtitle: 'Realtime crowdsourced bedrijfsverrijking',
      icon: Globe2,
      badge: 'Global Crowdsourced POI',
      color: 'from-emerald-600 to-teal-600',
      description:
        'Waar traditionele bureaus maandelijks statische KVK-lijsten verkopen, verrijkt CRMos fysieke panden via een wereldwijd netwerk van cartografen met actuele handelsnamen, branches en contactdata.',
      details: [
        'Directe koppeling van bedrijfsnaam, formule (retail) en SBI-gerelateerde branche.',
        'Openingstijden, websites en domeinnamen direct beschikbaar voor telemarketing en opvolging.',
        'Sneller actueel dan traditionele registers: nieuwe winkels en horecazaken zijn binnen dagen gemapt.',
        'Volledig open, transparant en onafhankelijk van commerciële monopolies.',
      ],
      marketingStat: 'Realtime matching zonder dure data-API keys',
    },
    {
      id: 'vector',
      title: 'MapLibre GL & OpenFreeMap Engine',
      subtitle: '60fps vector rendering zonder paywalls',
      icon: Layers,
      badge: 'Next-Gen Vector Engine',
      color: 'from-violet-600 to-purple-600',
      description:
        'In plaats van honderden tot duizenden euro’s per maand te betalen aan commerciële kaart-API’s zoals Google Maps of Mapbox, gebruikt CRMos een hypermoderne open-source vector rendering stack.',
      details: [
        'Vloeiende 60 frames per seconde vector rendering op elk mobiel apparaat, iPad of laptop.',
        'Liberty, Positron en Bright kaartstijlen met haarscherpe details op straat- en huisnummerniveau.',
        '100% keyless: uw organisatie hoeft geen creditcard of billing-account bij Google achter te laten.',
        'Geen tracking van uw vertegenwoordigers door commerciële advertentienetwerken.',
      ],
      marketingStat: '€ 0,00 verbruikskosten per 10.000 kaartviews',
    },
    {
      id: 'osrm',
      title: 'OSRM Routeplanner & Loopoptimalisatie',
      subtitle: 'Maximale deuren per uur voor Field Sales',
      icon: Route,
      badge: 'Sub-Milliseconde Routing',
      color: 'from-amber-600 to-orange-600',
      description:
        'Elke minuut die een vertegenwoordiger kwijt is aan onlogisch zigzaggen door een wijk kost omzet. CRMos integreert Open Source Routing Machine om de meest efficiënte looproutes te berekenen.',
      details: [
        'Sub-milliseconde berekening van de optimale volgorde langs alle zakelijke deuren in een rayon.',
        'Specifieke profielen voor voetgangers (deurlopers), fietskoeriers en buitendienstauto’s.',
        'Gemiddeld 20% tot 35% tijdsbesparing op de straat per verkoopagent per dag.',
        'Directe koppeling met statusregistratie: "Niet thuis" wordt direct herpland in de loopvolgorde.',
      ],
      marketingStat: '+30% meer effectieve klantgesprekken per shift',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Navbar />

      <main className="space-y-20 pb-24 overflow-hidden">
        {/* Apple-Style Hero Header */}
        <section className="relative pt-16 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />

          <div className="relative mx-auto max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>CRMos Proprietary Data Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground text-balance">
              De slimste B2B panden- &amp; geodata engine.{' '}
              <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                Volledig ingebouwd.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-balance">
              Waarom duizenden euro's betalen voor verouderde KVK-lijsten of dure Google Maps credits? 
              CRMos combineert officiële overheidsregisters met wereldwijde open geodata en live looproute-algoritmes. 
              Geverifieerde zakelijke adressen, 0% woonhuizen en maximale conversie voor uw salesteams.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="rounded-full px-8 h-12 text-sm font-semibold shadow-md gap-2"
              >
                <span>Start 14 Dagen Gratis</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('architectuur');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-full px-7 h-12 text-sm font-medium border-border/80 hover:bg-muted"
              >
                <span>Bekijk Hoe Het Werkt</span>
              </Button>
            </div>

            {/* Key Metrics Strip */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground">2.5M+</p>
                <p className="text-xs text-muted-foreground mt-1">Zakelijke Panden in NL</p>
              </div>
              <div className="p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">0%</p>
                <p className="text-xs text-muted-foreground mt-1">Particuliere Woonhuizen</p>
              </div>
              <div className="p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">€ 0,00</p>
                <p className="text-xs text-muted-foreground mt-1">API- of Datakosten per Lead</p>
              </div>
              <div className="p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-sm text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground">60 FPS</p>
                <p className="text-xs text-muted-foreground mt-1">Vector Loopkaarten</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Marketing Move: Why Traditional Data Sourcing is Broken */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-gradient-to-br from-card via-card/90 to-muted/20 p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="max-w-3xl space-y-4">
              <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10">
                De Commerciële Realiteit
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                Waarom traditionele data-leveranciers uw salesbudget verbranden
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Als commercieel directeur of rayonmanager kent u de frustratie: u koopt een leadlijst van 5.000 adressen. 
                Vervolgens staat uw buitendienstteam aan te bellen bij woonboerderijen, zolderkamers van holding BV's en leegstaande garageboxen. 
                Traditionele data is statisch, incompleet en peperduur.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="p-6 rounded-2xl bg-background border border-border/60 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                  <XCircle className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground text-base">Verouderde KVK Exports</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tot wel 45% van de adressen in standaard KVK-dumps zijn postbus-adressen of particuliere woningen waar niemand aanwezig is. Uw team verspilt uren aan loze looproutes.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-background border border-border/60 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <XCircle className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground text-base">Hoge Kaart- &amp; API-Licenties</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Commerciële kaarten (Google Maps, Mapbox) rekenen torenhoge kosten zodra uw vertegenwoordigers dagelijks honderden pinnen bekijken. Bovendien tonen ze geen kadastrale bouwfuncties.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-background border border-border/60 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground text-base">De CRMos Data Revolutie</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Door officiële open overheidsregistraties (BAG) te combineren met wereldwijde open geodata, filteren we woonhuizen 100% uit. U krijgt actuele B2B-leads direct op de kaart, zonder extra facturen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars of CRMos Data Engine */}
        <section id="architectuur" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              De 4 Pijlers van onze Data-Architectuur
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Geen zwarte doos of vage scraping: ontdek hoe CRMos geavanceerde open technologieën samenvoegt tot één gestroomlijnde B2B verkoopmachine.
            </p>
          </div>

          {/* Interactive Pillar Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-muted/40 border max-w-2xl mx-auto">
            {pillars.map((p) => {
              const active = activePillar === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePillar(p.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <p.icon className="h-3.5 w-3.5" />
                  <span>{p.title.split('&')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Showcase */}
          {(() => {
            const current = pillars.find((p) => p.id === activePillar) || pillars[0];
            const Icon = current.icon;
            return (
              <div className="rounded-3xl border bg-card p-8 sm:p-12 shadow-sm grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {current.badge}
                      </Badge>
                      <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
                        {current.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {current.description}
                  </p>

                  <div className="space-y-3">
                    {current.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-foreground leading-normal">{detail}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/15 text-xs font-semibold text-primary">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span>{current.marketingStat}</span>
                    </div>
                  </div>
                </div>

                {/* Visual Representation Card */}
                <div className="rounded-2xl border bg-muted/30 p-6 sm:p-8 space-y-5">
                  <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Live Data Inspectie
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      Standaard Actief
                    </Badge>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-background border flex items-center justify-between">
                      <span className="text-muted-foreground">Datastype:</span>
                      <span className="font-semibold text-primary">Fysiek Bedrijfspand (B2B)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-background border flex items-center justify-between">
                      <span className="text-muted-foreground">Woonfilter:</span>
                      <span className="font-semibold text-emerald-600">100% Geëxcludeerd</span>
                    </div>
                    <div className="p-3 rounded-xl bg-background border flex items-center justify-between">
                      <span className="text-muted-foreground">Verrijking:</span>
                      <span className="font-semibold text-sky-600">Handelsnaam, Branche, Openingstijden</span>
                    </div>
                    <div className="p-3 rounded-xl bg-background border flex items-center justify-between">
                      <span className="text-muted-foreground">Loopvolgorde:</span>
                      <span className="font-semibold text-amber-600">Sub-milliseconde OSRM Matrix</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground space-y-1">
                    <p className="font-bold">Het Commerciële Resultaat:</p>
                    <p className="text-muted-foreground">
                      Uw verkoopvertegenwoordigers besteden 100% van hun bezoektijd aan panden met een aantoonbare zakelijke bestemming. Geen tijdverlies, hogere dealconversie.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Detailed Comparison Table */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Eerlijke Vergelijking
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              CRMos Data Engine vs. Traditionele Methoden
            </h2>
            <p className="text-sm text-muted-foreground">
              Bekijk hoe onze geïntegreerde aanpak zich verhoudt tot losse data-aankopen en handmatige exports.
            </p>
          </div>

          <div className="rounded-3xl border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-4 sm:p-5 font-bold text-foreground">Kenmerk / Capaciteit</th>
                  <th className="p-4 sm:p-5 font-bold text-primary bg-primary/5">
                    CRMos Data Engine
                  </th>
                  <th className="p-4 sm:p-5 font-medium text-muted-foreground">Commerciële Data Brokers</th>
                  <th className="p-4 sm:p-5 font-medium text-muted-foreground">Handmatige KVK Exports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 sm:p-5 font-semibold text-foreground">{row.feature}</td>
                    <td className="p-4 sm:p-5 font-bold text-primary bg-primary/5 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{row.crmos}</span>
                    </td>
                    <td className="p-4 sm:p-5 text-muted-foreground">{row.databrokers}</td>
                    <td className="p-4 sm:p-5 text-muted-foreground">{row.kvk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Privacy & Compliance Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-card p-8 sm:p-12 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  100% AVG / GDPR &amp; Ethiek ("Privacy-First by Design")
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gefundeerd op officiële overheidsregistraties en open geografische standaarden
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 pt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <div className="p-4 rounded-2xl bg-muted/20 border space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  Geen Persoonsgegevens
                </p>
                <p>
                  CRMos indexeert uitsluitend fysieke pandkenmerken en openbaar geregistreerde zakelijke vestigingen. Particuliere woongegevens worden categorisch buitengesloten.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/20 border space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-blue-600" />
                  Officiële Basisregistratie
                </p>
                <p>
                  De gebouwdata is afkomstig uit de openbare Basisregistratie Adressen en Gebouwen (BAG) van het Kadaster, vastgelegd conform de Wet op de basisregistraties.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/20 border space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-indigo-600" />
                  Zero Third-Party Tracking
                </p>
                <p>
                  Omdat we geen commerciële kaart-API's (Google/Mapbox) gebruiken, worden de looproutes en zoekopdrachten van uw vertegenwoordigers nooit gedeeld met advertentiegiganten.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Veelgestelde Vragen over onze Geodata &amp; Engine
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Alles wat u moet weten over de techniek en het dagelijks gebruik binnen CRMos.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Moeten wij zelf API-sleutels of licenties aanmaken bij Kadaster of OpenStreetMap?',
                a: 'Nee, absoluut niet. De CRMos Data Engine werkt 100% out-of-the-box. Alle data-endpoints worden direct en sleutelloos ontsloten via onze ingebouwde connectoren.',
              },
              {
                q: 'Hoe zit het met de actualiteit van nieuwe bedrijfspanden?',
                a: 'Het Kadaster werkt de BAG basisregistratie continu bij. Zodra een nieuw pand of vergunning wordt opgeleverd en in het register staat, is het direct zichtbaar wanneer u een rayon importeert.',
              },
              {
                q: 'Werkt dit voor heel Nederland?',
                a: 'Ja, landelijk dekkend voor elk postcodegebied (PC4 en PC6) en elke gemeente van Nederland, van Groningen tot Maastricht.',
              },
              {
                q: 'Kunnen we de verrijkte panden direct doorzetten naar ons CRM en de bellijsten?',
                a: 'Ja. Met één vinkje in de rayonimport worden alle verrijkte bedrijfspanden automatisch aangemaakt als volwaardige bedrijven (Companies) in uw CRMos database.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl border bg-card space-y-2">
                <p className="font-bold text-sm text-foreground">{faq.q}</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pre-Footer CTA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 sm:p-14 text-center space-y-6 relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Ervaar de kracht van CRMos Data Intelligence zelf
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Geef uw buitendienst en telefonische verkoopteams direct toegang tot geverifieerde zakelijke panden en optimale looproutes. Probeer 14 dagen gratis.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="rounded-full px-8 h-12 text-sm font-semibold shadow-md gap-2"
              >
                <span>Direct Gratis Starten</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/solutions?tab=field-sales')}
                className="rounded-full px-7 h-12 text-sm font-medium"
              >
                <span>Bekijk Field Sales Oplossingen</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
