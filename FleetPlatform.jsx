import React, { useState, useMemo, useEffect, useRef, useCallback, useContext, createContext } from "react";
import {
  LayoutDashboard, Car, Building2, ArrowLeftRight, FileText, Repeat,
  AlarmClock, Wrench, CircleDot, ShieldAlert, Receipt, Coins,
  ChevronRight, X, Search, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, TrendingDown, MapPin, Calendar, ArrowRight,
  Fuel, Droplet, Plus, ArrowDownToLine, ArrowUpFromLine, Gauge,
  Download, FileSpreadsheet, ListChecks, Users, Banknote, Wallet, Send, Mail, Award,
  ChevronUp, ChevronDown, ChevronsUpDown, Pencil, Trash2, Lock, History, ShieldCheck,
  Truck, Upload, FileInput, Scale, CalendarClock, Paperclip, Printer, FileSignature,
  Package, Barcode
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
// Il motore dei fogli di calcolo pesa circa 140 KB compressi e serve solo a chi
// esporta o importa: caricarlo all'avvio faceva attendere ogni utente, anche
// chi non apre mai quelle funzioni. Viene ora scaricato alla prima richiesta e
// poi tenuto in memoria.
let _XLSX = null;
let _XLSXinFlight = null;
async function caricaXLSX() {
  if (_XLSX) return _XLSX;
  if (!_XLSXinFlight) _XLSXinFlight = import("xlsx").then(m => (_XLSX = m.default?.utils ? m.default : m));
  return _XLSXinFlight;
}

// ---------------------------------------------------------------------------
// DESIGN TOKENS — coerenti col brand Matherion (navy / gold)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// TITOLARE DELLA PIATTAFORMA
// ---------------------------------------------------------------------------
// La piattaforma è di proprietà di Matherion S.r.l. I riferimenti societari
// non compaiono nel piè di pagina — dove resta il solo marchio — ma nella
// sezione di compliance, che è il luogo in cui la legge li richiede e in cui
// l'utente si aspetta di trovarli.
// ---------------------------------------------------------------------------
// ACCESSO LIBERO
// ---------------------------------------------------------------------------
// Con true la piattaforma si apre direttamente, senza schermata di accesso:
// chiunque raggiunga l'indirizzo entra con il profilo indicato qui sotto.
// Scelta deliberata per la fase di prova e dimostrazione.
//
// ATTENZIONE: con l'accesso libero non esiste alcuna separazione fra utenti.
// Chi apre la piattaforma ha i permessi del profilo predefinito — compresa la
// cancellazione dei dati — e le gerarchie configurate in Utenti & Permessi non
// hanno effetto. Prima di pubblicare la piattaforma su un indirizzo
// raggiungibile dall'esterno, riportare ACCESSO_LIBERO a false: la schermata di
// accesso, le utenze e i permessi tornano a funzionare senza altre modifiche.
const ACCESSO_LIBERO = false;

// Profilo con cui si entra ad accesso libero: il primo utente con questo ruolo,
// altrimenti il primo dell'elenco.
const RUOLO_ACCESSO_LIBERO = "super_admin";

const PLATFORM_OWNER = {
  name: "Matherion S.r.l.",
  vat: "18552531008",
  address: "Viale Luigi Schiavonetti 270",
  zip: "00173",
  city: "Roma",
  province: "RM",
  country: "Italia",
  pec: "matherion@legalmail.it",
  privacyEmail: "privacy@matherion.it",
  product: "Matherion Fleet OS",
  claim: "Muoviamo idee, guidiamo soluzioni",
};
const ownerAddressLine = () =>
  `${PLATFORM_OWNER.address}, ${PLATFORM_OWNER.zip} ${PLATFORM_OWNER.city} (${PLATFORM_OWNER.province})`;

// ---------------------------------------------------------------------------
// PALETTE — allineata al marchio Matherion (teal/cyan del logo)
// ---------------------------------------------------------------------------
// I nomi delle costanti restano quelli originari perché usati ovunque nel file:
// cambiare qui i valori riveste l'intera piattaforma senza toccare i moduli.
//   NAVY_900/800/700 → scala del teal profondo (sfondi scuri, testi, azioni primarie)
//   GOLD_500/300     → teal chiaro di accento (indicatori attivi, azioni secondarie)
const NAVY_900 = "#0A2A33";   // teal profondissimo — sidebar
const NAVY_800 = "#0F3C49";   // teal profondo — bordi e superfici scure
const NAVY_700 = "#12596B";   // teal primario — titoli e pulsanti principali
const GOLD_500 = "#2FA8C4";   // cyan del logo — accento e azioni secondarie
const GOLD_300 = "#A6DEEB";   // cyan chiaro — testo su fondo scuro
const GOLD_DARK = "#14788F";  // cyan scuro — link su fondo chiaro

const BRAND_GRADIENT = "linear-gradient(160deg, #0A2A33 0%, #0F3C49 55%, #12596B 100%)";
const ACCENT_GRADIENT = "linear-gradient(135deg, #2FA8C4 0%, #4FC3D9 100%)";
const SURFACE = "#F4F7F9";    // sfondo applicativo, leggermente freddo

const FONT = '"Segoe UI", Calibri, system-ui, -apple-system, sans-serif';

// ---------------------------------------------------------------------------
// MOCK DATA — modellati sullo schema fleet_platform_schema.sql
// ---------------------------------------------------------------------------
const seedCompanies = [
  { id: "demo", name: "Demo Trasporti S.r.l.", role: "Utilizzatrice / Gestore", city: "Livorno",
    platformEnabled: true, demo: true,
    legalAddress: "Via della Dimostrazione 1, 57121 Livorno (LI)", vat: "IT00000000011",
    reaNumber: "LI-000001", legalRep: "Mario Rossi", pec: "demotrasporti@pec.example",
    isTransportOperator: true, alboNumber: "LI/0000001",
    declaredCapacity: 45000, capacityType: "Fideiussione bancaria", capacityDate: "2026-01-15", capacityExpiry: "2027-01-15" },
  { id: "demoholding", name: "Demo Holding S.r.l.", role: "Concedente / Proprietaria", city: "Roma",
    platformEnabled: true, demo: true,
    legalAddress: "Via della Dimostrazione 10, 00173 Roma (RM)", vat: "IT00000000012",
    reaNumber: "RM-000002", legalRep: "Mario Rossi", pec: "demoholding@pec.example",
    isTransportOperator: false, alboNumber: null,
    declaredCapacity: 0, capacityType: null, capacityDate: null, capacityExpiry: null },
  { id: "demopartner", name: "Demo Partner Logistica S.r.l.", role: "Subnoleggiatrice", city: "Roma",
    platformEnabled: true, demo: true,
    legalAddress: "Via della Dimostrazione 20, 00171 Roma (RM)", vat: "IT00000000013",
    reaNumber: "RM-000003", legalRep: "Giulia Conti", pec: "demopartner@pec.example",
    isTransportOperator: true, alboNumber: "RM/0000003",
    declaredCapacity: 9500, capacityType: "Patrimonio netto", capacityDate: "2025-11-30", capacityExpiry: "2026-11-30" },
];

const statusMeta = {
  disponibile: { label: "Disponibile", color: "#2E7D5B", bg: "#E7F5EE" },
  assegnato: { label: "Assegnato", color: "#12596B", bg: "#E3F2F6" },
  in_servizio: { label: "In servizio", color: "#12798F", bg: "#E3F2F6" },
  in_manutenzione: { label: "In manutenzione", color: "#B07A12", bg: "#FBF1DC" },
  incidentato: { label: "Incidentato", color: "#B4302E", bg: "#FBEAEA" },
  fermo: { label: "Fermo", color: "#6B7280", bg: "#F1F2F4" },
  in_trasferimento: { label: "In trasferimento", color: "#8B5CF6", bg: "#F1EBFE" },
};

const seedVehicles = [
  { id: "v1", plate: "FR001AB", internalPlate: "FR-LIV-001", vin: "WVWZZZ1KZAW000001", engineNumber: "CFHC123456",
    make: "Volkswagen", model: "Caddy Cargo", version: "2.0 TDI 102CV", vehicleCategory: "N1",
    homologationNumber: "e3*2007/46*1234*05", fuel: "Diesel", displacement: 1968, powerKw: 75,
    color: "Bianco", euroClass: "Euro 6D", co2: 148, maxSpeed: 168,
    maxLadenMass: 2400, unladenMass: 1620, maxTrailerBraked: 1500, maxTrailerUnbraked: 690,
    axlesCount: 2, wheelbase: 2755, seatsCount: 3,
    tireSizeFront: "205/65 R16C", tireSizeRear: "205/65 R16C", rimSizeFront: "6.5J x 16", rimSizeRear: "6.5J x 16",
    docNumber: "A2216218RM21", registrationDate: "2024-03-12", firstRegistrationDate: "2024-03-12", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 42150, status: "in_servizio", company: "demo", costCenter: "AMZ-LIV",
    driver: "M. Bianchi", availability: "noleggio", rentalSupplier: "Ayvens" },

  { id: "v2", plate: "FR002AB", internalPlate: "FR-LIV-002", vin: "WVWZZZ1KZAW000002", engineNumber: "CFHC123457",
    make: "Fiat", model: "Ducato", version: "2.3 MJT 140CV L2H2", vehicleCategory: "N1",
    homologationNumber: "e3*2007/46*1235*05", fuel: "Diesel", displacement: 2287, powerKw: 103,
    color: "Bianco", euroClass: "Euro 6D", co2: 189, maxSpeed: 158,
    maxLadenMass: 3300, unladenMass: 1980, maxTrailerBraked: 2000, maxTrailerUnbraked: 750,
    axlesCount: 2, wheelbase: 3450, seatsCount: 3,
    tireSizeFront: "225/75 R16C", tireSizeRear: "225/75 R16C", rimSizeFront: "6J x 16", rimSizeRear: "6J x 16",
    docNumber: "A2216219RM21", registrationDate: "2022-06-05", firstRegistrationDate: "2022-06-05", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 88420, status: "in_manutenzione", company: "demo", costCenter: "AMZ-LIV",
    driver: "—", availability: "leasing", rentalSupplier: "Arval" },

  { id: "v3", plate: "FR003AC", internalPlate: "FR-GRS-001", vin: "WVWZZZ1KZAW000003", engineNumber: "CFHC123458",
    make: "Volkswagen", model: "Caddy Cargo", version: "2.0 TDI 102CV", vehicleCategory: "N1",
    homologationNumber: "e3*2007/46*1234*05", fuel: "Diesel", displacement: 1968, powerKw: 75,
    color: "Bianco", euroClass: "Euro 6D", co2: 148, maxSpeed: 168,
    maxLadenMass: 2400, unladenMass: 1620, maxTrailerBraked: 1500, maxTrailerUnbraked: 690,
    axlesCount: 2, wheelbase: 2755, seatsCount: 3,
    tireSizeFront: "205/65 R16C", tireSizeRear: "205/65 R16C", rimSizeFront: "6.5J x 16", rimSizeRear: "6.5J x 16",
    docNumber: "A2216220RM21", registrationDate: "2025-11-02", firstRegistrationDate: "2025-11-02", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 15200, status: "disponibile", company: "demo", costCenter: "AMZ-GRS",
    driver: "—", availability: "proprieta", rentalSupplier: null },

  { id: "v4", plate: "FR004AC", internalPlate: "FR-GRS-002", vin: "WVWZZZ1KZAW000004", engineNumber: "EL0004AB",
    make: "Renault", model: "Kangoo", version: "E-Tech Electric 90CV", vehicleCategory: "N1",
    homologationNumber: "e2*2007/46*0998*07", fuel: "Elettrico", displacement: null, powerKw: 66,
    color: "Grigio", euroClass: "—", co2: 0, maxSpeed: 130,
    maxLadenMass: 1900, unladenMass: 1450, maxTrailerBraked: 750, maxTrailerUnbraked: 500,
    axlesCount: 2, wheelbase: 2716, seatsCount: 3,
    tireSizeFront: "195/65 R16C", tireSizeRear: "195/65 R16C", rimSizeFront: "6J x 16", rimSizeRear: "6J x 16",
    docNumber: "A2216221RM21", registrationDate: "2025-02-18", firstRegistrationDate: "2025-02-18", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 9800, status: "in_servizio", company: "demo", costCenter: "AMZ-GRS",
    driver: "L. Rossi", availability: "noleggio", rentalSupplier: "Leasys" },

  { id: "v5", plate: "FR005AD", internalPlate: "FR-LIV-003", vin: "WVWZZZ1KZAW000005", engineNumber: "CFHC123459",
    make: "Fiat", model: "Doblo", version: "1.6 MJT 100CV", vehicleCategory: "N1",
    homologationNumber: "e3*2007/46*1236*04", fuel: "Diesel", displacement: 1598, powerKw: 74,
    color: "Bianco", euroClass: "Euro 6D", co2: 155, maxSpeed: 162,
    maxLadenMass: 2050, unladenMass: 1380, maxTrailerBraked: 1200, maxTrailerUnbraked: 620,
    axlesCount: 2, wheelbase: 2755, seatsCount: 3,
    tireSizeFront: "195/65 R16C", tireSizeRear: "195/65 R16C", rimSizeFront: "6J x 16", rimSizeRear: "6J x 16",
    docNumber: "A2216222RM21", registrationDate: "2021-09-20", firstRegistrationDate: "2021-09-20", registrationValidity: "Illimitata",
    plateChangeNotes: "Reimmatricolato il 14/05/2023 a seguito furto/ritrovamento targa originaria FR005AA — nuova targa FR005AD assegnata da MCTC Livorno.",
    km: 61340, status: "incidentato", company: "demo", costCenter: "AMZ-LIV",
    driver: "—", availability: "leasing", rentalSupplier: "Arval" },

  { id: "v6", plate: "FR006AD", internalPlate: "CLD-ROM-001", vin: "WVWZZZ1KZAW000006", engineNumber: "CFHC123460",
    make: "Volkswagen", model: "Caddy Cargo", version: "2.0 TDI 102CV", vehicleCategory: "N1",
    homologationNumber: "e3*2007/46*1234*05", fuel: "Diesel", displacement: 1968, powerKw: 75,
    color: "Bianco", euroClass: "Euro 6D", co2: 148, maxSpeed: 168,
    maxLadenMass: 2400, unladenMass: 1620, maxTrailerBraked: 1500, maxTrailerUnbraked: 690,
    axlesCount: 2, wheelbase: 2755, seatsCount: 3,
    tireSizeFront: "205/65 R16C", tireSizeRear: "205/65 R16C", rimSizeFront: "6.5J x 16", rimSizeRear: "6.5J x 16",
    docNumber: "A2216223RM21", registrationDate: "2023-12-01", firstRegistrationDate: "2023-12-01", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 33990, status: "assegnato", company: "demopartner", costCenter: "SUB-ROM",
    driver: "P. Verdi", availability: "subnoleggio", rentalSupplier: null },

  { id: "v7", plate: "FR007AE", internalPlate: "FR-LIV-004", vin: "WVWZZZ1KZAW000007", engineNumber: "CFHC123461",
    make: "Renault", model: "Master", version: "2.3 dCi 145CV L2H2", vehicleCategory: "N1",
    homologationNumber: "e2*2007/46*0876*06", fuel: "Diesel", displacement: 2298, powerKw: 107,
    color: "Bianco", euroClass: "Euro 6", co2: 195, maxSpeed: 155,
    maxLadenMass: 3500, unladenMass: 2100, maxTrailerBraked: 2000, maxTrailerUnbraked: 750,
    axlesCount: 2, wheelbase: 3682, seatsCount: 3,
    tireSizeFront: "235/65 R16C", tireSizeRear: "235/65 R16C", rimSizeFront: "6.5J x 16", rimSizeRear: "6.5J x 16",
    docNumber: "A2216224RM21", registrationDate: "2019-04-10", firstRegistrationDate: "2019-04-10", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 121870, status: "fermo", company: "demo", costCenter: "AMZ-LIV",
    driver: "—", availability: "proprieta", rentalSupplier: null },

  { id: "v8", plate: "FR008AE", internalPlate: "MAT-COR-001", vin: "WVWZZZ1KZAW000008", engineNumber: "CFHC123462",
    make: "Fiat", model: "Ducato", version: "2.3 MJT 140CV L1H1", vehicleCategory: "N1",
    homologationNumber: "e3*2007/46*1235*05", fuel: "Diesel", displacement: 2287, powerKw: 103,
    color: "Blu", euroClass: "Euro 6D", co2: 182, maxSpeed: 158,
    maxLadenMass: 3000, unladenMass: 1850, maxTrailerBraked: 2000, maxTrailerUnbraked: 750,
    axlesCount: 2, wheelbase: 3000, seatsCount: 3,
    tireSizeFront: "215/70 R15C", tireSizeRear: "215/70 R15C", rimSizeFront: "6J x 15", rimSizeRear: "6J x 15",
    docNumber: "A2216225RM21", registrationDate: "2025-07-01", firstRegistrationDate: "2025-07-01", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 5100, status: "disponibile", company: "demoholding", costCenter: "CORP-01",
    driver: "—", availability: "proprieta", rentalSupplier: null },

  // --- Mezzi pesanti (rilevanti per il rimborso accise) ---
  { id: "v9", plate: "FR009BA", internalPlate: "FR-LIV-005", vin: "WVWZZZ1KZAW000009", engineNumber: "OM936LA001",
    make: "Iveco", model: "Eurocargo", version: "120E25 Euro 6", vehicleCategory: "N2",
    homologationNumber: "e3*2007/46*2210*03", fuel: "Diesel", displacement: 5900, powerKw: 185,
    color: "Bianco", euroClass: "Euro 6", co2: 620, maxSpeed: 110,
    maxLadenMass: 12000, unladenMass: 5400, maxTrailerBraked: 8000, maxTrailerUnbraked: 750,
    axlesCount: 2, wheelbase: 4185, seatsCount: 3,
    tireSizeFront: "245/70 R19.5", tireSizeRear: "245/70 R19.5", rimSizeFront: "6.75 x 19.5", rimSizeRear: "6.75 x 19.5",
    docNumber: "A2216226RM21", registrationDate: "2023-05-14", firstRegistrationDate: "2023-05-14", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 187400, status: "in_servizio", company: "demo", costCenter: "AMZ-LIV",
    driver: "G. Ferri", availability: "proprieta", rentalSupplier: null },

  { id: "v10", plate: "FR010BA", internalPlate: "FR-LIV-006", vin: "WVWZZZ1KZAW000010", engineNumber: "DC13155002",
    make: "Scania", model: "R450", version: "Highline 4x2 Euro 6", vehicleCategory: "N3",
    homologationNumber: "e4*2007/46*0551*08", fuel: "Diesel", displacement: 12742, powerKw: 331,
    color: "Bianco", euroClass: "Euro 6", co2: 890, maxSpeed: 90,
    maxLadenMass: 18000, unladenMass: 7900, maxTrailerBraked: 26000, maxTrailerUnbraked: 750,
    axlesCount: 2, wheelbase: 3700, seatsCount: 2,
    tireSizeFront: "315/70 R22.5", tireSizeRear: "315/70 R22.5", rimSizeFront: "9.00 x 22.5", rimSizeRear: "9.00 x 22.5",
    docNumber: "A2216227RM21", registrationDate: "2022-09-08", firstRegistrationDate: "2022-09-08", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 412600, status: "in_servizio", company: "demo", costCenter: "AMZ-LIV",
    driver: "S. Conti", availability: "leasing", rentalSupplier: "Arval" },

  { id: "v11", plate: "FR011BB", internalPlate: "FR-GRS-003", vin: "WVWZZZ1KZAW000011", engineNumber: "F1CE3481007",
    make: "Iveco", model: "Daily", version: "70C18 Euro 6", vehicleCategory: "N2",
    homologationNumber: "e3*2007/46*1902*06", fuel: "Diesel", displacement: 2998, powerKw: 132,
    color: "Bianco", euroClass: "Euro 6D", co2: 310, maxSpeed: 130,
    maxLadenMass: 7000, unladenMass: 3200, maxTrailerBraked: 3500, maxTrailerUnbraked: 750,
    axlesCount: 2, wheelbase: 3750, seatsCount: 3,
    tireSizeFront: "225/75 R16C", tireSizeRear: "225/75 R16C", rimSizeFront: "6J x 16", rimSizeRear: "6J x 16",
    docNumber: "A2216228RM21", registrationDate: "2024-02-20", firstRegistrationDate: "2024-02-20", registrationValidity: "Illimitata",
    plateChangeNotes: "", km: 94300, status: "in_servizio", company: "demo", costCenter: "AMZ-GRS",
    driver: "A. Moretti", availability: "noleggio", rentalSupplier: "Ayvens" },
];

const availabilityLabel = {
  proprieta: "Proprietà", leasing: "Leasing", noleggio: "Noleggio",
  subnoleggio: "Subnoleggio", comodato: "Comodato", altro: "Altro",
};

const companyName = (id) => LIVE.companies.find(c => c.id === id)?.name || id;

const seedDeadlines = [
  { id: "d1", vehicle: "FR002AB", type: "Revisione", due: "2026-08-25", days: 6 },
  { id: "d2", vehicle: "FR005AD", type: "Assicurazione RCA", due: "2026-08-29", days: 10 },
  { id: "d3", vehicle: "FR001AB", type: "Tagliando", due: "2026-09-05", days: 17 },
  { id: "d4", vehicle: "FR007AE", type: "Bollo", due: "2026-09-18", days: 30 },
  { id: "d5", vehicle: "FR006AD", type: "Telepass", due: "2026-10-10", days: 52 },
];

const seedClaims = [
  { id: "s1", vehicle: "FR005AD", date: "2026-08-02", status: "attesa_perizia", damage: 3200, driver: "R. Neri",
    deductible: 1000, claimNumber: "SX/2026/41907",
    updates: [{ date: "2026-08-05", from: "aperto", to: "attesa_perizia", text: "Denuncia inviata alla compagnia, perito assegnato." }] },
  { id: "s2", vehicle: "FR002AB", date: "2026-07-18", status: "in_riparazione", damage: 1450, driver: "M. Bianchi",
    updates: [{ date: "2026-07-25", from: "attesa_perizia", to: "in_riparazione", text: "Perizia conclusa, autorizzata riparazione in carrozzeria." }] },
  { id: "s3", vehicle: "FR007AE", date: "2026-06-30", status: "liquidato", damage: 890, driver: "—",
    updates: [{ date: "2026-07-20", from: "in_riparazione", to: "liquidato", text: "Liquidati € 890 al netto della franchigia." }] },
  { id: "s4", vehicle: "FR010BA", date: "2026-08-14", status: "aperto", damage: 5400, driver: "S. Conti",
    deductible: 1500, claimNumber: "SX/2026/44120", updates: [] },
  // Mezzo subnoleggiato: la franchigia è a carico del locatario e viene
  // addebitata in fattura senza IVA (rimborso del danno, art. 15 DPR 633/72)
  { id: "s5", vehicle: "FR003AC", date: "2026-09-05", status: "in_riparazione", damage: 2100, driver: "L. Fabbri",
    deductible: 800, claimNumber: "SX/2026/45233", insuranceCompany: "UnipolSai", liability: "nostra",
    updates: [{ date: "2026-09-08", from: "aperto", to: "in_riparazione", text: "Perizia conclusa: danno riconosciuto, franchigia 800 € a carico del locatario." }] },
];

const seedFines = [
  // Mezzo in gestione interna: nessuna rinotifica, resta l'obbligo di comunicare
  // i dati del conducente all'ente accertatore
  { id: "f1", vehicle: "FR002AB", fineNumber: "V/2026/118432", authority: "Comune di Livorno",
    date: "2026-08-10", notificationDate: "2026-08-14", offence: "Art. 7 CdS — accesso ZTL non autorizzato",
    amount: 88, reducedAmount: 61.60, points: 0, status: "ricevuto", driver: "M. Bianchi" },
  { id: "f2", vehicle: "FR004AC", fineNumber: "V/2026/009911", authority: "Polizia Stradale",
    date: "2026-07-22", notificationDate: "2026-08-05", offence: "Art. 142 CdS — eccesso di velocità",
    amount: 173, reducedAmount: 121.10, points: 3, status: "in_ricorso", driver: "L. Rossi" },
  // Mezzo subnoleggiato a Demo Partner alla data dell'infrazione: va rinotificato
  { id: "f3", vehicle: "FR006AD", fineNumber: "V/2026/447120", authority: "Comune di Roma",
    date: "2026-08-14", notificationDate: "2026-08-16", offence: "Art. 158 CdS — sosta vietata",
    amount: 42, reducedAmount: 29.40, points: 0, status: "ricevuto", driver: "" },
  { id: "f4", vehicle: "FR006AD", fineNumber: "V/2026/431008", authority: "Polizia Locale Roma",
    date: "2026-06-28", notificationDate: "2026-07-10", offence: "Art. 7 CdS — corsia riservata",
    amount: 165, reducedAmount: 115.50, points: 2, status: "rinotificato", driver: "",
    rinotifica: { date: "2026-07-14", to: "demopartner", method: "PEC",
      ref: "PEC prot. 2026/1188", rechargeAmount: 165, adminFee: 15 } },
];

const seedMaintenance = [
  { id: "m1", vehicle: "FR002AB", type: "straordinaria", workshop: "Officina Del Porto", status: "in_corso", cost: 1850, scheduled: "2026-08-19",
    updates: [{ date: "2026-08-19", from: "autorizzata", to: "in_corso", text: "Mezzo entrato in officina, smontaggio frizione avviato." }] },
  { id: "m2", vehicle: "FR007AE", type: "ordinaria", workshop: "Officina Mobile Toscana", status: "richiesta",
    cost: null, scheduled: "2026-08-22", quoteStatus: "da_richiedere", updates: [] },
  { id: "m3", vehicle: "FR001AB", type: "programmata", workshop: "Officina Del Porto", status: "completata", cost: 320, scheduled: "2026-07-30",
    quoteNumber: "PRV-2026/098", quoteDate: "2026-07-24", quoteAmount: 340, quoteStatus: "approvato",
    invoiceNumber: "FT 2026/207", invoiceDate: "2026-08-05", invoiceAmount: 320,
    updates: [{ date: "2026-07-30", from: "in_corso", to: "completata", text: "Tagliando eseguito, sostituiti filtri e olio." }] },
  { id: "m4", vehicle: "FR010BA", type: "programmata", workshop: "Scania Service Pisa", status: "preventivata",
    cost: 2400, scheduled: "2026-09-02",
    quoteNumber: "PRV-2026/114", quoteDate: "2026-08-19", quoteAmount: 2150, quoteStatus: "ricevuto", updates: [] },
  { id: "m5", vehicle: "FR009BA", type: "straordinaria", workshop: "Iveco Assistance", status: "autorizzata", cost: 1180, scheduled: "2026-08-28", updates: [] },
  { id: "m6", vehicle: "FR004AC", type: "ordinaria", workshop: "AutoService Livorno", status: "fatturata", cost: 260, scheduled: "2026-06-15",
    updates: [{ date: "2026-06-20", from: "completata", to: "fatturata", text: "Fattura 2291 registrata in contabilità." }] },
];

// downPayment = maxi-canone / anticipo versato alla stipula
// buyout       = riscatto previsto a scadenza (leasing e finanziamenti)
const seedContracts = [
  { id: "c1", vehicle: "FR001AB", type: "noleggio", supplier: "Ayvens", fee: 480, start: "2024-03-01", end: "2027-03-01", status: "attivo",
    downPayment: 2500, buyout: 0 },
  { id: "c2", vehicle: "FR002AB", type: "leasing", supplier: "Arval", fee: 390, start: "2022-06-05", end: "2026-09-15", status: "in_rinnovo",
    downPayment: 6000, buyout: 4800 },
  { id: "c3", vehicle: "FR004AC", type: "noleggio", supplier: "Leasys", fee: 520, start: "2025-02-18", end: "2027-11-01", status: "attivo",
    downPayment: 0, buyout: 0 },
  { id: "c4", vehicle: "FR005AD", type: "leasing", supplier: "Arval", fee: 410, start: "2021-09-20", end: "2026-09-19", status: "attivo",
    downPayment: 5500, buyout: 3900 },
  { id: "c5", vehicle: "FR005AD", type: "noleggio", supplier: "Ayvens", fee: 445, start: "2026-11-01", end: "2029-10-31", status: "bozza",
    downPayment: 3000, buyout: 0 },
  { id: "c6", vehicle: "FR011BB", type: "noleggio", supplier: "Ayvens", fee: 1480, start: "2024-02-20", end: "2026-10-31", status: "attivo",
    downPayment: 8000, buyout: 0 },
  { id: "c7", vehicle: "FR011BB", type: "noleggio", supplier: "Leasys", fee: 1520, start: "2026-11-01", end: "2029-10-31", status: "bozza",
    downPayment: 0, buyout: 0 },
  { id: "c8", vehicle: "FR009BA", type: "acquisto", supplier: "Iveco Italia", fee: 0, start: "2023-05-14", end: "2030-05-13", status: "attivo",
    downPayment: 68000, buyout: 0 },
  { id: "c9", vehicle: "FR010BA", type: "leasing", supplier: "Arval", fee: 2100, start: "2022-09-08", end: "2027-09-07", status: "attivo",
    downPayment: 24000, buyout: 18500 },
];

// ---------------------------------------------------------------------------
// COSTI FISSI ANNUI PER VEICOLO — maturano anche a mezzo fermo
// ---------------------------------------------------------------------------
// Valori di partenza dei soli veicoli dimostrativi: per ogni altro mezzo i
// costi fissi si leggono dalla scheda del veicolo (sezione «Costi fissi annui»).
const seedFixedCosts = {
  FR001AB: { insurance: 1450, roadTax: 320, telematics: 180, other: 120 },
  FR002AB: { insurance: 1680, roadTax: 480, telematics: 180, other: 140 },
  FR003AC: { insurance: 1400, roadTax: 320, telematics: 180, other: 100 },
  FR004AC: { insurance: 1250, roadTax: 0,   telematics: 180, other: 100 },
  FR005AD: { insurance: 1520, roadTax: 340, telematics: 180, other: 120 },
  FR006AD: { insurance: 1450, roadTax: 320, telematics: 180, other: 120 },
  FR007AE: { insurance: 1890, roadTax: 520, telematics: 180, other: 160 },
  FR008AE: { insurance: 1620, roadTax: 460, telematics: 180, other: 140 },
  FR009BA: { insurance: 3800, roadTax: 980, telematics: 240, other: 320 },
  FR010BA: { insurance: 5200, roadTax: 1240, telematics: 240, other: 420 },
  FR011BB: { insurance: 2400, roadTax: 640, telematics: 240, other: 200 },
};

// ---------------------------------------------------------------------------
// FERMI TECNICI — dal momento del fermo alla rimessa in servizio
// ---------------------------------------------------------------------------
const DOWNTIME_CAUSES = {
  meccanica:    { label: "Meccanica",              color: "#1B6DB0" },
  carrozzeria:  { label: "Carrozzeria",            color: "#8B5CF6" },
  pneumatici:   { label: "Pneumatici",             color: "#B07A12" },
  assicurazione:{ label: "Copertura assicurativa", color: "#B4302E" },
  revisione:    { label: "Revisione / collaudo",   color: "#6B7280" },
  sinistro:     { label: "Sinistro",               color: "#B4302E" },
  altro:        { label: "Altro",                  color: "#6B7280" },
};

const seedDowntimeEvents = [
  { id: "dt1", vehicle: "FR002AB", cause: "meccanica", start: "2026-08-14", end: null,
    description: "Sostituzione frizione", repairCost: 1850, replacementDailyCost: 0, sourceRef: "m1" },
  { id: "dt2", vehicle: "FR005AD", cause: "sinistro", start: "2026-08-02", end: null,
    description: "Attesa perizia e riparazione carrozzeria", repairCost: 3200, replacementDailyCost: 45, sourceRef: "s1" },
  { id: "dt3", vehicle: "FR007AE", cause: "assicurazione", start: "2026-07-28", end: "2026-08-11",
    description: "Mancato rinnovo RCA — mezzo fermo fino a copertura", repairCost: 0, replacementDailyCost: 0 },
  { id: "dt4", vehicle: "FR001AB", cause: "pneumatici", start: "2026-07-30", end: "2026-07-31",
    description: "Sostituzione treno gomme", repairCost: 620, replacementDailyCost: 0 },
  { id: "dt5", vehicle: "FR010BA", cause: "meccanica", start: "2026-06-10", end: "2026-06-19",
    description: "Guasto turbina", repairCost: 4900, replacementDailyCost: 180 },
  { id: "dt6", vehicle: "FR004AC", cause: "revisione", start: "2026-05-12", end: "2026-05-13",
    description: "Revisione periodica", repairCost: 85, replacementDailyCost: 0 },
  { id: "dt7", vehicle: "FR011BB", cause: "carrozzeria", start: "2026-04-02", end: "2026-04-16",
    description: "Riparazione sponda idraulica", repairCost: 2750, replacementDailyCost: 90 },
];

// Condizioni di noleggio: franchigia RCA, penale danni, furto (importo o %)
const seedSubRentals = [
  { id: "sr1", vehicle: "FR006AD", granting: "demoholding", using: "demopartner", fee: 1150, vehicleCost: 850,
    start: "2026-04-01", end: "2027-04-01", status: "attivo",
    deductibleRCA: 1000, damagePenalty: 750, theftMode: "percentuale", theftValue: 10 },
  { id: "sr2", vehicle: "FR003AC", granting: "demo", using: "demopartner", fee: 780, vehicleCost: 560,
    start: "2025-09-01", end: "2026-08-31", status: "attivo",
    deductibleRCA: 800, damagePenalty: 500, theftMode: "percentuale", theftValue: 10 },
  { id: "sr3", vehicle: "FR004AC", granting: "demo", using: "demopartner", fee: 690, vehicleCost: 480,
    start: "2025-09-15", end: "2026-09-14", status: "attivo",
    deductibleRCA: 800, damagePenalty: 500, theftMode: "importo", theftValue: 2500 },
  { id: "sr4", vehicle: "FR001AB", granting: "demo", using: "demopartner", fee: 820, vehicleCost: 690,
    start: "2025-10-01", end: "2026-09-30", status: "attivo",
    deductibleRCA: 1000, damagePenalty: 750, theftMode: "percentuale", theftValue: 15 },
  { id: "sr5", vehicle: "FR011BB", granting: "demo", using: "demopartner", fee: 1480, vehicleCost: 1320,
    start: "2025-11-01", end: "2026-10-31", status: "attivo",
    deductibleRCA: 1500, damagePenalty: 1000, theftMode: "percentuale", theftValue: 10 },
];

// ---------------------------------------------------------------------------
// CARBURANTE & FUEL CARD
// ---------------------------------------------------------------------------
// Ogni operatore esporta i movimenti con intestazioni proprie: invece di
// costringere l'utente a rimappare le colonne a mano, ogni operatore ha il suo
// profilo di importazione. Il tracciato "Matherion" resta come formato neutro
// per gli operatori non ancora profilati.
const FUEL_OPERATORS = {
  q8:       { label: "Q8 / Q8easy",   color: "#B4302E" },
  ip:       { label: "IP Plus",       color: "#1B6DB0" },
  eni:      { label: "Eni / Enjoy",   color: "#E8A33D" },
  eurowag:  { label: "Eurowag",       color: "#2E7D5B" },
  shell:    { label: "Shell Card",    color: "#B07A12" },
  tamoil:   { label: "Tamoil",        color: "#8B5CF6" },
  altro:    { label: "Altro operatore", color: "#6B7280" },
};

// Mappatura intestazione del file -> campo interno, per operatore
const FUEL_IMPORT_PROFILES = {
  matherion: {
    label: "Tracciato Matherion (neutro)",
    map: { date: "Data", card: "Carta", vehicle: "Targa", station: "Punto vendita",
           product: "Prodotto", qty: "Litri", unitPrice: "Prezzo unitario", amount: "Importo", odometer: "Km" },
  },
  q8: {
    label: "Q8 / Q8easy",
    map: { date: "DATA OPERAZIONE", card: "NUMERO CARTA", vehicle: "TARGA", station: "PUNTO VENDITA",
           product: "PRODOTTO", qty: "QUANTITA", unitPrice: "PREZZO UNITARIO", amount: "IMPORTO LORDO", odometer: "CHILOMETRAGGIO" },
  },
  ip: {
    label: "IP Plus",
    map: { date: "Data rifornimento", card: "Card", vehicle: "Targa veicolo", station: "Stazione",
           product: "Carburante", qty: "Litri erogati", unitPrice: "Prezzo/litro", amount: "Totale €", odometer: "Km veicolo" },
  },
  eni: {
    label: "Eni",
    map: { date: "Data", card: "N. Carta", vehicle: "Targa", station: "Impianto",
           product: "Tipo prodotto", qty: "Quantità (LT)", unitPrice: "Prezzo", amount: "Importo", odometer: "Km" },
  },
  eurowag: {
    label: "Eurowag",
    map: { date: "Transaction date", card: "Card number", vehicle: "Vehicle plate", station: "Station name",
           product: "Product", qty: "Quantity", unitPrice: "Unit price", amount: "Gross amount", odometer: "Odometer" },
  },
};

const initialFuelCards = [
  { id: "fc1", operator: "q8", number: "7080 1234 5678 9012", assignedTo: "FR001AB", assignType: "vehicle",
    pin: "••••", expiry: "2027-06-30", status: "attiva", monthlyFee: 0 },
  { id: "fc2", operator: "eni", number: "7003 9988 7766 5544", assignedTo: "FR010BA", assignType: "vehicle",
    pin: "••••", expiry: "2027-03-31", status: "attiva", monthlyFee: 2.5 },
  { id: "fc3", operator: "eurowag", number: "EW-4477112", assignedTo: "FR009BA", assignType: "vehicle",
    pin: "••••", expiry: "2028-01-31", status: "attiva", monthlyFee: 3 },
  { id: "fc4", operator: "ip", number: "6015 3344 1122 8899", assignedTo: "M. Bianchi", assignType: "driver",
    pin: "••••", expiry: "2026-12-31", status: "attiva", monthlyFee: 0 },
  { id: "fc5", operator: "q8", number: "7080 0000 1111 2222", assignedTo: null, assignType: null,
    pin: "••••", expiry: "2027-06-30", status: "sospesa", monthlyFee: 0 },
];

const initialFuelTx = [
  { id: "ftx1", date: "2026-08-18", operator: "q8", card: "7080 1234 5678 9012", vehicle: "FR001AB",
    station: "Q8 Livorno Aurelia", product: "Gasolio", qty: 45.2, unitPrice: 1.549, amount: 70.02, odometer: 42150 },
  { id: "ftx2", date: "2026-08-15", operator: "eni", card: "7003 9988 7766 5544", vehicle: "FR010BA",
    station: "Eni Firenze Nord", product: "Gasolio", qty: 598, unitPrice: 1.570, amount: 938.86, odometer: 412600 },
  { id: "ftx3", date: "2026-08-12", operator: "eurowag", card: "EW-4477112", vehicle: "FR009BA",
    station: "Eurowag Bologna", product: "Gasolio", qty: 288, unitPrice: 1.570, amount: 452.16, odometer: 187400 },
  { id: "ftx4", date: "2026-08-10", operator: "ip", card: "6015 3344 1122 8899", vehicle: "FR002AB",
    station: "IP Pisa Est", product: "Gasolio", qty: 62.4, unitPrice: 1.559, amount: 97.28, odometer: 88420 },
  { id: "ftx5", date: "2026-08-05", operator: "q8", card: "7080 1234 5678 9012", vehicle: "FR001AB",
    station: "Q8 Livorno Porto", product: "AdBlue", qty: 10, unitPrice: 0.890, amount: 8.90, odometer: 41680 },
];

// ---------------------------------------------------------------------------
// TELEPASS & PEDAGGI
// ---------------------------------------------------------------------------
const TOLL_OPERATORS = {
  telepass:  { label: "Telepass", color: "#1B6DB0" },
  unipol:    { label: "UnipolMove", color: "#2E7D5B" },
  dkv:       { label: "DKV Box", color: "#E8A33D" },
  altro:     { label: "Altro", color: "#6B7280" },
};

const initialTollDevices = [
  { id: "td1", operator: "telepass", serial: "TP-4471820", vehicle: "FR001AB", tollClass: "A",
    activation: "2024-03-15", monthlyFee: 3.90, status: "attivo" },
  { id: "td2", operator: "telepass", serial: "TP-4471821", vehicle: "FR010BA", tollClass: "B",
    activation: "2022-09-20", monthlyFee: 12.50, status: "attivo" },
  { id: "td3", operator: "telepass", serial: "TP-4471822", vehicle: "FR009BA", tollClass: "B",
    activation: "2023-05-20", monthlyFee: 12.50, status: "attivo" },
  { id: "td4", operator: "unipol", serial: "UM-9982211", vehicle: null, tollClass: "A",
    activation: "2025-01-10", monthlyFee: 2.50, status: "giacenza" },
];

const initialTollTx = [
  { id: "tt1", date: "2026-08-18", device: "TP-4471820", vehicle: "FR001AB", network: "A12",
    entry: "Livorno", exit: "Pisa Centro", amount: 3.40, tollClass: "A" },
  { id: "tt2", date: "2026-08-17", device: "TP-4471821", vehicle: "FR010BA", network: "A1",
    entry: "Firenze Sud", exit: "Bologna", amount: 28.90, tollClass: "B" },
  { id: "tt3", date: "2026-08-16", device: "TP-4471822", vehicle: "FR009BA", network: "A11",
    entry: "Pistoia", exit: "Firenze Nord", amount: 9.20, tollClass: "B" },
  { id: "tt4", date: "2026-08-14", device: "TP-4471820", vehicle: "FR001AB", network: "A12",
    entry: "Pisa Centro", exit: "Livorno", amount: 3.40, tollClass: "A" },
];

// ---------------------------------------------------------------------------
// DOTAZIONI DI BORDO
// ---------------------------------------------------------------------------
// Le dotazioni vivono in magazzino finché non vengono affidate: da quel momento
// sono in carico a un veicolo o a un dipendente, con verbale sottoscritto.
// È il presupposto per non perderle nei passaggi di mezzo fra centri di costo.
const EQUIPMENT_CATEGORIES = {
  movimentazione: { label: "Movimentazione",  color: "#1B6DB0" },  // carrelli, transpallet, muletti
  sicurezza:      { label: "Sicurezza",       color: "#B4302E" },  // giubbetti AV, estintori, triangoli
  informatica:    { label: "Informatica",     color: "#8B5CF6" },  // palmari, stampanti
  carico:         { label: "Ancoraggio carico", color: "#B07A12" }, // cinghie, bravette, sponde
  invernale:      { label: "Dotazione invernale", color: "#12798F" },
  varie:          { label: "Varie",           color: "#6B7280" },
};

const initialEquipment = [
  { id: "eq1", code: "DOT-0001", category: "carico", description: "Bravetta di ancoraggio carico",
    serial: "BRV-11201", value: 45, purchase: "2025-04-10", condition: "buono",
    assignType: "vehicle", assignedTo: "FR001AB", assignedOn: "2025-04-12" },
  { id: "eq2", code: "DOT-0002", category: "movimentazione", description: "Transpallet manuale 2500 kg",
    serial: "TP-88410", value: 380, purchase: "2024-11-02", condition: "buono",
    assignType: "vehicle", assignedTo: "FR002AB", assignedOn: "2024-11-05" },
  { id: "eq3", code: "DOT-0003", category: "movimentazione", description: "Carrello pieghevole 300 kg",
    serial: "CR-2201", value: 120, purchase: "2025-02-18", condition: "buono",
    assignType: "vehicle", assignedTo: "FR002AB", assignedOn: "2025-02-20" },
  { id: "eq4", code: "DOT-0004", category: "informatica", description: "Palmare Zebra TC22",
    serial: "ZB-556677", value: 640, purchase: "2025-06-01", condition: "buono",
    assignType: "driver", assignedTo: "M. Bianchi", assignedOn: "2025-06-03" },
  { id: "eq5", code: "DOT-0005", category: "sicurezza", description: "Giubbetto alta visibilità cl. 2",
    serial: "GAV-9001", value: 18, purchase: "2026-01-15", condition: "buono",
    assignType: "driver", assignedTo: "M. Bianchi", assignedOn: "2026-01-16" },
  { id: "eq6", code: "DOT-0006", category: "movimentazione", description: "Muletto elettrico 1500 kg",
    serial: "MUL-3300", value: 9800, purchase: "2023-09-12", condition: "buono",
    assignType: null, assignedTo: null, assignedOn: null },
  { id: "eq7", code: "DOT-0007", category: "sicurezza", description: "Estintore 2 kg polvere",
    serial: "EST-4410", value: 32, purchase: "2026-03-01", condition: "buono",
    assignType: "vehicle", assignedTo: "FR010BA", assignedOn: "2026-03-02" },
  { id: "eq8", code: "DOT-0008", category: "invernale", description: "Catene da neve 22.5",
    serial: "CAT-7712", value: 210, purchase: "2025-10-20", condition: "buono",
    assignType: null, assignedTo: null, assignedOn: null },
  { id: "eq9", code: "DOT-0009", category: "informatica", description: "Palmare Zebra TC22",
    serial: "ZB-556678", value: 640, purchase: "2025-06-01", condition: "buono",
    assignType: null, assignedTo: null, assignedOn: null },
];

const initialEquipmentRecords = [
  { id: "er1", type: "affidamento", date: "2025-06-03", assignType: "driver", target: "M. Bianchi",
    items: ["eq4", "eq5"], note: "Consegna palmare e giubbetto AV per attività di consegna.", signed: true },
  { id: "er2", type: "affidamento", date: "2024-11-05", assignType: "vehicle", target: "FR002AB",
    items: ["eq2", "eq3"], note: "Dotazione di movimentazione a bordo per consegne su piano.", signed: true },
  { id: "er3", type: "riconsegna", date: "2026-05-20", assignType: "driver", target: "L. Rossi",
    items: [], note: "Riconsegna palmare a fine assegnazione: apparato verificato e funzionante.", signed: true },
];

// ---------------------------------------------------------------------------
// TRASFERIMENTI MASSIVI — filiali, reparti coinvolti e costi di trasferimento
// ---------------------------------------------------------------------------
const branches = [
  { id: "br1", name: "Filiale Livorno", company: "demo", city: "Livorno", costCenters: ["AMZ-LIV", "OPS-LIV"] },
  { id: "br2", name: "Filiale Grosseto", company: "demo", city: "Grosseto", costCenters: ["AMZ-GRS"] },
  { id: "br3", name: "Filiale Roma", company: "demopartner", city: "Roma", costCenters: ["SUB-ROM", "OPS-ROM"] },
  { id: "br4", name: "Sede Corporate", company: "demoholding", city: "Livorno", costCenters: ["CORP-01"] },
];

// Reparti destinatari della comunicazione: ognuno deve aggiornare qualcosa di
// diverso, quindi la mail riporta per ciascuno l'azione di competenza.
const departments = [
  { key: "dotazioni", label: "Reparto Dotazioni", email: "dotazioni@demotrasporti.example",
    action: "Aggiornare l'attribuzione dei dispositivi Telepass e la contabilizzazione dei pedaggi sul nuovo centro di costo." },
  { key: "carburante", label: "Reparto Carburante", email: "carburante@demotrasporti.example",
    action: "Riassegnare le fuel card e reindirizzare il riparto carburante alla filiale di destinazione." },
  { key: "amministrazione", label: "Amministrazione", email: "amministrazione@demotrasporti.example",
    action: "Predisporre e inviare la contrattualistica al nuovo committente e aggiornare l'intestazione dei contratti." },
  { key: "fleet_manager", label: "Responsabile Flotta", email: "fleetmanager@demotrasporti.example",
    action: "Validare il trasferimento e i costi sostenuti, con attribuzione al centro di costo destinatario." },
  { key: "operativo", label: "Responsabile Operativo Ufficio Flotta", email: "operativo@demotrasporti.example",
    action: "Pianificare la logistica dello spostamento e la riconsegna delle chiavi e dei documenti di bordo." },
  { key: "ufficio_flotta", label: "Ufficio Flotta", email: "ufficioflotta@demotrasporti.example",
    action: "Aggiornare l'anagrafica flotta, le scadenze e l'assegnazione dei conducenti." },
];

// Le voci di costo del trasferimento restano separate dalle altre spese del
// veicolo: sono costi una tantum di natura logistica e vanno valutati come
// tali dal Fleet Manager, non confusi con l'esercizio ordinario.
const TRANSFER_COST_ITEMS = [
  { key: "fuel", label: "Carburante" },
  { key: "tolls", label: "Pedaggi" },
  { key: "driver", label: "Autista / manodopera" },
  { key: "carrier", label: "Bisarca / trasporto su mezzo" },
  { key: "ferry", label: "Traghetto" },
  { key: "other", label: "Altri costi" },
];

const initialTransferBatches = [
  { id: "tb1", date: "2026-06-15", vehicles: ["FR003AC", "FR004AC"],
    fromLabel: "Filiale Livorno · AMZ-LIV", toBranch: "br2", toCostCenter: "AMZ-GRS",
    reason: "Riequilibrio flotta punta stagionale Grosseto",
    costs: { fuel: 180, tolls: 62, driver: 240, carrier: 0, ferry: 0, other: 25 },
    notified: ["dotazioni", "carburante", "amministrazione", "fleet_manager", "operativo", "ufficio_flotta"],
    status: "completato" },
  { id: "tb2", date: "2026-07-08", vehicles: ["FR010BA"],
    fromLabel: "Filiale Livorno · AMZ-LIV", toBranch: "br3", toCostCenter: "SUB-ROM",
    reason: "Assegnazione commessa Roma",
    costs: { fuel: 320, tolls: 148, driver: 380, carrier: 0, ferry: 0, other: 40 },
    notified: ["dotazioni", "carburante", "fleet_manager", "ufficio_flotta"],
    status: "completato" },
];

// ---------------------------------------------------------------------------
// MAGAZZINO RICAMBI
// ---------------------------------------------------------------------------
// Ogni ricambio ha due identificativi: un progressivo interno assegnato al
// primo carico (sempre presente) e il codice a barre del fornitore (non tutti
// i ricambi ne hanno uno leggibile). Il prelievo accetta indifferentemente
// l'uno o l'altro: in officina mobile capita spesso di avere l'etichetta
// rovinata e di dover digitare il progressivo.
const PART_CATEGORIES = {
  filtri:      { label: "Filtri",            color: "#1B6DB0" },
  freni:       { label: "Freni",             color: "#B4302E" },
  olio:        { label: "Olî e lubrificanti", color: "#B07A12" },
  elettrico:   { label: "Elettrico",         color: "#8B5CF6" },
  pneumatici:  { label: "Pneumatici",        color: "#12596B" },
  carrozzeria: { label: "Carrozzeria",       color: "#6B7280" },
  motore:      { label: "Motore",            color: "#2E7D5B" },
  varie:       { label: "Varie",             color: "#6B7280" },
};

const initialParts = [
  { id: "p001", code: "RIC-0001", barcode: "8012345000018", description: "Filtro olio motore VW 2.0 TDI",
    category: "filtri", unit: "pz", stock: 14, minStock: 6, location: "A-01-3",
    avgCost: 12.40, supplier: "Officina Mobile Toscana", compatible: "Caddy, Golf 2.0 TDI" },
  { id: "p002", code: "RIC-0002", barcode: "8012345000025", description: "Pastiglie freno anteriori Ducato",
    category: "freni", unit: "kit", stock: 5, minStock: 4, location: "B-02-1",
    avgCost: 68.90, supplier: "Officina Mobile Toscana", compatible: "Ducato, Boxer" },
  { id: "p003", code: "RIC-0003", barcode: "8012345000032", description: "Olio motore 5W30 sintetico",
    category: "olio", unit: "lt", stock: 96, minStock: 40, location: "C-01-1",
    avgCost: 6.15, supplier: "Eni Fuel", compatible: "Universale" },
  { id: "p004", code: "RIC-0004", barcode: "8012345000049", description: "Batteria 12V 95Ah",
    category: "elettrico", unit: "pz", stock: 2, minStock: 3, location: "A-03-2",
    avgCost: 142.00, supplier: "Officina Mobile Toscana", compatible: "Mezzi pesanti" },
  { id: "p005", code: "RIC-0005", barcode: "8012345000056", description: "Filtro aria Eurocargo",
    category: "filtri", unit: "pz", stock: 7, minStock: 4, location: "A-01-5",
    avgCost: 34.50, supplier: "Iveco Assistance", compatible: "Eurocargo, Daily 70C" },
  { id: "p006", code: "RIC-0006", barcode: "8012345000063", description: "Disco freno posteriore Scania R",
    category: "freni", unit: "pz", stock: 4, minStock: 2, location: "B-04-2",
    avgCost: 210.00, supplier: "Scania Service Pisa", compatible: "Scania serie R" },
  { id: "p007", code: "RIC-0007", barcode: "", description: "Kit tergicristalli anteriori",
    category: "varie", unit: "kit", stock: 11, minStock: 5, location: "D-01-1",
    avgCost: 18.20, supplier: "Officina Mobile Toscana", compatible: "Universale" },
];

const MOVE_TYPES = {
  carico:    { label: "Carico (acquisto)", color: "#2E7D5B", sign: 1 },
  scarico:   { label: "Prelievo su veicolo", color: "#B4302E", sign: -1 },
  rettifica: { label: "Rettifica inventariale", color: "#B07A12", sign: 0 },
  reso:      { label: "Reso a fornitore", color: "#6B7280", sign: -1 },
};

const initialStockMoves = [
  { id: "sm1", part: "p001", type: "carico", qty: 20, date: "2026-06-12", unitCost: 12.40,
    supplier: "Officina Mobile Toscana", docRef: "FT 2026/188", vehicle: null, intervention: null,
    note: "Riassortimento trimestrale" },
  { id: "sm2", part: "p003", type: "carico", qty: 120, date: "2026-06-12", unitCost: 6.15,
    supplier: "Eni Fuel", docRef: "FT 4521", vehicle: null, intervention: null, note: "Fusto 120 lt" },
  { id: "sm3", part: "p001", type: "scarico", qty: 1, date: "2026-07-30", unitCost: 12.40,
    supplier: null, docRef: null, vehicle: "FR001AB", intervention: "m3", note: "Tagliando programmato" },
  { id: "sm4", part: "p003", type: "scarico", qty: 6, date: "2026-07-30", unitCost: 6.15,
    supplier: null, docRef: null, vehicle: "FR001AB", intervention: "m3", note: "Cambio olio" },
  { id: "sm5", part: "p002", type: "carico", qty: 8, date: "2026-07-02", unitCost: 68.90,
    supplier: "Officina Mobile Toscana", docRef: "FT 2026/201", vehicle: null, intervention: null, note: "" },
  { id: "sm6", part: "p004", type: "scarico", qty: 1, date: "2026-08-14", unitCost: 142.00,
    supplier: null, docRef: null, vehicle: "FR010BA", intervention: null, note: "Sostituzione batteria in strada" },
];

// ---------------------------------------------------------------------------
// RETE MATHERION — scambio veicoli fra aziende sulla stessa piattaforma
// ---------------------------------------------------------------------------
// Quando la società destinataria usa a sua volta la piattaforma, il noleggio
// non resta un dato interno del locatore: genera una richiesta di presa in
// carico che il locatario deve accettare. Il veicolo entra nella sua flotta
// solo dopo l'accettazione esplicita — nessuno si ritrova mezzi non voluti.
const HANDOVER_STATUS = {
  inviata:    { label: "In attesa di conferma", color: "#B07A12" },
  accettata:  { label: "Accettata",             color: "#2E7D5B" },
  rifiutata:  { label: "Rifiutata",             color: "#B4302E" },
  annullata:  { label: "Annullata dal mittente", color: "#6B7280" },
  restituito: { label: "Restituito",            color: "#12596B" },
};

const initialHandovers = [
  { id: "hv1", vehicle: "FR006AD", from: "demoholding", to: "demopartner",
    start: "2026-04-01", end: "2027-04-01", fee: 1150,
    deductibleRCA: 1000, damagePenalty: 750, theftMode: "percentuale", theftValue: 10,
    status: "accettata", sentAt: "2026-03-25", respondedAt: "2026-03-27",
    note: "Consegna presso deposito Roma Prenestina.", responseNote: "Confermato, ritirato il 01/04.",
    contractRef: "Contratto quadro CLD-2026" },
  { id: "hv2", vehicle: "FR003AC", from: "demo", to: "demopartner",
    start: "2026-09-01", end: "2027-08-31", fee: 780,
    deductibleRCA: 800, damagePenalty: 500, theftMode: "percentuale", theftValue: 10,
    status: "inviata", sentAt: "2026-08-18",
    note: "Mezzo disponibile dal 01/09, chiavi e libretto in consegna al ritiro.",
    contractRef: null },
  { id: "hv3", vehicle: "FR008AE", from: "demoholding", to: "demo",
    start: "2026-09-01", end: "2027-02-28", fee: 620,
    deductibleRCA: 1000, damagePenalty: 600, theftMode: "importo", theftValue: 2500,
    status: "inviata", sentAt: "2026-08-19",
    note: "Trasferimento infragruppo per punta stagionale.", contractRef: null },
];

// ---------------------------------------------------------------------------
// CHAT INTERNA — tracciata e conservata per azienda
// ---------------------------------------------------------------------------
const initialThreads = [
  { id: "th1", participants: ["demoholding", "demopartner"], subject: "Subnoleggio FR006AD" },
  { id: "th2", participants: ["demo", "demopartner"], subject: "Disponibilità mezzi settembre" },
  { id: "th3", participants: ["demo", "demoholding"], subject: "Trasferimenti infragruppo" },
];

const initialMessages = [
  { id: "m1", thread: "th1", from: "demoholding", author: "Mario Rossi",
    at: "2026-03-25 09:12", text: "Buongiorno, vi ho inviato la presa in carico del Caddy FR006AD con decorrenza 01/04." },
  { id: "m2", thread: "th1", from: "demopartner", author: "Giulia Conti",
    at: "2026-03-27 11:40", text: "Ricevuta e accettata. Passiamo a ritirarlo mercoledì mattina." },
  { id: "m3", thread: "th2", from: "demopartner", author: "Giulia Conti",
    at: "2026-08-17 15:05", text: "Avreste un furgone medio disponibile da inizio settembre per sei mesi?" },
  { id: "m4", thread: "th2", from: "demo", author: "Mario Rossi",
    at: "2026-08-18 08:22", text: "Sì, FR003AC è libero dal 01/09. Vi ho inviato la richiesta di presa in carico." },
];

// ---------------------------------------------------------------------------
// POSTA ELETTRONICA — fino a tre indirizzi per utente
// ---------------------------------------------------------------------------
const MAX_MAIL_ACCOUNTS = 3;

const initialMailAccounts = [
  { id: "ma1", address: "fleet@demotrasporti.example", label: "Fleet operativo", signature: "Demo Trasporti S.r.l. — Ufficio Flotte", verified: true },
  { id: "ma2", address: "amministrazione@demotrasporti.example", label: "Amministrazione", signature: "Demo Trasporti S.r.l. — Amministrazione", verified: true },
];

const initialMails = [
  { id: "ml1", account: "ma1", folder: "in", from: "noleggi@ayvens.it", to: "fleet@demotrasporti.example",
    subject: "Conferma consegna FR001AB", at: "2026-08-18 10:12",
    body: "Buongiorno,\nconfermiamo la consegna del veicolo FR001AB presso la vostra sede per il 22/08.\nCordiali saluti.", read: false },
  { id: "ml2", account: "ma1", folder: "in", from: "elena.marchetti@demopartner.example", to: "fleet@demotrasporti.example",
    subject: "Richiesta mezzo settembre", at: "2026-08-17 15:20",
    body: "Buongiorno,\ncome anticipato in chat avremmo necessità di un furgone medio da settembre.\nGrazie.", read: true },
  { id: "ml3", account: "ma2", folder: "out", from: "amministrazione@demotrasporti.example", to: "amministrazione@demopartner.example",
    subject: "Fattura FT-2026-0089", at: "2026-08-01 09:00",
    body: "In allegato la fattura relativa al subnoleggio del mese di agosto.", read: true },
];

const theftModeLabel = { importo: "Importo fisso", percentuale: "% sul valore" };

// ---------------------------------------------------------------------------
// COSTO TOTALE DI POSSESSO (TCO) — calcolato, non tabellato
// ---------------------------------------------------------------------------
// In precedenza il TCO era una tabella fissa con gli undici mezzi di esempio:
// qualunque veicolo inserito dal cliente risultava a costo zero e, cancellati i
// dati dimostrativi, l'intero modulo Costi mostrava zeri. Ora il valore nasce
// dai dati effettivi: canone del contratto in essere, costi fissi annui,
// manutenzione, carburante, sinistri e verbali degli ultimi dodici mesi.

/** Costi fissi annui: prima la scheda del veicolo, poi i valori dimostrativi. */
function costiFissiVeicolo(v, plateFallback) {
  const targa = v?.plate || plateFallback;
  const seme = seedFixedCosts[targa] || {};
  const num = (x, y) => (Number.isFinite(Number(x)) && x !== "" && x !== null ? Number(x) : (y || 0));
  return {
    insurance:  num(v?.insuranceFee,  seme.insurance),
    roadTax:    num(v?.roadTax,       seme.roadTax),
    telematics: num(v?.telematicsFee, seme.telematics),
    other:      num(v?.otherAnnualCost, seme.other),
  };
}

const MESI_TCO = 12;
function dodiciMesiFa() {
  const d = new Date();
  d.setMonth(d.getMonth() - MESI_TCO);
  return d.toISOString().slice(0, 10);
}

// Sommare per ogni veicolo scorrendo ogni archivio costa veicoli × movimenti:
// su 500 mezzi e qualche migliaio di movimenti significa milioni di confronti a
// ogni apertura del modulo Costi. Gli archivi vengono quindi indicizzati per
// targa una volta sola, e riutilizzati finché i dati non cambiano.
function _indicizza(arr, campoData, campoImporto, da) {
  const m = new Map();
  for (const x of arr || []) {
    if (campoData && x[campoData] && x[campoData] < da) continue;
    const n = Number(x[campoImporto]);
    if (!Number.isFinite(n)) continue;
    m.set(x.vehicle, (m.get(x.vehicle) || 0) + n);
  }
  return m;
}
let _indiciTco = null;
function _indici() {
  if (_indiciTco) return _indiciTco;
  const da = dodiciMesiFa();
  const canoni = new Map();
  for (const c of LIVE.contracts || []) {
    if (c.status === "bozza") continue;
    const attuale = canoni.get(c.vehicle);
    if (!attuale || c.status === "attivo") canoni.set(c.vehicle, c);
  }
  _indiciTco = {
    canoni,
    manutenzione: _indicizza(LIVE.maintenance, "scheduled", "cost", da),
    carburante:   _indicizza(LIVE.fuelTransactions, "date", "amount", da),
    sinistri:     _indicizza(LIVE.claims, "date", "damage", da),
    verbali:      _indicizza(LIVE.fines, "date", "amount", da),
  };
  return _indiciTco;
}

/** TCO mensile di un singolo veicolo, in euro. */
function tcoMensile(v) {
  if (!v) return 0;
  const ix = _indici();
  const targa = v.plate;

  const contratto = ix.canoni.get(targa);
  const canone = contratto ? (Number(contratto.fee) || 0) : 0;

  const f = costiFissiVeicolo(v);
  const fissiMensili = (f.insurance + f.roadTax + f.telematics + f.other) / 12;

  const q = (m) => (m.get(targa) || 0) / MESI_TCO;

  return Math.round(canone + fissiMensili
    + q(ix.manutenzione) + q(ix.carburante) + q(ix.sinistri) + q(ix.verbali));
}

// Il calcolo attraversa cinque archivi per ogni veicolo: su flotte di qualche
// migliaio di mezzi, rifarlo a ogni render bloccherebbe l'interfaccia. Il
// risultato viene conservato e invalidato quando gli archivi cambiano.
const _tcoCache = new Map();
let _tcoRev = -1;
function tcoDi(v) {
  if (!v) return 0;
  if (_tcoRev !== LIVE.rev) { _tcoCache.clear(); _indiciTco = null; _tcoRev = LIVE.rev; }
  if (_tcoCache.has(v.id)) return _tcoCache.get(v.id);
  const x = tcoMensile(v);
  _tcoCache.set(v.id, x);
  return x;
}
function tcoDiTarga(plate) { return tcoDi((LIVE.vehicles || []).find(v => v.plate === plate)); }
function tcoFlotta() { return (LIVE.vehicles || []).reduce((t, v) => t + tcoDi(v), 0); }

// ---------------------------------------------------------------------------
// TRANSAZIONI CARBURANTE — base per media consumi e rimborso accise
// (rifornimenti da cisterna interna + fuel card esterne)
// ---------------------------------------------------------------------------
const seedFuelTransactions = [
  // FR009BA — Iveco Eurocargo 12 t
  { id: "ft01", vehicle: "FR009BA", date: "2026-01-14", litres: 320, amount: 496.0, odometer: 152800, source: "Cisterna AMZ-LIV" },
  { id: "ft02", vehicle: "FR009BA", date: "2026-02-11", litres: 298, amount: 461.9, odometer: 161200, source: "Cisterna AMZ-LIV" },
  { id: "ft03", vehicle: "FR009BA", date: "2026-03-19", litres: 341, amount: 535.4, odometer: 170500, source: "Fuel card Eni" },
  { id: "ft04", vehicle: "FR009BA", date: "2026-04-15", litres: 310, amount: 489.8, odometer: 179100, source: "Cisterna AMZ-LIV" },
  { id: "ft05", vehicle: "FR009BA", date: "2026-05-20", litres: 288, amount: 452.2, odometer: 187400, source: "Cisterna AMZ-LIV" },

  // FR010BA — Scania R450 18 t
  { id: "ft06", vehicle: "FR010BA", date: "2026-01-09", litres: 620, amount: 961.0, odometer: 352400, source: "Fuel card Eni" },
  { id: "ft07", vehicle: "FR010BA", date: "2026-02-06", litres: 655, amount: 1015.3, odometer: 370200, source: "Fuel card Eni" },
  { id: "ft08", vehicle: "FR010BA", date: "2026-03-13", litres: 640, amount: 1004.8, odometer: 387600, source: "Fuel card Eni" },
  { id: "ft09", vehicle: "FR010BA", date: "2026-04-10", litres: 610, amount: 963.8, odometer: 404100, source: "Fuel card Eni" },
  { id: "ft10", vehicle: "FR010BA", date: "2026-05-15", litres: 598, amount: 938.9, odometer: 412600, source: "Fuel card Eni" },

  // FR011BB — Iveco Daily 7 t (sopra 3,5 t ma sotto 7,5 t)
  { id: "ft11", vehicle: "FR011BB", date: "2026-01-21", litres: 145, amount: 224.8, odometer: 78200, source: "Cisterna AMZ-GRS" },
  { id: "ft12", vehicle: "FR011BB", date: "2026-02-18", litres: 138, amount: 213.9, odometer: 84100, source: "Cisterna AMZ-GRS" },
  { id: "ft13", vehicle: "FR011BB", date: "2026-03-25", litres: 152, amount: 238.6, odometer: 90500, source: "Cisterna AMZ-GRS" },
  { id: "ft14", vehicle: "FR011BB", date: "2026-04-22", litres: 141, amount: 222.8, odometer: 94300, source: "Cisterna AMZ-GRS" },

  // Mezzi leggeri (non rilevanti ai fini accise, ma tracciati)
  { id: "ft15", vehicle: "FR001AB", date: "2026-03-10", litres: 45, amount: 69.8, odometer: 39800, source: "Cisterna AMZ-LIV" },
  { id: "ft16", vehicle: "FR002AB", date: "2026-03-14", litres: 62, amount: 96.1, odometer: 84200, source: "Cisterna AMZ-LIV" },
];

const costTrend = [
  { month: "Feb", canone: 5200, manutenzione: 900, altro: 600 },
  { month: "Mar", canone: 5200, manutenzione: 1400, altro: 700 },
  { month: "Apr", canone: 5400, manutenzione: 800, altro: 550 },
  { month: "Mag", canone: 5400, manutenzione: 2100, altro: 620 },
  { month: "Giu", canone: 5600, manutenzione: 1100, altro: 680 },
  { month: "Lug", canone: 5600, manutenzione: 1850, altro: 710 },
  { month: "Ago", canone: 5600, manutenzione: 1300, altro: 640 },
];

// Cisterne di proprietà del cliente — carburante e AdBlue
const initialTanks = [
  { id: "t1", label: "Cisterna Gasolio — Amazon Livorno", type: "gasolio", company: "demo", branch: "AMZ-LIV",
    capacity: 5000, level: 1180, threshold: 1000, supplier: "Eni Fuel", lastRefill: "2026-08-05" },
  { id: "t2", label: "Cisterna Gasolio — Amazon Grosseto", type: "gasolio", company: "demo", branch: "AMZ-GRS",
    capacity: 3000, level: 2140, threshold: 700, supplier: "Q8", lastRefill: "2026-08-12" },
  { id: "t3", label: "Cisterna AdBlue — Amazon Livorno", type: "adblue", company: "demo", branch: "AMZ-LIV",
    capacity: 1000, level: 165, threshold: 200, supplier: "TotalEnergies", lastRefill: "2026-07-28" },
  { id: "t4", label: "Cisterna AdBlue — Amazon Grosseto", type: "adblue", company: "demo", branch: "AMZ-GRS",
    capacity: 800, level: 540, threshold: 160, supplier: "TotalEnergies", lastRefill: "2026-08-09" },
];

const initialTankRefills = [
  { id: "tr1", tank: "t1", date: "2026-08-05", qty: 3000, unitPrice: 1.55, supplier: "Eni Fuel", note: "Bolla 4521" },
  { id: "tr2", tank: "t2", date: "2026-08-12", qty: 2000, unitPrice: 1.53, supplier: "Q8", note: "Bolla 9012" },
  { id: "tr3", tank: "t3", date: "2026-07-28", qty: 500, unitPrice: 0.68, supplier: "TotalEnergies", note: "Bolla AD-331" },
];

const initialVehicleRefuels = [
  { id: "vr1", tank: "t1", vehicle: "FR001AB", date: "2026-08-18", qty: 45, km: 42150 },
  { id: "vr2", tank: "t1", vehicle: "FR005AD", date: "2026-08-17", qty: 58, km: 61340 },
  { id: "vr3", tank: "t3", vehicle: "FR002AB", date: "2026-08-16", qty: 6, km: 88400 },
  { id: "vr4", tank: "t2", vehicle: "FR003AC", date: "2026-08-15", qty: 40, km: 15150 },
];

// ---------------------------------------------------------------------------
// CLIENTI & FORNITORI (anagrafica commerciale — dati per fatturazione)
// ---------------------------------------------------------------------------
const initialPartners = [
  { id: "p1", name: "Ayvens", type: "fornitore", vat: "IT01234567890", sdi: "M5UXCR1", pec: "ayvens@legalmail.it",
    iban: "IT60X0542811101000000123456", paymentTerms: 30, contactName: "Ufficio Fornitori Fleet", contactEmail: "fleet@ayvens.it", contactPhone: "02 1234567", city: "Milano" },
  { id: "p2", name: "Arval", type: "fornitore", vat: "IT09876543210", sdi: "W7YWO82", pec: "arval@legalmail.it",
    iban: "IT34G0306901718100000004567", paymentTerms: 30, contactName: "Customer Service", contactEmail: "customerservice@arval.it", contactPhone: "02 7654321", city: "Torino" },
  { id: "p3", name: "Leasys", type: "fornitore", vat: "IT11223344556", sdi: "SUBM70N", pec: "leasys@legalmail.it",
    iban: "IT91Y0300203280000401234567", paymentTerms: 60, contactName: "Gestione Flotte", contactEmail: "flotte@leasys.it", contactPhone: "011 9988776", city: "Torino" },
  { id: "p4", name: "Eni Fuel", type: "fornitore", vat: "IT00905811006", sdi: "0000000", pec: "enifuel@pec.eni.com",
    iban: "IT05T0100503382000000012345", paymentTerms: 30, contactName: "Amministrazione", contactEmail: "amministrazione@enifuel.it", contactPhone: "06 55887766", city: "Roma" },
  { id: "p5", name: "TotalEnergies", type: "fornitore", vat: "IT08765432109", sdi: "1234567", pec: "totalenergies@pec.it",
    iban: "IT77B0200811100000012345678", paymentTerms: 30, contactName: "Ufficio Ordini", contactEmail: "ordini@totalenergies.it", contactPhone: "02 44556677", city: "Milano" },
  { id: "p6", name: "Officina Del Porto", type: "fornitore", vat: "IT01987654321", sdi: "SUBM70N", pec: "officinadelporto@pec.it",
    iban: "IT12A0301503200000003334455", paymentTerms: 30, contactName: "Marco Ferretti", contactEmail: "info@officinadelporto.it", contactPhone: "0586 112233", city: "Livorno" },
  { id: "p8", name: "Officina Mobile Toscana", type: "fornitore", vat: "IT02233445566", sdi: "KRRH6B9", pec: "officinamobile@pec.it",
    iban: "IT19L0300203280000400998877", paymentTerms: 60, contactName: "Andrea Ferri", contactEmail: "interventi@demofficina.example",
    contactPhone: "0586 778899", city: "Livorno", mobileWorkshop: true },
  { id: "p7", name: "Demo Partner Logistica S.r.l.", type: "cliente", vat: "IT00000000013", sdi: "DEMO001", pec: "demopartner@pec.example",
    iban: "IT44C0200812345000004455667", paymentTerms: 30, contactName: "Giulia Conti", contactEmail: "amministrazione@demopartner.example", contactPhone: "06 33221144", city: "Roma" },
];

// ---------------------------------------------------------------------------
// FATTURAZIONE — attiva (subnoleggio) e passiva (fornitori)
// ---------------------------------------------------------------------------
const initialSubRentalInvoices = [
  { id: "sri1", vehicle: "FR006AD", customer: "Demo Partner Logistica S.r.l.", type: "fattura", number: "FT-2026-0089",
    issueDate: "2026-08-01", dueDate: "2026-08-31", amountNet: 1150, vat: 22, status: "emessa" },
  { id: "sri2", vehicle: "FR006AD", customer: "Demo Partner Logistica S.r.l.", type: "proforma", number: "PF-2026-0090",
    issueDate: "2026-08-19", dueDate: "2026-09-18", amountNet: 1150, vat: 22, status: "bozza" },
];

const initialSupplierInvoices = [
  { id: "spi1", supplier: "Ayvens", vehiclePlate: "FR001AB", vehicleModel: "Volkswagen Caddy Cargo", number: "INV-8827",
    invoiceDate: "2026-08-01", dueDate: "2026-08-31", amountNet: 480, vat: 22, category: "canone", status: "verificata" },
  { id: "spi2", supplier: "Arval", vehiclePlate: "FR002AB", vehicleModel: "Fiat Ducato", number: "ARV-5521",
    invoiceDate: "2026-08-01", dueDate: "2026-08-31", amountNet: 390, vat: 22, category: "canone", status: "ricevuta" },
  { id: "spi3", supplier: "Leasys", vehiclePlate: "FR004AC", vehicleModel: "Renault Kangoo", number: "LSY-1290",
    invoiceDate: "2026-08-01", dueDate: "2026-08-31", amountNet: 520, vat: 22, category: "canone", status: "pagata" },
  { id: "spi4", supplier: "Arval", vehiclePlate: "FR005AD", vehicleModel: "Fiat Doblo", number: "ARV-5522",
    invoiceDate: "2026-08-01", dueDate: "2026-08-31", amountNet: 410, vat: 22, category: "canone", status: "pagata" },
  { id: "spi5", supplier: "Ayvens", vehiclePlate: "FR006AD", vehicleModel: "Volkswagen Caddy Cargo", number: "INV-8830",
    invoiceDate: "2026-07-01", dueDate: "2026-07-31", amountNet: 475, vat: 22, category: "canone", status: "pagata" },
  { id: "spi6", supplier: "Leasys", vehiclePlate: "—", vehicleModel: "Volkswagen Caddy Cargo", number: "LSY-1301 (preventivo)",
    invoiceDate: "2026-08-05", dueDate: "—", amountNet: 505, vat: 22, category: "canone", status: "ricevuta" },
  { id: "spi7", supplier: "Eni Fuel", vehiclePlate: "—", vehicleModel: "Cisterna Gasolio — Amazon Livorno", number: "BOLLA-4521",
    invoiceDate: "2026-08-05", dueDate: "2026-09-04", amountNet: 4650, vat: 22, category: "carburante", status: "pagata" },
  { id: "spi8", supplier: "Officina Del Porto", vehiclePlate: "FR002AB", vehicleModel: "Fiat Ducato", number: "OFF-2291",
    invoiceDate: "2026-08-19", dueDate: "2026-09-18", amountNet: 1850, vat: 22, category: "manutenzione", status: "ricevuta" },
];

// ---------------------------------------------------------------------------
// BUDGET PER CENTRO DI COSTO
// ---------------------------------------------------------------------------
const initialCostCenterBudgets = [
  { id: "b1", costCenter: "AMZ-LIV", company: "demo", period: "2026-08", budget: 5000 },
  { id: "b2", costCenter: "AMZ-GRS", company: "demo", period: "2026-08", budget: 500 },
  { id: "b3", costCenter: "SUB-ROM", company: "demopartner", period: "2026-08", budget: 1000 },
  { id: "b4", costCenter: "CORP-01", company: "demoholding", period: "2026-08", budget: 150 },
];

const fleetByStatus = Object.entries(
  seedVehicles.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; }, {})
).map(([k, v]) => ({ name: statusMeta[k]?.label || k, value: v, color: statusMeta[k]?.color || "#999" }));

// ---------------------------------------------------------------------------
// UI PRIMITIVES
// ---------------------------------------------------------------------------
function Badge({ status }) {
  const m = statusMeta[status] || { label: status, color: "#555", bg: "#eee" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  );
}

function Card({ children, className = "", onClick, ...props }) {
  return (
    <div {...props} onClick={onClick}
      onKeyDown={onClick ? e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(e); } } : undefined}
      className={`bg-white rounded-xl border border-slate-200/70 ${className}`}
      style={{ boxShadow: "0 1px 2px rgba(10,42,51,.04), 0 8px 24px -12px rgba(10,42,51,.10)" }}>
      {children}
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, accent = NAVY_700, onClick }) {
  return (
    <Card
      className={`p-5 flex items-start justify-between ${onClick ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md" : ""}`}
      {...(onClick ? { onClick, role: "button", tabIndex: 0 } : {})}
    >
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold tracking-tight" style={{ color: NAVY_700 }}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accent}16`, boxShadow: `inset 0 0 0 1px ${accent}22` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
    </Card>
  );
}

function SectionTitle({ title, sub, action }) {
  return (
    <div className="mb-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
      <div className="flex gap-3">
        <span className="w-1 rounded-full flex-shrink-0 mt-1 mb-1" style={{ background: ACCENT_GRADIENT }} />
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: NAVY_700 }}>{title}</h1>
          {sub && <p className="text-sm text-slate-500 mt-1 max-w-3xl">{sub}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap gap-2 md:flex-shrink-0">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXPORT EXCEL — utility condivisa da tutti i moduli
// ---------------------------------------------------------------------------
// Genera un vero file .xlsx: XLSX.writeFile non funziona in contesti con
// download bloccati, quindi si costruisce il binario e lo si scarica come Blob
// con il MIME type corretto — altrimenti il browser lo interpreta come testo.
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function exportRowsToExcel(rows, filename, sheetName = "Dati") {
  const XLSX = await caricaXLSX();
  if (!rows || rows.length === 0) {
    alert("Non ci sono dati da esportare.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(rows);

  // Larghezza colonne calcolata sul contenuto, così il file si apre leggibile
  const headers = Object.keys(rows[0]);
  ws["!cols"] = headers.map(h => ({
    wch: Math.min(45, Math.max(h.length + 2,
      ...rows.map(r => String(r[h] ?? "").length + 2))),
  }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({
    s: { r: 0, c: 0 }, e: { r: rows.length, c: headers.length - 1 } }) };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Scarica un binario già pronto (usato dai template di importazione)
async function downloadWorkbook(wb, filename) {
  const XLSX = await caricaXLSX();
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function ExportButton({ rows, filename, sheetName, label = "Esporta Excel" }) {
  return (
    <button
      onClick={() => exportRowsToExcel(rows, filename, sheetName)}
      className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50 flex-shrink-0"
      style={{ borderColor: NAVY_700, color: NAVY_700 }}
    >
      <Download size={14} /> {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// SELEZIONE FILE
// ---------------------------------------------------------------------------
// L'input file non va nascosto con display:none dentro una <label>: iOS Safari
// e i contesti in iframe con sandbox spesso non aprono il selettore, e il
// pulsante risulta inerte senza alcun errore. Qui l'input resta nel flusso ma
// invisibile, e l'apertura è comandata da un click esplicito sul riferimento:
// è il gesto dell'utente a innescarla, condizione richiesta da tutti i browser.
const VISUALLY_HIDDEN = {
  position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
  overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0, opacity: 0,
};

function FileUploadButton({ onFiles, multiple, accept, disabled, label, icon: Icon = Upload,
                            className = "", style = {}, variant = "solid" }) {
  const base = "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition";
  const look = variant === "solid"
    ? { background: ACCENT_GRADIENT, color: "#fff", ...style }
    : { border: `1px solid ${NAVY_700}`, color: NAVY_700, ...style };

  return (
    <span className="relative inline-flex" style={{ opacity: disabled ? 0.5 : 1 }}>
      <span className={`${base} ${variant === "outline" ? "hover:bg-slate-50" : ""} ${className}`} style={look}>
        <Icon size={14} /> {label}
      </span>
      {/* L'input è sovrapposto e trasparente: il click dell'utente lo raggiunge
          direttamente, senza inoltri programmatici che alcuni browser rifiutano. */}
      <input type="file" multiple={multiple} accept={accept} disabled={disabled} title={label}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ fontSize: 0 }}
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length) onFiles(files);
          e.target.value = "";          // consente di ricaricare lo stesso file
        }} />
    </span>
  );
}

// Variante ampia, a tutta larghezza, per le aree di caricamento
function FileDropArea({ onFiles, multiple, accept, disabled, hint }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false);
        if (!disabled && e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
      }}
      className="relative w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-5 transition"
      style={{
        borderColor: over ? GOLD_500 : "#cbd5e1",
        backgroundColor: over ? "#F0F9FB" : "transparent",
        opacity: disabled ? 0.5 : 1,
      }}>
      <Upload size={20} style={{ color: over ? GOLD_500 : "#94a3b8" }} />
      <span className="text-xs font-medium text-slate-500 text-center px-3">{hint}</span>
      <input type="file" multiple={multiple} accept={accept} disabled={disabled} title={hint}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ fontSize: 0 }}
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length) onFiles(files);
          e.target.value = "";
        }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ALLEGATI — documentale trasversale a tutti i moduli
// ---------------------------------------------------------------------------
// Ogni record (veicolo, contratto, sinistro, verbale, intervento, cisterna,
// anagrafica cliente/fornitore...) può avere documenti collegati: carta di
// circolazione, polizza, contratto firmato, fatture, perizie, foto.
// I file sono conservati come data URL nella sessione; in produzione la stessa
// interfaccia scrive su object storage e la tabella `documents` ne è l'indice.
// Documenti che ogni veicolo deve avere: la mancanza è segnalata in dashboard.
// L'elenco è volutamente breve — sono gli unici la cui assenza impedisce
// materialmente di far circolare il mezzo.
// ---------------------------------------------------------------------------
// REQUISITI DOCUMENTALI PER SEZIONE
// ---------------------------------------------------------------------------
// Quali documenti devono obbligatoriamente accompagnare ciascun tipo di record.
// Sono un parametro, non una costante di codice: cambiano fra aziende e nel
// tempo, e il fleet manager deve poterli rivedere senza interventi tecnici.
const DOC_SECTIONS = [
  { entity: "veicolo",   label: "Veicoli",     icon: Car },
  { entity: "contratto", label: "Contratti",   icon: FileText },
  { entity: "sinistro",  label: "Sinistri",    icon: ShieldAlert },
  { entity: "partner",   label: "Clienti & Fornitori", icon: Users },
];

// ---------------------------------------------------------------------------
// REGISTRO DEI DATI VIVI
// ---------------------------------------------------------------------------
// Alcuni elenchi (menu a tendina, cataloghi di esportazione, generatori di
// contratti) venivano costruiti sugli array di esempio: restavano fermi mentre
// l'utente inseriva o cancellava record. Il registro viene riallineato dalla
// shell a ogni render, cosicché ogni lettura veda i dati effettivi.
const LIVE = {
  companies: seedCompanies, vehicles: seedVehicles, contracts: seedContracts,
  maintenance: seedMaintenance, claims: seedClaims, fines: seedFines,
  deadlines: seedDeadlines, subRentals: seedSubRentals,
  fuelTransactions: seedFuelTransactions,
  rev: 0,   // cambia a ogni riallineamento: invalida le memorizzazioni dei calcoli
};

const DEFAULT_DOC_REQUIREMENTS = {
  veicolo: ["Carta di circolazione", "Polizza assicurativa", "Certificato di proprietà"],
  contratto: ["Contratto di noleggio", "Fattura"],
  sinistro: ["CID / Constatazione amichevole", "Fotografia"],
  partner: ["Visura camerale"],
};

// Mantenuto per i moduli che lo usavano prima che i requisiti diventassero
// configurabili: resta allineato al valore predefinito dei veicoli.
const REQUIRED_VEHICLE_DOCS = DEFAULT_DOC_REQUIREMENTS.veicolo;

const DOCUMENT_TYPES = [
  "Carta di circolazione", "Certificato di proprietà", "Polizza assicurativa",
  "Contratto di noleggio", "Contratto di leasing", "Fattura", "Preventivo",
  "Rapporto officina", "Scheda di intervento", "Preventivo officina",
  "Fattura di acquisto ricambi", "CID / Constatazione amichevole", "Perizia",
  "Verbale", "Fotografia", "Verbale di riconsegna", "Visura camerale",
  "Documento d'identità", "Attestato di rischio", "Certificato di revisione", "Altro",
];

const AttachmentsContext = createContext(null);
function useAttachments() { return useContext(AttachmentsContext); }

function AttachmentsProvider({ children }) {
  const [files, setFiles] = usePersistentState("attachments", []);
  const [openFor, setOpenFor] = useState(null);   // { type, id, label, presetDocType }

  const listFor = (type, id) => files.filter(f => f.entityType === type && f.entityId === id);

  const addFiles = async (type, id, fileList, docType) => {
    const added = await Promise.all(Array.from(fileList).map(file => new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res({
        id: `doc${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        entityType: type, entityId: id, docType: docType || "Altro",
        name: file.name, size: file.size, mime: file.type,
        uploadedAt: TODAY, dataUrl: e.target.result,
      });
      reader.onerror = () => res(null);
      reader.readAsDataURL(file);
    })));
    if (added.some(f => !f)) throw new Error("Impossibile leggere uno degli allegati");
    if (added.reduce((n,f) => n + f.dataUrl.length, 0) + JSON.stringify(files).length > 7 * 1024 * 1024) throw new Error("Allegati troppo grandi per questo archivio (limite 7 MB). Ridurre le dimensioni dei file.");
    setFiles(prev => [...prev, ...added]);
  };

  const removeFile = (fileId) => setFiles(prev => prev.filter(f => f.id !== fileId));

  return (
    <AttachmentsContext.Provider value={{ files, listFor, addFiles, removeFile, openFor, setOpenFor }}>
      {children}
    </AttachmentsContext.Provider>
  );
}

const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;

function AttachmentsModal() {
  const { openFor, setOpenFor, listFor, addFiles, removeFile } = useAttachments();
  const [docType, setDocType] = useState(openFor?.presetDocType || "Altro");
  // Aprendo il modale da un documento mancante, il tipo è già quello richiesto:
  // evita che il file finisca catalogato come "Altro" e resti comunque mancante.
  React.useEffect(() => {
    if (openFor?.presetDocType) setDocType(openFor.presetDocType);
  }, [openFor?.id, openFor?.presetDocType]);
  const [busy, setBusy] = useState(false);
  const editable = useCanEditHere();
  // Tutti gli hook prima di qualunque uscita anticipata, altrimenti al secondo
  // render il loro numero cambia e React interrompe l'applicazione.
  const [feedback, setFeedback] = useState("");
  if (!openFor) return null;
  const docs = listFor(openFor.type, openFor.id);

  const onPick = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setBusy(true);
    setFeedback("");
    try {
      await addFiles(openFor.type, openFor.id, list, docType);
      setFeedback(`${list.length} file caricat${list.length === 1 ? "o" : "i"} come «${docType}».`);
    } catch (e) {
      setFeedback("");
      alert(`Caricamento non riuscito: ${e?.message || "errore imprevisto"}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>DOCUMENTI ALLEGATI</p>
            <h3 className="text-lg font-bold text-white">{openFor.label}</h3>
          </div>
          <button onClick={() => setOpenFor(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Tipo di documento</p>
              <select value={docType} onChange={e => setDocType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <FileUploadButton multiple disabled={busy || !editable}
              label={busy ? "Caricamento..." : "Carica file"}
              onFiles={onPick} />
          </div>

          {/* Alternativa al selettore di sistema: in alcuni contesti incorporati
              la finestra di selezione è bloccata e il trascinamento resta l'unica via. */}
          <FileDropArea multiple disabled={busy || !editable} onFiles={onPick}
            hint="…oppure trascina qui i file" />

          {feedback && (
            <p className="text-xs flex items-center gap-1" style={{ color: "#2E7D5B" }}>
              <CheckCircle2 size={12} /> {feedback}
            </p>
          )}

          <div className="border-t border-slate-100 pt-3">
            {docs.length === 0 && <p className="text-sm text-slate-400">Nessun documento allegato.</p>}
            <div className="space-y-2">
              {docs.map(d => (
                <div key={d.id} className="flex items-center gap-3 border border-slate-200 rounded-lg p-2.5">
                  <FileText size={18} className="text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.docType} · {formatBytes(d.size)} · {d.uploadedAt}</p>
                  </div>
                  <a href={d.dataUrl} download={d.name} title="Scarica"
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                    <Download size={14} />
                  </a>
                  {editable && <button onClick={() => removeFile(d.id)} title="Elimina"
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                    <Trash2 size={14} />
                  </button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pulsante graffetta con contatore, da affiancare alle azioni di riga
function AttachButton({ entity, compact }) {
  const { listFor, setOpenFor } = useAttachments();
  const n = listFor(entity.type, entity.id).length;
  return (
    <button onClick={(e) => { e.stopPropagation(); setOpenFor(entity); }} title="Documenti allegati"
      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition relative">
      <Paperclip size={compact ? 13 : 14} />
      {n > 0 && (
        <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center text-white"
          style={{ backgroundColor: GOLD_500 }}>{n}</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// REGISTRO VEICOLI — sorgente unica delle targhe selezionabili
// ---------------------------------------------------------------------------
// Tutti i moduli scelgono la targa da questo registro: non è possibile digitare
// una targa inesistente. Se il mezzo non è ancora censito, l'anagrafica si crea
// dal link sotto il menu, senza abbandonare la compilazione in corso.
const VehicleRegistryContext = createContext({ vehicleList: [], createVehicle: () => {} });
function useVehicleRegistry() { return useContext(VehicleRegistryContext); }

function VehiclePicker({ value, onChange, disabled, compact }) {
  const { vehicleList, createVehicle } = useVehicleRegistry();
  const [creating, setCreating] = useState(false);
  const cls = compact
    ? "w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
    : "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm";

  return (
    <>
      <select value={value || ""} onChange={e => onChange(e.target.value)} disabled={disabled} className={cls}>
        <option value="">Seleziona targa...</option>
        {[...vehicleList].sort((a, b) => a.plate.localeCompare(b.plate)).map(v => (
          <option key={v.id} value={v.plate}>{v.plate} — {v.make} {v.model}</option>
        ))}
      </select>
      {!disabled && (
        <button type="button" onClick={() => setCreating(true)}
          className="text-xs mt-1 text-left hover:underline"
          style={{ color: GOLD_DARK }}>
          Targa non presente? Inserisci una nuova anagrafica veicolo
        </button>
      )}
      {creating && (
        <SimpleFormModal
          title="Nuova anagrafica veicolo" fields={VEHICLE_FORM_FIELDS} submitLabel="Crea veicolo e seleziona"
          onClose={() => setCreating(false)}
          onSave={(f) => {
            const created = createVehicle(f);
            if (created) onChange(created.plate);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// DATA TABLE — ordinamento e filtro per colonna, riusabile in ogni modulo
// ---------------------------------------------------------------------------
function useSortFilter(data, columns) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [filters, setFilters] = useState({});

  const getVal = (row, col) => (col.accessor ? col.accessor(row) : row[col.key]);

  const filtered = data.filter(row => columns.every(col => {
    const f = filters[col.key];
    if (!f) return true;
    const val = getVal(row, col);
    return String(val ?? "").toLowerCase().includes(String(f).toLowerCase());
  }));

  const sorted = sortKey ? [...filtered].sort((a, b) => {
    const col = columns.find(c => c.key === sortKey);
    const av = getVal(a, col), bv = getVal(b, col);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }) : filtered;

  return { sorted, sortKey, sortDir, setSortKey, setSortDir, filters, setFilters };
}

const RIGHE_PER_PAGINA = 50;

function DataTable({ columns, data, onRowClick, getRowKey = (r, i) => r.id ?? i, emptyLabel = "Nessun risultato." }) {
  const vp = useViewport();
  const { sorted, sortKey, sortDir, setSortKey, setSortDir, filters, setFilters } = useSortFilter(data, columns);
  const getVal = (row, col) => (col.accessor ? col.accessor(row) : row[col.key]);

  // Oltre qualche centinaio di record, disegnare tutte le righe in una volta
  // blocca la pagina per secondi. Si mostra una pagina per volta; ordinamento e
  // filtri continuano a operare sull'intero archivio, non sulla pagina visibile.
  const [pagina, setPagina] = useState(0);
  const pagine = Math.max(1, Math.ceil(sorted.length / RIGHE_PER_PAGINA));
  const paginaCorrente = Math.min(pagina, pagine - 1);
  useEffect(() => { setPagina(0); }, [sortKey, sortDir, filters, data.length]);
  const visibili = sorted.length > RIGHE_PER_PAGINA
    ? sorted.slice(paginaCorrente * RIGHE_PER_PAGINA, (paginaCorrente + 1) * RIGHE_PER_PAGINA)
    : sorted;

  const Paginazione = () => (sorted.length <= RIGHE_PER_PAGINA ? null : (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
      <span>
        {fmtNumber(paginaCorrente * RIGHE_PER_PAGINA + 1, 0)}–
        {fmtNumber(Math.min((paginaCorrente + 1) * RIGHE_PER_PAGINA, sorted.length), 0)}
        {" "}di {fmtNumber(sorted.length, 0)}
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={paginaCorrente === 0}
          className="px-2.5 py-1.5 rounded-md border border-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50">
          Precedenti
        </button>
        <span className="px-1">pagina {paginaCorrente + 1} di {fmtNumber(pagine, 0)}</span>
        <button onClick={() => setPagina(p => Math.min(pagine - 1, p + 1))} disabled={paginaCorrente >= pagine - 1}
          className="px-2.5 py-1.5 rounded-md border border-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50">
          Successivi
        </button>
      </div>
    </div>
  ));

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    if (sortKey !== col.key) { setSortKey(col.key); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortKey(null); }
  };

  // Su telefono la tabella diventa un elenco di schede: una griglia a otto
  // colonne su 390 px resta illeggibile anche potendola scorrere, mentre la
  // scheda mostra subito ciò che serve a riconoscere la riga.
  if (vp.mobile) {
    const colonneAzioni = columns.filter(c => c.key.startsWith("_"));
    const colonneDato = columns.filter(c => !c.key.startsWith("_"));
    const [principale, secondaria, ...altre] = colonneDato;

    const rendi = (row, col) => (col.render ? col.render(row) : getVal(row, col));

    return (
      <div className="divide-y divide-slate-100">
        {visibili.map((row, i) => (
          <div key={getRowKey(row, i)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`px-4 py-3 ${onRowClick ? "active:bg-slate-50 cursor-pointer" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold" style={{ color: NAVY_700 }}>
                  {principale && rendi(row, principale)}
                </div>
                {secondaria && (
                  <div className="text-sm text-slate-500 mt-0.5">{rendi(row, secondaria)}</div>
                )}
              </div>
              {onRowClick && <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-1" />}
            </div>

            {altre.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {altre.slice(0, 5).map(col => {
                  const v = rendi(row, col);
                  if (v === null || v === undefined || v === "") return null;
                  return (
                    <div key={col.key} className="text-xs">
                      <span className="text-slate-400">{col.label}: </span>
                      <span className="text-slate-600">{v}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {colonneAzioni.length > 0 && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100"
                onClick={(e) => e.stopPropagation()}>
                {colonneAzioni.map(col => <span key={col.key}>{col.render ? col.render(row) : null}</span>)}
              </div>
            )}
          </div>
        ))}
        {sorted.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">{emptyLabel}</p>}
        <Paginazione />
      </div>
    );
  }

  return (
    // Su schermo stretto la tabella scorre in orizzontale invece di comprimere
    // le colonne fino a renderle illeggibili
    <div className="overflow-x-auto -mx-px">
      <table className="w-full min-w-[720px]">
        <thead className="border-b border-slate-200 bg-slate-50/60">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="text-left px-4 pt-3 pb-1.5">
                <button
                  onClick={() => toggleSort(col)}
                  className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${col.sortable === false ? "cursor-default text-slate-500" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {col.label}
                  {col.sortable !== false && (
                    sortKey === col.key
                      ? (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
                      : <ChevronsUpDown size={12} className="opacity-30" />
                  )}
                </button>
              </th>
            ))}
          </tr>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 pb-2.5">
                {col.filterable === false ? null : col.filterType === "select" ? (
                  <select
                    value={filters[col.key] || ""} onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-600"
                  >
                    <option value="">Tutti</option>
                    {col.options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                  </select>
                ) : (
                  <input
                    value={filters[col.key] || ""} onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))}
                    placeholder="Filtra..." className="w-full text-xs border border-slate-200 rounded-md px-1.5 py-1 text-slate-600"
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visibili.map((row, i) => (
            <tr key={getRowKey(row, i)} className={onRowClick ? "hover:bg-slate-50 cursor-pointer" : "hover:bg-slate-50"} onClick={() => onRowClick?.(row)}>
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm text-slate-700">
                  {col.render ? col.render(row) : getVal(row, col)}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={columns.length} className="text-center text-sm text-slate-400 py-8">{emptyLabel}</td></tr>
          )}
        </tbody>
      </table>
      <Paginazione />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MASCHERA DI INSERIMENTO GENERICA — usata da tutti i moduli per "Nuovo..."
// ---------------------------------------------------------------------------
function initialFormValues(fields, initialValues) {
  return Object.fromEntries(fields.map(field => {
    let value = initialValues?.[field.key] ?? field.default ?? "";
    if (field.type === "select" && value !== "" && field.options && !field.options.some(option => String(typeof option === "object" ? option.value : option) === String(value))) value = "";
    return [field.key, value];
  }));
}
function SimpleFormModal({ title, fields, onClose, onSave, submitLabel = "Salva", initialValues }) {
  const [form, setForm] = useState(() => initialFormValues(fields, initialValues));
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Se i campi dichiarano una sezione, il modulo si articola in schede: evita
  // maschere lunghissime da scorrere quando l'anagrafica ha decine di campi.
  const sections = [...new Set(fields.map(f => f.section).filter(Boolean))];
  const tabbed = sections.length > 1;
  const [tab, setTab] = useState(sections[0] || null);
  const [attempted, setAttempted] = useState(false);

  const missingOf = (list) => list.filter(f => f.required && String(form[f.key] ?? "").trim() === "");
  const missing = missingOf(fields);
  const requiredOk = missing.length === 0;
  const visible = tabbed ? fields.filter(f => f.section === tab) : fields;

  // Un campo obbligatorio può trovarsi in una scheda non visibile: al tentativo
  // di salvataggio ci si sposta dove manca il dato, altrimenti l'utente vedrebbe
  // solo un pulsante inerte senza capirne il motivo.
  const submit = () => {
    if (!requiredOk) {
      setAttempted(true);
      if (tabbed) {
        const firstMissing = missing[0];
        if (firstMissing?.section) setTab(firstMissing.section);
      }
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`bg-white rounded-t-2xl sm:rounded-xl w-full ${tabbed ? "max-w-2xl" : "max-w-lg"} max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: NAVY_700 }}>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        {tabbed && (
          <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-200 overflow-x-auto flex-shrink-0">
            {sections.map(sec => {
              const secFields = fields.filter(f => f.section === sec);
              const mancanti = missingOf(secFields).length;
              const active = tab === sec;
              return (
                <button key={sec} onClick={() => setTab(sec)}
                  className="px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition flex items-center gap-1.5"
                  style={active
                    ? { color: NAVY_700, borderBottom: `2px solid ${GOLD_500}`, backgroundColor: "#F4F7F9" }
                    : { color: "#94a3b8", borderBottom: "2px solid transparent" }}>
                  {sec}
                  {attempted && mancanti > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#B4302E" }} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visible.map(f => {
              const mancante = attempted && f.required && String(form[f.key] ?? "").trim() === "";
              return (
                <div key={f.key} className={`flex flex-col ${f.span === 2 ? "col-span-2" : ""}`}>
                  <p className="text-xs mb-1" style={{ color: mancante ? "#B4302E" : "#64748b" }}>
                    {f.label}{f.required ? " *" : ""}
                  </p>
                  {f.type === "vehicle" ? (
                    <VehiclePicker value={form[f.key]} onChange={v => setForm(x => ({ ...x, [f.key]: v }))} />
                  ) : f.type === "select" ? (
                    <select value={form[f.key]} onChange={set(f.key)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      style={{ borderColor: mancante ? "#B4302E" : "#cbd5e1" }}>
                      <option value="">Seleziona...</option>
                      {f.options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || "text"} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      style={{ borderColor: mancante ? "#B4302E" : "#cbd5e1" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
          {attempted && !requiredOk && (
            <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: "#B4302E" }}>
              <AlertTriangle size={13} />
              {missing.length} camp{missing.length === 1 ? "o obbligatorio" : "i obbligatori"} da compilare
              {tabbed && missing[0]?.section ? ` — vedi «${missing[0].section}»` : ""}
            </p>
          )}
          <div className="flex gap-2">
            {tabbed && (
              <>
                <button onClick={() => setTab(sections[Math.max(0, sections.indexOf(tab) - 1)])}
                  disabled={sections.indexOf(tab) === 0}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition">
                  Indietro
                </button>
                {sections.indexOf(tab) < sections.length - 1 && (
                  <button onClick={() => setTab(sections[sections.indexOf(tab) + 1])}
                    className="px-3 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
                    style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                    Avanti
                  </button>
                )}
              </>
            )}
            <button onClick={submit}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white transition"
              style={{ backgroundColor: requiredOk ? NAVY_700 : "#94a3b8" }}>
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MARCHIO — lampadina con circuito, ridisegnata in SVG per restare nitida
// a ogni dimensione e adattarsi al fondo scuro della barra laterale.
// ---------------------------------------------------------------------------
function BrandMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bulbGrad" x1="12" y1="4" x2="52" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4FC3D9" />
          <stop offset="1" stopColor="#2FA8C4" />
        </linearGradient>
      </defs>
      {/* bulbo */}
      <path d="M32 5c-11 0-19.5 8.5-19.5 19 0 7 3.6 11.4 6.7 15 2 2.3 3.3 4.2 3.6 6.4h18.4c.3-2.2 1.6-4.1 3.6-6.4 3.1-3.6 6.7-8 6.7-15C51.5 13.5 43 5 32 5Z"
        stroke="url(#bulbGrad)" strokeWidth="3.4" strokeLinejoin="round" />
      {/* zoccolo */}
      <rect x="23" y="49" width="18" height="4.2" rx="2.1" fill="url(#bulbGrad)" />
      <path d="M27 56h10c-.6 2.4-2.6 4-5 4s-4.4-1.6-5-4Z" fill="url(#bulbGrad)" />
      {/* circuito interno */}
      <path d="M32 45V28m0 0-6-6m6 6 7-7m-7 13-8 0m8 6 9 0" stroke="url(#bulbGrad)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="26" cy="22" r="2.6" fill="url(#bulbGrad)" />
      <circle cx="39" cy="21" r="2.6" fill="url(#bulbGrad)" />
      <circle cx="24" cy="34" r="2.2" fill="url(#bulbGrad)" />
      <circle cx="41" cy="40" r="2.2" fill="url(#bulbGrad)" />
      <circle cx="32" cy="16" r="2" fill="url(#bulbGrad)" />
      <circle cx="19" cy="27" r="1.5" fill="url(#bulbGrad)" opacity=".75" />
      <circle cx="45" cy="30" r="1.5" fill="url(#bulbGrad)" opacity=".75" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PERSISTENZA LOCALE
// ---------------------------------------------------------------------------
// I dati inseriti devono sopravvivere alla chiusura della pagina. Sono previsti
// tre livelli, provati in ordine:
//   1. window.storage — archivio persistente dell'ambiente Claude
//   2. localStorage   — quando la piattaforma gira come sito o in locale
//   3. memoria        — ultimo ripiego, con avviso esplicito all'utente
// La distinzione conta: se nessuno dei due archivi è disponibile l'utente deve
// saperlo prima di inserire dati, non dopo averli persi.
const STORE_PREFIX = "matherion.fleet.";

// ---------------------------------------------------------------------------
// ARCHIVI DISPONIBILI
// ---------------------------------------------------------------------------
// I dati non vengono affidati a un solo archivio. Ogni salvataggio viene
// scritto su TUTTI quelli disponibili; in lettura si prende la copia più
// recente e si riallineano le altre. Serve perché ciascun archivio ha un modo
// tipico di venire meno — la cache svuotata, lo spazio esaurito, la modalità
// privata — e sono guasti indipendenti fra loro: perderli tutti insieme è
// molto meno probabile che perderne uno.
const backendDisponibili = (() => {
  const elenco = [];
  if (typeof window !== "undefined" && window.storage?.get) elenco.push("window");
  if (typeof window !== "undefined" && window.indexedDB) elenco.push("idb");
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const k = "__matherion_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      elenco.push("local");
    }
  } catch { /* accesso negato: modalità privata o contesto restrittivo */ }
  return elenco;
})();

const storageBackend = backendDisponibili[0] || "memory";

// --- IndexedDB: capiente e non cancellato dallo svuotamento della cronologia
const IDB_NAME = "matherion-fleet";
const IDB_STORE = "archivi";
let idbPromise = null;

function apriIdb() {
  if (!window.indexedDB) return Promise.reject(new Error("IndexedDB non disponibile"));
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((res, rej) => {
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  return idbPromise;
}

function idbOp(modo, azione) {
  return apriIdb().then(db => new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, modo);
    const req = azione(tx.objectStore(IDB_STORE));
    let result;
    req.onsuccess = () => { result = req.result; };
    req.onerror = () => rej(req.error);
    tx.oncomplete = () => res(result);
    tx.onerror = () => rej(tx.error || new Error("Transazione IndexedDB fallita"));
    tx.onabort = () => rej(tx.error || new Error("Transazione IndexedDB annullata"));
  }));
}

const memoryStore = new Map();

// Limite prudenziale per singolo archivio: oltre questa soglia la scrittura
// viene rifiutata dall'ambiente, e l'utente deve saperlo con una causa precisa.
const MAX_VALUE_BYTES = 4.5 * 1024 * 1024;

// Le scritture passano da una coda: all'avvio decine di archivi si salverebbero
// nello stesso istante, superando il limite di richieste dell'ambiente e facendo
// fallire tutto. Con la coda le scritture sono sequenziali e distanziate.
const writeQueue = [];
let queueRunning = false;

async function runQueue() {
  if (queueRunning) return;
  queueRunning = true;
  while (writeQueue.length) {
    const job = writeQueue.shift();
    let esito = { ok: false, reason: "sconosciuto" };
    for (let tentativo = 0; tentativo < 3; tentativo++) {
      try { esito = await job.run(); } catch (e) { esito = { ok: false, reason: String(e?.message || e) }; }
      if (esito.ok) break;
      // Attesa crescente: se il rifiuto è per troppe richieste, ritentare subito
      // le farebbe fallire di nuovo.
      await new Promise(r => setTimeout(r, 250 * (tentativo + 1)));
    }
    job.done(esito);
    await new Promise(r => setTimeout(r, 60));
  }
  queueRunning = false;
}

// ---------------------------------------------------------------------------
// PUNTO DI INNESTO DEL DATABASE
// ---------------------------------------------------------------------------
// Se l'applicazione viene avviata con un archivio remoto già installato
// (window.__MATHERION_STORE__), tutte le letture e scritture passano da lì.
// È il motivo per cui il passaggio al database non richiede di modificare i
// moduli: il livello di persistenza è uno solo, e si sostituisce in un punto.
const remote = () => (typeof window !== "undefined" ? window.__MATHERION_STORE__ : null);

const dataStore = {
  get backend() { return remote() ? "remote" : storageBackend; },
  get available() { return !!remote() || storageBackend !== "memory"; },

  async get(key) {
    const r = remote();
    if (r) return await r.get(key);
    return this._localGet(key);
  },

  set(key, value) {
    const r = remote();
    if (r) {
      return new Promise(resolve => {
        writeQueue.push({run: async () => {
          try {
            const esito = await r.set(key, value);
            return esito && typeof esito === "object" ? esito : {ok: true, via: "remote"};
          } catch(e) { return {ok: false, reason: String(e?.message || e).slice(0, 120)}; }
        }, done: resolve});
        runQueue();
      });
    }
    return this._localSet(key, value);
  },

  async remove(key) {
    const r = remote();
    if (r) { try { await r.remove(key); return true; } catch { return false; } }
    return this._localRemove(key);
  },

  // --- Lettura e scrittura sui singoli archivi ------------------------------
  // Ogni valore è racchiuso in una busta con la data di scrittura: è ciò che
  // permette, trovando copie diverse, di riconoscere qual è la più recente.
  async _leggiDa(backend, k) {
    try {
      if (backend === "window") {
        const r = await window.storage.get(k);
        return r ? JSON.parse(r.value) : null;
      }
      if (backend === "idb") return (await idbOp("readonly", st => st.get(k))) ?? null;
      if (backend === "local") {
        const v = window.localStorage.getItem(k);
        return v ? JSON.parse(v) : null;
      }
      return memoryStore.has(k) ? memoryStore.get(k) : null;
    } catch { return null; }
  },

  async _scriviSu(backend, k, busta) {
    const payload = JSON.stringify(busta);
    if (payload.length > MAX_VALUE_BYTES) {
      throw new Error(`sezione troppo grande (${(payload.length / 1048576).toFixed(1)} MB)`);
    }
    if (backend === "window") { await window.storage.set(k, payload); return; }
    if (backend === "idb") { await idbOp("readwrite", st => st.put(busta, k)); return; }
    if (backend === "local") { window.localStorage.setItem(k, payload); return; }
    memoryStore.set(k, busta);
  },

  /**
   * Legge da tutti gli archivi e restituisce la copia più recente,
   * riallineando quelli rimasti indietro. È il meccanismo che recupera i dati
   * quando un archivio viene svuotato o non è più disponibile.
   */
  async _localGet(key) {
    const k = STORE_PREFIX + key;
    const lista = backendDisponibili.length ? backendDisponibili : ["memory"];
    const copie = [];
    for (const b of lista) {
      const busta = await this._leggiDa(b, k);
      if (busta && typeof busta === "object" && "data" in busta) copie.push({ backend: b, busta });
    }
    if (copie.length === 0) return null;

    copie.sort((x, y) => (y.busta.at || 0) - (x.busta.at || 0));
    const vincente = copie[0];

    // Riallineamento silenzioso degli archivi con una copia più vecchia o assenti
    for (const b of lista) {
      const presente = copie.find(c => c.backend === b);
      if (!presente || (presente.busta.at || 0) < (vincente.busta.at || 0)) {
        this._scriviSu(b, k, vincente.busta).catch(() => { /* archivio non scrivibile */ });
      }
    }
    return vincente.busta.data;
  },

  /** Scrive su tutti gli archivi disponibili. Riesce se almeno uno accetta. */
  _localSet(key, value) {
    const k = STORE_PREFIX + key;
    return new Promise(resolve => {
      writeQueue.push({
        run: async () => {
          const busta = { v: 1, at: Date.now(), data: value };
          const lista = backendDisponibili.length ? backendDisponibili : ["memory"];
          const riusciti = [];
          const falliti = [];

          for (const b of lista) {
            try { await this._scriviSu(b, k, busta); riusciti.push(b); }
            catch (e) { falliti.push({ b, motivo: String(e?.message || e) }); }
          }

          if (riusciti.length === 0) {
            // Nemmeno un archivio ha accettato: si conserva in memoria per non
            // perdere il dato nella sessione corrente, ma è un errore da dire.
            memoryStore.set(k, busta);
            const causa = falliti[0]?.motivo || "";
            const motivo = /quota|exceed|full/i.test(causa)
              ? "spazio esaurito su tutti gli archivi: esporta subito un backup"
              : `nessun archivio disponibile (${causa.slice(0, 50)})`;
            return { ok: false, reason: motivo };
          }

          return {
            ok: riusciti.some(b => b !== "memory"),
            reason: riusciti.every(b => b === "memory") ? "Dati conservati solo in memoria: esportare un backup prima di chiudere" : null,
            via: riusciti.join("+"),
            copie: riusciti.length,
            degraded: falliti.length ? `${falliti.length} archivio/i non scrivibile/i` : null,
          };
        },
        done: resolve,
      });
      runQueue();
    });
  },

  async _localRemove(key) {
    const k = STORE_PREFIX + key;
    const lista = backendDisponibili.length ? backendDisponibili : ["memory"];
    for (const b of lista) {
      try {
        if (b === "window") await window.storage.delete(k);
        else if (b === "idb") await idbOp("readwrite", st => st.delete(k));
        else if (b === "local") window.localStorage.removeItem(k);
      } catch { /* archivio non disponibile */ }
    }
    memoryStore.delete(k);
    return true;
  },

  /** Stato di ciascun archivio, per la diagnostica */
  async statoArchivi() {
    const out = [];
    for (const b of (backendDisponibili.length ? backendDisponibili : ["memory"])) {
      let chiavi = 0, ultimo = 0, scrivibile = false;
      for (const key of BACKUP_KEYS) {
        const busta = await this._leggiDa(b, STORE_PREFIX + key);
        if (busta && "data" in busta) { chiavi++; ultimo = Math.max(ultimo, busta.at || 0); }
      }
      try {
        await this._scriviSu(b, STORE_PREFIX + "__prova__", { v: 1, at: Date.now(), data: "x" });
        scrivibile = true;
        if (b === "window") await window.storage.delete(STORE_PREFIX + "__prova__");
        else if (b === "idb") await idbOp("readwrite", st => st.delete(STORE_PREFIX + "__prova__"));
        else if (b === "local") window.localStorage.removeItem(STORE_PREFIX + "__prova__");
      } catch { scrivibile = false; }
      out.push({ backend: b, chiavi, ultimo, scrivibile });
    }
    return out;
  },
};

// Contesto per segnalare lo stato del salvataggio nell'interfaccia
const SaveStateContext = createContext({ saving: false, lastSaved: null, failed: false, backend: storageBackend });
function useSaveState() { return useContext(SaveStateContext); }

/**
 * Stato con salvataggio automatico: stessa firma di useState, così la
 * conversione dei moduli è meccanica e non cambia il codice che li usa.
 * La scrittura è differita di mezzo secondo: durante una digitazione o un
 * trascinamento si evitano decine di scritture inutili.
 */
function usePersistentState(key, initial, onSaveEvent) {
  const reportSave = (...args) => {
    if (args[0] && typeof window !== "undefined") window.dispatchEvent(new Event("fleet-data-saved"));
    if (onSaveEvent) onSaveEvent(...args);
    else if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("fleet-save-result", {detail: args}));
  };
  const [value, setValue] = useState(() => remote() ? (key === "cookieConsent" ? null : []) : (typeof initial === "function" ? initial() : initial));
  const [loaded, setLoaded] = useState(false);
  const timer = useRef(null);
  const ultimoSalvato = useRef(null);   // impronta dell'ultimo contenuto scritto

  useEffect(() => {
    let vivo = true;
    dataStore.get(key).then(saved => {
      if (!vivo) return;
      if (saved !== null && saved !== undefined) {
        setValue(saved);
        ultimoSalvato.current = JSON.stringify(saved);
      } else {
        // Primo avvio: l'archivio è vuoto e va inizializzato, altrimenti un
        // backup o un file su OneDrive creato subito dopo conterrebbe solo le
        // sezioni toccate per caso. La scrittura passa dalla coda e avviene
        // una sola volta: dagli avvii successivi i dati esistono già.
        const iniziale = typeof initial === "function" ? initial() : initial;
        dataStore.set(key, iniziale).then(esito => {
          if (esito.ok) { try { ultimoSalvato.current = JSON.stringify(iniziale); } catch { /* ignorato */ } }
          reportSave(esito.ok, esito.reason, key, esito);
        });
      }
      setLoaded(true);
    }).catch(error => {
      if (vivo) reportSave(false, `Lettura fallita: ${error?.message || error}. Nessuna inizializzazione eseguita.`, key);
    });
    return () => { vivo = false; };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    let impronta;
    try { impronta = JSON.stringify(value); } catch { return; }
    if (impronta === ultimoSalvato.current) return;   // nessuna modifica: niente scrittura

    let cancelled = false;
    const persist = async () => {
      const esito = await dataStore.set(key, value);
      if (!cancelled && esito.ok) ultimoSalvato.current = impronta;
      reportSave(esito.ok, esito.reason, key, esito);
    };
    persist();
    return () => { cancelled = true; };
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}

// ---------------------------------------------------------------------------
// FORMATO DELLO SCHERMO
// ---------------------------------------------------------------------------
// Su telefono la barra laterale fissa da 264 px mangerebbe metà larghezza:
// diventa un menu a scomparsa, e le destinazioni ricorrenti si raggiungono
// dalla barra in basso, dove il pollice arriva senza spostare la mano.
function useViewport() {
  const [larghezza, setLarghezza] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280);

  useEffect(() => {
    const aggiorna = () => setLarghezza(window.innerWidth);
    window.addEventListener("resize", aggiorna);
    window.addEventListener("orientationchange", aggiorna);
    return () => {
      window.removeEventListener("resize", aggiorna);
      window.removeEventListener("orientationchange", aggiorna);
    };
  }, []);

  return {
    larghezza,
    mobile: larghezza < 768,
    tablet: larghezza >= 768 && larghezza < 1180,
    desktop: larghezza >= 1180,
  };
}

// Le cinque destinazioni della barra inferiore: quelle che si aprono più volte
// al giorno. L'ultima apre il menu completo.
const MOBILE_TABS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "flotta", label: "Flotta", icon: Car },
  { id: "manutenzione", label: "Officina", icon: Wrench },
  { id: "calendario", label: "Agenda", icon: CalendarClock },
  { id: "__menu__", label: "Menu", icon: ListChecks },
];

// ---------------------------------------------------------------------------
// PERMESSI — visibilità e modifica per modulo
// ---------------------------------------------------------------------------
// Tre livelli per modulo: nessuno (il modulo non compare), visualizza (sola
// lettura) e modifica. L'applicazione non si limita a nascondere il menu: i
// pulsanti di creazione, modifica ed eliminazione spariscono anche dentro il
// modulo, perché un permesso applicato solo alla navigazione si aggira
// semplicemente cambiando schermata.
const PERM = { none: "nessuno", view: "visualizza", edit: "modifica" };

const PermissionsContext = createContext({
  user: null, currentModule: null,
  canView: () => false, canEdit: () => false,
});
function usePermissions() { return useContext(PermissionsContext); }

// Il pulsante di modifica in una tabella non sa a quale modulo appartiene:
// glielo dice il contesto, valorizzato dall'App con il modulo attivo.
function useCanEditHere() {
  const { canEdit, currentModule } = usePermissions();
  return canEdit(currentModule);
}

// ---------------------------------------------------------------------------
// STRUTTURA DEL MENU
// ---------------------------------------------------------------------------
// NAV resta l'elenco piatto dei moduli — è la base dei permessi e delle
// etichette. Qui si descrive solo come raggrupparli: separare le due cose
// permette di riorganizzare il menu senza toccare le abilitazioni assegnate
// agli utenti.
const NAV_STRUCTURE = [
  { item: "dashboard" },
  { item: "calendario" },
  { item: "flotta" },
  { group: "societa_gruppo", label: "Società & Gruppo", icon: Building2,
    children: ["societa", "capacita"] },
  { item: "partner" },
  { group: "comunicazioni", label: "Comunicazioni", icon: Mail,
    children: ["email", "chat"] },
  { group: "trasferimenti_grp", label: "Trasferimenti", icon: ArrowLeftRight,
    children: ["trasferimenti", "trasferimenti_massivi", "prese"] },
  { group: "noleggi_grp", label: "Noleggi & Leasing", icon: FileText,
    children: ["contratti", "subnoleggio", "rinnovi"] },
  { item: "fatturazione" },
  { item: "scadenze" },
  { group: "manutenzioni_grp", label: "Manutenzioni", icon: Wrench,
    children: ["manutenzione", "pneumatici", "magazzino"] },
  { group: "rifornimenti_grp", label: "Rifornimenti", icon: Fuel,
    children: ["rifornimenti", "cisterne", "carburante", "accise"] },
  { item: "pedaggi" },
  { item: "dotazioni" },
  { item: "sinistri" },
  { item: "verbali" },
  { group: "kpi", label: "KPI & Controllo", icon: TrendingUp,
    children: ["analisi", "costi", "budget"] },
  { item: "importazione" },
  { item: "importdocs" },
  { item: "conformita_doc" },
  { item: "esportazioni" },
  { item: "audit" },
  { item: "utenti" },
  { item: "backup" },
  { item: "compliance" },
];

function NewRecordButton({ label = "Nuovo", onClick }) {
  const vp = useViewport();
  if (!useCanEditHere()) return null;

  // Su telefono l'azione principale diventa un pulsante flottante in basso a
  // destra: resta raggiungibile mentre si scorre l'elenco, senza tornare in cima.
  if (vp.mobile) {
    return (
      <button onClick={onClick} aria-label={label}
        className="fixed right-4 z-30 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full text-sm font-semibold text-white active:scale-95 transition"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom))",
          background: ACCENT_GRADIENT,
          boxShadow: "0 6px 20px -4px rgba(47,168,196,.55)",
        }}>
        <Plus size={18} /> {label}
      </button>
    );
  }

  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition" style={{ background: ACCENT_GRADIENT, boxShadow: "0 2px 8px -2px rgba(47,168,196,.5)" }}>
      <Plus size={14} /> {label}
    </button>
  );
}

function Th({ children }) {
  return <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 text-sm text-slate-700 ${className}`}>{children}</td>;
}

// ---------------------------------------------------------------------------
// NAV CONFIG
// ---------------------------------------------------------------------------
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "flotta", label: "Anagrafica Flotta", icon: Car },
  { id: "societa", label: "Anagrafica Società", icon: Building2 },
  { id: "capacita", label: "Capacità Finanziaria", icon: Scale },
  { id: "partner", label: "Clienti & Fornitori", icon: Users },
  { id: "prese", label: "Prese in Carico", icon: Repeat, network: true },
  { id: "chat", label: "Chat Interna", icon: Mail, network: true },
  { id: "email", label: "Posta Elettronica", icon: Send, network: true },
  { id: "trasferimenti", label: "Assegnazioni & Trasferimenti", icon: ArrowLeftRight },
  { id: "trasferimenti_massivi", label: "Trasferimenti Massivi", icon: Truck },
  { id: "contratti", label: "Contratti", icon: FileText },
  { id: "subnoleggio", label: "Subnoleggio", icon: Repeat },
  { id: "rinnovi", label: "Rinnovi Subnoleggio", icon: CalendarClock },
  { id: "fatturazione", label: "Fatturazione", icon: Banknote },
  { id: "scadenze", label: "Scadenze & Compliance", icon: AlarmClock },
  { id: "manutenzione", label: "Manutenzione", icon: Wrench },
  { id: "pneumatici", label: "Pneumatici", icon: CircleDot },
  { id: "magazzino", label: "Magazzino Ricambi", icon: Package },
  { id: "cisterne", label: "Cisterne Carburante & AdBlue", icon: Fuel },
  { id: "carburante", label: "Carburante & Fuel Card", icon: Receipt },
  { id: "pedaggi", label: "Telepass & Pedaggi", icon: Gauge },
  { id: "dotazioni", label: "Dotazioni di Bordo", icon: Package },
  { id: "rifornimenti", label: "Rifornimenti Veicoli", icon: Droplet },
  { id: "sinistri", label: "Sinistri", icon: ShieldAlert },
  { id: "verbali", label: "Verbali & Multe", icon: Receipt },
  { id: "costi", label: "Costi & Redditività", icon: Coins },
  { id: "analisi", label: "Analisi Economica", icon: TrendingDown },
  { id: "budget", label: "Budget Centri di Costo", icon: Wallet },
  { id: "accise", label: "Rimborso Accise", icon: Truck },
  { id: "importazione", label: "Importazione Dati", icon: Upload },
  { id: "importdocs", label: "Importazione Documenti", icon: Paperclip },
  { id: "conformita_doc", label: "Conformità Documentale", icon: ShieldCheck },
  { id: "esportazioni", label: "Esportazione Guidata", icon: FileSpreadsheet },
  { id: "compliance", label: "Privacy & Cookie", icon: ShieldCheck },
  { id: "backup", label: "Dati & Backup", icon: ShieldCheck },
  { id: "calendario", label: "Calendario Condiviso", icon: CalendarClock },
  { id: "audit", label: "Registro Eliminazioni", icon: History },
];

// ---------------------------------------------------------------------------
// TRANSFER WORKFLOW MODAL
// ---------------------------------------------------------------------------
const TRANSFER_STEPS = [
  "Chiudi assegnazione precedente",
  "Registra data/ora trasferimento",
  "Disattiva da flotta origine",
  "Attiva su flotta destinazione",
  "Crea nuova assegnazione",
  "Mantieni VIN, targa e storico",
  "Trasferisci documenti",
  "Trasferisci info manutentive",
  "Trasferisci scadenze",
  "Aggiorna centro di costo",
  "Aggiorna responsabile",
  "Aggiorna contratto intercompany",
  "Genera scrittura economica intercompany",
];

// ---------------------------------------------------------------------------
// STORICO VEICOLO — eventi immutabili in ordine cronologico
// ---------------------------------------------------------------------------
const eventMeta = {
  immatricolazione: { label: "Immatricolazione", color: "#6B7280" },
  assegnazione: { label: "Assegnazione", color: "#12596B" },
  trasferimento: { label: "Trasferimento infragruppo", color: "#8B5CF6" },
  contratto_aperto: { label: "Contratto attivato", color: "#2E7D5B" },
  contratto_chiuso: { label: "Contratto chiuso", color: "#B07A12" },
  manutenzione: { label: "Manutenzione", color: "#1B6DB0" },
  sinistro: { label: "Sinistro", color: "#B4302E" },
};

let eventSeq = 0;
const makeEvent = (plate, date, type, title, detail) => ({
  id: `ev${Date.now()}${eventSeq++}`, plate, date, type, title, detail,
});

// Storico iniziale ricostruito dai dati anagrafici e contrattuali
function seedVehicleEvents(vehicleList, contractList) {
  const evs = [];
  vehicleList.forEach(v => {
    if (v.firstRegistrationDate) {
      evs.push(makeEvent(v.plate, v.firstRegistrationDate, "immatricolazione",
        "Immatricolazione", `${v.make} ${v.model} — telaio ${v.vin}`));
      evs.push(makeEvent(v.plate, v.firstRegistrationDate, "assegnazione",
        `Assegnato a ${companyName(v.company)}`, `Centro di costo ${v.costCenter}`));
    }
  });
  contractList.forEach(c => {
    evs.push(makeEvent(c.vehicle, c.start || c.end, "contratto_aperto",
      `Contratto ${c.type} attivato`, `${c.supplier} — € ${c.fee}/mese, scadenza ${c.end}`));
  });
  return evs;
}

function TransferModal({ vehicle, contractList, equipment = [], onClose, onExecute }) {
  const [toCompany, setToCompany] = useState("");
  const [toCostCenter, setToCostCenter] = useState("");
  const [date, setDate] = useState("2026-09-01");
  const [contractAction, setContractAction] = useState("mantieni");
  const [newContract, setNewContract] = useState({ supplier: "", fee: "", type: "noleggio", end: "" });
  const [running, setRunning] = useState(false);
  const [doneSteps, setDoneSteps] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Contratto attualmente in essere sul mezzo: è quello che il trasferimento
  // deve chiudere o mantenere, e va tracciato nello storico.
  const activeContract = contractList.find(c => c.vehicle === vehicle.plate && c.status !== "chiuso");

  const canRun = toCompany && date &&
    (contractAction !== "sostituisci" || (newContract.supplier && newContract.fee && newContract.end));

  const start = () => {
    if (!canRun) return;
    setRunning(true);
    setDoneSteps(0);
    let i = 0;
    const tick = () => {
      i += 1;
      setDoneSteps(i);
      if (i < TRANSFER_STEPS.length) setTimeout(tick, 120);
      else {
        // Persistenza effettiva: anagrafica, contratti e storico del mezzo
        onExecute({
          vehicle, toCompany, toCostCenter: toCostCenter || vehicle.costCenter,
          date, contractAction, activeContract, newContract,
        });
        setCompleted(true);
        setRunning(false);
      }
    };
    setTimeout(tick, 120);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>TRASFERIMENTO INFRAGRUPPO</p>
            <h3 className="text-lg font-bold text-white">{vehicle.plate} — {vehicle.make} {vehicle.model}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        {!completed ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Da</p>
                <p className="font-semibold text-slate-800">{companyName(vehicle.company)}</p>
                <p className="text-xs text-slate-400">{vehicle.costCenter}</p>
              </div>
              <ArrowRight size={18} className="text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">A</p>
                <select value={toCompany} onChange={e => setToCompany(e.target.value)} disabled={running}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800">
                  <option value="">Seleziona società...</option>
                  {LIVE.companies.filter(c => c.id !== vehicle.company).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Data trasferimento</p>
                <input type="date" value={date} disabled={running} onChange={e => setDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Nuovo centro di costo</p>
                <input value={toCostCenter} disabled={running} onChange={e => setToCostCenter(e.target.value)}
                  placeholder={vehicle.costCenter} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <EquipmentOnBoardWarning equipment={equipment} plates={[vehicle.plate]} />

            {/* --- Gestione del contratto di noleggio in essere --- */}
            <div className="rounded-lg p-3" style={{ backgroundColor: "#F5F6F8" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: NAVY_700 }}>Contratto di noleggio</p>
              {activeContract ? (
                <p className="text-xs text-slate-500 mb-2.5">
                  In essere: <strong className="text-slate-700">{activeContract.type} · {activeContract.supplier}</strong> —
                  € {activeContract.fee}/mese, scadenza {activeContract.end}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mb-2.5">Nessun contratto attivo registrato per questo mezzo.</p>
              )}
              <div className="space-y-1.5">
                {[
                  { id: "mantieni", label: "Mantieni il contratto attuale (cambia solo la società utilizzatrice)" },
                  { id: "sostituisci", label: "Chiudi il contratto e registrane uno nuovo alla società di destinazione" },
                ].map(o => (
                  <label key={o.id} className="flex items-start gap-2 text-xs cursor-pointer">
                    <input type="radio" name="contractAction" checked={contractAction === o.id} disabled={running}
                      onChange={() => setContractAction(o.id)} className="mt-0.5" style={{ accentColor: NAVY_700 }} />
                    <span className="text-slate-600">{o.label}</span>
                  </label>
                ))}
              </div>

              {contractAction === "sostituisci" && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Fornitore / concedente</p>
                    <input value={newContract.supplier} disabled={running}
                      onChange={e => setNewContract(c => ({ ...c, supplier: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Tipo</p>
                    <select value={newContract.type} disabled={running}
                      onChange={e => setNewContract(c => ({ ...c, type: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs">
                      {["noleggio", "leasing", "finanziamento", "acquisto"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Canone mensile (€)</p>
                    <input type="number" value={newContract.fee} disabled={running}
                      onChange={e => setNewContract(c => ({ ...c, fee: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Scadenza</p>
                    <input type="date" value={newContract.end} disabled={running}
                      onChange={e => setNewContract(c => ({ ...c, end: e.target.value }))}
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs" />
                  </div>
                </div>
              )}
            </div>

            {running && (
              <div className="pt-2 space-y-1.5 max-h-52 overflow-y-auto">
                {TRANSFER_STEPS.map((st, idx) => (
                  <div key={st} className="flex items-center gap-2 text-sm">
                    {idx < doneSteps
                      ? <CheckCircle2 size={16} style={{ color: "#2E7D5B" }} />
                      : <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                    <span className={idx < doneSteps ? "text-slate-700" : "text-slate-400"}>{st}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={start} disabled={!canRun || running}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-40 transition"
              style={{ backgroundColor: NAVY_700 }}>
              {running ? "Esecuzione in corso..." : "Esegui trasferimento"}
            </button>
            <p className="text-xs text-slate-400 text-center">VIN, targa e storico restano invariati — nessuna duplicazione dell'anagrafica.</p>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: "#E7F5EE" }}>
              <CheckCircle2 size={28} style={{ color: "#2E7D5B" }} />
            </div>
            <h4 className="text-lg font-bold" style={{ color: NAVY_700 }}>Trasferimento completato</h4>
            <p className="text-sm text-slate-500">
              {vehicle.plate} è passato da <strong>{companyName(vehicle.company)}</strong> a
              <strong> {companyName(toCompany)}</strong> con decorrenza {date}.
            </p>
            <p className="text-xs text-slate-400">
              {contractAction === "sostituisci"
                ? `Contratto ${activeContract ? `${activeContract.supplier} ` : ""}chiuso e sostituito con ${newContract.supplier}. Provenienza e sostituzione sono registrate nello storico del mezzo.`
                : "Contratto mantenuto. Provenienza e passaggio sono registrati nello storico del mezzo."}
            </p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: NAVY_700 }}>
              Chiudi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VEHICLE DETAIL DRAWER
// ---------------------------------------------------------------------------
function VehicleDocumentsPanel({ vehicle }) {
  const { listFor, addFiles, removeFile } = useAttachments();
  const [docType, setDocType] = useState("Carta di circolazione");
  const [busy, setBusy] = useState(false);
  const docs = listFor("veicolo", vehicle.id);

  const onPick = async (files) => {
    setBusy(true);
    await addFiles("veicolo", vehicle.id, files, docType);
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500 mb-1">Tipo di documento</p>
        <select value={docType} onChange={e => setDocType(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-2">
          {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <FileDropArea multiple disabled={busy} onFiles={onPick}
          hint={busy ? "Caricamento..." : "Carica carta di circolazione, polizza, contratto — o trascina qui i file"} />
      </div>

      {docs.length === 0 && <p className="text-sm text-slate-400">Nessun documento allegato a questo veicolo.</p>}
      <div className="space-y-2">
        {docs.map(d => (
          <div key={d.id} className="flex items-center gap-3 border border-slate-200 rounded-lg p-2.5">
            <FileText size={18} className="text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
              <p className="text-xs text-slate-400">{d.docType} · {formatBytes(d.size)} · {d.uploadedAt}</p>
            </div>
            <a href={d.dataUrl} download={d.name} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <Download size={14} />
            </a>
            <button onClick={() => removeFile(d.id)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VehicleDrawer({ vehicle, events = [], onClose, onTransfer, onSave, onDelete }) {
  const [tab, setTab] = useState("anagrafica");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const tabs = [
    { id: "anagrafica", label: "Anagrafica" },
    { id: "storico", label: "Storico" },
    { id: "costi", label: "Costi" },
    { id: "documenti", label: "Documenti" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-200" style={{ backgroundColor: NAVY_700 }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>{vehicle.vin}</p>
              <h3 className="text-xl font-bold text-white mt-1">{vehicle.plate}</h3>
              <p className="text-sm text-white/70">{vehicle.make} {vehicle.model}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
          </div>
          <div className="mt-3"><Badge status={vehicle.status} /></div>
        </div>

        <div className="flex border-b border-slate-200 px-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-3 py-3 text-sm font-medium border-b-2 -mb-px transition"
              style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {tab === "anagrafica" && (
            <>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>Identificazione</p>
                  <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <dt className="text-slate-400">Telaio (VIN)</dt><dd className="text-slate-700 font-medium">{vehicle.vin}</dd>
                    <dt className="text-slate-400">Targa</dt><dd className="text-slate-700 font-medium">{vehicle.plate}</dd>
                    <dt className="text-slate-400">Targa interna</dt><dd className="text-slate-700 font-medium">{vehicle.internalPlate}</dd>
                    <dt className="text-slate-400">N° Carta di circolazione</dt><dd className="text-slate-700 font-medium">{vehicle.docNumber}</dd>
                    <dt className="text-slate-400">N° motore</dt><dd className="text-slate-700 font-medium">{vehicle.engineNumber}</dd>
                    <dt className="text-slate-400">Colore</dt><dd className="text-slate-700 font-medium">{vehicle.color}</dd>
                  </dl>
                  {vehicle.plateChangeNotes && (
                    <div className="mt-2.5 flex gap-2 text-xs rounded-lg p-2.5" style={{ backgroundColor: "#FBF1DC", color: "#7A5C0E" }}>
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{vehicle.plateChangeNotes}</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>Marca, modello, omologazione</p>
                  <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <dt className="text-slate-400">Versione</dt><dd className="text-slate-700 font-medium">{vehicle.version}</dd>
                    <dt className="text-slate-400">Categoria veicolo</dt><dd className="text-slate-700 font-medium">{vehicle.vehicleCategory}</dd>
                    <dt className="text-slate-400">N° omologazione</dt><dd className="text-slate-700 font-medium text-xs">{vehicle.homologationNumber}</dd>
                  </dl>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>Motore</p>
                  <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <dt className="text-slate-400">Alimentazione</dt><dd className="text-slate-700 font-medium">{vehicle.fuel}</dd>
                    <dt className="text-slate-400">Cilindrata</dt><dd className="text-slate-700 font-medium">{vehicle.displacement ? `${vehicle.displacement} cc` : "—"}</dd>
                    <dt className="text-slate-400">Potenza</dt><dd className="text-slate-700 font-medium">{vehicle.powerKw} kW</dd>
                    <dt className="text-slate-400">Classe Euro</dt><dd className="text-slate-700 font-medium">{vehicle.euroClass}</dd>
                    <dt className="text-slate-400">CO₂</dt><dd className="text-slate-700 font-medium">{vehicle.co2} g/km</dd>
                    <dt className="text-slate-400">Velocità max</dt><dd className="text-slate-700 font-medium">{vehicle.maxSpeed} km/h</dd>
                  </dl>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>Masse (kg)</p>
                  <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <dt className="text-slate-400">Massa a pieno carico</dt><dd className="text-slate-700 font-medium">{vehicle.maxLadenMass}</dd>
                    <dt className="text-slate-400">Massa a vuoto</dt><dd className="text-slate-700 font-medium">{vehicle.unladenMass}</dd>
                    <dt className="text-slate-400">Rimorchiabile frenato</dt><dd className="text-slate-700 font-medium">{vehicle.maxTrailerBraked}</dd>
                    <dt className="text-slate-400">Rimorchiabile non frenato</dt><dd className="text-slate-700 font-medium">{vehicle.maxTrailerUnbraked}</dd>
                    <dt className="text-slate-400">Assi / Passo</dt><dd className="text-slate-700 font-medium">{vehicle.axlesCount} / {vehicle.wheelbase} mm</dd>
                    <dt className="text-slate-400">Posti</dt><dd className="text-slate-700 font-medium">{vehicle.seatsCount}</dd>
                  </dl>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>Pneumatici e cerchi omologati</p>
                  <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <dt className="text-slate-400">Pneumatico ant.</dt><dd className="text-slate-700 font-medium">{vehicle.tireSizeFront}</dd>
                    <dt className="text-slate-400">Pneumatico post.</dt><dd className="text-slate-700 font-medium">{vehicle.tireSizeRear}</dd>
                    <dt className="text-slate-400">Cerchio ant.</dt><dd className="text-slate-700 font-medium">{vehicle.rimSizeFront}</dd>
                    <dt className="text-slate-400">Cerchio post.</dt><dd className="text-slate-700 font-medium">{vehicle.rimSizeRear}</dd>
                  </dl>
                  <p className="text-xs text-slate-400 mt-1.5">Dato omologato di libretto — lo stato reale dei pneumatici montati è nel modulo Pneumatici.</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>Registrazione</p>
                  <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <dt className="text-slate-400">Prima immatricolazione</dt><dd className="text-slate-700 font-medium">{vehicle.firstRegistrationDate}</dd>
                    <dt className="text-slate-400">Data carta di circolazione</dt><dd className="text-slate-700 font-medium">{vehicle.registrationDate}</dd>
                    <dt className="text-slate-400">Validità</dt><dd className="text-slate-700 font-medium">{vehicle.registrationValidity}</dd>
                  </dl>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>Gestione</p>
                  <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <dt className="text-slate-400">Km attuali</dt><dd className="text-slate-700 font-medium">{vehicle.km.toLocaleString("it-IT")}</dd>
                    <dt className="text-slate-400">Società</dt><dd className="text-slate-700 font-medium">{companyName(vehicle.company)}</dd>
                    <dt className="text-slate-400">Centro di costo</dt><dd className="text-slate-700 font-medium">{vehicle.costCenter}</dd>
                    <dt className="text-slate-400">Conducente</dt><dd className="text-slate-700 font-medium">{vehicle.driver}</dd>
                    <dt className="text-slate-400">Tipo contratto</dt><dd className="text-slate-700 font-medium">{availabilityLabel[vehicle.availability]}</dd>
                    <dt className="text-slate-400">Società di noleggio</dt><dd className="text-slate-700 font-medium">{vehicle.rentalSupplier || "—"}</dd>
                  </dl>
                </div>
              </div>

              <button
                onClick={() => onTransfer(vehicle)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border-2 transition hover:bg-slate-50 mt-5"
                style={{ borderColor: NAVY_700, color: NAVY_700 }}
              >
                <ArrowLeftRight size={16} /> Trasferisci veicolo
              </button>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
                  style={{ borderColor: "#cbd5e1", color: "#475569" }}
                >
                  <Pencil size={15} /> Modifica
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-red-50"
                  style={{ borderColor: "#fecaca", color: "#B4302E" }}
                >
                  <Trash2 size={15} /> Elimina
                </button>
              </div>
            </>
          )}

          {tab === "storico" && (
            <div className="space-y-4">
              {events.length === 0 && <p className="text-sm text-slate-400">Nessun evento registrato per questo mezzo.</p>}
              {events.map((h, i) => {
                const m = eventMeta[h.type] || { label: h.type, color: GOLD_500 };
                return (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: m.color }} />
                      {i < events.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400">{h.date}</p>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: m.color, backgroundColor: `${m.color}14` }}>{m.label}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium mt-0.5">{h.title}</p>
                      {h.detail && <p className="text-xs text-slate-500 mt-0.5">{h.detail}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "documenti" && (
            <VehicleDocumentsPanel vehicle={vehicle} />
          )}

          {tab === "costi" && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Costo Totale di Possesso (mese)</p>
              <p className="text-3xl font-bold" style={{ color: NAVY_700 }}>€ {tcoDi(vehicle).toLocaleString("it-IT")}</p>
              <p className="text-xs text-slate-400 mt-4">Composizione stimata: canone, assicurazione, manutenzione, pneumatici, carburante, Telepass.</p>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <SimpleFormModal
          title={`Modifica veicolo — ${vehicle.plate}`} fields={VEHICLE_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={vehicle}
          onClose={() => setShowEdit(false)}
          onSave={(f) => { onSave({ ...f, km: parseInt(f.km) || 0 }); setShowEdit(false); }}
        />
      )}
      {showDelete && (
        <PinConfirmModal
          itemLabel={`il veicolo ${vehicle.plate} — ${vehicle.make} ${vehicle.model}`}
          moduleLabel="Anagrafica Flotta"
          onClose={() => setShowDelete(false)}
          onConfirm={(user) => { onDelete(user); setShowDelete(false); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MODULE VIEWS
// ---------------------------------------------------------------------------
function DashboardView({ onNavigate, companyList, vehicleList }) {
  const fleetByStatus = Object.entries(vehicleList.reduce((acc,v) => {acc[v.status]=(acc[v.status]||0)+1;return acc;},{})).map(([key,value])=>({name:statusMeta[key]?.label||key,value,color:statusMeta[key]?.color||"#64748b"}));
  const costTrend = Array.from({length:7},(_,i) => {
    const now=new Date(localISODate()+"T12:00:00"), date=new Date(now.getFullYear(),now.getMonth()-6+i,1);
    const month=date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0");
    const last=month+"-"+String(new Date(date.getFullYear(),date.getMonth()+1,0).getDate());
    return {month:date.toLocaleDateString("it-IT",{month:"short",year:"2-digit"}),
      canone:LIVE.contracts.filter(c=>c.start&&c.start<=last&&(!c.end||c.end>=month+"-01")).reduce((n,c)=>n+(Number(c.fee)||0),0),
      manutenzione:LIVE.maintenance.filter(m=>["completata","fatturata"].includes(m.status)&&(m.invoiceDate||m.scheduled||"").startsWith(month)).reduce((n,m)=>n+(Number(m.invoiceAmount??m.cost)||0),0)};
  });
  // Copertura documentale: quali veicoli non hanno i documenti obbligatori
  const { files: attachedFiles } = useAttachments();
  const copertura = vehicleList.map(v => {
    const suoi = attachedFiles.filter(f => f.entityType === "veicolo" && f.entityId === v.id);
    return { vehicle: v, presenti: suoi.length, mancanti: REQUIRED_VEHICLE_DOCS.filter(t => !suoi.some(f => f.docType === t)) };
  });
  const scopertiDoc = copertura.filter(c => c.mancanti.length > 0);
  const totalCost = tcoFlotta();
  const subMargin = LIVE.subRentals.reduce((a, sr) => a + (sr.fee - sr.vehicleCost), 0);
  const capacityAlerts = companyList
    .filter(c => c.isTransportOperator)
    .map(c => computeFinancialCapacity(c, vehicleList, CAPACITY_DEFAULTS))
    .filter(r => r.status === "da_aggiornare" || r.status === "insufficiente");

  return (
    <div>
      <div className="rounded-2xl p-6 mb-6 text-white" style={{background:BRAND_GRADIENT}}>
        <p className="text-xs uppercase tracking-widest mb-2" style={{color:GOLD_300}}>Matherion · Controllo operativo</p>
        <h1 className="text-2xl md:text-3xl font-bold">Fleet Control Tower</h1>
        <p className="text-sm mt-2 text-white/70">La tua flotta, le priorità di oggi, i numeri per decidere.</p>
        <div className="flex flex-wrap gap-2 mt-5">
          {[{id:"flotta",label:"Apri la flotta",icon:Car},{id:"scadenze",label:"Controlla scadenze",icon:AlarmClock},{id:"calendario",label:"Agenda operativa",icon:CalendarClock}].map(({id,label,icon:Icon})=><button key={id} onClick={()=>onNavigate(id)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-sm font-semibold"><Icon size={17}/>{label}<ArrowRight size={15}/></button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <KPI icon={Car} label="Veicoli totali" value={LIVE.vehicles.length} sub={`${LIVE.vehicles.filter(v=>v.status==='in_servizio'||v.status==='assegnato').length} operativi`} onClick={() => onNavigate("flotta")} />
        <KPI icon={AlarmClock} label="Scadenze ≤ 30gg" value={LIVE.deadlines.filter(d => d.days <= 30).length} sub="richiedono attenzione" accent="#B07A12" onClick={() => onNavigate("scadenze")} />
        <KPI icon={ShieldAlert} label="Sinistri aperti" value={LIVE.claims.filter(c => c.status !== "liquidato").length} sub={`su ${LIVE.claims.length} totali`} accent="#B4302E" onClick={() => onNavigate("sinistri")} />
        <KPI icon={Coins} label="Margine subnoleggio" value={`€ ${subMargin.toLocaleString("it-IT")}`} sub="mese corrente" accent="#2E7D5B" onClick={() => onNavigate("subnoleggio")} />
      </div>

      {capacityAlerts.length > 0 && (
        <button onClick={() => onNavigate("capacita")}
          className="w-full flex items-center gap-2.5 rounded-lg p-4 text-sm mb-6 text-left transition hover:opacity-90"
          style={{ backgroundColor: capacityAlerts.some(r => r.status === "insufficiente") ? "#FBEAEA" : "#FBF1DC" }}>
          <AlertTriangle size={17} className="flex-shrink-0"
            style={{ color: capacityAlerts.some(r => r.status === "insufficiente") ? "#B4302E" : "#B07A12" }} />
          <span style={{ color: capacityAlerts.some(r => r.status === "insufficiente") ? "#8F2624" : "#7A5C0E" }}>
            <strong>Capacità finanziaria da aggiornare</strong> — {capacityAlerts.map(r => r.company.name).join(", ")}
          </span>
          <ChevronRight size={16} className="ml-auto flex-shrink-0 opacity-50" />
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <Card className="p-5 col-span-2 flex flex-col">
          <p className="text-sm font-semibold mb-1" style={{ color: NAVY_700 }}>Canoni e manutenzioni registrate</p><p className="text-xs text-slate-500 mb-4">Canoni mensili dei contratti nel periodo; interventi completati o fatturati.</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={costTrend}>
              <defs>
                <linearGradient id="gCanone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NAVY_700} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={NAVY_700} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gManut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD_500} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={GOLD_500} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Area type="monotone" dataKey="canone" stroke={NAVY_700} fill="url(#gCanone)" strokeWidth={2} name="Canoni" />
              <Area type="monotone" dataKey="manutenzione" stroke={GOLD_500} fill="url(#gManut)" strokeWidth={2} name="Manutenzione" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: NAVY_700 }}>Flotta per stato</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={fleetByStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3} onClick={() => onNavigate("flotta")} className="cursor-pointer">
                {fleetByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {fleetByStatus.length === 0 && <p className="text-sm text-slate-500">Nessun veicolo registrato.</p>}
            {fleetByStatus.map(f => (
              <button key={f.name} onClick={() => onNavigate("flotta")} className="w-full flex items-center justify-between text-xs hover:bg-slate-50 rounded px-1 py-0.5 transition">
                <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />{f.name}</span>
                <span className="font-semibold" style={{ color: NAVY_700 }}>{f.value}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: NAVY_700 }}>
            <AlarmClock size={16} /> Prossime scadenze
          </p>
          <div className="space-y-1">
            {LIVE.deadlines.slice(0, 4).map(d => (
              <button key={d.id} onClick={() => onNavigate("scadenze")} className="w-full flex items-center justify-between text-sm hover:bg-slate-50 rounded-lg px-1.5 py-1.5 transition text-left">
                <div>
                  <span className="font-medium text-slate-700">{d.vehicle}</span>
                  <span className="text-slate-400"> — {d.type}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: d.days <= 15 ? "#B4302E" : "#B07A12", backgroundColor: d.days <= 15 ? "#FBEAEA" : "#FBF1DC" }}>
                  {d.days}gg
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: NAVY_700 }}>
            <ShieldAlert size={16} /> Sinistri in corso
          </p>
          <div className="space-y-1">
            {LIVE.claims.filter(c => c.status !== "liquidato").map(c => (
              <button key={c.id} onClick={() => onNavigate("sinistri")} className="w-full flex items-center justify-between text-sm hover:bg-slate-50 rounded-lg px-1.5 py-1.5 transition text-left">
                <div>
                  <span className="font-medium text-slate-700">{c.vehicle}</span>
                  <span className="text-slate-400"> — {c.date}</span>
                </div>
                <span className="text-xs font-semibold text-slate-600">€ {c.damage.toLocaleString("it-IT")}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <DocumentCoverage copertura={copertura} scoperti={scopertiDoc} compact
          onNavigate={() => onNavigate("importdocs")} />
      </div>
    </div>
  );
}

const SEARCH_FIELDS = [
  { id: "tutti", label: "Tutti i campi" },
  { id: "plate", label: "Targa" },
  { id: "internalPlate", label: "Targa interna" },
  { id: "vin", label: "Telaio (VIN)" },
  { id: "costCenter", label: "Centro di costo" },
  { id: "company", label: "Società" },
  { id: "availability", label: "Tipo contratto" },
  { id: "rentalSupplier", label: "Società di noleggio" },
];

function vehicleSearchIndex(v) {
  return [
    v.plate, v.internalPlate, v.vin, v.costCenter, companyName(v.company),
    availabilityLabel[v.availability], v.rentalSupplier, v.make, v.model, v.docNumber, v.engineNumber,
  ].filter(Boolean).join(" ").toLowerCase();
}

function matchesField(v, field, q) {
  const needle = q.toLowerCase();
  switch (field) {
    case "plate": return v.plate.toLowerCase().includes(needle);
    case "internalPlate": return (v.internalPlate || "").toLowerCase().includes(needle);
    case "vin": return v.vin.toLowerCase().includes(needle);
    case "costCenter": return v.costCenter.toLowerCase().includes(needle);
    case "company": return companyName(v.company).toLowerCase().includes(needle);
    case "availability": return availabilityLabel[v.availability].toLowerCase().includes(needle);
    case "rentalSupplier": return (v.rentalSupplier || "").toLowerCase().includes(needle);
    default: return vehicleSearchIndex(v).includes(needle);
  }
}

const VEHICLE_FORM_FIELDS = [
  // Identificazione
  { key: "vin", label: "Telaio (VIN)", required: true, span: 2 , section: "Identificazione" },
  { key: "plate", label: "Targa", required: true , section: "Identificazione" },
  { key: "internalPlate", label: "Targa interna" , section: "Identificazione" },
  { key: "docNumber", label: "N° Carta di circolazione" , section: "Identificazione" },
  { key: "engineNumber", label: "N° motore" , section: "Identificazione" },
  { key: "plateChangeNotes", label: "Note cambio targa / reimmatricolazione", span: 2 , section: "Identificazione" },
  // Marca, modello, omologazione
  { key: "make", label: "Marca", required: true , section: "Omologazione" },
  { key: "model", label: "Modello", required: true , section: "Omologazione" },
  { key: "version", label: "Versione" , section: "Omologazione" },
  { key: "trimLevel", label: "Allestimento" , section: "Omologazione" },
  { key: "vehicleCategory", label: "Categoria veicolo (M1, N1, N2, N3...)" , section: "Omologazione" },
  { key: "homologationNumber", label: "N° omologazione" , section: "Omologazione" },
  // Motore
  { key: "fuel", label: "Alimentazione", type: "select", options: ["Diesel", "Benzina", "Elettrico", "Ibrido", "GPL", "Metano"] , section: "Motore" },
  { key: "displacement", label: "Cilindrata (cc)", type: "number" , section: "Motore" },
  { key: "powerKw", label: "Potenza (kW)", type: "number" , section: "Motore" },
  { key: "euroClass", label: "Classe Euro" , section: "Motore" },
  { key: "co2", label: "CO₂ (g/km)", type: "number" , section: "Motore" },
  { key: "maxSpeed", label: "Velocità massima (km/h)", type: "number" , section: "Motore" },
  // Masse e dimensioni
  { key: "maxLadenMass", label: "Massa complessiva (kg)", type: "number" , section: "Masse" },
  { key: "unladenMass", label: "Massa a vuoto (kg)", type: "number" , section: "Masse" },
  { key: "maxTrailerBraked", label: "Rimorchiabile frenato (kg)", type: "number" , section: "Masse" },
  { key: "maxTrailerUnbraked", label: "Rimorchiabile non frenato (kg)", type: "number" , section: "Masse" },
  { key: "axlesCount", label: "Numero assi", type: "number" , section: "Masse" },
  { key: "wheelbase", label: "Passo (mm)", type: "number" , section: "Masse" },
  { key: "seatsCount", label: "Posti a sedere", type: "number" , section: "Masse" },
  // Pneumatici e cerchi omologati
  { key: "tireSizeFront", label: "Pneumatico anteriore" , section: "Pneumatici" },
  { key: "tireSizeRear", label: "Pneumatico posteriore" , section: "Pneumatici" },
  { key: "rimSizeFront", label: "Cerchio anteriore" , section: "Pneumatici" },
  { key: "rimSizeRear", label: "Cerchio posteriore" , section: "Pneumatici" },
  // Registrazione
  { key: "color", label: "Colore" , section: "Registrazione" },
  { key: "firstRegistrationDate", label: "Prima immatricolazione", type: "date" , section: "Registrazione" },
  { key: "registrationDate", label: "Data carta di circolazione", type: "date" , section: "Registrazione" },
  { key: "registrationValidity", label: "Validità carta di circolazione" , section: "Registrazione" },
  // Gestione
  { key: "km", label: "Km attuali", type: "number", default: 0 , section: "Gestione" },
  { key: "status", label: "Stato", type: "select", default: "disponibile",
    options: Object.entries(statusMeta).map(([value, m]) => ({ value, label: m.label })) },
  { key: "company", label: "Società", type: "select", required: true, get default() { return LIVE.companies.length === 1 ? LIVE.companies[0].id : ""; }, get options() { return LIVE.companies.map(c => ({ value: c.id, label: c.name })); } , section: "Gestione" },
  { key: "costCenter", label: "Centro di costo" , section: "Gestione" },
  { key: "driver", label: "Conducente" , section: "Gestione" },
  { key: "availability", label: "Tipo contratto", type: "select",
    options: Object.entries(availabilityLabel).map(([value, label]) => ({ value, label })) },
  { key: "rentalSupplier", label: "Società di noleggio" , section: "Gestione" },
  { key: "notes", label: "Note", span: 2 , section: "Gestione" },
  // Costi fissi: maturano anche a mezzo fermo ed entrano nel calcolo del TCO
  { key: "insuranceFee", label: "Assicurazione — premio annuo (€)", type: "number", section: "Costi fissi annui" },
  { key: "roadTax", label: "Bollo / tassa di possesso annua (€)", type: "number", section: "Costi fissi annui" },
  { key: "telematicsFee", label: "Telematica e GPS — canone annuo (€)", type: "number", section: "Costi fissi annui" },
  { key: "otherAnnualCost", label: "Altri costi fissi annui (€)", type: "number", section: "Costi fissi annui" },
];

function FlottaView({ list, setList, onSelect }) {
  const [q, setQ] = useState("");
  const [field, setField] = useState("tutti");
  const [showForm, setShowForm] = useState(false);
  const crud = useCrudModals(setList, "Anagrafica Flotta", v => `${v.plate} — ${v.make} ${v.model}`);
  const filtered = list.filter(v => q === "" || matchesField(v, field, q));

  const exportRows = filtered.map(v => ({
    "Targa": v.plate, "Targa interna": v.internalPlate, "Telaio (VIN)": v.vin,
    "N° Carta di circolazione": v.docNumber, "N° motore": v.engineNumber,
    "Marca": v.make, "Modello": v.model, "Versione": v.version, "Colore": v.color,
    "Alimentazione": v.fuel, "Classe Euro": v.euroClass, "CO2 (g/km)": v.co2,
    "Km attuali": v.km, "Stato": statusMeta[v.status]?.label, "Società": companyName(v.company),
    "Centro di costo": v.costCenter, "Conducente": v.driver,
    "Tipo contratto": availabilityLabel[v.availability], "Società di noleggio": v.rentalSupplier || "",
  }));

  const columns = [
    { key: "plate", label: "Targa", render: v => (<>{v.plate}<span className="block text-xs text-slate-400 font-normal">{v.internalPlate}</span></>) },
    { key: "model", label: "Veicolo", accessor: v => `${v.make} ${v.model}` },
    { key: "company", label: "Società", accessor: v => companyName(v.company), filterType: "select", options: LIVE.companies.map(c => c.name) },
    { key: "costCenter", label: "Centro di costo", accessor: v => v.costCenter || "" },
    { key: "availability", label: "Contratto", accessor: v => availabilityLabel[v.availability], filterType: "select", options: Object.values(availabilityLabel) },
    { key: "km", label: "Km", accessor: v => v.km, render: v => v.km.toLocaleString("it-IT") },
    { key: "driver", label: "Conducente" },
    { key: "status", label: "Stato", accessor: v => statusMeta[v.status]?.label, filterType: "select", options: Object.values(statusMeta).map(m => m.label), render: v => <Badge status={v.status} /> },
    { key: "_actions", label: "", sortable: false, filterable: false, render: v => (
      <RowActions entity={{ type: "veicolo", id: v.id, label: `${v.plate} — ${v.make} ${v.model}` }} onEdit={() => crud.requestEdit(v)} onDelete={() => crud.requestDelete(v)} />
    )},
    { key: "_open", label: "", sortable: false, filterable: false, render: () => <ChevronRight size={16} className="text-slate-300" /> },
  ];

  return (
    <div>
      <SectionTitle
        title="Anagrafica Flotta"
        sub={`${list.length} veicoli in gestione`}
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="anagrafica_flotta" sheetName="Flotta" />
            <NewRecordButton label="Nuovo veicolo" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      <div className="flex gap-2 mb-4">
        <select
          value={field} onChange={e => setField(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
        >
          {SEARCH_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder={field === "tutti" ? "Ricerca generica su tutti i campi..." : `Cerca per ${SEARCH_FIELDS.find(f=>f.id===field).label.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
          />
        </div>
        {q && (
          <button onClick={() => setQ("")} className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2">Azzera</button>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-3">{filtered.length} risultati — clicca l'intestazione per ordinare, usa i campi sotto per filtrare</p>
      <Card>
        <DataTable columns={columns} data={filtered} onRowClick={onSelect} emptyLabel="Nessun veicolo corrisponde alla ricerca." />
      </Card>

      {showForm && (
        <SimpleFormModal
          title="Nuovo veicolo" fields={VEHICLE_FORM_FIELDS} submitLabel="Aggiungi veicolo"
          onClose={() => setShowForm(false)}
          onSave={(f) => {
            setList(prev => [{
              id: `v${Date.now()}`, driver: "—", rentalSupplier: null,
              euroClass: "—", co2: null, docNumber: "", engineNumber: "", version: "",
              ...f, km: parseInt(f.km) || 0, status: f.status || "disponibile",
            }, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {crud.editing && (
        <SimpleFormModal
          title={`Modifica veicolo — ${crud.editing.plate}`} fields={VEHICLE_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing}
          onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f, km: parseInt(f.km) || 0 })}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`il veicolo ${crud.deleting.plate} — ${crud.deleting.make} ${crud.deleting.model}`}
          moduleLabel="Anagrafica Flotta"
          onClose={crud.cancelDelete}
          onConfirm={crud.confirmDelete}
        />
      )}
    </div>
  );
}

function SocietaView({ companyList, vehicleList }) {
  const exportRows = companyList.map(c => {
    const cap = c.isTransportOperator ? computeFinancialCapacity(c, vehicleList, CAPACITY_DEFAULTS) : null;
    return {
      "Società": c.name, "Ruolo": c.role, "Città": c.city,
      "Veicoli in flotta": vehicleList.filter(v => v.company === c.id).length,
      "Impresa di autotrasporto": c.isTransportOperator ? "SI" : "NO",
      "N° Albo": c.alboNumber || "—",
      "Capacità richiesta (€)": cap ? cap.required : "—",
      "Capacità attestata (€)": cap ? cap.declared : "—",
      "Stato capacità": cap ? capacityStatusMeta[cap.status].label : "—",
    };
  });
  return (
    <div>
      <SectionTitle
        title="Società & Gruppo" sub="Anagrafica società, ruoli, flotta di competenza e requisito di capacità finanziaria"
        action={<ExportButton rows={exportRows} filename="societa_gruppo" sheetName="Società" />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {companyList.map(c => {
          const count = vehicleList.filter(v => v.company === c.id).length;
          const cap = c.isTransportOperator ? computeFinancialCapacity(c, vehicleList, CAPACITY_DEFAULTS) : null;
          const m = cap ? capacityStatusMeta[cap.status] : null;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold" style={{ color: NAVY_700 }}>{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><MapPin size={12} />{c.city}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: GOLD_300, color: NAVY_800 }}>{c.role}</span>
              </div>
              <p className="text-2xl font-bold mt-4" style={{ color: NAVY_700 }}>{count}</p>
              <p className="text-xs text-slate-400">veicoli in flotta</p>

              {cap && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Capacità finanziaria · Albo {c.alboNumber}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: m.color, backgroundColor: m.bg }}>{m.label}</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    richiesta <strong>€ {cap.required.toLocaleString("it-IT")}</strong> su
                    <strong> € {cap.declared.toLocaleString("it-IT")}</strong> attestati
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TrasferimentiView({ vehicleList, onTransfer }) {
  const exportRows = vehicleList.map(v => ({
    "Targa": v.plate, "Società attuale": companyName(v.company), "Centro di costo": v.costCenter,
    "Disponibilità": availabilityLabel[v.availability],
  }));

  const columns = [
    { key: "plate", label: "Targa" },
    { key: "company", label: "Società attuale", accessor: v => companyName(v.company), filterType: "select", options: LIVE.companies.map(c => c.name) },
    { key: "costCenter", label: "Centro di costo" },
    { key: "availability", label: "Disponibilità", accessor: v => availabilityLabel[v.availability], filterType: "select", options: Object.values(availabilityLabel) },
    { key: "_action", label: "", sortable: false, filterable: false, render: v => (
      <button
        onClick={() => onTransfer(v)}
        className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg border transition hover:bg-slate-50"
        style={{ borderColor: NAVY_700, color: NAVY_700 }}
      >
        <ArrowLeftRight size={13} /> Trasferisci
      </button>
    )},
  ];

  return (
    <div>
      <SectionTitle
        title="Assegnazioni & Trasferimenti" sub="Relazioni temporali veicolo ↔ società — trasferimento infragruppo in un click"
        action={<ExportButton rows={exportRows} filename="assegnazioni_trasferimenti" sheetName="Assegnazioni" />}
      />
      <Card>
        <DataTable columns={columns} data={vehicleList} />
      </Card>
    </div>
  );
}

const MAINT_STAGES = ["richiesta", "preventivata", "autorizzata", "in_corso", "completata", "fatturata"];
const maintStageMeta = {
  richiesta:    { label: "Richiesta",    color: "#6B7280" },
  preventivata: { label: "Preventivata", color: "#B07A12" },
  autorizzata:  { label: "Autorizzata",  color: "#8B5CF6" },
  in_corso:     { label: "In corso",     color: "#1B6DB0" },
  completata:   { label: "Completata",   color: "#2E7D5B" },
  fatturata:    { label: "Fatturata",    color: "#12596B" },
};

const CLAIM_STAGES = ["aperto", "attesa_perizia", "in_riparazione", "liquidato", "chiuso"];
const claimStageMeta = {
  aperto:         { label: "Aperto",          color: "#B4302E" },
  attesa_perizia: { label: "Attesa perizia",  color: "#B07A12" },
  in_riparazione: { label: "In riparazione",  color: "#1B6DB0" },
  liquidato:      { label: "Liquidato",       color: "#2E7D5B" },
  chiuso:         { label: "Chiuso",          color: "#12596B" },
};

const CONTRACT_FORM_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "contractNumber", label: "N° contratto" },
  { key: "type", label: "Tipo", type: "select", required: true, options: ["noleggio", "leasing", "finanziamento", "acquisto"] },
  { key: "supplier", label: "Fornitore", required: true },
  { key: "start", label: "Decorrenza", type: "date" },
  { key: "end", label: "Scadenza", type: "date", required: true },
  { key: "durationMonths", label: "Durata (mesi)", type: "number" },
  { key: "fee", label: "Canone mensile (€)", type: "number", required: true },
  { key: "includedKm", label: "Km inclusi", type: "number" },
  { key: "kmOverageRate", label: "Tariffa km eccedenti (€)", type: "number" },
  { key: "deposit", label: "Deposito cauzionale (€)", type: "number" },
  { key: "noticePeriodDays", label: "Preavviso (giorni)", type: "number" },
  { key: "status", label: "Stato", type: "select", default: "attivo", options: ["attivo", "in_rinnovo", "scaduto", "chiuso"] },
  { key: "returnConditions", label: "Condizioni di riconsegna", span: 2 },
  { key: "notes", label: "Note", span: 2 },
];

// ---------------------------------------------------------------------------
// GANTT CONTRATTI — timeline delle scadenze e incastri fra contratti
// ---------------------------------------------------------------------------
// Per ogni veicolo i contratti sono ordinati nel tempo: fra due contratti
// consecutivi il sistema evidenzia una SCOPERTURA (giorni senza contratto,
// il mezzo resterebbe in flotta senza titolo) o una SOVRAPPOSIZIONE (giorni
// pagati due volte). Sono i due casi che il fleet manager deve intercettare
// prima che si verifichino.
function analyseContractChain(contractsForVehicle) {
  const sorted = [...contractsForVehicle].sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i], nxt = sorted[i + 1];
    if (!cur.end || !nxt.start) continue;
    const delta = daysBetween(cur.end, nxt.start);
    if (delta > 1) gaps.push({ type: "scopertura", days: delta - 1, from: cur, to: nxt });
    else if (delta < 0) gaps.push({ type: "sovrapposizione", days: Math.abs(delta), from: cur, to: nxt });
    else gaps.push({ type: "contiguo", days: 0, from: cur, to: nxt });
  }
  return { sorted, gaps };
}

function ContractGantt({ list }) {
  const [monthsAhead, setMonthsAhead] = useState(24);

  const dated = list.filter(c => c.start && c.end);
  if (dated.length === 0) return <Card className="p-8 text-center text-sm text-slate-400">Nessun contratto con date valorizzate.</Card>;

  const today = new Date(TODAY);
  const rangeStart = new Date(Math.min(...dated.map(c => new Date(c.start).getTime()), today.getTime()));
  const horizonEnd = new Date(today); horizonEnd.setMonth(horizonEnd.getMonth() + monthsAhead);
  const rangeEnd = new Date(Math.max(...dated.map(c => new Date(c.end).getTime()), horizonEnd.getTime()));
  const span = rangeEnd - rangeStart;
  const pct = (d) => Math.max(0, Math.min(100, ((new Date(d) - rangeStart) / span) * 100));

  // Tacche annuali sull'asse
  const ticks = [];
  for (let y = rangeStart.getFullYear(); y <= rangeEnd.getFullYear(); y++) {
    const d = `${y}-01-01`;
    if (new Date(d) >= rangeStart && new Date(d) <= rangeEnd) ticks.push({ label: y, left: pct(d) });
  }

  const byVehicle = [...new Set(dated.map(c => c.vehicle))].sort().map(v => ({
    vehicle: v, ...analyseContractChain(dated.filter(c => c.vehicle === v)),
  }));

  const typeColor = { noleggio: "#1B6DB0", leasing: "#8B5CF6", finanziamento: "#B07A12", acquisto: "#2E7D5B" };
  const allGaps = byVehicle.flatMap(v => v.gaps.filter(g => g.type !== "contiguo").map(g => ({ ...g, vehicle: v.vehicle })));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500">Orizzonte:</span>
        {[12, 24, 48].map(m => (
          <button key={m} onClick={() => setMonthsAhead(m)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
            style={monthsAhead === m ? { backgroundColor: NAVY_700, color: "#fff", borderColor: NAVY_700 } : { color: "#64748b", borderColor: "#e2e8f0" }}>
            {m} mesi
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          {Object.entries(typeColor).map(([t, c]) => (
            <span key={t} className="flex items-center gap-1 capitalize">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />{t}
            </span>
          ))}
        </div>
      </div>

      {allGaps.length > 0 && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-4" style={{ backgroundColor: "#FBF1DC" }}>
          <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" style={{ color: "#B07A12" }} />
          <div style={{ color: "#7A5C0E" }}>
            <p className="font-semibold mb-1">Incastri da sistemare</p>
            <ul className="text-xs space-y-0.5">
              {allGaps.map((g, i) => (
                <li key={i}>
                  <strong>{g.vehicle}</strong>: {g.type === "scopertura"
                    ? `${g.days} giorni senza contratto fra ${g.from.supplier} (fine ${g.from.end}) e ${g.to.supplier} (inizio ${g.to.start})`
                    : `${g.days} giorni di sovrapposizione fra ${g.from.supplier} e ${g.to.supplier} — doppio canone`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Card className="p-5 overflow-x-auto">
        {/* Asse temporale */}
        <div className="relative h-5 mb-2 ml-28 border-b border-slate-200">
          {ticks.map(t => (
            <span key={t.label} className="absolute text-xs text-slate-400" style={{ left: `${t.left}%` }}>{t.label}</span>
          ))}
          <span className="absolute -top-0.5 text-xs font-semibold px-1 rounded"
            style={{ left: `${pct(TODAY)}%`, color: "#B4302E", backgroundColor: "#FBEAEA" }}>oggi</span>
        </div>

        <div className="space-y-1.5">
          {byVehicle.map(v => (
            <div key={v.vehicle} className="flex items-center">
              <span className="w-28 flex-shrink-0 text-xs font-semibold text-slate-700">{v.vehicle}</span>
              <div className="relative flex-1 h-8 rounded" style={{ backgroundColor: "#F8FAFC" }}>
                {/* linea oggi */}
                <span className="absolute top-0 bottom-0 w-px" style={{ left: `${pct(TODAY)}%`, backgroundColor: "#B4302E" }} />
                {/* scoperture / sovrapposizioni */}
                {v.gaps.filter(g => g.type === "scopertura").map((g, i) => (
                  <span key={`gap${i}`} className="absolute top-1 bottom-1 rounded"
                    style={{
                      left: `${pct(g.from.end)}%`, width: `${Math.max(0.4, pct(g.to.start) - pct(g.from.end))}%`,
                      backgroundColor: "#FBEAEA", border: "1px dashed #B4302E",
                    }}
                    title={`Scopertura di ${g.days} giorni`} />
                ))}
                {/* barre contratti */}
                {v.sorted.map(c => {
                  const left = pct(c.start), width = Math.max(0.6, pct(c.end) - pct(c.start));
                  const daysLeft = daysBetween(TODAY, c.end);
                  const expiring = daysLeft >= 0 && daysLeft <= 90;
                  return (
                    <div key={c.id} className="absolute top-1 bottom-1 rounded flex items-center px-1.5 overflow-hidden"
                      style={{
                        left: `${left}%`, width: `${width}%`,
                        backgroundColor: typeColor[c.type] || "#64748B",
                        opacity: c.status === "bozza" ? 0.45 : 1,
                        border: expiring ? "2px solid #B4302E" : "none",
                      }}
                      title={`${c.supplier} · ${c.type} · ${c.start} → ${c.end}${c.status === "bozza" ? " (bozza)" : ""}${expiring ? ` · scade fra ${daysLeft} giorni` : ""}`}>
                      <span className="text-xs text-white font-medium truncate">{c.supplier}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm border-2" style={{ borderColor: "#B4302E" }} /> in scadenza entro 90 giorni</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#FBEAEA", border: "1px dashed #B4302E" }} /> scopertura contrattuale</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm opacity-45" style={{ backgroundColor: "#1B6DB0" }} /> contratto in bozza</span>
        </div>
      </Card>
    </div>
  );
}

function ContrattiView({ list, setList }) {
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("elenco");
  const crud = useCrudModals(setList, "Contratti", c => `${c.vehicle} — ${c.type} (${c.supplier})`);

  const exportRows = list.map(c => ({
    "Targa": c.vehicle, "Tipo": c.type, "Fornitore": c.supplier, "Canone mensile": c.fee,
    "Scadenza": c.end, "Stato": c.status,
  }));

  const columns = [
    { key: "vehicle", label: "Targa" },
    { key: "type", label: "Tipo", filterType: "select", options: ["noleggio", "leasing", "finanziamento", "acquisto"], render: c => <span className="capitalize">{c.type}</span> },
    { key: "supplier", label: "Fornitore" },
    { key: "fee", label: "Canone", render: c => `€ ${c.fee}/mese` },
    { key: "end", label: "Scadenza" },
    { key: "status", label: "Stato", filterType: "select", options: ["attivo", "in_rinnovo", "scaduto", "chiuso"], render: c => (
      <span className="text-xs font-semibold px-2 py-1 rounded-full"
        style={{ color: c.status === "attivo" ? "#2E7D5B" : "#B07A12", backgroundColor: c.status === "attivo" ? "#E7F5EE" : "#FBF1DC" }}>
        {c.status === "attivo" ? "Attivo" : c.status === "in_rinnovo" ? "In rinnovo" : c.status}
      </span>
    )},
    { key: "_actions", label: "", sortable: false, filterable: false, render: c => <RowActions entity={{ type: "contratto", id: c.id, label: `Contratto ${c.vehicle} — ${c.supplier}` }} onEdit={() => crud.requestEdit(c)} onDelete={() => crud.requestDelete(c)} /> },
  ];

  return (
    <div>
      <SectionTitle
        title="Contratti" sub="Noleggio, leasing, finanziamento, acquisto"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="contratti" sheetName="Contratti" />
            <NewRecordButton label="Nuovo contratto" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "elenco", label: "Elenco" }, { id: "gantt", label: "Gantt scadenze" }].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={view === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {view === "gantt" ? <ContractGantt list={list} /> : (
        <Card>
          <DataTable columns={columns} data={list} />
        </Card>
      )}

      {crud.editing && (
        <SimpleFormModal
          title={`Modifica contratto — ${crud.editing.vehicle}`} fields={CONTRACT_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f, fee: parseFloat(f.fee) || 0 })}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`il contratto ${crud.deleting.vehicle} — ${crud.deleting.supplier}`} moduleLabel="Contratti"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}

      {showForm && (
        <SimpleFormModal
          title="Nuovo contratto" fields={CONTRACT_FORM_FIELDS} submitLabel="Aggiungi contratto"
          onClose={() => setShowForm(false)}
          onSave={(f) => { setList(prev => [{ id: `c${Date.now()}`, ...f, fee: parseFloat(f.fee) || 0 }, ...prev]); setShowForm(false); }}
        />
      )}
    </div>
  );
}

const SUBRENTAL_FORM_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "granting", label: "Concedente", type: "select", required: true, get options() { return LIVE.companies.map(c => ({ value: c.id, label: c.name })); } },
  { key: "using", label: "Società locataria", type: "select", required: true, get options() { return LIVE.companies.map(c => ({ value: c.id, label: c.name })); } },
  { key: "start", label: "Inizio", type: "date", required: true },
  { key: "end", label: "Fine", type: "date" },
  { key: "fee", label: "Canone mensile (€)", type: "number", required: true },
  { key: "vehicleCost", label: "Costo veicolo (€)", type: "number", required: true },
  { key: "deductibleRCA", label: "Franchigia RCA (€)", type: "number" },
  { key: "damagePenalty", label: "Penale danni (€)", type: "number" },
  { key: "theftMode", label: "Furto — modalità", type: "select", options: [{ value: "percentuale", label: "% sul valore" }, { value: "importo", label: "Importo fisso" }] },
  { key: "theftValue", label: "Furto — valore", type: "number" },
];

function SubnoleggioView({ list, setList, vehicleList }) {
  const [sortBy, setSortBy] = useState("margine");
  const [showForm, setShowForm] = useState(false);
  const [contractFor, setContractFor] = useState(null);
  const crud = useCrudModals(setList, "Subnoleggio", sr => `${sr.vehicle} — ${companyName(sr.using)}`);

  const exportRows = list.map(sr => {
    const margin = sr.fee - sr.vehicleCost;
    return {
      "Targa": sr.vehicle, "Concedente": companyName(sr.granting), "Utilizzatrice": companyName(sr.using),
      "Inizio": sr.start, "Fine": sr.end, "Canone": sr.fee, "Costo veicolo": sr.vehicleCost,
      "Margine": margin, "Margine %": ((margin / sr.fee) * 100).toFixed(1), "Stato": sr.status,
      "Franchigia RCA": sr.deductibleRCA ?? "", "Penale danni": sr.damagePenalty ?? "",
      "Furto": sr.theftMode === "importo" ? `€ ${sr.theftValue}` : sr.theftValue != null ? `${sr.theftValue}%` : "",
    };
  });

  const sorted = [...list].sort((a, b) => {
    if (sortBy === "margine") return (b.fee - b.vehicleCost) - (a.fee - a.vehicleCost);
    if (sortBy === "canone") return b.fee - a.fee;
    return a.vehicle.localeCompare(b.vehicle);
  });

  return (
    <div>
      <SectionTitle
        title="Subnoleggio" sub="Redditività per contratto — ricavi meno costi del veicolo nel periodo"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="subnoleggio" sheetName="Subnoleggio" />
            <NewRecordButton label="Nuovo subnoleggio" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500">Ordina per:</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white">
          <option value="margine">Margine (decrescente)</option>
          <option value="canone">Canone (decrescente)</option>
          <option value="targa">Targa (A-Z)</option>
        </select>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {sorted.map(sr => {
          const margin = sr.fee - sr.vehicleCost;
          const marginPct = ((margin / sr.fee) * 100).toFixed(1);
          return (
            <Card key={sr.id} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold" style={{ color: NAVY_700 }}>{sr.vehicle}</h3>
                  <p className="text-xs text-slate-400">{companyName(sr.granting)} → {companyName(sr.using)} · {sr.start} – {sr.end || "in corso"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>Attivo</span>
                  <button onClick={() => setContractFor(sr)} title="Genera contratto di noleggio"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
                    style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                    <FileSignature size={13} /> Contratto
                  </button>
                  <RowActions entity={{ type: "subnoleggio", id: sr.id, label: `Subnoleggio ${sr.vehicle}` }} onEdit={() => crud.requestEdit(sr)} onDelete={() => crud.requestDelete(sr)} />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <div><p className="text-xs text-slate-400 mb-1">Ricavo subnoleggio</p><p className="text-lg font-bold text-slate-700">€ {sr.fee.toLocaleString("it-IT")}</p></div>
                <div><p className="text-xs text-slate-400 mb-1">Costo veicolo</p><p className="text-lg font-bold text-slate-700">€ {sr.vehicleCost.toLocaleString("it-IT")}</p></div>
                <div><p className="text-xs text-slate-400 mb-1">Margine</p><p className="text-lg font-bold" style={{ color: margin >= 0 ? "#2E7D5B" : "#B4302E" }}>€ {margin.toLocaleString("it-IT")}</p></div>
                <div><p className="text-xs text-slate-400 mb-1">Margine %</p><p className="text-lg font-bold" style={{ color: margin >= 0 ? "#2E7D5B" : "#B4302E" }}>{marginPct}%</p></div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>Franchigia RCA: <strong className="text-slate-700">€ {(sr.deductibleRCA ?? 0).toLocaleString("it-IT")}</strong></span>
                <span>Penale danni: <strong className="text-slate-700">€ {(sr.damagePenalty ?? 0).toLocaleString("it-IT")}</strong></span>
                <span>Furto: <strong className="text-slate-700">{sr.theftMode === "importo" ? `€ ${(sr.theftValue ?? 0).toLocaleString("it-IT")}` : `${sr.theftValue ?? 0}%`}</strong></span>
              </div>
            </Card>
          );
        })}
      </div>

      {crud.editing && (
        <SimpleFormModal
          title={`Modifica subnoleggio — ${crud.editing.vehicle}`} fields={SUBRENTAL_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f, fee: parseFloat(f.fee) || 0, vehicleCost: parseFloat(f.vehicleCost) || 0 })}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`il subnoleggio ${crud.deleting.vehicle} — ${companyName(crud.deleting.using)}`} moduleLabel="Subnoleggio"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}

      {showForm && (
        <SimpleFormModal
          title="Nuovo subnoleggio" fields={SUBRENTAL_FORM_FIELDS} submitLabel="Aggiungi subnoleggio"
          onClose={() => setShowForm(false)}
          onSave={(f) => {
            const creato = { id: `sr${Date.now()}`, ...f, fee: parseFloat(f.fee) || 0, vehicleCost: parseFloat(f.vehicleCost) || 0, status: "attivo" };
            setList(prev => [creato, ...prev]);
            setShowForm(false);
            setContractFor(creato);          // nuovo contratto: propone subito la stampa
          }}
        />
      )}
      {contractFor && (
        <ContractPrintModal subRental={contractFor} vehicleList={vehicleList} onClose={() => setContractFor(null)} />
      )}
    </div>
  );
}

const DEADLINE_FORM_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "type", label: "Tipo scadenza", required: true, type: "select",
    options: ["Assicurazione RCA", "Kasko", "Revisione", "Bollo", "Tagliando", "Pneumatici", "Tachigrafo", "Telepass", "Carta carburante"] },
  { key: "due", label: "Data scadenza", type: "date", required: true },
  { key: "reference", label: "Riferimento / n° documento" },
  { key: "amount", label: "Importo previsto (€)", type: "number" },
  { key: "notes", label: "Note", span: 2 },
];

function ScadenzeView({ list, setList }) {
  const [showForm, setShowForm] = useState(false);
  const crud = useCrudModals(setList, "Scadenze & Compliance", d => `${d.vehicle} — ${d.type} (${d.due})`);

  const withDays = list.map(d => ({ ...d, days: Math.round((new Date(d.due) - new Date(localISODate())) / 86400000) }));

  const exportRows = withDays.map(d => ({
    "Targa": d.vehicle, "Tipo scadenza": d.type, "Data scadenza": d.due, "Giorni residui": d.days,
  }));

  const columns = [
    { key: "vehicle", label: "Targa" },
    { key: "type", label: "Tipo", filterType: "select", options: [...new Set(LIVE.deadlines.map(d => d.type))] },
    { key: "due", label: "Scadenza", render: d => (<span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" />{d.due}</span>) },
    { key: "days", label: "Giorni residui", render: d => (
      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: d.days <= 15 ? "#B4302E" : d.days <= 30 ? "#B07A12" : "#2E7D5B", backgroundColor: d.days <= 15 ? "#FBEAEA" : d.days <= 30 ? "#FBF1DC" : "#E7F5EE" }}>
        {d.days} giorni
      </span>
    )},
    { key: "_actions", label: "", sortable: false, filterable: false, render: d => <RowActions entity={{ type: "scadenza", id: d.id, label: `${d.vehicle} — ${d.type}` }} onEdit={() => crud.requestEdit(d)} onDelete={() => crud.requestDelete(d)} /> },
  ];

  return (
    <div>
      <SectionTitle
        title="Scadenze & Compliance" sub="Motore scadenze — soglie di alert 90/60/30/15/7/1 giorni"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="scadenze_compliance" sheetName="Scadenze" />
            <NewRecordButton label="Nuova scadenza" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      <Card>
        <DataTable columns={columns} data={withDays} />
      </Card>

      {crud.editing && (
        <SimpleFormModal
          title={`Modifica scadenza — ${crud.editing.vehicle}`} fields={DEADLINE_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit} onSave={crud.confirmEdit}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`la scadenza ${crud.deleting.type} di ${crud.deleting.vehicle}`} moduleLabel="Scadenze & Compliance"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}

      {showForm && (
        <SimpleFormModal
          title="Nuova scadenza" fields={DEADLINE_FORM_FIELDS} submitLabel="Aggiungi scadenza"
          onClose={() => setShowForm(false)}
          onSave={(f) => { setList(prev => [{ id: `d${Date.now()}`, ...f }, ...prev]); setShowForm(false); }}
        />
      )}
    </div>
  );
}

const MAINTENANCE_FORM_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "type", label: "Tipo", type: "select", required: true, options: ["ordinaria", "straordinaria", "programmata"] },
  { key: "workshop", label: "Officina", required: true },
  { key: "scheduled", label: "Data intervento", type: "date", required: true },
  { key: "km", label: "Km all'intervento", type: "number" },
  { key: "laborCost", label: "Manodopera (€)", type: "number" },
  { key: "partsCost", label: "Ricambi (€)", type: "number" },
  { key: "cost", label: "Costo totale (€)", type: "number" },
  { key: "downtimeHours", label: "Ore di fermo", type: "number" },
  { key: "quoteNumber", label: "N° preventivo" },
  { key: "quoteDate", label: "Data preventivo", type: "date" },
  { key: "quoteAmount", label: "Importo preventivo (€)", type: "number" },
  { key: "quoteStatus", label: "Stato preventivo", type: "select",
    options: ["da_richiedere", "ricevuto", "approvato", "respinto"] },
  { key: "invoiceNumber", label: "N° fattura acquisto" },
  { key: "invoiceDate", label: "Data fattura", type: "date" },
  { key: "invoiceAmount", label: "Importo fattura (€)", type: "number" },
  { key: "warrantyCovered", label: "In garanzia", type: "select", options: ["No", "Sì"] },
  { key: "status", label: "Stato", type: "select", default: "richiesta",
    options: ["richiesta", "preventivata", "autorizzata", "in_corso", "completata", "fatturata"] },
  { key: "notes", label: "Note", span: 2 },
];

function ManutenzioneView({ list, setList, stockMoves = [], partList = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("pipeline");
  const crud = useCrudModals(setList, "Manutenzione", m => `${m.vehicle} — ${m.type} (${m.workshop})`);
  const pipe = usePipeline(setList);

  const exportRows = list.map(m => ({
    "Targa": m.vehicle, "Tipo": m.type, "Officina": m.workshop, "Data": m.scheduled,
    "Costo": m.cost || "", "Stato": m.status,
  }));

  const columns = [
    { key: "vehicle", label: "Targa" },
    { key: "type", label: "Tipo", filterType: "select", options: ["ordinaria", "straordinaria", "programmata"], render: m => <span className="capitalize">{m.type}</span> },
    { key: "workshop", label: "Officina" },
    { key: "scheduled", label: "Data" },
    { key: "cost", label: "Costo", render: m => m.cost ? `€ ${fmtNumber(m.cost, 2)}` : "—" },
    { key: "quoteNumber", label: "Preventivo", accessor: m => m.quoteNumber || "", render: m => m.quoteNumber ? (
      <>{m.quoteNumber}<span className="block text-xs text-slate-400 font-normal">
        {m.quoteAmount ? `€ ${fmtNumber(m.quoteAmount, 2)}` : ""}{m.quoteStatus ? ` · ${m.quoteStatus.replace("_", " ")}` : ""}
      </span></>
    ) : <span className="text-slate-300">—</span> },
    { key: "invoiceNumber", label: "Fattura", accessor: m => m.invoiceNumber || "", render: m => m.invoiceNumber ? (
      <>{m.invoiceNumber}<span className="block text-xs text-slate-400 font-normal">
        {m.invoiceAmount ? `€ ${fmtNumber(m.invoiceAmount, 2)}` : ""}
      </span></>
    ) : <span className="text-slate-300">—</span> },
    { key: "status", label: "Stato", filterType: "select", options: [...new Set(LIVE.maintenance.map(m => m.status))], render: m => <span className="capitalize">{m.status.replace("_", " ")}</span> },
    { key: "_actions", label: "", sortable: false, filterable: false, render: m => <RowActions entity={{ type: "manutenzione", id: m.id, label: `${m.vehicle} — ${m.workshop}` }} onEdit={() => crud.requestEdit(m)} onDelete={() => crud.requestDelete(m)} /> },
  ];

  return (
    <div>
      <SectionTitle
        title="Manutenzione" sub="Ordinaria, straordinaria e programmata"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="manutenzione" sheetName="Manutenzione" />
            <NewRecordButton label="Nuovo intervento" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "pipeline", label: "Pipeline lavorazioni" }, { id: "elenco", label: "Elenco" }].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={view === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {view === "pipeline" ? (
        <>
          <p className="text-xs text-slate-400 mb-3">
            Trascina una scheda da una colonna all'altra — con il mouse o con il dito su tablet e telefono — per far avanzare o riportare indietro i lavori:
            a ogni spostamento si apre la scheda per registrare la nota che motiva il passaggio. Tocca una scheda per consultare il diario e aggiungere note.
          </p>
          <KanbanBoard
            items={list} stages={MAINT_STAGES} stageMeta={maintStageMeta}
            onMove={pipe.requestMove} onOpen={pipe.setOpened}
            renderCard={m => (
              <>
                <p className="text-sm font-semibold text-slate-800">{m.vehicle}</p>
                <p className="text-xs text-slate-500 capitalize">{m.type} · {m.workshop}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-slate-400">{m.scheduled}</span>
                  {m.cost != null && <span className="text-xs font-semibold" style={{ color: NAVY_700 }}>€ {m.cost.toLocaleString("it-IT")}</span>}
                </div>
              </>
            )}
          />
        </>
      ) : (
        <Card>
          <DataTable columns={columns} data={list} />
        </Card>
      )}

      {(() => {
        const scostamenti = list.filter(m => m.quoteAmount && m.cost && m.cost > m.quoteAmount * 1.1);
        return scostamenti.length > 0 ? (
          <div className="flex gap-2.5 rounded-lg p-4 text-sm mt-5" style={{ backgroundColor: "#FBF1DC" }}>
            <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" style={{ color: "#B07A12" }} />
            <div style={{ color: "#7A5C0E" }}>
              <p className="font-semibold mb-1">Interventi oltre il preventivo</p>
              <ul className="text-xs space-y-0.5">
                {scostamenti.map(m => (
                  <li key={m.id}>
                    <strong>{m.vehicle}</strong> ({m.workshop}): preventivo € {fmtNumber(m.quoteAmount, 2)},
                    consuntivo € {fmtNumber(m.cost, 2)} — scostamento
                    {" "}+{fmtNumber(((m.cost - m.quoteAmount) / m.quoteAmount) * 100, 1)}%
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null;
      })()}

      {pipe.pendingMove && (
        <UpdateNoteModal
          title={`${pipe.pendingMove.item.vehicle} — avanzamento lavori`}
          subtitle={`${pipe.pendingMove.item.type} presso ${pipe.pendingMove.item.workshop}`}
          from={pipe.pendingMove.item.status} to={pipe.pendingMove.to} stageMeta={maintStageMeta}
          onClose={() => pipe.setPendingMove(null)} onConfirm={pipe.confirmMove}
        />
      )}
      {pipe.opened && (
        <RecordTimelineModal
          record={list.find(r => r.id === pipe.opened.id) || pipe.opened}
          stageMeta={maintStageMeta} title="INTERVENTO DI MANUTENZIONE" entityType="manutenzione"
          fields={[
            { label: "Tipo", value: r => r.type },
            { label: "Officina", value: r => r.workshop },
            { label: "Data", value: r => r.scheduled },
            { label: "Costo", value: r => r.cost != null ? `€ ${fmtNumber(r.cost, 2)}` : "—" },
            { label: "Preventivo", value: r => r.quoteNumber
              ? `${r.quoteNumber} · € ${fmtNumber(r.quoteAmount || 0, 2)} · ${(r.quoteStatus || "").replace("_", " ")}` : "—" },
            { label: "Fattura acquisto", value: r => r.invoiceNumber
              ? `${r.invoiceNumber} · € ${fmtNumber(r.invoiceAmount || 0, 2)}` : "—" },
            { label: "Ricambi impiegati", value: r => {
              const used = stockMoves.filter(m => m.intervention === r.id && m.type === "scarico");
              if (!used.length) return "nessuno";
              const tot = used.reduce((t, m) => t + m.qty * (m.unitCost || 0), 0);
              return `${used.length} articoli · € ${fmtNumber(tot, 2)}`;
            } },
            { label: "Dettaglio ricambi", value: r => {
              const used = stockMoves.filter(m => m.intervention === r.id && m.type === "scarico");
              if (!used.length) return "—";
              return used.map(m => {
                const p = partList.find(x => x.id === m.part);
                return `${fmtNumber(m.qty)} × ${p ? p.description : m.part}`;
              }).join(" · ");
            } },
          ]}
          onClose={() => pipe.setOpened(null)}
          onAddNote={(text) => pipe.addNote(pipe.opened, text)}
          onEdit={crud.requestEdit} onDelete={crud.requestDelete}
        />
      )}

      {crud.editing && (
        <SimpleFormModal
          title={`Modifica intervento — ${crud.editing.vehicle}`} fields={MAINTENANCE_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f, cost: f.cost ? parseFloat(f.cost) : null })}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`l'intervento su ${crud.deleting.vehicle} (${crud.deleting.workshop})`} moduleLabel="Manutenzione"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}

      {showForm && (
        <SimpleFormModal
          title="Nuovo intervento di manutenzione" fields={MAINTENANCE_FORM_FIELDS} submitLabel="Aggiungi intervento"
          onClose={() => setShowForm(false)}
          onSave={(f) => { setList(prev => [{ id: `m${Date.now()}`, ...f, cost: f.cost ? parseFloat(f.cost) : null }, ...prev]); setShowForm(false); }}
        />
      )}
    </div>
  );
}

const TIRE_FORM_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "position", label: "Posizione", type: "select", required: true, options: ["Ant. Sx", "Ant. Dx", "Post. Sx", "Post. Dx"] },
  { key: "make", label: "Marca" },
  { key: "model", label: "Modello" },
  { key: "size", label: "Misura", required: true, placeholder: "es. 205/55 R16" },
  { key: "dot", label: "Codice DOT" },
  { key: "seasonality", label: "Stagionalità", type: "select", options: ["estivo", "invernale", "quattro_stagioni"] },
  { key: "tread", label: "Battistrada", placeholder: "es. 6.0 mm" },
  { key: "pressure", label: "Pressione (bar)", type: "number" },
  { key: "mountedKm", label: "Km al montaggio", type: "number" },
  { key: "cost", label: "Costo (€)", type: "number" },
  { key: "status", label: "Stato", type: "select", default: "Montato", options: ["Montato", "Da sostituire"] },
];

function PneumaticiView() {
  const [list, setList] = usePersistentState("tires", []);
  const [showForm, setShowForm] = useState(false);
  const crud = useCrudModals(setList, "Pneumatici", r => `${r.vehicle} — ${r.position} (${r.size})`);

  const exportRows = list.map(r => ({
    "Targa": r.vehicle, "Posizione": r.position, "Misura": r.size, "Battistrada": r.tread, "Stato": r.status,
  }));

  const columns = [
    { key: "vehicle", label: "Targa" },
    { key: "position", label: "Posizione", filterType: "select", options: ["Ant. Sx", "Ant. Dx", "Post. Sx", "Post. Dx"] },
    { key: "size", label: "Misura" },
    { key: "tread", label: "Battistrada" },
    { key: "status", label: "Stato", filterType: "select", options: ["Montato", "Da sostituire"], render: r => (
      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: r.status === "Montato" ? "#2E7D5B" : "#B4302E", backgroundColor: r.status === "Montato" ? "#E7F5EE" : "#FBEAEA" }}>{r.status}</span>
    )},
    { key: "_actions", label: "", sortable: false, filterable: false, render: r => <RowActions entity={{ type: "pneumatico", id: r.id, label: `${r.vehicle} — ${r.position}` }} onEdit={() => crud.requestEdit(r)} onDelete={() => crud.requestDelete(r)} /> },
  ];

  return (
    <div>
      <SectionTitle
        title="Pneumatici" sub="Storico montaggio per posizione"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="pneumatici" sheetName="Pneumatici" />
            <NewRecordButton label="Nuovo pneumatico" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      <Card>
        <DataTable columns={columns} data={list} />
      </Card>

      {crud.editing && (
        <SimpleFormModal
          title={`Modifica pneumatico — ${crud.editing.vehicle}`} fields={TIRE_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit} onSave={crud.confirmEdit}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`il pneumatico ${crud.deleting.position} di ${crud.deleting.vehicle}`} moduleLabel="Pneumatici"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}

      {showForm && (
        <SimpleFormModal
          title="Nuovo montaggio pneumatico" fields={TIRE_FORM_FIELDS} submitLabel="Aggiungi"
          onClose={() => setShowForm(false)}
          onSave={(f) => { setList(prev => [{ id: `tm${Date.now()}`, ...f }, ...prev]); setShowForm(false); }}
        />
      )}
    </div>
  );
}

const CLAIM_FORM_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "date", label: "Data evento", type: "date", required: true },
  { key: "time", label: "Ora evento" },
  { key: "location", label: "Luogo", span: 2 },
  { key: "driver", label: "Conducente" },
  { key: "counterpart", label: "Controparte" },
  { key: "counterpartPlate", label: "Targa controparte" },
  { key: "liability", label: "Responsabilità", type: "select",
    options: ["nostra", "controparte", "concorsuale", "da_determinare"] },
  { key: "dynamics", label: "Dinamica", span: 2 },
  { key: "cidNumber", label: "N° CID" },
  { key: "insuranceCompany", label: "Compagnia assicurativa" },
  { key: "policyNumber", label: "N° polizza" },
  { key: "claimNumber", label: "N° sinistro" },
  { key: "bodyShop", label: "Carrozzeria" },
  { key: "deductible", label: "Franchigia (€)", type: "number" },
  { key: "damage", label: "Danno stimato (€)", type: "number", required: true },
  { key: "settledDamage", label: "Danno liquidato (€)", type: "number" },
  { key: "status", label: "Stato", type: "select", default: "aperto",
    options: ["aperto", "attesa_perizia", "in_riparazione", "liquidato"] },
  { key: "notes", label: "Note", span: 2 },
];

function SinistriView({ list, setList }) {
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("pipeline");
  const crud = useCrudModals(setList, "Sinistri", c => `${c.vehicle} — ${c.date}`);
  const pipe = usePipeline(setList);

  const exportRows = list.map(c => ({
    "Targa": c.vehicle, "Data": c.date, "Conducente": c.driver, "Danno stimato": c.damage, "Stato": c.status,
  }));

  const columns = [
    { key: "vehicle", label: "Targa" },
    { key: "date", label: "Data" },
    { key: "driver", label: "Conducente" },
    { key: "damage", label: "Danno stimato", render: c => `€ ${c.damage.toLocaleString("it-IT")}` },
    { key: "status", label: "Stato", filterType: "select", options: [...new Set(LIVE.claims.map(c => c.status))], render: c => <span className="capitalize">{c.status.replace("_", " ")}</span> },
    { key: "_actions", label: "", sortable: false, filterable: false, render: c => <RowActions entity={{ type: "sinistro", id: c.id, label: `Sinistro ${c.vehicle} — ${c.date}` }} onEdit={() => crud.requestEdit(c)} onDelete={() => crud.requestDelete(c)} /> },
  ];

  return (
    <div>
      <SectionTitle
        title="Sinistri" sub="Evento, assicurazione, costi"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="sinistri" sheetName="Sinistri" />
            <NewRecordButton label="Nuovo sinistro" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "pipeline", label: "Pipeline gestione" }, { id: "elenco", label: "Elenco" }].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={view === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {view === "pipeline" ? (
        <>
          <p className="text-xs text-slate-400 mb-3">
            Trascina una scheda — con il mouse o con il dito — per far avanzare o riportare indietro la gestione del sinistro:
            a ogni passaggio di stato si apre la scheda per registrare la nota di aggiornamento. Tocca una scheda per consultare la cronologia.
          </p>
          <KanbanBoard
            items={list} stages={CLAIM_STAGES} stageMeta={claimStageMeta}
            onMove={pipe.requestMove} onOpen={pipe.setOpened}
            renderCard={c => (
              <>
                <p className="text-sm font-semibold text-slate-800">{c.vehicle}</p>
                <p className="text-xs text-slate-500">{c.date} · {c.driver}</p>
                <p className="text-xs font-semibold mt-1.5" style={{ color: NAVY_700 }}>
                  € {(c.damage || 0).toLocaleString("it-IT")}
                </p>
              </>
            )}
          />
        </>
      ) : (
        <Card>
          <DataTable columns={columns} data={list} />
        </Card>
      )}

      {pipe.pendingMove && (
        <UpdateNoteModal
          title={`${pipe.pendingMove.item.vehicle} — aggiornamento sinistro`}
          subtitle={`Evento del ${pipe.pendingMove.item.date} · danno stimato € ${(pipe.pendingMove.item.damage || 0).toLocaleString("it-IT")}`}
          from={pipe.pendingMove.item.status} to={pipe.pendingMove.to} stageMeta={claimStageMeta}
          onClose={() => pipe.setPendingMove(null)} onConfirm={pipe.confirmMove}
        />
      )}
      {pipe.opened && (
        <RecordTimelineModal
          record={list.find(r => r.id === pipe.opened.id) || pipe.opened}
          stageMeta={claimStageMeta} title="SINISTRO" entityType="sinistro"
          fields={[
            { label: "Data evento", value: r => r.date },
            { label: "Conducente", value: r => r.driver },
            { label: "Danno stimato", value: r => `€ ${(r.damage || 0).toLocaleString("it-IT")}` },
            { label: "Compagnia", value: r => r.insuranceCompany },
          ]}
          onClose={() => pipe.setOpened(null)}
          onAddNote={(text) => pipe.addNote(pipe.opened, text)}
          onEdit={crud.requestEdit} onDelete={crud.requestDelete}
        />
      )}

      {crud.editing && (
        <SimpleFormModal
          title={`Modifica sinistro — ${crud.editing.vehicle}`} fields={CLAIM_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f, damage: parseFloat(f.damage) || 0 })}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`il sinistro del ${crud.deleting.date} — ${crud.deleting.vehicle}`} moduleLabel="Sinistri"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}

      {showForm && (
        <SimpleFormModal
          title="Nuovo sinistro" fields={CLAIM_FORM_FIELDS} submitLabel="Registra sinistro"
          onClose={() => setShowForm(false)}
          onSave={(f) => { setList(prev => [{ id: `s${Date.now()}`, ...f, damage: parseFloat(f.damage) || 0 }, ...prev]); setShowForm(false); }}
        />
      )}
    </div>
  );
}

const FINE_FORM_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "fineNumber", label: "N° verbale" },
  { key: "authority", label: "Ente accertatore", required: true },
  { key: "date", label: "Data infrazione", type: "date", required: true },
  { key: "notificationDate", label: "Data notifica", type: "date" },
  { key: "driver", label: "Conducente" },
  { key: "offence", label: "Violazione contestata", span: 2 },
  { key: "amount", label: "Importo (€)", type: "number", required: true },
  { key: "reducedAmount", label: "Importo ridotto (€)", type: "number" },
  { key: "points", label: "Punti patente", type: "number" },
  { key: "dueDate", label: "Scadenza pagamento", type: "date" },
  { key: "paymentDate", label: "Data pagamento", type: "date" },
  { key: "status", label: "Stato", type: "select", default: "ricevuto",
    options: ["ricevuto", "notificato_conducente", "in_ricorso", "pagato"] },
  { key: "appealNotes", label: "Note ricorso", span: 2 },
];

function VerbaliView({ list, setList, subRentalList = [], vehicleList = [], handovers = [], onSendMail }) {
  const [showForm, setShowForm] = useState(false);
  const [rinotifica, setRinotifica] = useState(null);
  const crud = useCrudModals(setList, "Verbali & Multe", f => `${f.vehicle} — ${f.authority} (${f.date})`);

  const ctx = { subRentalList, vehicleList, handovers };
  const stato = (f) => fineNotificationStatus(f, ctx);

  const daRinotificare = list.filter(f => stato(f).daRinotificare);
  const inScadenza = list.filter(f => {
    const st = stato(f);
    return !st.giaFatta && (st.urgente || st.scaduto);
  });

  const registraRinotifica = (fine, dati) => {
    setList(prev => prev.map(f => f.id === fine.id
      ? { ...f, status: "rinotificato", driver: dati.driverName || f.driver, rinotifica: dati }
      : f));
    setRinotifica(null);
  };

  const eur = (n) => `€ ${fmtNumber(n || 0, 2)}`;

  const exportRows = list.map(f => {
    const st = stato(f);
    return {
      "Targa": f.vehicle, "N° verbale": f.fineNumber || "", "Ente": f.authority,
      "Data violazione": f.date, "Data notifica": f.notificationDate || "",
      "Violazione": f.offence || "", "Conducente": f.driver || "",
      "Importo": f.amount, "Punti": f.points || 0, "Stato": f.status,
      "Disponibilità alla violazione": companyName(st.resp.company) || "",
      "Titolo": st.resp.source,
      "Da rinotificare": st.daRinotificare ? "SI" : "NO",
      "Termine dati conducente": st.scadenza || "",
      "Giorni residui": st.giorniResidui ?? "",
      "Rinotificato il": f.rinotifica?.date || "",
      "Rinotificato a": f.rinotifica ? companyName(f.rinotifica.to) : "",
      "Mezzo invio": f.rinotifica?.method || "",
      "Riaddebito": f.rinotifica ? (f.rinotifica.rechargeAmount || 0) + (f.rinotifica.adminFee || 0) : "",
    };
  });

  const columns = [
    { key: "vehicle", label: "Targa" },
    { key: "authority", label: "Ente" },
    { key: "date", label: "Data" },
    { key: "responsabile", label: "Disponibilità alla violazione", sortable: false,
      accessor: f => companyName(stato(f).resp.company) || "",
      render: f => {
        const st = stato(f);
        return (
          <>
            {companyName(st.resp.company) || "—"}
            <span className="block text-xs font-normal"
              style={{ color: st.resp.kind === "esterno" ? "#B07A12" : "#94a3b8" }}>
              {st.resp.source}
            </span>
          </>
        );
      } },
    { key: "rinotifica", label: "Rinotifica", sortable: false, filterable: false,
      render: f => {
        const st = stato(f);
        if (st.giaFatta) {
          return (
            <>
              <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                style={{ color: "#2E7D5B", backgroundColor: "#E7F5EE" }}>
                {f.rinotifica.date}
              </span>
              <span className="block text-xs text-slate-400 font-normal mt-0.5">
                {companyName(f.rinotifica.to)} · {f.rinotifica.method}
              </span>
            </>
          );
        }
        if (st.resp.kind !== "esterno") {
          return <span className="text-xs text-slate-300">non richiesta</span>;
        }
        return (
          <button onClick={(e) => { e.stopPropagation(); setRinotifica(f); }}
            className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white transition whitespace-nowrap"
            style={{ backgroundColor: st.scaduto ? "#B4302E" : st.urgente ? "#B07A12" : NAVY_700 }}>
            <Send size={12} /> Rinotifica
            {st.giorniResidui !== null && (
              <span className="font-normal opacity-80">
                {st.scaduto ? `(scaduto)` : `(${st.giorniResidui}gg)`}
              </span>
            )}
          </button>
        );
      } },
    { key: "driver", label: "Conducente" },
    { key: "amount", label: "Importo", render: f => `€ ${f.amount}` },
    { key: "status", label: "Stato", filterType: "select", options: [...new Set(LIVE.fines.map(f => f.status))], render: f => <span className="capitalize">{f.status.replace("_", " ")}</span> },
    { key: "_actions", label: "", sortable: false, filterable: false, render: f => <RowActions entity={{ type: "verbale", id: f.id, label: `Verbale ${f.vehicle} — ${f.authority}` }} onEdit={() => crud.requestEdit(f)} onDelete={() => crud.requestDelete(f)} /> },
  ];

  return (
    <div>
      <SectionTitle
        title="Verbali & Multe" sub="Riconciliazione automatica verbale ↔ veicolo ↔ assegnatario"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="verbali_multe" sheetName="Verbali" />
            <NewRecordButton label="Nuovo verbale" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      {(daRinotificare.length > 0 || inScadenza.length > 0) && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5"
          style={{ backgroundColor: inScadenza.some(f => stato(f).scaduto) ? "#FBEAEA" : "#FBF1DC" }}>
          <AlertTriangle size={17} className="flex-shrink-0 mt-0.5"
            style={{ color: inScadenza.some(f => stato(f).scaduto) ? "#B4302E" : "#B07A12" }} />
          <div style={{ color: inScadenza.some(f => stato(f).scaduto) ? "#8F2624" : "#7A5C0E" }}>
            <p className="font-semibold mb-1">
              {daRinotificare.length > 0
                ? `${daRinotificare.length} verbal${daRinotificare.length === 1 ? "e" : "i"} da rinotificare`
                : "Termini in scadenza per la comunicazione dei dati del conducente"}
            </p>
            <ul className="text-xs space-y-0.5">
              {[...new Set([...daRinotificare, ...inScadenza])].map(f => {
                const st = stato(f);
                return (
                  <li key={f.id}>
                    <strong>{f.vehicle}</strong> — {f.authority}, violazione del {f.date}
                    {st.resp.kind === "esterno" ? ` · mezzo in uso a ${companyName(st.resp.company)}` : ""}
                    {st.scadenza
                      ? st.scaduto
                        ? ` · termine scaduto il ${st.scadenza}`
                        : ` · ${st.giorniResidui} giorni al termine del ${st.scadenza}`
                      : " · data di notifica non registrata, termine non calcolabile"}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs mt-1.5">
              La comunicazione dei dati del conducente va effettuata entro {DRIVER_DATA_DEADLINE_DAYS} giorni
              dalla notifica: oltre il termine si aggiunge una sanzione autonoma a carico dell'impresa.
            </p>
          </div>
        </div>
      )}

      <Card>
        <DataTable columns={columns} data={list} />
      </Card>

      {rinotifica && (
        <RinotificaModal fine={rinotifica} ctx={ctx} onSendMail={onSendMail}
          onClose={() => setRinotifica(null)} onConfirm={registraRinotifica} />
      )}

      {crud.editing && (
        <SimpleFormModal
          title={`Modifica verbale — ${crud.editing.vehicle}`} fields={FINE_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f, amount: parseFloat(f.amount) || 0 })}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`il verbale ${crud.deleting.authority} — ${crud.deleting.vehicle}`} moduleLabel="Verbali & Multe"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}

      {showForm && (
        <SimpleFormModal
          title="Nuovo verbale" fields={FINE_FORM_FIELDS} submitLabel="Registra verbale"
          onClose={() => setShowForm(false)}
          onSave={(f) => { setList(prev => [{ id: `f${Date.now()}`, ...f, amount: parseFloat(f.amount) || 0 }, ...prev]); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function CostiView() {
  const totalTco = tcoFlotta();
  // Un grafico con una barra per mezzo è illeggibile — e lento — oltre la
  // ventina di veicoli: si mostrano i più onerosi, il resto sta nell'export.
  const graficoTco = useMemo(() => LIVE.vehicles
    .map(v => ({ name: v.plate, tco: tcoDi(v) }))
    .sort((a, b) => b.tco - a.tco)
    .slice(0, 15), [LIVE.rev, LIVE.vehicles.length]);
  const senzaCostiFissi = LIVE.vehicles.filter(v => {
    const f = costiFissiVeicolo(v);
    return !(f.insurance || f.roadTax || f.telematics || f.other);
  }).length;
  const exportRows = LIVE.vehicles.map(v => ({
    "Targa": v.plate, "Società": companyName(v.company), "TCO mensile": tcoDi(v),
  }));
  return (
    <div>
      <SectionTitle
        title="Costi & Redditività" sub="Costo Totale di Possesso per veicolo"
        action={<ExportButton rows={exportRows} filename="costi_redditivita" sheetName="Costi" />}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <KPI icon={Coins} label="TCO flotta / mese" value={`€ ${totalTco.toLocaleString("it-IT")}`} />
        <KPI icon={TrendingDown} label="Costo medio / veicolo"
          value={LIVE.vehicles.length ? `€ ${fmtNumber(Math.round(totalTco / LIVE.vehicles.length), 0)}` : "—"}
          sub={senzaCostiFissi ? `${senzaCostiFissi} mezzi senza costi fissi registrati` : "assicurazione e bollo compresi"}
          accent="#B07A12" />
        <KPI icon={TrendingUp} label="Margine subnoleggio" value={`€ ${LIVE.subRentals.reduce((a,sr)=>a+(sr.fee-sr.vehicleCost),0)}`} accent="#2E7D5B" />
      </div>
      <Card className="p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: NAVY_700 }}>
          TCO per veicolo{LIVE.vehicles.length > 15 ? " — i 15 mezzi più onerosi" : ""}
        </p>
        <p className="text-xs text-slate-400 mb-4">
          {LIVE.vehicles.length > 15
            ? `Su ${fmtNumber(LIVE.vehicles.length, 0)} veicoli in flotta; l'elenco completo è nell'esportazione Excel.`
            : "Canone contrattuale, costi fissi annui e spese degli ultimi dodici mesi."}
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={graficoTco}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Bar dataKey="tco" fill={NAVY_700} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CISTERNE CARBURANTE & ADBLUE — di proprietà del cliente
// ---------------------------------------------------------------------------
function levelStatus(tank) {
  const pct = (tank.level / tank.capacity) * 100;
  if (tank.level <= tank.threshold) return { pct, color: "#B4302E", bg: "#FBEAEA", label: "Sotto soglia — pianificare rifornimento" };
  if (tank.level <= tank.threshold * 1.5) return { pct, color: "#B07A12", bg: "#FBF1DC", label: "In avvicinamento alla soglia" };
  return { pct, color: "#2E7D5B", bg: "#E7F5EE", label: "Livello adeguato" };
}

function TankGauge({ tank }) {
  const s = levelStatus(tank);
  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-1.5">
        <span className="text-2xl font-bold" style={{ color: NAVY_700 }}>{tank.level.toLocaleString("it-IT")} L</span>
        <span className="text-xs text-slate-400 mb-1">/ {tank.capacity.toLocaleString("it-IT")} L</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, s.pct)}%`, backgroundColor: s.color }} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
        <span className="text-xs text-slate-400">soglia riordino: {tank.threshold.toLocaleString("it-IT")} L</span>
      </div>
    </div>
  );
}

function TankMovementModal({ mode, tank, onClose, onConfirm }) {
  // mode: "refuel" (cisterna -> veicolo) | "refill" (fornitore -> cisterna)
  const [vehicle, setVehicle] = useState("");
  const [qty, setQty] = useState("");
  const [km, setKm] = useState("");
  const [supplier, setSupplier] = useState(tank.supplier);
  const [unitPrice, setUnitPrice] = useState("");
  const [date, setDate] = useState("2026-08-19");

  const isRefuel = mode === "refuel";
  const qtyNum = parseFloat(qty) || 0;
  const overCapacity = !isRefuel && tank.level + qtyNum > tank.capacity;
  const underZero = isRefuel && tank.level - qtyNum < 0;

  const canConfirm = qtyNum > 0 && !overCapacity && !underZero && (!isRefuel || vehicle);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>
              {isRefuel ? "RIFORNIMENTO VEICOLO DA CISTERNA" : "RIFORNIMENTO CISTERNA DA FORNITORE"}
            </p>
            <h3 className="text-lg font-bold text-white">{tank.label}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {isRefuel && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Veicolo</p>
              <select value={vehicle} onChange={e => setVehicle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Seleziona veicolo...</option>
                {LIVE.vehicles.map(v => <option key={v.id} value={v.plate}>{v.plate} — {v.make} {v.model}</option>)}
              </select>
            </div>
          )}

          {!isRefuel && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Fornitore</p>
              <input value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Quantità (litri)</p>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Data</p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {isRefuel ? (
            <div>
              <p className="text-xs text-slate-500 mb-1">Km al rifornimento</p>
              <input type="number" value={km} onChange={e => setKm(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-1">Prezzo unitario (€/litro)</p>
              <input type="number" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
            </div>
          )}

          <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "#F5F6F8" }}>
            <div className="flex items-center justify-between text-slate-500"><span>Livello attuale</span><span className="font-semibold text-slate-700">{tank.level.toLocaleString("it-IT")} L</span></div>
            <div className="flex items-center justify-between text-slate-500 mt-1">
              <span>Livello dopo l'operazione</span>
              <span className="font-semibold" style={{ color: overCapacity || underZero ? "#B4302E" : NAVY_700 }}>
                {(isRefuel ? tank.level - qtyNum : tank.level + qtyNum).toLocaleString("it-IT")} L
              </span>
            </div>
          </div>

          {overCapacity && <p className="text-xs font-medium" style={{ color: "#B4302E" }}>La quantità supera la capacità della cisterna.</p>}
          {underZero && <p className="text-xs font-medium" style={{ color: "#B4302E" }}>La quantità supera il livello disponibile in cisterna.</p>}

          <button
            disabled={!canConfirm}
            onClick={() => onConfirm({ vehicle, qty: qtyNum, km, supplier, unitPrice, date })}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}
          >
            {isRefuel ? "Registra rifornimento veicolo" : "Registra rifornimento cisterna"}
          </button>
        </div>
      </div>
    </div>
  );
}

const TANK_FORM_FIELDS = [
  { key: "label", label: "Nome cisterna", required: true, span: 2, placeholder: "es. Cisterna Gasolio — Amazon Bologna" },
  { key: "type", label: "Tipo", type: "select", required: true, options: [{ value: "gasolio", label: "Gasolio" }, { value: "benzina", label: "Benzina" }, { value: "adblue", label: "AdBlue" }] },
  { key: "company", label: "Società proprietaria", type: "select", required: true, get options() { return LIVE.companies.map(c => ({ value: c.id, label: c.name })); } },
  { key: "branch", label: "Filiale / ubicazione", required: true },
  { key: "capacity", label: "Capacità (litri)", type: "number", required: true },
  { key: "level", label: "Livello attuale (litri)", type: "number", default: 0 },
  { key: "threshold", label: "Soglia di riordino (litri)", type: "number", required: true },
  { key: "supplier", label: "Fornitore abituale", required: true },
];
const REFUEL_EDIT_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "date", label: "Data", type: "date", required: true },
  { key: "qty", label: "Quantità (litri)", type: "number", required: true },
  { key: "km", label: "Km" },
];
const REFILL_EDIT_FIELDS = [
  { key: "supplier", label: "Fornitore", required: true },
  { key: "date", label: "Data", type: "date", required: true },
  { key: "qty", label: "Quantità (litri)", type: "number", required: true },
  { key: "unitPrice", label: "Prezzo unitario (€/L)", type: "number" },
];

function CisterneView() {
  const [tanks, setTanks] = usePersistentState("tanks", initialTanks);
  const [refills, setRefills] = usePersistentState("tankRefills", initialTankRefills);
  const [refuels, setRefuels] = usePersistentState("vehicleRefuels", initialVehicleRefuels);
  const [modal, setModal] = useState(null); // { mode, tank }
  const [filterType, setFilterType] = useState("tutti");
  const [showNewTank, setShowNewTank] = useState(false);

  const tankLabel = (id) => tanks.find(t => t.id === id)?.label || id;
  const crudTanks = useCrudModals(setTanks, "Cisterne Carburante & AdBlue", t => t.label);
  const crudRefuels = useCrudModals(setRefuels, "Cisterne — Rifornimenti veicoli", r => `${r.vehicle} — ${tankLabel(r.tank)} (${r.date})`);
  const crudRefills = useCrudModals(setRefills, "Cisterne — Rifornimenti fornitore", r => `${tankLabel(r.tank)} — ${r.supplier} (${r.date})`);

  const shownTanks = tanks.filter(t => filterType === "tutti" || t.type === filterType);

  const handleConfirm = (data) => {
    const { mode, tank } = modal;
    const delta = mode === "refuel" ? -data.qty : data.qty;
    setTanks(prev => prev.map(t => t.id === tank.id ? { ...t, level: t.level + delta, lastRefill: mode === "refill" ? data.date : t.lastRefill } : t));
    if (mode === "refuel") {
      setRefuels(prev => [{ id: `vr${prev.length + 1}`, tank: tank.id, vehicle: data.vehicle, date: data.date, qty: data.qty, km: data.km || "—" }, ...prev]);
    } else {
      setRefills(prev => [{ id: `tr${prev.length + 1}`, tank: tank.id, date: data.date, qty: data.qty, unitPrice: parseFloat(data.unitPrice) || 0, supplier: data.supplier, note: "—" }, ...prev]);
    }
    setModal(null);
  };

  const exportRows = tanks.map(t => ({
    "Cisterna": t.label, "Tipo": t.type === "adblue" ? "AdBlue" : "Gasolio", "Società": companyName(t.company),
    "Filiale": t.branch, "Capacità (L)": t.capacity, "Livello attuale (L)": t.level,
    "Soglia riordino (L)": t.threshold, "Fornitore": t.supplier, "Ultimo rifornimento": t.lastRefill,
  }));

  return (
    <div>
      <SectionTitle
        title="Cisterne Carburante & AdBlue" sub="Cisterne di proprietà del cliente — rifornimenti veicoli e rifornimento cisterna da fornitore"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="cisterne_carburante" sheetName="Cisterne" />
            <NewRecordButton label="Nuova cisterna" onClick={() => setShowNewTank(true)} />
          </div>
        }
      />

      <div className="flex gap-2 mb-5">
        {["tutti", "gasolio", "adblue"].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize"
            style={filterType === t ? { backgroundColor: NAVY_700, color: "#fff", borderColor: NAVY_700 } : { color: "#64748b", borderColor: "#e2e8f0" }}
          >
            {t === "adblue" ? "AdBlue" : t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {shownTanks.map(tank => {
          const s = levelStatus(tank);
          return (
            <Card key={tank.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${NAVY_700}14` }}>
                    {tank.type === "adblue" ? <Droplet size={17} style={{ color: NAVY_700 }} /> : <Fuel size={17} style={{ color: NAVY_700 }} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{tank.label}</p>
                    <p className="text-xs text-slate-400">{companyName(tank.company)} · {tank.branch}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {tank.level <= tank.threshold && <AlertTriangle size={16} style={{ color: "#B4302E" }} className="mr-1" />}
                  <RowActions entity={{ type: "cisterna", id: tank.id, label: tank.label }} onEdit={() => crudTanks.requestEdit(tank)} onDelete={() => crudTanks.requestDelete(tank)} />
                </div>
              </div>

              <TankGauge tank={tank} />

              <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                <span>Fornitore: <strong className="text-slate-600">{tank.supplier}</strong></span>
                <span>Ultimo rifornimento: {tank.lastRefill}</span>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setModal({ mode: "refuel", tank })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
                  style={{ borderColor: NAVY_700, color: NAVY_700 }}
                >
                  <ArrowUpFromLine size={13} /> Rifornisci veicolo
                </button>
                <button
                  onClick={() => setModal({ mode: "refill", tank })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition"
                  style={{ backgroundColor: GOLD_500 }}
                >
                  <ArrowDownToLine size={13} /> Rifornisci cisterna
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: NAVY_700 }}>
            <ArrowUpFromLine size={15} /> Rifornimenti veicoli (da cisterna)
          </p>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {refuels.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <span className="font-medium text-slate-700">{r.vehicle}</span>
                  <span className="text-slate-400"> — {tankLabel(r.tank)}</span>
                  <p className="text-xs text-slate-400">{r.date} · {r.km !== "—" ? `${r.km} km` : "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{r.qty} L</span>
                  <RowActions onEdit={() => crudRefuels.requestEdit(r)} onDelete={() => crudRefuels.requestDelete(r)} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: NAVY_700 }}>
            <ArrowDownToLine size={15} /> Rifornimenti cisterna (da fornitore)
          </p>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {refills.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <span className="font-medium text-slate-700">{tankLabel(r.tank)}</span>
                  <p className="text-xs text-slate-400">{r.date} · {r.supplier} {r.unitPrice ? `· € ${r.unitPrice}/L` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">+{r.qty.toLocaleString("it-IT")} L</span>
                  <RowActions onEdit={() => crudRefills.requestEdit(r)} onDelete={() => crudRefills.requestDelete(r)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {modal && (
        <TankMovementModal
          mode={modal.mode}
          tank={tanks.find(t => t.id === modal.tank.id)}
          onClose={() => setModal(null)}
          onConfirm={(data) => handleConfirm({ ...data, mode: modal.mode, tank: modal.tank })}
        />
      )}
      {showNewTank && (
        <SimpleFormModal
          title="Nuova cisterna"
          fields={TANK_FORM_FIELDS}
          submitLabel="Aggiungi cisterna"
          onClose={() => setShowNewTank(false)}
          onSave={(f) => {
            setTanks(prev => [...prev, {
              id: `t${Date.now()}`, ...f,
              capacity: parseFloat(f.capacity) || 0, level: parseFloat(f.level) || 0, threshold: parseFloat(f.threshold) || 0,
              lastRefill: "—",
            }]);
            setShowNewTank(false);
          }}
        />
      )}

      {crudTanks.editing && (
        <SimpleFormModal
          title={`Modifica cisterna — ${crudTanks.editing.label}`} fields={TANK_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crudTanks.editing} onClose={crudTanks.cancelEdit}
          onSave={(f) => crudTanks.confirmEdit({ ...f, capacity: parseFloat(f.capacity) || 0, level: parseFloat(f.level) || 0, threshold: parseFloat(f.threshold) || 0 })}
        />
      )}
      {crudTanks.deleting && (
        <PinConfirmModal
          itemLabel={crudTanks.deleting.label} moduleLabel="Cisterne Carburante & AdBlue"
          onClose={crudTanks.cancelDelete} onConfirm={crudTanks.confirmDelete}
        />
      )}

      {crudRefuels.editing && (
        <SimpleFormModal
          title="Modifica rifornimento veicolo" fields={REFUEL_EDIT_FIELDS} submitLabel="Salva modifiche"
          initialValues={crudRefuels.editing} onClose={crudRefuels.cancelEdit}
          onSave={(f) => crudRefuels.confirmEdit({ ...f, qty: parseFloat(f.qty) || 0 })}
        />
      )}
      {crudRefuels.deleting && (
        <PinConfirmModal
          itemLabel={`il rifornimento di ${crudRefuels.deleting.vehicle} del ${crudRefuels.deleting.date}`} moduleLabel="Cisterne — Rifornimenti veicoli"
          onClose={crudRefuels.cancelDelete} onConfirm={crudRefuels.confirmDelete}
        />
      )}

      {crudRefills.editing && (
        <SimpleFormModal
          title="Modifica rifornimento cisterna" fields={REFILL_EDIT_FIELDS} submitLabel="Salva modifiche"
          initialValues={crudRefills.editing} onClose={crudRefills.cancelEdit}
          onSave={(f) => crudRefills.confirmEdit({ ...f, qty: parseFloat(f.qty) || 0, unitPrice: parseFloat(f.unitPrice) || 0 })}
        />
      )}
      {crudRefills.deleting && (
        <PinConfirmModal
          itemLabel={`il rifornimento da ${crudRefills.deleting.supplier} del ${crudRefills.deleting.date}`} moduleLabel="Cisterne — Rifornimenti fornitore"
          onClose={crudRefills.cancelDelete} onConfirm={crudRefills.confirmDelete}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ESPORTAZIONE GUIDATA — selezione campi multi-modulo, join per targa
// ---------------------------------------------------------------------------
const findContract = (plate) => LIVE.contracts.find(c => c.vehicle === plate);
const findSubRental = (plate) => LIVE.subRentals.find(sr => sr.vehicle === plate);
const nearestDeadline = (plate) => LIVE.deadlines.filter(d => d.vehicle === plate).sort((a, b) => a.days - b.days)[0];

const EXPORT_CATALOG = [
  { module: "Anagrafica Flotta", fields: [
    { id: "plate", label: "Targa", get: v => v.plate },
    { id: "internalPlate", label: "Targa interna", get: v => v.internalPlate },
    { id: "vin", label: "Telaio (VIN)", get: v => v.vin },
    { id: "docNumber", label: "N° Carta di circolazione", get: v => v.docNumber },
    { id: "make", label: "Marca", get: v => v.make },
    { id: "model", label: "Modello", get: v => v.model },
    { id: "color", label: "Colore", get: v => v.color },
    { id: "euroClass", label: "Classe Euro", get: v => v.euroClass },
    { id: "fuel", label: "Alimentazione", get: v => v.fuel },
    { id: "status", label: "Stato", get: v => statusMeta[v.status]?.label },
    { id: "company", label: "Società", get: v => companyName(v.company) },
    { id: "costCenter", label: "Centro di costo", get: v => v.costCenter },
    { id: "driver", label: "Conducente", get: v => v.driver },
    { id: "km", label: "Km attuali", get: v => v.km },
  ]},
  { module: "Contratti", fields: [
    { id: "contractType", label: "Tipo contratto", get: v => findContract(v.plate)?.type || "" },
    { id: "contractSupplier", label: "Fornitore contratto", get: v => findContract(v.plate)?.supplier || "" },
    { id: "contractFee", label: "Canone mensile contratto", get: v => findContract(v.plate)?.fee ?? "" },
    { id: "contractEnd", label: "Scadenza contratto", get: v => findContract(v.plate)?.end || "" },
  ]},
  { module: "Subnoleggio", fields: [
    { id: "subFee", label: "Canone subnoleggio", get: v => findSubRental(v.plate)?.fee ?? "" },
    { id: "subMargin", label: "Margine subnoleggio", get: v => { const sr = findSubRental(v.plate); return sr ? sr.fee - sr.vehicleCost : ""; } },
  ]},
  { module: "Scadenze", fields: [
    { id: "nextDeadlineType", label: "Prossima scadenza — tipo", get: v => nearestDeadline(v.plate)?.type || "" },
    { id: "nextDeadlineDate", label: "Prossima scadenza — data", get: v => nearestDeadline(v.plate)?.due || "" },
    { id: "nextDeadlineDays", label: "Prossima scadenza — giorni residui", get: v => nearestDeadline(v.plate)?.days ?? "" },
  ]},
  { module: "Manutenzione", fields: [
    { id: "maintCount", label: "N° interventi manutenzione", get: v => LIVE.maintenance.filter(m => m.vehicle === v.plate).length },
    { id: "maintTotalCost", label: "Costo totale manutenzione", get: v => LIVE.maintenance.filter(m => m.vehicle === v.plate).reduce((a, m) => a + (m.cost || 0), 0) },
  ]},
  { module: "Sinistri", fields: [
    { id: "claimsOpen", label: "Sinistri aperti", get: v => LIVE.claims.filter(c => c.vehicle === v.plate && c.status !== "liquidato").length },
    { id: "claimsTotalDamage", label: "Danno totale stimato", get: v => LIVE.claims.filter(c => c.vehicle === v.plate).reduce((a, c) => a + c.damage, 0) },
  ]},
  { module: "Verbali & Multe", fields: [
    { id: "finesCount", label: "N° verbali", get: v => LIVE.fines.filter(f => f.vehicle === v.plate).length },
    { id: "finesTotalAmount", label: "Importo totale verbali", get: v => LIVE.fines.filter(f => f.vehicle === v.plate).reduce((a, f) => a + f.amount, 0) },
  ]},
  { module: "Costi & Redditività", fields: [
    { id: "tco", label: "TCO mensile", get: v => tcoDi(v) },
  ]},
  { module: "Carburante", fields: [
    { id: "fuelTotalLiters", label: "Litri riforniti (totale)", get: v => initialVehicleRefuels.filter(r => r.vehicle === v.plate).reduce((a, r) => a + r.qty, 0) },
  ]},
];

const INSURANCE_PRESET = [
  "plate", "vin", "make", "model", "color", "euroClass", "company", "costCenter",
  "claimsOpen", "claimsTotalDamage", "nextDeadlineType", "nextDeadlineDate", "nextDeadlineDays",
];

function EsportazioniView() {
  const [selected, setSelected] = useState(() => {
    const s = {};
    EXPORT_CATALOG[0].fields.forEach(f => { s[f.id] = true; }); // Anagrafica Flotta pre-selezionata
    return s;
  });

  const toggleField = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleModule = (mod, value) => setSelected(prev => {
    const next = { ...prev };
    mod.fields.forEach(f => { next[f.id] = value; });
    return next;
  });
  const applyPreset = (ids) => setSelected(() => {
    const s = {};
    ids.forEach(id => { s[id] = true; });
    return s;
  });
  const clearAll = () => setSelected({});
  const selectAll = () => setSelected(() => {
    const s = {};
    EXPORT_CATALOG.forEach(mod => mod.fields.forEach(f => { s[f.id] = true; }));
    return s;
  });

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const generate = () => {
    const activeFields = EXPORT_CATALOG.flatMap(mod => mod.fields.filter(f => selected[f.id]).map(f => ({ ...f, module: mod.module })));
    if (activeFields.length === 0) return;
    const rows = LIVE.vehicles.map(v => {
      const row = {};
      activeFields.forEach(f => { row[`${f.module} — ${f.label}`] = f.get(v); });
      return row;
    });
    exportRowsToExcel(rows, "esportazione_personalizzata", "Esportazione");
  };

  return (
    <div>
      <SectionTitle
        title="Esportazione Guidata" sub="Seleziona i campi da più moduli — verranno uniti in un unico file Excel, una riga per veicolo (join per targa)"
        action={
          <button onClick={generate} disabled={selectedCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition flex-shrink-0"
            style={{ backgroundColor: NAVY_700 }}>
            <Download size={15} /> Genera Excel ({selectedCount} campi)
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => applyPreset(INSURANCE_PRESET)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition" style={{ backgroundColor: GOLD_500 }}>
          <ShieldAlert size={13} /> Preset: Esportazione assicurativa
        </button>
        <button onClick={selectAll} className="px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50" style={{ borderColor: "#cbd5e1", color: "#475569" }}>
          Seleziona tutti i campi
        </button>
        <button onClick={clearAll} className="px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50" style={{ borderColor: "#cbd5e1", color: "#475569" }}>
          Deseleziona tutto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {EXPORT_CATALOG.map(mod => {
          const allChecked = mod.fields.every(f => selected[f.id]);
          const someChecked = mod.fields.some(f => selected[f.id]);
          return (
            <Card key={mod.module} className="p-4">
              <label className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-100 cursor-pointer">
                <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={e => toggleModule(mod, e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: NAVY_700 }} />
                <span className="text-sm font-bold" style={{ color: NAVY_700 }}>{mod.module}</span>
              </label>
              <div className="space-y-1.5">
                {mod.fields.map(f => (
                  <label key={f.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-800">
                    <input type="checkbox" checked={!!selected[f.id]} onChange={() => toggleField(f.id)}
                      className="w-3.5 h-3.5 rounded" style={{ accentColor: GOLD_500 }} />
                    {f.label}
                  </label>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CLIENTI & FORNITORI
// ---------------------------------------------------------------------------
function PartnerFormModal({ onClose, onSave, initialValues, title = "Nuova anagrafica", submitLabel = "Salva anagrafica" }) {
  const [form, setForm] = useState({
    name: "", type: "fornitore", vat: "", sdi: "", pec: "", iban: "",
    paymentTerms: 30, contactName: "", contactEmail: "", contactPhone: "", city: "",
    ...(initialValues || {}),
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const canSave = form.name.trim() && form.sdi.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200" style={{ backgroundColor: NAVY_700 }}>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">Ragione sociale</p>
              <input value={form.name} onChange={set("name")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Tipo</p>
              <select value={form.type} onChange={set("type")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="fornitore">Fornitore</option>
                <option value="cliente">Cliente</option>
                <option value="entrambi">Cliente e Fornitore</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Città</p>
              <input value={form.city} onChange={set("city")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">P.IVA</p>
              <input value={form.vat} onChange={set("vat")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Codice SDI *</p>
              <input value={form.sdi} onChange={set("sdi")} maxLength={7} placeholder="7 caratteri"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase" />
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">PEC</p>
              <input value={form.pec} onChange={set("pec")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">IBAN</p>
              <input value={form.iban} onChange={set("iban")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Termini pagamento (gg)</p>
              <input type="number" value={form.paymentTerms} onChange={set("paymentTerms")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Referente</p>
              <input value={form.contactName} onChange={set("contactName")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Email referente</p>
              <input value={form.contactEmail} onChange={set("contactEmail")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Telefono</p>
              <input value={form.contactPhone} onChange={set("contactPhone")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button
            disabled={!canSave}
            onClick={() => onSave(initialValues ? form : { ...form, id: `p${Date.now()}` })}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-40 transition mt-2"
            style={{ backgroundColor: NAVY_700 }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const partnerTypeLabel = { cliente: "Cliente", fornitore: "Fornitore", entrambi: "Cliente e Fornitore" };

function ClientiFornitoriView({ list: partners, setList: setPartners }) {
  const [filter, setFilter] = useState("tutti");
  const [showForm, setShowForm] = useState(false);
  const crud = useCrudModals(setPartners, "Clienti & Fornitori", p => p.name);

  const shown = partners.filter(p => filter === "tutti" || p.type === filter || (filter === "cliente" && p.type === "entrambi") || (filter === "fornitore" && p.type === "entrambi"));

  const exportRows = shown.map(p => ({
    "Ragione sociale": p.name, "Tipo": partnerTypeLabel[p.type], "Città": p.city, "P.IVA": p.vat,
    "Codice SDI": p.sdi, "PEC": p.pec, "IBAN": p.iban, "Termini pagamento (gg)": p.paymentTerms,
    "Referente": p.contactName, "Email referente": p.contactEmail, "Telefono": p.contactPhone,
  }));

  return (
    <div>
      <SectionTitle
        title="Clienti & Fornitori" sub="Anagrafica commerciale — dati necessari per la fatturazione elettronica"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="clienti_fornitori" sheetName="Anagrafiche" />
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition" style={{ backgroundColor: GOLD_500 }}>
              <Plus size={14} /> Nuova anagrafica
            </button>
          </div>
        }
      />

      <div className="flex gap-2 mb-4">
        {["tutti", "cliente", "fornitore"].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize"
            style={filter === t ? { backgroundColor: NAVY_700, color: "#fff", borderColor: NAVY_700 } : { color: "#64748b", borderColor: "#e2e8f0" }}>
            {t === "tutti" ? "Tutti" : t === "cliente" ? "Clienti" : "Fornitori"}
          </button>
        ))}
      </div>

      <Card>
        <DataTable
          columns={[
            { key: "name", label: "Ragione sociale", render: p => (<>{p.name}<span className="block text-xs text-slate-400 font-normal">{p.city}</span></>) },
            { key: "type", label: "Tipo", filterType: "select", options: ["cliente", "fornitore", "entrambi"].map(v => ({ value: v, label: partnerTypeLabel[v] })), render: p => (
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: p.type === "cliente" ? "#E3F2F6" : "#FBF1DC", color: p.type === "cliente" ? NAVY_700 : "#B07A12" }}>
                {partnerTypeLabel[p.type]}
              </span>
            )},
            { key: "vat", label: "P.IVA" },
            { key: "sdi", label: "Codice SDI", render: p => <span className="font-mono">{p.sdi}</span> },
            { key: "pec", label: "PEC" },
            { key: "paymentTerms", label: "Termini pag.", render: p => `${p.paymentTerms} gg` },
            { key: "contactName", label: "Referente" },
            { key: "_actions", label: "", sortable: false, filterable: false, render: p => <RowActions entity={{ type: "partner", id: p.id, label: p.name }} onEdit={() => crud.requestEdit(p)} onDelete={() => crud.requestDelete(p)} /> },
          ]}
          data={shown}
        />
      </Card>

      {showForm && (
        <PartnerFormModal
          onClose={() => setShowForm(false)}
          onSave={(p) => { setPartners(prev => [p, ...prev]); setShowForm(false); }}
        />
      )}
      {crud.editing && (
        <PartnerFormModal
          title={`Modifica anagrafica — ${crud.editing.name}`} submitLabel="Salva modifiche"
          initialValues={crud.editing}
          onClose={crud.cancelEdit}
          onSave={crud.confirmEdit}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={crud.deleting.name} moduleLabel="Clienti & Fornitori"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FATTURAZIONE — attiva (subnoleggio) · passiva (fornitori) · benchmark
// ---------------------------------------------------------------------------
const invoiceStatusMeta = {
  bozza: { label: "Bozza", color: "#6B7280", bg: "#F1F2F4" },
  emessa: { label: "Emessa", color: "#1B6DB0", bg: "#E7F3FC" },
  inviata: { label: "Inviata", color: "#8B5CF6", bg: "#F1EBFE" },
  pagata: { label: "Pagata", color: "#2E7D5B", bg: "#E7F5EE" },
  scaduta: { label: "Scaduta", color: "#B4302E", bg: "#FBEAEA" },
  ricevuta: { label: "Ricevuta", color: "#1B6DB0", bg: "#E7F3FC" },
  verificata: { label: "Verificata", color: "#B07A12", bg: "#FBF1DC" },
  contestata: { label: "Contestata", color: "#B4302E", bg: "#FBEAEA" },
};
function InvoiceBadge({ status }) {
  const m = invoiceStatusMeta[status] || { label: status, color: "#555", bg: "#eee" };
  return <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: m.color, backgroundColor: m.bg }}>{m.label}</span>;
}

const ACTIVE_INVOICE_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "customer", label: "Cliente", required: true },
  { key: "type", label: "Tipo", type: "select", required: true, default: "proforma", options: ["proforma", "fattura"] },
  { key: "number", label: "Numero documento", required: true },
  { key: "issueDate", label: "Data emissione", type: "date", required: true },
  { key: "dueDate", label: "Scadenza", type: "date" },
  { key: "amountNet", label: "Imponibile (€)", type: "number", required: true },
  { key: "vat", label: "IVA %", type: "number", default: 22 },
];

const PASSIVE_INVOICE_FIELDS = [
  { key: "supplier", label: "Fornitore", required: true },
  { key: "vehiclePlate", label: "Targa (— se non applicabile)", default: "—" },
  { key: "vehicleModel", label: "Modello / descrizione", required: true, span: 2 },
  { key: "number", label: "Numero documento", required: true },
  { key: "invoiceDate", label: "Data fattura", type: "date", required: true },
  { key: "dueDate", label: "Scadenza", type: "date" },
  { key: "amountNet", label: "Imponibile (€)", type: "number", required: true },
  { key: "category", label: "Categoria", type: "select", required: true, default: "canone",
    options: ["canone", "manutenzione", "carburante", "assicurazione", "pneumatici", "telepass", "altro"] },
];

// ---------------------------------------------------------------------------
// COMPOSIZIONE DI PROFORMA E FATTURE
// ---------------------------------------------------------------------------
// Il documento nasce da due fonti già presenti in piattaforma: i contratti di
// noleggio in essere con quel cliente e le fatture passive da ribaltare.
// Riscrivere quegli importi a mano sarebbe la via più diretta agli errori: qui
// si selezionano, e il margine si applica in modo trasparente e verificabile.
function NuovaFatturaModal({ partnerList, subRentalList, contractList, supplierInv,
                             claimList = [], giaRibaltate, giaAddebitate = [], onClose, onSave }) {
  const [cliente, setCliente] = useState("");
  const [tipo, setTipo] = useState("proforma");
  const [issueDate, setIssueDate] = useState(TODAY);
  const [dueDate, setDueDate] = useState(addDays(TODAY, 30));
  const [vat, setVat] = useState("22");
  const [note, setNote] = useState("");

  const [selNoleggi, setSelNoleggi] = useState({});
  const [selCosti, setSelCosti] = useState({});
  const [margini, setMargini] = useState({});          // ricarico per singola voce
  const [margineGlobale, setMargineGlobale] = useState("10");
  const [manuali, setManuali] = useState([]);
  const [selFranchigie, setSelFranchigie] = useState({});

  const eur = (n) => `€ ${fmtNumber(n || 0, 2)}`;
  const clienti = partnerList.filter(p => p.type === "cliente" || p.type === "cliente_fornitore");
  const clienteSel = partnerList.find(p => p.id === cliente);

  // Noleggi contrattualizzati con questo cliente: si cercano fra i subnoleggi
  // attivi, che sono il titolo in forza del quale si fattura.
  const noleggiCliente = !clienteSel ? [] : subRentalList.filter(sr => {
    if (sr.status !== "attivo") return false;
    const soc = LIVE.companies.find(c => c.id === sr.using);
    return soc && (soc.name === clienteSel.name || sr.using === clienteSel.companyId);
  });

  // Costi ribaltabili: fatture passive dei mezzi affidati al cliente, non ancora
  // riaddebitate. Escluderle una volta usate evita il doppio addebito.
  const targheCliente = noleggiCliente.map(n => n.vehicle);
  const costiRibaltabili = supplierInv.filter(i =>
    targheCliente.includes(i.vehiclePlate) && !giaRibaltate.includes(i.id));

  const margineDi = (id) => {
    const v = margini[id];
    return v === undefined || v === "" ? parseFloat(margineGlobale) || 0 : parseFloat(v) || 0;
  };

  const righeNoleggio = noleggiCliente.filter(n => selNoleggi[n.id]).map(n => ({
    tipo: "noleggio",
    riferimento: n.vehicle,
    descrizione: `Canone di noleggio ${n.vehicle} — periodo ${n.start} / ${n.end || "in corso"}`,
    imponibile: parseFloat(n.fee) || 0,
    costo: null, margine: 0,
  }));

  const righeCosto = costiRibaltabili.filter(c => selCosti[c.id]).map(c => {
    const m = margineDi(c.id);
    const base = parseFloat(c.amountNet) || 0;
    return {
      tipo: "ribaltamento",
      riferimento: c.vehiclePlate,
      descrizione: `${(c.category || "spesa")[0].toUpperCase()}${(c.category || "spesa").slice(1)} ${c.vehiclePlate} — rif. ${c.supplier} ${c.number}`,
      costo: base,
      margine: m,
      imponibile: Math.round(base * (1 + m / 100) * 100) / 100,
      sourceId: c.id,
    };
  });

  // Franchigie addebitabili: sinistri dei mezzi affidati al cliente con una
  // franchigia valorizzata e non ancora riaddebitata.
  const franchigieAddebitabili = claimList.filter(c =>
    targheCliente.includes(c.vehicle)
    && (parseFloat(c.deductible) || 0) > 0
    && !giaAddebitate.includes(c.id));

  const righeFranchigia = franchigieAddebitabili.filter(c => selFranchigie[c.id]).map(c => ({
    tipo: "franchigia",
    riferimento: c.vehicle,
    descrizione: `Franchigia sinistro ${c.vehicle} del ${c.date}${c.claimNumber ? ` — sinistro n. ${c.claimNumber}` : ""}`,
    imponibile: parseFloat(c.deductible) || 0,
    costo: null, margine: 0,
    senzaIva: true,
    claimId: c.id,
  }));

  const righe = [...righeNoleggio, ...righeCosto, ...righeFranchigia, ...manuali];

  // La franchigia è un risarcimento del danno, non un corrispettivo: resta
  // fuori dal campo di applicazione dell'IVA (art. 15, co. 1, n. 1, DPR
  // 633/1972). Va quindi esposta in fattura separatamente dall'imponibile,
  // e non deve concorrere alla base di calcolo dell'imposta.
  const imponibile = righe.filter(r => !r.senzaIva).reduce((t, r) => t + r.imponibile, 0);
  const fuoriCampo = righe.filter(r => r.senzaIva).reduce((t, r) => t + r.imponibile, 0);
  const iva = Math.round(imponibile * (parseFloat(vat) || 0)) / 100;
  const totale = imponibile + iva + fuoriCampo;
  const costoRibaltato = righeCosto.reduce((t, r) => t + r.costo, 0);
  const margineMaturato = righeCosto.reduce((t, r) => t + (r.imponibile - r.costo), 0);

  const salva = () => {
    if (!clienteSel || righe.length === 0) return;
    onSave({
      customer: clienteSel.name,
      customerId: clienteSel.id,
      type: tipo,
      issueDate, dueDate,
      vat: parseFloat(vat) || 0,
      amountNet: Math.round(imponibile * 100) / 100,
      amountExempt: Math.round(fuoriCampo * 100) / 100,
      righe,
      note,
      vehicle: [...new Set(righe.map(r => r.riferimento))].join(", ") || "—",
      ribaltate: righeCosto.map(r => r.sourceId),
      franchigieAddebitate: righeFranchigia.map(r => r.claimId),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>NUOVO DOCUMENTO</p>
            <h3 className="text-lg font-bold text-white">
              {tipo === "proforma" ? "Proforma" : "Fattura"} {clienteSel ? `— ${clienteSel.name}` : ""}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1 — Cliente e testata */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>1 · Cliente e documento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Cliente *</p>
                <select value={cliente} onChange={e => { setCliente(e.target.value); setSelNoleggi({}); setSelCosti({}); }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleziona dall'anagrafica clienti...</option>
                  {clienti.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.vat ? ` — ${p.vat}` : ""}</option>
                  ))}
                </select>
                {clienteSel && (
                  <p className="text-xs text-slate-400 mt-1">
                    {clienteSel.sdi ? `SDI ${clienteSel.sdi} · ` : ""}
                    {clienteSel.pec ? `${clienteSel.pec} · ` : ""}
                    pagamento a {clienteSel.paymentTerms || 30} giorni
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Tipo documento</p>
                <select value={tipo} onChange={e => setTipo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="proforma">Proforma</option>
                  <option value="fattura">Fattura</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">IVA %</p>
                <input type="number" value={vat} onChange={e => setVat(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Data emissione</p>
                <input type="date" value={issueDate}
                  onChange={e => { setIssueDate(e.target.value); setDueDate(addDays(e.target.value, clienteSel?.paymentTerms || 30)); }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Scadenza</p>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* 2 — Noleggi contrattualizzati */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>
              2 · Noleggi contrattualizzati
            </p>
            {!clienteSel ? (
              <p className="text-sm text-slate-400">Seleziona prima il cliente.</p>
            ) : noleggiCliente.length === 0 ? (
              <p className="text-sm text-slate-400">Nessun noleggio attivo intestato a questo cliente.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {noleggiCliente.map(n => (
                  <label key={n.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={!!selNoleggi[n.id]}
                      onChange={() => setSelNoleggi(s => ({ ...s, [n.id]: !s[n.id] }))}
                      className="w-3.5 h-3.5 rounded" style={{ accentColor: GOLD_500 }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-700">{n.vehicle}</p>
                      <p className="text-xs text-slate-400">
                        {n.start} → {n.end || "in corso"} · franchigia RCA {eur(n.deductibleRCA)}
                      </p>
                    </div>
                    <span className="font-semibold text-sm" style={{ color: NAVY_700 }}>{eur(n.fee)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 3 — Costi da ribaltare */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: GOLD_500 }}>
                3 · Costi da ribaltare
              </p>
              {costiRibaltabili.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Margine predefinito</span>
                  <input type="number" value={margineGlobale} onChange={e => setMargineGlobale(e.target.value)}
                    className="w-16 border border-slate-300 rounded-md px-2 py-1 text-xs text-right" />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              )}
            </div>

            {!clienteSel ? (
              <p className="text-sm text-slate-400">Seleziona prima il cliente.</p>
            ) : costiRibaltabili.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nessuna fattura passiva da ribaltare per i mezzi di questo cliente.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {costiRibaltabili.map(c => {
                  const sel = !!selCosti[c.id];
                  const m = margineDi(c.id);
                  const addebito = Math.round((parseFloat(c.amountNet) || 0) * (1 + m / 100) * 100) / 100;
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <input type="checkbox" checked={sel}
                        onChange={() => setSelCosti(s => ({ ...s, [c.id]: !s[c.id] }))}
                        className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ accentColor: GOLD_500 }} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-700 capitalize">
                          {c.category} · {c.vehiclePlate}
                        </p>
                        <p className="text-xs text-slate-400">{c.supplier} · {c.number} · {c.invoiceDate}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">costo {eur(c.amountNet)}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input type="number" value={margini[c.id] ?? ""} placeholder={margineGlobale}
                          onChange={e => setMargini(x => ({ ...x, [c.id]: e.target.value }))}
                          disabled={!sel}
                          className="w-14 border border-slate-300 rounded-md px-1.5 py-1 text-xs text-right disabled:opacity-40" />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                      <span className="font-semibold text-sm w-24 text-right"
                        style={{ color: sel ? NAVY_700 : "#cbd5e1" }}>{eur(addebito)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4 — Franchigie da addebitare */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>
              4 · Franchigie da addebitare
            </p>
            {!clienteSel ? (
              <p className="text-xs text-slate-400">Seleziona prima il cliente.</p>
            ) : franchigieAddebitabili.length === 0 ? (
              <p className="text-xs text-slate-400">
                Nessuna franchigia da addebitare per i mezzi affidati a questo cliente.
              </p>
            ) : (
              <>
                <div className="flex gap-2 rounded-lg p-2.5 text-xs mb-2"
                  style={{ backgroundColor: "#E3F2F6", color: "#0F3C49" }}>
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Le franchigie sono addebitate <strong>senza IVA</strong>: costituiscono rimborso del danno
                    e restano fuori dal campo di applicazione dell'imposta (art. 15, co. 1, n. 1,
                    DPR 633/1972). In fattura vengono esposte in una voce separata dall'imponibile.
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {franchigieAddebitabili.map(c => {
                    const sel = !!selFranchigie[c.id];
                    return (
                      <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={sel}
                          onChange={() => setSelFranchigie(f => ({ ...f, [c.id]: !sel }))}
                          className="w-4 h-4 rounded flex-shrink-0" style={{ accentColor: GOLD_500 }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: sel ? NAVY_700 : "#64748b" }}>
                            {c.vehicle} — sinistro del {c.date}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {c.claimNumber ? `n. ${c.claimNumber} · ` : ""}
                            danno stimato {eur(c.damage)} · {String(c.status || "").replace("_", " ")}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ color: "#0F3C49", backgroundColor: "#E3F2F6" }}>fuori campo IVA</span>
                        <span className="font-semibold text-sm w-24 text-right flex-shrink-0"
                          style={{ color: sel ? NAVY_700 : "#cbd5e1" }}>{eur(c.deductible)}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 5 — Voci libere */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: GOLD_500 }}>
                5 · Altre voci
              </p>
              <button onClick={() => setManuali(m => [...m, { tipo: "manuale", riferimento: "—", descrizione: "", imponibile: 0, costo: null, margine: 0, senzaIva: false }])}
                className="text-xs font-semibold flex items-center gap-1" style={{ color: GOLD_DARK }}>
                <Plus size={12} /> Aggiungi voce
              </button>
            </div>
            {manuali.map((r, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <input value={r.descrizione} placeholder="Descrizione"
                  onChange={e => setManuali(m => m.map((x, j) => j === i ? { ...x, descrizione: e.target.value } : x))}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input type="number" value={r.imponibile} placeholder="0,00"
                  onChange={e => setManuali(m => m.map((x, j) => j === i ? { ...x, imponibile: parseFloat(e.target.value) || 0 } : x))}
                  className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm text-right" />
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer whitespace-nowrap"
                  title="Somme escluse dal campo IVA: risarcimenti, penali, anticipazioni in nome e per conto">
                  <input type="checkbox" checked={!!r.senzaIva}
                    onChange={() => setManuali(m => m.map((x, j) => j === i ? { ...x, senzaIva: !x.senzaIva } : x))}
                    className="w-3.5 h-3.5 rounded" style={{ accentColor: GOLD_500 }} />
                  senza IVA
                </label>
                <button onClick={() => setManuali(m => m.filter((_, j) => j !== i))}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {manuali.length === 0 && <p className="text-xs text-slate-400">Nessuna voce aggiuntiva.</p>}
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Note in fattura</p>
            <input value={note} onChange={e => setNote(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Riepilogo */}
          {righe.length > 0 && (
            <Card className="p-4">
              <p className="text-sm font-semibold mb-2" style={{ color: NAVY_700 }}>
                Riepilogo — {righe.length} rig{righe.length === 1 ? "a" : "he"}
              </p>
              <table className="w-full text-xs mb-3">
                <tbody>
                  {righe.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 text-slate-600">{r.descrizione || "(senza descrizione)"}</td>
                      <td className="py-1.5 text-right text-slate-400 whitespace-nowrap">
                        {r.costo != null ? `costo ${eur(r.costo)} +${fmtNumber(r.margine, 1)}%` : ""}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-slate-700 w-24">
                        {eur(r.imponibile)}
                        {r.senzaIva && <span className="block text-xs font-normal text-slate-400">senza IVA</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm border-t border-slate-200 pt-2">
                <div className="flex justify-between"><span className="text-slate-500">Imponibile</span><strong>{eur(imponibile)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">IVA {vat}%</span><span>{eur(iva)}</span></div>
                {fuoriCampo > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Somme escluse — art. 15 DPR 633/72</span>
                    <span>{eur(fuoriCampo)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base pt-1 border-t border-slate-100">
                  <strong style={{ color: NAVY_700 }}>Totale documento</strong>
                  <strong style={{ color: NAVY_700 }}>{eur(totale)}</strong>
                </div>
                {costoRibaltato > 0 && (
                  <div className="flex justify-between text-xs pt-1.5" style={{ color: "#2E7D5B" }}>
                    <span>Costi ribaltati {eur(costoRibaltato)} — margine maturato</span>
                    <strong>{eur(margineMaturato)}</strong>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
          <button onClick={salva} disabled={!clienteSel || righe.length === 0}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}>
            {tipo === "proforma" ? "Crea proforma" : "Emetti fattura"}
          </button>
          <p className="text-xs text-slate-400">
            {!clienteSel ? "Seleziona il cliente per proseguire"
              : righe.length === 0 ? "Seleziona almeno un noleggio o un costo da ribaltare"
              : fuoriCampo > 0
                ? `${eur(totale)} — di cui ${eur(fuoriCampo)} fuori campo IVA`
                : `${eur(totale)} IVA inclusa`}
          </p>
        </div>
      </div>
    </div>
  );
}

function FatturazioneView({ partnerList = [], subRentalList = [], contractList = [], claimList = [] }) {
  const [tab, setTab] = useState("attiva");
  const [showCompose, setShowCompose] = useState(false);
  const [dettaglio, setDettaglio] = useState(null);
  const [subInvoices, setSubInvoices] = usePersistentState("subRentalInvoices", initialSubRentalInvoices);
  const [supplierInv, setSupplierInv] = usePersistentState("supplierInvoices", initialSupplierInvoices);
  const [showActiveForm, setShowActiveForm] = useState(false);
  const [showPassiveForm, setShowPassiveForm] = useState(false);
  const crudActive = useCrudModals(setSubInvoices, "Fatturazione — Attive", i => `${i.number} — ${i.vehicle}`);
  const crudPassive = useCrudModals(setSupplierInv, "Fatturazione — Passive", i => `${i.number} — ${i.supplier}`);

  const sendProforma = (id) => setSubInvoices(prev => prev.map(i => i.id === id ? { ...i, status: i.status === "bozza" ? "inviata" : i.status } : i));

  // Costi già ribaltati: escluderli dalle scelte successive impedisce di
  // addebitare due volte la stessa fattura passiva, errore che in fase di
  // contestazione costa credibilità oltre che denaro.
  const giaRibaltate = subInvoices.flatMap(i => i.ribaltate || []);
  // Una franchigia già addebitata non deve ripresentarsi in un documento
  // successivo: sarebbe un doppio addebito al cliente.
  const giaAddebitate = subInvoices.flatMap(i => i.franchigieAddebitate || []);

  // Numerazione progressiva separata per proforma e fatture
  const prossimoNumero = (tipo) => {
    const prefisso = tipo === "proforma" ? "PF" : "FT";
    const anno = new Date(TODAY).getFullYear();
    const esistenti = subInvoices
      .filter(i => (i.number || "").startsWith(`${prefisso}-${anno}`))
      .map(i => parseInt((i.number || "").split("-")[2], 10))
      .filter(n => Number.isFinite(n));
    const prossimo = (esistenti.length ? Math.max(...esistenti) : 0) + 1;
    return `${prefisso}-${anno}-${String(prossimo).padStart(4, "0")}`;
  };

  // Totale di un documento: l'IVA grava solo sull'imponibile, le somme escluse
  // (franchigie e altri rimborsi) si sommano al netto.
  const totaleDocumento = (i) =>
    Math.round(((i.amountNet || 0) * (1 + (i.vat || 0) / 100) + (i.amountExempt || 0)) * 100) / 100;

  const creaDocumento = (doc) => {
    setSubInvoices(prev => [{
      id: `sri${Date.now()}`,
      number: prossimoNumero(doc.type),
      status: doc.type === "proforma" ? "bozza" : "emessa",
      ...doc,
    }, ...prev]);
    setShowCompose(false);
    setTab("attiva");
  };

  const convertiInFattura = (doc) => {
    setSubInvoices(prev => prev.map(i => i.id === doc.id
      ? { ...i, type: "fattura", number: prossimoNumero("fattura"), status: "emessa", issueDate: TODAY }
      : i));
  };

  const tabs = [
    { id: "attiva", label: "Fatture attive — Subnoleggio" },
    { id: "passiva", label: "Fatture passive — Fornitori" },
    { id: "benchmark", label: "Benchmark Fornitori" },
  ];

  const exportActive = subInvoices.map(i => ({
    "Targa": i.vehicle, "Cliente": i.customer, "Tipo": i.type, "Numero": i.number,
    "Data emissione": i.issueDate, "Scadenza": i.dueDate, "Imponibile": i.amountNet,
    "IVA %": i.vat, "IVA": Math.round(i.amountNet * (i.vat || 0)) / 100,
    "Somme escluse art. 15": i.amountExempt || 0,
    "Totale": totaleDocumento(i), "Stato": i.status,
  }));
  const exportPassive = supplierInv.map(i => ({
    "Fornitore": i.supplier, "Targa": i.vehiclePlate, "Modello": i.vehicleModel, "Numero": i.number,
    "Data fattura": i.invoiceDate, "Scadenza": i.dueDate, "Imponibile": i.amountNet,
    "IVA %": i.vat, "Totale": Math.round(i.amountNet * (1 + i.vat / 100) * 100) / 100,
    "Categoria": i.category, "Stato": i.status,
  }));

  // Benchmark: aggregazione per fornitore
  const bySupplier = Object.values(
    supplierInv.reduce((acc, i) => {
      acc[i.supplier] = acc[i.supplier] || { supplier: i.supplier, count: 0, total: 0 };
      acc[i.supplier].count += 1;
      acc[i.supplier].total += i.amountNet;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  // Benchmark: confronto canone per stesso modello tra fornitori diversi
  const modelComparisons = Object.entries(
    supplierInv.filter(i => i.category === "canone").reduce((acc, i) => {
      acc[i.vehicleModel] = acc[i.vehicleModel] || {};
      acc[i.vehicleModel][i.supplier] = acc[i.vehicleModel][i.supplier] || { sum: 0, count: 0 };
      acc[i.vehicleModel][i.supplier].sum += i.amountNet;
      acc[i.vehicleModel][i.supplier].count += 1;
      return acc;
    }, {})
  ).map(([model, bySup]) => {
    const rows = Object.entries(bySup).map(([supplier, v]) => ({ supplier, avg: v.sum / v.count }));
    rows.sort((a, b) => a.avg - b.avg);
    return { model, rows };
  }).filter(m => m.rows.length > 1);

  return (
    <div>
      <SectionTitle title="Fatturazione" sub="Fatture attive di subnoleggio, fatture passive dei fornitori e benchmark tra fornitori" />

      <div className="flex border-b border-slate-200 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "attiva" && (
        <div>
          <div className="flex justify-between mb-3">
            <div className="flex gap-2">
              <NewRecordButton label="Componi documento" onClick={() => setShowCompose(true)} />
              <button onClick={() => setShowActiveForm(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
                style={{ borderColor: "#cbd5e1", color: "#475569" }}>
                <Plus size={14} /> Inserimento manuale
              </button>
            </div>
            <ExportButton rows={exportActive} filename="fatture_subnoleggio" sheetName="Fatture attive" />
          </div>
          <Card>
            <DataTable
              columns={[
                { key: "number", label: "N° documento" },
                { key: "vehicle", label: "Targa" },
                { key: "customer", label: "Cliente", filterType: "select", options: [...new Set(subInvoices.map(i => i.customer))] },
                { key: "type", label: "Tipo", filterType: "select", options: ["proforma", "fattura"], render: i => <span className="capitalize">{i.type}</span> },
                { key: "issueDate", label: "Emissione" },
                { key: "dueDate", label: "Scadenza" },
                { key: "amountNet", label: "Imponibile", render: i => (
                  <>€ {fmtNumber(i.amountNet, 2)}
                    {i.righe?.length > 0 && (
                      <span className="block text-xs text-slate-400 font-normal">
                        {i.righe.length} rig{i.righe.length === 1 ? "a" : "he"}
                        {i.righe.some(r => r.tipo === "ribaltamento") ? " · con ribaltamenti" : ""}
                      </span>
                    )}
                    {i.amountExempt > 0 && (
                      <span className="block text-xs font-normal" style={{ color: "#0F3C49" }}>
                        + € {fmtNumber(i.amountExempt, 2)} fuori campo IVA
                      </span>
                    )}
                  </>
                ) },
                { key: "status", label: "Stato", filterType: "select", options: Object.keys(invoiceStatusMeta), render: i => <InvoiceBadge status={i.status} /> },
                { key: "_dettaglio", label: "", sortable: false, filterable: false, render: i => (
                  i.righe?.length > 0 ? (
                    <button onClick={(e) => { e.stopPropagation(); setDettaglio(i); }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition hover:bg-slate-50"
                      style={{ borderColor: "#cbd5e1", color: "#475569" }}>
                      Dettaglio
                    </button>
                  ) : null
                ) },
                { key: "_converti", label: "", sortable: false, filterable: false, render: i => (
                  i.type === "proforma" ? (
                    <button onClick={(e) => { e.stopPropagation(); convertiInFattura(i); }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white transition whitespace-nowrap"
                      style={{ backgroundColor: "#2E7D5B" }}>
                      Converti in fattura
                    </button>
                  ) : null
                ) },
                { key: "_action", label: "", sortable: false, filterable: false, render: i => (
                  <div className="flex items-center gap-1">
                    {i.type === "proforma" && i.status === "bozza" && (
                      <button onClick={() => sendProforma(i.id)}
                        className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white transition" style={{ backgroundColor: NAVY_700 }}>
                        <Send size={12} /> Invia
                      </button>
                    )}
                    <RowActions entity={{ type: "fattura_attiva", id: i.id, label: `Documento ${i.number}` }} onEdit={() => crudActive.requestEdit(i)} onDelete={() => crudActive.requestDelete(i)} />
                  </div>
                )},
              ]}
              data={subInvoices}
            />
          </Card>
        </div>
      )}

      {tab === "passiva" && (
        <div>
          <div className="flex justify-between mb-3">
            <NewRecordButton label="Registra fattura fornitore" onClick={() => setShowPassiveForm(true)} />
            <ExportButton rows={exportPassive} filename="fatture_fornitori" sheetName="Fatture passive" />
          </div>
          <Card>
            <DataTable
              columns={[
                { key: "number", label: "N° documento" },
                { key: "supplier", label: "Fornitore", filterType: "select", options: [...new Set(supplierInv.map(i => i.supplier))] },
                { key: "vehiclePlate", label: "Targa / Modello", render: i => (<>{i.vehiclePlate}<span className="block text-xs text-slate-400">{i.vehicleModel}</span></>) },
                { key: "invoiceDate", label: "Data" },
                { key: "category", label: "Categoria", filterType: "select", options: [...new Set(supplierInv.map(i => i.category))], render: i => <span className="capitalize">{i.category}</span> },
                { key: "amountNet", label: "Imponibile", render: i => `€ ${i.amountNet.toLocaleString("it-IT")}` },
                { key: "status", label: "Stato", filterType: "select", options: Object.keys(invoiceStatusMeta), render: i => <InvoiceBadge status={i.status} /> },
                { key: "_actions", label: "", sortable: false, filterable: false, render: i => <RowActions entity={{ type: "fattura_passiva", id: i.id, label: `Fattura ${i.number} — ${i.supplier}` }} onEdit={() => crudPassive.requestEdit(i)} onDelete={() => crudPassive.requestDelete(i)} /> },
              ]}
              data={supplierInv}
            />
          </Card>
        </div>
      )}

      {tab === "benchmark" && (
        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: NAVY_700 }}>
              <Award size={16} /> Spesa totale per fornitore
            </p>
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50/60"><tr><Th>Fornitore</Th><Th>N° fatture</Th><Th>Totale speso</Th><Th>Importo medio</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {bySupplier.map(s => (
                  <tr key={s.supplier}>
                    <Td className="font-semibold">{s.supplier}</Td>
                    <Td>{s.count}</Td>
                    <Td>€ {s.total.toLocaleString("it-IT")}</Td>
                    <Td>€ {Math.round(s.total / s.count).toLocaleString("it-IT")}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: NAVY_700 }}>
              <TrendingDown size={16} /> Confronto canone a parità di modello
            </p>
            <p className="text-xs text-slate-400 mb-4">Il fornitore più conveniente per modello è evidenziato in verde.</p>
            <div className="space-y-4">
              {modelComparisons.map(m => (
                <div key={m.model}>
                  <p className="text-sm font-semibold text-slate-700 mb-1.5">{m.model}</p>
                  <div className="flex flex-wrap gap-2">
                    {m.rows.map((r, idx) => (
                      <div key={r.supplier} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={idx === 0 ? { backgroundColor: "#E7F5EE", color: "#2E7D5B" } : { backgroundColor: "#F1F2F4", color: "#475569" }}>
                        {idx === 0 && <Award size={12} />}
                        {r.supplier} — € {r.avg.toFixed(0)}/mese
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {modelComparisons.length === 0 && <p className="text-sm text-slate-400">Servono almeno due fornitori sullo stesso modello per generare un confronto.</p>}
            </div>
          </Card>
        </div>
      )}

      {showCompose && (
        <NuovaFatturaModal
          partnerList={partnerList} subRentalList={subRentalList} contractList={contractList}
          supplierInv={supplierInv} giaRibaltate={giaRibaltate}
          claimList={claimList} giaAddebitate={giaAddebitate}
          onClose={() => setShowCompose(false)} onSave={creaDocumento} />
      )}

      {dettaglio && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
              <div>
                <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>
                  {dettaglio.type === "proforma" ? "PROFORMA" : "FATTURA"} {dettaglio.number}
                </p>
                <h3 className="text-lg font-bold text-white">{dettaglio.customer}</h3>
              </div>
              <button onClick={() => setDettaglio(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-400 mb-3">
                Emessa il {dettaglio.issueDate} · scadenza {dettaglio.dueDate}
                {dettaglio.note ? ` · ${dettaglio.note}` : ""}
              </p>
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Descrizione</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Costo</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Margine</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Imponibile</th>
                  </tr>
                </thead>
                <tbody>
                  {(dettaglio.righe || []).map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 text-slate-600">{r.descrizione}</td>
                      <td className="py-2 text-right text-slate-400">{r.costo != null ? `€ ${fmtNumber(r.costo, 2)}` : "—"}</td>
                      <td className="py-2 text-right text-slate-400">{r.costo != null ? `${fmtNumber(r.margine, 1)}%` : "—"}</td>
                      <td className="py-2 text-right font-semibold text-slate-700">
                        € {fmtNumber(r.imponibile, 2)}
                        {r.senzaIva && <span className="block text-xs font-normal text-slate-400">senza IVA</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-2 text-right font-semibold" style={{ color: NAVY_700 }}>Imponibile</td>
                    <td className="py-2 text-right font-bold" style={{ color: NAVY_700 }}>€ {fmtNumber(dettaglio.amountNet, 2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-right text-slate-500">IVA {dettaglio.vat}%</td>
                    <td className="py-1 text-right text-slate-600">€ {fmtNumber(dettaglio.amountNet * dettaglio.vat / 100, 2)}</td>
                  </tr>
                  {dettaglio.amountExempt > 0 && (
                    <tr>
                      <td colSpan={3} className="py-1 text-right text-slate-500">
                        Somme escluse — art. 15, co. 1, n. 1, DPR 633/1972
                      </td>
                      <td className="py-1 text-right text-slate-600">€ {fmtNumber(dettaglio.amountExempt, 2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="py-2 text-right font-bold" style={{ color: NAVY_700 }}>Totale</td>
                    <td className="py-2 text-right font-bold" style={{ color: NAVY_700 }}>
                      € {fmtNumber(totaleDocumento(dettaglio), 2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {showActiveForm && (
        <SimpleFormModal
          title="Nuova fattura / proforma subnoleggio" fields={ACTIVE_INVOICE_FIELDS} submitLabel="Registra documento"
          onClose={() => setShowActiveForm(false)}
          onSave={(f) => {
            setSubInvoices(prev => [{ id: `sri${Date.now()}`, ...f, amountNet: parseFloat(f.amountNet) || 0, vat: parseFloat(f.vat) || 22, status: "bozza" }, ...prev]);
            setShowActiveForm(false);
          }}
        />
      )}
      {showPassiveForm && (
        <SimpleFormModal
          title="Registra fattura fornitore" fields={PASSIVE_INVOICE_FIELDS} submitLabel="Registra fattura"
          onClose={() => setShowPassiveForm(false)}
          onSave={(f) => {
            setSupplierInv(prev => [{ id: `spi${Date.now()}`, ...f, amountNet: parseFloat(f.amountNet) || 0, vat: 22, status: "ricevuta" }, ...prev]);
            setShowPassiveForm(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BUDGET PER CENTRO DI COSTO
// ---------------------------------------------------------------------------
function actualSpendByCostCenter(costCenter) {
  return LIVE.vehicles.filter(v => v.costCenter === costCenter).reduce((sum, v) => sum + tcoDi(v), 0);
}

const BUDGET_FORM_FIELDS = [
  { key: "costCenter", label: "Centro di costo", required: true },
  { key: "company", label: "Società", type: "select", required: true, get options() { return LIVE.companies.map(c => ({ value: c.id, label: c.name })); } },
  { key: "period", label: "Periodo (AAAA-MM)", required: true, placeholder: "2026-08" },
  { key: "budget", label: "Budget mensile (€)", type: "number", required: true },
];

function BudgetView() {
  const [budgets, setBudgets] = usePersistentState("budgets", initialCostCenterBudgets);
  const [showForm, setShowForm] = useState(false);
  const crud = useCrudModals(setBudgets, "Budget Centri di Costo", b => `${b.costCenter} — ${b.period}`);

  const updateBudget = (id, value) => setBudgets(prev => prev.map(b => b.id === id ? { ...b, budget: parseFloat(value) || 0 } : b));

  const rows = budgets.map(b => {
    const actual = actualSpendByCostCenter(b.costCenter);
    const variance = b.budget - actual;
    const pct = b.budget > 0 ? (actual / b.budget) * 100 : 0;
    return { ...b, actual, variance, pct };
  });

  const exportRows = rows.map(r => ({
    "Centro di costo": r.costCenter, "Società": companyName(r.company), "Periodo": r.period,
    "Budget": r.budget, "Speso": r.actual, "Scostamento": r.variance, "% Utilizzo": r.pct.toFixed(1),
  }));

  return (
    <div>
      <SectionTitle
        title="Budget per Centro di Costo" sub="Budget mensile di spesa confrontato con il costo effettivo (TCO) dei veicoli in ciascun centro"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="budget_centri_costo" sheetName="Budget" />
            <NewRecordButton label="Nuovo centro di costo" onClick={() => setShowForm(true)} />
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map(r => {
          const over = r.pct > 100;
          const color = over ? "#B4302E" : r.pct > 85 ? "#B07A12" : "#2E7D5B";
          return (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm text-slate-800">{r.costCenter}</p>
                  <p className="text-xs text-slate-400">{companyName(r.company)} · {r.period}</p>
                </div>
                <div className="flex items-center gap-1">
                  {over && <AlertTriangle size={16} style={{ color: "#B4302E" }} className="mr-1" />}
                  <RowActions entity={{ type: "budget", id: r.id, label: `Budget ${r.costCenter}` }} onEdit={() => crud.requestEdit(r)} onDelete={() => crud.requestDelete(r)} />
                </div>
              </div>

              <div className="flex items-end gap-2 mb-1.5">
                <span className="text-2xl font-bold" style={{ color: NAVY_700 }}>€ {r.actual.toLocaleString("it-IT")}</span>
                <span className="text-xs text-slate-400 mb-1">speso su</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">Budget:</span>
                <input
                  type="number" value={r.budget}
                  onChange={e => updateBudget(r.id, e.target.value)}
                  className="w-24 border border-slate-300 rounded-lg px-2 py-1 text-sm font-semibold"
                />
                <span className="text-xs text-slate-400">€/mese</span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, r.pct)}%`, backgroundColor: color }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-semibold" style={{ color }}>{r.pct.toFixed(0)}% del budget</span>
                <span className="text-xs" style={{ color: r.variance < 0 ? "#B4302E" : "#2E7D5B" }}>
                  {r.variance < 0 ? "Sforamento" : "Residuo"}: € {Math.abs(r.variance).toLocaleString("it-IT")}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <SimpleFormModal
          title="Nuovo centro di costo" fields={BUDGET_FORM_FIELDS} submitLabel="Aggiungi"
          onClose={() => setShowForm(false)}
          onSave={(f) => { setBudgets(prev => [{ id: `b${Date.now()}`, ...f, budget: parseFloat(f.budget) || 0 }, ...prev]); setShowForm(false); }}
        />
      )}
      {crud.editing && (
        <SimpleFormModal
          title={`Modifica centro di costo — ${crud.editing.costCenter}`} fields={BUDGET_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f, budget: parseFloat(f.budget) || 0 })}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal
          itemLabel={`il budget di ${crud.deleting.costCenter} (${crud.deleting.period})`} moduleLabel="Budget Centri di Costo"
          onClose={crud.cancelDelete} onConfirm={crud.confirmDelete}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UTENTI AUTORIZZATI — PIN operatore per le eliminazioni
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// REGISTRO ELIMINAZIONI — contesto condiviso da tutti i moduli
// ---------------------------------------------------------------------------
const AuditLogContext = createContext(null);
function useAuditLog() { return useContext(AuditLogContext); }

function AuditLogProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const refresh = useCallback(() => {
    fleetApi("/api/audit").then(result => setEntries(result.data)).catch(() => {});
  }, []);
  useEffect(() => {
    refresh(); window.addEventListener("fleet-data-saved", refresh);
    return () => window.removeEventListener("fleet-data-saved", refresh);
  }, [refresh]);
  const logDeletion = () => { /* Il server registra le eliminazioni al commit. */ };
  return <AuditLogContext.Provider value={{ entries, logDeletion }}>{children}</AuditLogContext.Provider>;
}

// ---------------------------------------------------------------------------
// CONFERMA ELIMINAZIONE CON PIN — riusata da tutti i moduli
// ---------------------------------------------------------------------------
function PinConfirmModal({ itemLabel, moduleLabel, onClose, onConfirm }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { canEdit, currentModule } = usePermissions();
  const submit = async e => {
    e.preventDefault();
    if (busy || !canEdit(currentModule)) return;
    setBusy(true); setError("");
    try {
      const result = await fleetApi("/api/auth/reauth", {method:"POST", body:JSON.stringify({password})});
      setPassword(""); onConfirm({name:result.user.fullName,role:result.user.role,canDelete:true});
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><form onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
    <h2 className="text-lg font-bold">Conferma eliminazione</h2>
    <p className="text-sm">Eliminare {itemLabel} da {moduleLabel}?</p>
    <label className="block text-sm">Conferma la tua password<input autoFocus required autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="block w-full border rounded-xl p-3 mt-2" /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex gap-3"><button type="button" onClick={onClose} className="border rounded-xl px-4 py-3">Annulla</button><button disabled={busy || !canEdit(currentModule)} className="rounded-xl px-4 py-3 bg-red-700 text-white disabled:opacity-50">{busy ? "Verifica…" : "Elimina"}</button></div>
  </form></div>;
}

// ---------------------------------------------------------------------------
// AZIONI RIGA — Modifica / Elimina, riusate da ogni modulo
// ---------------------------------------------------------------------------
function RowActions({ onEdit, onDelete, entity }) {
  const editable = useCanEditHere();
  return (
    <div className="flex items-center gap-1">
      {entity && <AttachButton entity={entity} />}
      {!editable && !entity && <span className="text-xs text-slate-300">sola lettura</span>}
      {editable && onEdit && (
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Modifica"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
          <Pencil size={14} />
        </button>
      )}
      {editable && onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Elimina"
          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// Hook di comodo: incapsula apertura form di modifica + conferma PIN di eliminazione
// per una lista in stato locale (list/setList), identificata da id.
function useCrudModals(setList, moduleLabel, getLabel) {
  const { logDeletion } = useAuditLog();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const requestEdit = (record) => setEditing(record);
  const requestDelete = (record) => setDeleting(record);
  const cancelEdit = () => setEditing(null);
  const cancelDelete = () => setDeleting(null);

  const confirmEdit = (values) => {
    setList(prev => prev.map(r => r.id === editing.id ? { ...r, ...values } : r));
    setEditing(null);
  };
  const confirmDelete = (user) => {
    setList(prev => prev.filter(r => r.id !== deleting.id));
    logDeletion({ module: moduleLabel, record: getLabel(deleting), user });
    setDeleting(null);
  };

  return { editing, deleting, requestEdit, requestDelete, cancelEdit, cancelDelete, confirmEdit, confirmDelete };
}

// ---------------------------------------------------------------------------
// REGISTRO ELIMINAZIONI — tracciabilità di chi ha eliminato cosa
// ---------------------------------------------------------------------------
function RegistroEliminazioniView() {
  const { entries } = useAuditLog();

  const exportRows = entries.map(e => ({
    "Data/Ora": new Date(e.timestamp).toLocaleString("it-IT"), "Modulo": e.module, "Elemento eliminato": e.record,
    "Utente": e.userName, "Ruolo": e.userRole,
  }));

  const columns = [
    { key: "timestamp", label: "Data/Ora", render: e => new Date(e.timestamp).toLocaleString("it-IT") },
    { key: "module", label: "Modulo", filterType: "select", options: [...new Set(entries.map(e => e.module))] },
    { key: "record", label: "Elemento eliminato" },
    { key: "userName", label: "Utente", filterType: "select", options: [...new Set(entries.map(e => e.userName))] },
    { key: "userRole", label: "Ruolo" },
  ];

  return (
    <div>
      <SectionTitle
        title="Registro Eliminazioni" sub="Tracciabilità completa: chi ha eliminato cosa, quando e da quale modulo"
        action={<ExportButton rows={exportRows} filename="registro_eliminazioni" sheetName="Eliminazioni" />}
      />
      <Card>
        <DataTable columns={columns} data={entries} emptyLabel="Nessuna eliminazione registrata finora." />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RIMBORSO ACCISE — estrazione trimestrale per mezzi pesanti
// ---------------------------------------------------------------------------
// La domanda di rimborso dell'accisa sul gasolio per autotrazione (Agenzia
// delle Dogane e dei Monopoli) riguarda i veicoli di massa complessiva pari o
// superiore a 7,5 t. La soglia e l'aliquota sono qui parametriche: vanno
// verificate a ogni trimestre sul provvedimento AdM vigente prima dell'invio.
const EXCISE_DEFAULT_RATE = 0.214;   // €/litro — valore indicativo, da confermare
const EXCISE_MASS_THRESHOLD = 7500;  // kg

const QUARTERS = [
  { id: "2026-Q1", label: "1° trimestre 2026", start: "2026-01-01", end: "2026-03-31" },
  { id: "2026-Q2", label: "2° trimestre 2026", start: "2026-04-01", end: "2026-06-30" },
  { id: "2026-Q3", label: "3° trimestre 2026", start: "2026-07-01", end: "2026-09-30" },
  { id: "2026-Q4", label: "4° trimestre 2026", start: "2026-10-01", end: "2026-12-31" },
];

function computeExciseRow(vehicle, quarter) {
  const inQuarter = LIVE.fuelTransactions
    .filter(t => t.vehicle === vehicle.plate && t.date >= quarter.start && t.date <= quarter.end)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (inQuarter.length === 0) return null;

  const litres = inQuarter.reduce((s, t) => s + t.litres, 0);
  const cost = inQuarter.reduce((s, t) => s + t.amount, 0);

  // Km percorsi: dall'ultima lettura precedente al trimestre all'ultima del trimestre.
  const before = LIVE.fuelTransactions
    .filter(t => t.vehicle === vehicle.plate && t.date < quarter.start)
    .sort((a, b) => a.date.localeCompare(b.date));
  const startOdo = before.length ? before[before.length - 1].odometer : inQuarter[0].odometer;
  const endOdo = inQuarter[inQuarter.length - 1].odometer;
  const km = Math.max(0, endOdo - startOdo);

  return {
    id: vehicle.id,
    plate: vehicle.plate,
    vehicle: `${vehicle.make} ${vehicle.model}`,
    mass: vehicle.maxLadenMass,
    euroClass: vehicle.euroClass,
    company: vehicle.company,
    km,
    litres: Math.round(litres * 10) / 10,
    avgKmPerLitre: litres > 0 ? Math.round((km / litres) * 100) / 100 : 0,
    cost: Math.round(cost * 100) / 100,
    avgPricePerLitre: litres > 0 ? Math.round((cost / litres) * 1000) / 1000 : 0,
    eligible: vehicle.maxLadenMass >= EXCISE_MASS_THRESHOLD,
    transactions: inQuarter.length,
  };
}

function AcciseView({ vehicleList }) {
  const [quarterId, setQuarterId] = useState("2026-Q1");
  const [massFilter, setMassFilter] = useState("7500");
  const [rate, setRate] = useState(EXCISE_DEFAULT_RATE);

  const quarter = QUARTERS.find(q => q.id === quarterId);
  const threshold = parseInt(massFilter);

  const rows = vehicleList
    .filter(v => (v.maxLadenMass || 0) > 3500)
    .filter(v => (v.maxLadenMass || 0) >= threshold)
    .map(v => computeExciseRow(v, quarter))
    .filter(Boolean)
    .sort((a, b) => b.litres - a.litres);

  const eligibleRows = rows.filter(r => r.eligible);
  const totLitres = eligibleRows.reduce((s, r) => s + r.litres, 0);
  const totKm = eligibleRows.reduce((s, r) => s + r.km, 0);
  const totCost = eligibleRows.reduce((s, r) => s + r.cost, 0);
  const rebate = totLitres * (parseFloat(rate) || 0);

  const exportRows = rows.map(r => ({
    "Targa": r.plate, "Veicolo": r.vehicle, "Massa complessiva (kg)": r.mass, "Classe Euro": r.euroClass,
    "Società": companyName(r.company), "Trimestre": quarter.label,
    "Km percorsi": r.km, "Litri consumati": r.litres, "Media km/L": r.avgKmPerLitre,
    "Costo carburante (€)": r.cost, "Prezzo medio €/L": r.avgPricePerLitre,
    "Ammesso al rimborso": r.eligible ? "SI" : "NO",
    "Rimborso stimato (€)": r.eligible ? Math.round(r.litres * (parseFloat(rate) || 0) * 100) / 100 : 0,
  }));

  const columns = [
    { key: "plate", label: "Targa", render: r => (<>{r.plate}<span className="block text-xs text-slate-400 font-normal">{r.vehicle}</span></>) },
    { key: "mass", label: "Massa", render: r => (
      <span className="text-xs font-semibold px-2 py-1 rounded-full"
        style={r.eligible ? { backgroundColor: "#E7F5EE", color: "#2E7D5B" } : { backgroundColor: "#F1F2F4", color: "#6B7280" }}>
        {(r.mass / 1000).toFixed(1).replace(".", ",")} t
      </span>
    )},
    { key: "km", label: "Km percorsi", render: r => r.km.toLocaleString("it-IT") },
    { key: "litres", label: "Litri", render: r => r.litres.toLocaleString("it-IT") },
    { key: "avgKmPerLitre", label: "Media km/L", render: r => (
      <span className="font-semibold" style={{ color: NAVY_700 }}>{r.avgKmPerLitre.toString().replace(".", ",")}</span>
    )},
    { key: "cost", label: "Costo carburante", render: r => `€ ${r.cost.toLocaleString("it-IT", { minimumFractionDigits: 2 })}` },
    { key: "avgPricePerLitre", label: "€/L medio", render: r => `€ ${r.avgPricePerLitre.toString().replace(".", ",")}` },
    { key: "eligible", label: "Rimborso", filterType: "select", options: [{ value: "true", label: "Ammesso" }, { value: "false", label: "Escluso" }],
      accessor: r => String(r.eligible),
      render: r => r.eligible
        ? <span className="text-sm font-semibold" style={{ color: "#2E7D5B" }}>€ {(r.litres * (parseFloat(rate) || 0)).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        : <span className="text-xs text-slate-400">non ammesso</span>
    },
  ];

  return (
    <div>
      <SectionTitle
        title="Rimborso Accise Gasolio"
        sub="Estrazione trimestrale km percorsi, litri consumati, media km/L e costo carburante per la dichiarazione all'Agenzia delle Dogane e dei Monopoli"
        action={<ExportButton rows={exportRows} filename={`rimborso_accise_${quarterId}`} sheetName={quarterId} />}
      />

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <p className="text-xs text-slate-500 mb-1">Trimestre di riferimento</p>
          <select value={quarterId} onChange={e => setQuarterId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            {QUARTERS.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Soglia massa complessiva</p>
          <select value={massFilter} onChange={e => setMassFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="3501">Superiore a 3,5 t (tutti i pesanti)</option>
            <option value="7500">Pari o superiore a 7,5 t (ammessi al rimborso)</option>
          </select>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Aliquota rimborso (€/litro)</p>
          <input type="number" step="0.001" value={rate} onChange={e => setRate(e.target.value)}
            className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <KPI icon={Truck} label="Mezzi ammessi" value={eligibleRows.length} sub={`su ${rows.length} pesanti nel periodo`} />
        <KPI icon={MapPin} label="Km percorsi" value={totKm.toLocaleString("it-IT")} sub={quarter.label} accent="#1B6DB0" />
        <KPI icon={Fuel} label="Litri consumati" value={totLitres.toLocaleString("it-IT")} sub={totKm > 0 && totLitres > 0 ? `media ${(totKm / totLitres).toFixed(2).replace(".", ",")} km/L` : "—"} accent="#B07A12" />
        <KPI icon={Coins} label="Rimborso stimato" value={`€ ${rebate.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`su € ${totCost.toLocaleString("it-IT", { minimumFractionDigits: 2 })} di carburante`} accent="#2E7D5B" />
      </div>

      <Card className="mb-5">
        <DataTable columns={columns} data={rows} emptyLabel="Nessun mezzo con consumi registrati nel trimestre selezionato." />
      </Card>

      <div className="flex gap-2.5 rounded-lg p-4 text-sm" style={{ backgroundColor: "#FBF1DC" }}>
        <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" style={{ color: "#B07A12" }} />
        <div style={{ color: "#7A5C0E" }}>
          <p className="font-semibold mb-1">Verifica prima dell'invio</p>
          <p className="text-xs leading-relaxed">
            Soglia di massa e aliquota di rimborso sono parametriche e impostate su valori indicativi: vanno confrontate
            con il provvedimento dell'Agenzia delle Dogane e dei Monopoli vigente per il trimestre di riferimento, insieme
            ai requisiti di classe ambientale minima ammessa. I litri considerati sono quelli dei rifornimenti registrati
            in piattaforma nel periodo; i km derivano dalle letture contachilometri associate ai rifornimenti.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// IMPORTAZIONE DATI DA TEMPLATE — Upload → Mapping → Validazione → Preview → Import
// ---------------------------------------------------------------------------
// Ogni template dichiara: colonne attese, campo interno, obbligatorietà, tipo e
// dominio dei valori ammessi. La chiave identifica il record: se già presente
// viene SOVRASCRITTO, altrimenti inserito.
const IMPORT_TEMPLATES = {
  flotta: {
    label: "Anagrafica Flotta",
    keyField: "vin",
    keyHeader: "Telaio (VIN)",
    idPrefix: "v",
    columns: [
      { header: "Telaio (VIN)", field: "vin", required: true, type: "text" },
      { header: "Targa", field: "plate", required: true, type: "text" },
      { header: "Targa interna", field: "internalPlate", type: "text" },
      { header: "N° Carta di circolazione", field: "docNumber", type: "text" },
      { header: "N° motore", field: "engineNumber", type: "text" },
      { header: "Marca", field: "make", required: true, type: "text" },
      { header: "Modello", field: "model", required: true, type: "text" },
      { header: "Versione", field: "version", type: "text" },
      { header: "Colore", field: "color", type: "text" },
      { header: "Alimentazione", field: "fuel", type: "enum", options: ["Diesel", "Benzina", "Elettrico", "Ibrido", "GPL", "Metano"] },
      { header: "Classe Euro", field: "euroClass", type: "text" },
      { header: "Massa complessiva (kg)", field: "maxLadenMass", type: "number" },
      { header: "Km attuali", field: "km", type: "number" },
      { header: "Stato", field: "status", type: "enum", options: Object.keys(statusMeta) },
      { header: "Società", field: "company", type: "enum", options: LIVE.companies.map(c => c.id) },
      { header: "Centro di costo", field: "costCenter", type: "text" },
      { header: "Conducente", field: "driver", type: "text" },
      { header: "Tipo contratto", field: "availability", type: "enum", options: Object.keys(availabilityLabel) },
      { header: "Società di noleggio", field: "rentalSupplier", type: "text" },
    ],
    example: {
      vin: "WVWZZZ1KZAW000099", plate: "FR099ZZ", internalPlate: "FR-LIV-099", docNumber: "A2216299RM21",
      engineNumber: "CFHC000099", make: "Volkswagen", model: "Caddy Cargo", version: "2.0 TDI 102CV",
      color: "Bianco", fuel: "Diesel", euroClass: "Euro 6D", maxLadenMass: 2400, km: 12000,
      status: "disponibile", company: "demo", costCenter: "AMZ-LIV", driver: "—",
      availability: "noleggio", rentalSupplier: "Ayvens",
    },
  },
  contratti: {
    label: "Contratti",
    keyField: "_key", keyHeader: "Targa + N° contratto", idPrefix: "c",
    keyBuilder: r => `${r.vehicle}|${r.contractNumber || ""}`,
    columns: [
      { header: "Targa", field: "vehicle", required: true, type: "text" },
      { header: "N° contratto", field: "contractNumber", type: "text" },
      { header: "Tipo", field: "type", required: true, type: "enum", options: ["noleggio", "leasing", "finanziamento", "acquisto"] },
      { header: "Fornitore", field: "supplier", required: true, type: "text" },
      { header: "Canone mensile", field: "fee", required: true, type: "number" },
      { header: "Scadenza", field: "end", required: true, type: "date" },
      { header: "Stato", field: "status", type: "enum", options: ["attivo", "in_rinnovo", "scaduto", "chiuso"] },
    ],
    example: { vehicle: "FR001AB", contractNumber: "AYV-2026-01", type: "noleggio", supplier: "Ayvens", fee: 480, end: "2027-03-01", status: "attivo" },
  },
  scadenze: {
    label: "Scadenze & Compliance",
    keyField: "_key", keyHeader: "Targa + Tipo", idPrefix: "d",
    keyBuilder: r => `${r.vehicle}|${r.type}`,
    columns: [
      { header: "Targa", field: "vehicle", required: true, type: "text" },
      { header: "Tipo scadenza", field: "type", required: true, type: "text" },
      { header: "Data scadenza", field: "due", required: true, type: "date" },
    ],
    example: { vehicle: "FR001AB", type: "Revisione", due: "2027-03-12" },
  },
  manutenzione: {
    label: "Manutenzione",
    keyField: "_key", keyHeader: "Targa + Data", idPrefix: "m",
    keyBuilder: r => `${r.vehicle}|${r.scheduled}`,
    columns: [
      { header: "Targa", field: "vehicle", required: true, type: "text" },
      { header: "Tipo", field: "type", required: true, type: "enum", options: ["ordinaria", "straordinaria", "programmata"] },
      { header: "Officina", field: "workshop", required: true, type: "text" },
      { header: "Data", field: "scheduled", required: true, type: "date" },
      { header: "Costo", field: "cost", type: "number" },
      { header: "Stato", field: "status", type: "enum", options: ["richiesta", "preventivata", "autorizzata", "in_corso", "completata", "fatturata"] },
    ],
    example: { vehicle: "FR001AB", type: "ordinaria", workshop: "Officina Del Porto", scheduled: "2026-09-15", cost: 320, status: "richiesta" },
  },
  sinistri: {
    label: "Sinistri",
    keyField: "_key", keyHeader: "Targa + Data", idPrefix: "s",
    keyBuilder: r => `${r.vehicle}|${r.date}`,
    columns: [
      { header: "Targa", field: "vehicle", required: true, type: "text" },
      { header: "Data", field: "date", required: true, type: "date" },
      { header: "Conducente", field: "driver", type: "text" },
      { header: "Danno stimato", field: "damage", required: true, type: "number" },
      { header: "Stato", field: "status", type: "enum", options: ["aperto", "attesa_perizia", "in_riparazione", "liquidato"] },
    ],
    example: { vehicle: "FR001AB", date: "2026-08-01", driver: "M. Bianchi", damage: 1200, status: "aperto" },
  },
  verbali: {
    label: "Verbali & Multe",
    keyField: "_key", keyHeader: "Targa + Data", idPrefix: "f",
    keyBuilder: r => `${r.vehicle}|${r.date}`,
    columns: [
      { header: "Targa", field: "vehicle", required: true, type: "text" },
      { header: "Ente", field: "authority", required: true, type: "text" },
      { header: "Data", field: "date", required: true, type: "date" },
      { header: "Conducente", field: "driver", type: "text" },
      { header: "Importo", field: "amount", required: true, type: "number" },
      { header: "Stato", field: "status", type: "enum", options: ["ricevuto", "notificato_conducente", "in_ricorso", "pagato"] },
    ],
    example: { vehicle: "FR001AB", authority: "Comune di Livorno", date: "2026-08-10", driver: "M. Bianchi", amount: 42, status: "ricevuto" },
  },
  rifornimenti: {
    label: "Rifornimenti",
    keyField: "_key", keyHeader: "Targa + Data + Km", idPrefix: "ft",
    keyBuilder: r => `${r.vehicle}|${r.date}|${r.odometer}`,
    columns: [
      { header: "Targa", field: "vehicle", required: true, type: "text" },
      { header: "Data", field: "date", required: true, type: "date" },
      { header: "Km", field: "odometer", required: true, type: "number" },
      { header: "Litri", field: "litres", required: true, type: "number" },
      { header: "Importo (€)", field: "amount", type: "number" },
      { header: "Fonte", field: "source", type: "text" },
    ],
    example: { vehicle: "FR009BA", date: "2026-06-15", odometer: 195000, litres: 305, amount: 478.5, source: "Cisterna AMZ-LIV" },
    rowValidator: (record, ctx) => validateRefuel(
      { plate: record.vehicle, date: record.date, odometer: record.odometer, litres: record.litres },
      [...ctx.existingList, ...ctx.acceptedSoFar]
    ),
  },
  partner: {
    label: "Clienti & Fornitori",
    keyField: "name", keyHeader: "Ragione sociale", idPrefix: "p",
    columns: [
      { header: "Ragione sociale", field: "name", required: true, type: "text" },
      { header: "Tipo", field: "type", required: true, type: "enum", options: ["cliente", "fornitore", "entrambi"] },
      { header: "Città", field: "city", type: "text" },
      { header: "P.IVA", field: "vat", type: "text" },
      { header: "Codice SDI", field: "sdi", required: true, type: "text", maxLength: 7 },
      { header: "PEC", field: "pec", type: "text" },
      { header: "IBAN", field: "iban", type: "text" },
      { header: "Termini pagamento (gg)", field: "paymentTerms", type: "number" },
      { header: "Referente", field: "contactName", type: "text" },
      { header: "Email referente", field: "contactEmail", type: "text" },
      { header: "Telefono", field: "contactPhone", type: "text" },
    ],
    example: { name: "Nuovo Fornitore S.r.l.", type: "fornitore", city: "Livorno", vat: "IT01234567890", sdi: "ABC1234", pec: "fornitore@pec.it", iban: "IT00X0000000000000000000000", paymentTerms: 30, contactName: "Mario Rossi", contactEmail: "info@fornitore.it", contactPhone: "0586 000000" },
  },
};

async function downloadTemplate(tplId) {
  const tpl = IMPORT_TEMPLATES[tplId];
  const headerRow = {};
  const exampleRow = {};
  const hintRow = {};
  tpl.columns.forEach(c => {
    headerRow[c.header] = c.header;
    exampleRow[c.header] = tpl.example[c.field] ?? "";
    hintRow[c.header] = [
      c.required ? "OBBLIGATORIO" : "facoltativo",
      c.type === "enum" ? `valori: ${c.options.join(" | ")}` : c.type === "date" ? "formato AAAA-MM-GG" : c.type === "number" ? "numero" : "testo",
    ].join(" — ");
  });
  const XLSX = await caricaXLSX();
  const ws = XLSX.utils.json_to_sheet([hintRow, exampleRow], { header: tpl.columns.map(c => c.header) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  downloadWorkbook(wb, `template_${tplId}`);
}

// ---------------------------------------------------------------------------
// CONTROLLO CHILOMETRICO — validazione condivisa (manuale e import massivo)
// ---------------------------------------------------------------------------
// Regole:
//  • BLOCCANTE: km inferiori all'ultima lettura registrata per quel veicolo
//    (il contachilometri non torna indietro) o km superiori a una lettura
//    successiva già presente.
//  • SEGNALAZIONE: percorrenza anomala fra due rifornimenti, oppure media
//    km/L troppo distante dallo storico del mezzo o fuori da una banda fisica
//    plausibile — indizio tipico di km digitati male o litri attribuiti alla
//    targa sbagliata.
const KM_RULES = {
  maxKmBetweenRefuels: 3000,   // percorrenza sospetta fra due rifornimenti
  minKmPerLitre: 1.5,          // sotto: consumo implausibile
  maxKmPerLitre: 25,           // sopra: consumo implausibile
  deviationPct: 40,            // scostamento massimo dalla media storica del mezzo
};

function vehicleFuelHistory(plate, transactions) {
  return transactions
    .filter(t => t.vehicle === plate)
    .sort((a, b) => (a.date === b.date ? a.odometer - b.odometer : a.date.localeCompare(b.date)));
}

function historicalKmPerLitre(plate, transactions) {
  const h = vehicleFuelHistory(plate, transactions);
  if (h.length < 2) return null;
  const km = h[h.length - 1].odometer - h[0].odometer;
  const litres = h.slice(1).reduce((s, t) => s + t.litres, 0);
  return litres > 0 && km > 0 ? km / litres : null;
}

function validateRefuel({ plate, date, odometer, litres }, transactions) {
  const errors = [];
  const warnings = [];
  const km = parseFloat(odometer);
  const lt = parseFloat(litres);
  const history = vehicleFuelHistory(plate, transactions);

  if (history.length === 0 && !LIVE.vehicles.some(v => v.plate === plate)) {
    warnings.push(`Targa ${plate} non presente in anagrafica flotta`);
  }

  const previous = history.filter(t => t.date <= date).pop();
  const following = history.find(t => t.date > date);

  // --- Regola bloccante: il contachilometri non può diminuire ---
  if (previous && km < previous.odometer) {
    errors.push(`Km ${km.toLocaleString("it-IT")} inferiori all'ultima lettura del ${previous.date} (${previous.odometer.toLocaleString("it-IT")} km)`);
  }
  if (following && km > following.odometer) {
    errors.push(`Km ${km.toLocaleString("it-IT")} superiori alla lettura successiva del ${following.date} (${following.odometer.toLocaleString("it-IT")} km)`);
  }

  // --- Segnalazioni su percorrenza e consumo ---
  if (previous && km >= previous.odometer) {
    const delta = km - previous.odometer;
    if (delta > KM_RULES.maxKmBetweenRefuels) {
      warnings.push(`Percorrenza elevata dall'ultimo rifornimento: ${delta.toLocaleString("it-IT")} km`);
    }
    if (lt > 0 && delta > 0) {
      const kmPerL = delta / lt;
      if (kmPerL < KM_RULES.minKmPerLitre) {
        warnings.push(`Media ${kmPerL.toFixed(2).replace(".", ",")} km/L troppo bassa (soglia ${KM_RULES.minKmPerLitre})`);
      } else if (kmPerL > KM_RULES.maxKmPerLitre) {
        warnings.push(`Media ${kmPerL.toFixed(2).replace(".", ",")} km/L troppo alta (soglia ${KM_RULES.maxKmPerLitre})`);
      } else {
        const avg = historicalKmPerLitre(plate, transactions);
        if (avg) {
          const dev = Math.abs((kmPerL - avg) / avg) * 100;
          if (dev > KM_RULES.deviationPct) {
            warnings.push(`Media ${kmPerL.toFixed(2).replace(".", ",")} km/L scostata del ${dev.toFixed(0)}% dallo storico del mezzo (${avg.toFixed(2).replace(".", ",")} km/L)`);
          }
        }
      }
    }
    if (delta === 0) warnings.push("Km invariati rispetto al rifornimento precedente");
  }

  return { errors, warnings };
}

function validateImportRows(rawRows, tpl, existingList) {
  const seenKeys = new Set();
  // Righe già validate nel file: servono ai controlli progressivi (es. i km
  // devono restare coerenti anche fra due righe dello stesso file).
  const acceptedSoFar = [];
  return rawRows.map((raw, idx) => {
    const errors = [];
    const warnings = [];
    const record = {};

    tpl.columns.forEach(c => {
      let v = raw[c.header];
      if (v === undefined || v === null || String(v).trim() === "") {
        if (c.required) errors.push(`"${c.header}" è obbligatorio`);
        return;
      }
      v = typeof v === "string" ? v.trim() : v;

      if (c.type === "number") {
        const n = parseFloat(String(v).replace(",", "."));
        if (isNaN(n)) { errors.push(`"${c.header}" deve essere numerico (valore: ${v})`); return; }
        if (n < 0) errors.push(`"${c.header}" non può essere negativo`);
        v = n;
      }
      if (c.type === "date") {
        const d = String(v).slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(new Date(d).getTime())) {
          errors.push(`"${c.header}" deve essere una data valida AAAA-MM-GG (valore: ${v})`); return;
        }
        v = d;
      }
      if (c.type === "enum" && !c.options.includes(String(v))) {
        errors.push(`"${c.header}": valore "${v}" non ammesso`); return;
      }
      if (c.maxLength && String(v).length > c.maxLength) {
        errors.push(`"${c.header}" supera ${c.maxLength} caratteri`);
      }
      record[c.field] = v;
    });

    // Chiave identificativa
    const key = tpl.keyBuilder ? tpl.keyBuilder(record) : record[tpl.keyField];
    if (!key || String(key).includes("undefined")) {
      errors.push("Chiave identificativa incompleta");
    } else if (seenKeys.has(key)) {
      errors.push(`Chiave duplicata nel file: ${key}`);
    } else {
      seenKeys.add(key);
    }

    const existing = existingList.find(e => (tpl.keyBuilder ? tpl.keyBuilder(e) : e[tpl.keyField]) === key);

    // Controlli di qualità specifici
    if (tpl.keyField === "vin") {
      const platedup = existingList.find(e => e.plate === record.plate && e.vin !== record.vin);
      if (platedup) errors.push(`Targa ${record.plate} già assegnata a un altro telaio (${platedup.vin})`);
      if (existing && record.km != null && existing.km != null && record.km < existing.km) {
        warnings.push(`Km in diminuzione: ${existing.km.toLocaleString("it-IT")} → ${record.km.toLocaleString("it-IT")}`);
      }
    }

    // Validazione specifica del template (es. controllo chilometrico)
    if (tpl.rowValidator) {
      const extra = tpl.rowValidator(record, { existingList, acceptedSoFar });
      errors.push(...extra.errors);
      warnings.push(...extra.warnings);
    }
    if (errors.length === 0) acceptedSoFar.push(record);

    return { rowNumber: idx + 2, record, key, errors, warnings, action: existing ? "aggiorna" : "inserisci", existing };
  });
}

function ImportazioneView({ store }) {
  const [tplId, setTplId] = useState("flotta");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState("");
  const [imported, setImported] = useState(null);

  const tpl = IMPORT_TEMPLATES[tplId];
  const target = store[tplId];

  const reset = () => { setParsed(null); setFileName(""); setParseError(""); setImported(null); };

  const handleFile = (files) => {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name); setParseError(""); setImported(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await caricaXLSX();
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        let rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        // Scarta l'eventuale riga di istruzioni del template
        rows = rows.filter(r => !String(Object.values(r)[0] ?? "").includes("OBBLIGATORIO") && !String(Object.values(r)[0] ?? "").includes("facoltativo"));
        if (rows.length === 0) { setParseError("Il file non contiene righe di dati."); setParsed(null); return; }
        setParsed(validateImportRows(rows, tpl, target.list));
      } catch (err) {
        setParseError("Impossibile leggere il file. Verifica che sia un .xlsx generato dal template.");
        setParsed(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const valid = parsed ? parsed.filter(r => r.errors.length === 0) : [];
  const invalid = parsed ? parsed.filter(r => r.errors.length > 0) : [];
  const toUpdate = valid.filter(r => r.action === "aggiorna");
  const toInsert = valid.filter(r => r.action === "inserisci");

  const applyImport = () => {
    target.setList(prev => {
      let next = [...prev];
      valid.forEach(r => {
        const idx = next.findIndex(e => (tpl.keyBuilder ? tpl.keyBuilder(e) : e[tpl.keyField]) === r.key);
        if (idx >= 0) next[idx] = { ...next[idx], ...r.record };            // SOVRASCRITTURA
        else next = [{ id: `${tpl.idPrefix}${Date.now()}${Math.random().toString(36).slice(2, 5)}`, ...r.record }, ...next];
      });
      return next;
    });
    setImported({ updated: toUpdate.length, inserted: toInsert.length, skipped: invalid.length });
    setParsed(null);
  };

  const errorExport = invalid.map(r => ({
    "Riga file": r.rowNumber, "Chiave": r.key || "—", "Errori": r.errors.join(" · "),
  }));

  return (
    <div>
      <SectionTitle
        title="Importazione Dati"
        sub="Aggiornamento massivo da file Excel conforme al template: i record esistenti vengono sovrascritti, i nuovi inseriti"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <Card className="p-5 col-span-2">
          <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>1 · Seleziona il modulo e scarica il template</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Modulo di destinazione</p>
              <select value={tplId} onChange={e => { setTplId(e.target.value); reset(); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                {Object.entries(IMPORT_TEMPLATES).map(([id, t]) => <option key={id} value={id}>{t.label}</option>)}
              </select>
            </div>
            <button onClick={() => downloadTemplate(tplId)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
              style={{ borderColor: NAVY_700, color: NAVY_700 }}>
              <Download size={14} /> Scarica template
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Chiave di identificazione: <strong className="text-slate-600">{tpl.keyHeader}</strong> — se il valore esiste già il record viene aggiornato, altrimenti creato.
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>2 · Carica il file compilato</p>
          <FileDropArea accept=".xlsx,.xls,.csv" onFiles={handleFile}
            hint={fileName || "Seleziona il file .xlsx — o trascinalo qui"} />
        </Card>
      </div>

      {parseError && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#FBEAEA", color: "#B4302E" }}>
          <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" /> {parseError}
        </div>
      )}

      {imported && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>
          <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Importazione completata</p>
            <p className="text-xs mt-0.5">
              {imported.updated} record aggiornati · {imported.inserted} inseriti
              {imported.skipped > 0 ? ` · ${imported.skipped} scartati per errori` : ""}
            </p>
          </div>
        </div>
      )}

      {parsed && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
            <KPI icon={ListChecks} label="Righe lette" value={parsed.length} />
            <KPI icon={Pencil} label="Da aggiornare" value={toUpdate.length} sub="sovrascrittura" accent="#B07A12" />
            <KPI icon={Plus} label="Da inserire" value={toInsert.length} sub="nuovi record" accent="#2E7D5B" />
            <KPI icon={AlertTriangle} label="Righe con errori" value={invalid.length} sub="verranno scartate" accent="#B4302E" />
          </div>

          {invalid.length > 0 && (
            <Card className="p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "#B4302E" }}>
                  <AlertTriangle size={16} /> Errori di validazione
                </p>
                <ExportButton rows={errorExport} filename="report_errori_import" sheetName="Errori" label="Esporta report errori" />
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {invalid.map(r => (
                  <div key={r.rowNumber} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                    <span className="font-semibold text-slate-700">Riga {r.rowNumber}</span>
                    <span className="text-slate-400"> — {r.key || "chiave mancante"}</span>
                    <ul className="mt-1 space-y-0.5">
                      {r.errors.map((e, i) => <li key={i} className="text-xs" style={{ color: "#B4302E" }}>• {e}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5 mb-5">
            <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>3 · Anteprima delle modifiche</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {valid.map(r => (
                <div key={r.rowNumber} className="flex items-start justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full mr-2"
                      style={r.action === "aggiorna" ? { backgroundColor: "#FBF1DC", color: "#B07A12" } : { backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>
                      {r.action === "aggiorna" ? "AGGIORNA" : "INSERISCI"}
                    </span>
                    <span className="font-medium text-slate-700">{r.key}</span>
                    {r.warnings.map((w, i) => (
                      <p key={i} className="text-xs mt-1" style={{ color: "#B07A12" }}>⚠ {w}</p>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">riga {r.rowNumber}</span>
                </div>
              ))}
              {valid.length === 0 && <p className="text-sm text-slate-400">Nessuna riga valida da importare.</p>}
            </div>
          </Card>

          <div className="flex gap-2">
            <button onClick={applyImport} disabled={valid.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
              style={{ backgroundColor: NAVY_700 }}>
              <ArrowDownToLine size={15} /> Conferma importazione ({valid.length} righe)
            </button>
            <button onClick={reset}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
              Annulla
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CAPACITÀ FINANZIARIA — verifica per impresa di autotrasporto
// ---------------------------------------------------------------------------
// Requisito calcolato sul parco veicoli in disponibilità (proprietà, leasing,
// noleggio, subnoleggio: rileva la disponibilità, non il titolo di possesso):
//   • primo veicolo                                    → € 9.000
//   • ogni ulteriore autocarro / trattore stradale     → € 5.000
//   • ogni ulteriore veicolo fino a 3,5 t              → €   900
// Gli importi sono parametrici perché la quota ridotta per i veicoli leggeri
// dipende dalla normativa specifica applicata: vanno verificati sul
// regolamento vigente prima di presentare l'attestazione.
const CAPACITY_DEFAULTS = { first: 9000, heavy: 5000, light: 900, massThreshold: 3500, alertMarginPct: 15 };

function computeFinancialCapacity(company, vehicleList, params) {
  const { first, heavy, light, massThreshold, alertMarginPct } = params;

  // Veicoli in disponibilità della società (qualunque titolo)
  const fleet = vehicleList.filter(v =>
    v.company === company.id && v.status !== "venduto_dismesso" && v.active !== false
  );
  const heavyList = fleet.filter(v => (v.maxLadenMass || 0) > massThreshold);
  const lightList = fleet.filter(v => (v.maxLadenMass || 0) <= massThreshold);

  let required = 0;
  if (fleet.length > 0) {
    if (heavyList.length > 0) {
      required = first + (heavyList.length - 1) * heavy + lightList.length * light;
    } else {
      required = first + (lightList.length - 1) * light;
    }
  }

  const declared = company.declaredCapacity || 0;
  const margin = declared - required;
  const marginPct = declared > 0 ? (margin / declared) * 100 : (required > 0 ? -100 : 0);

  let status = "ok";
  if (fleet.length === 0) status = "na";
  else if (margin < 0) status = "insufficiente";
  else if (marginPct <= alertMarginPct) status = "da_aggiornare";

  // Quanti veicoli ancora inseribili prima di superare la capacità dichiarata
  const headroomHeavy = margin >= 0 ? Math.floor(margin / heavy) : 0;
  const headroomLight = margin >= 0 ? Math.floor(margin / light) : 0;

  return {
    id: company.id, company, fleetCount: fleet.length,
    heavyCount: heavyList.length, lightCount: lightList.length,
    required, declared, margin, marginPct, status, headroomHeavy, headroomLight,
  };
}

const capacityStatusMeta = {
  ok: { label: "Adeguata", color: "#2E7D5B", bg: "#E7F5EE" },
  da_aggiornare: { label: "Da aggiornare", color: "#B07A12", bg: "#FBF1DC" },
  insufficiente: { label: "Insufficiente", color: "#B4302E", bg: "#FBEAEA" },
  na: { label: "Nessun veicolo", color: "#6B7280", bg: "#F1F2F4" },
};

const CAPACITY_FORM_FIELDS = [
  { key: "declaredCapacity", label: "Capacità finanziaria attestata (€)", type: "number", required: true },
  { key: "capacityType", label: "Forma di dimostrazione", type: "select",
    options: ["Patrimonio netto", "Fideiussione bancaria", "Polizza assicurativa", "Mista"] },
  { key: "alboNumber", label: "N° iscrizione Albo autotrasportatori" },
  { key: "capacityDate", label: "Data attestazione", type: "date" },
  { key: "capacityExpiry", label: "Scadenza attestazione", type: "date" },
];

function CapacitaFinanziariaView({ companyList, setCompanyList, vehicleList }) {
  const [params, setParams] = useState(CAPACITY_DEFAULTS);
  const [editing, setEditing] = useState(null);
  const setParam = (k) => (e) => setParams(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));

  const rows = companyList
    .filter(c => c.isTransportOperator)
    .map(c => computeFinancialCapacity(c, vehicleList, params));

  const toUpdate = rows.filter(r => r.status === "da_aggiornare" || r.status === "insufficiente");

  const exportRows = rows.map(r => ({
    "Società": r.company.name, "N° Albo": r.company.alboNumber || "—",
    "Veicoli in disponibilità": r.fleetCount, "di cui > 3,5 t": r.heavyCount, "di cui ≤ 3,5 t": r.lightCount,
    "Capacità richiesta (€)": r.required, "Capacità attestata (€)": r.declared,
    "Margine (€)": r.margin, "Margine %": r.marginPct.toFixed(1),
    "Forma": r.company.capacityType || "—", "Scadenza attestazione": r.company.capacityExpiry || "—",
    "Stato": capacityStatusMeta[r.status].label,
  }));

  return (
    <div>
      <SectionTitle
        title="Capacità Finanziaria"
        sub="Verifica del requisito per impresa di autotrasporto, ricalcolata automaticamente a ogni variazione del parco veicoli"
        action={<ExportButton rows={exportRows} filename="capacita_finanziaria" sheetName="Capacità" />}
      />

      {toUpdate.length > 0 && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5"
          style={{ backgroundColor: toUpdate.some(r => r.status === "insufficiente") ? "#FBEAEA" : "#FBF1DC" }}>
          <AlertTriangle size={17} className="flex-shrink-0 mt-0.5"
            style={{ color: toUpdate.some(r => r.status === "insufficiente") ? "#B4302E" : "#B07A12" }} />
          <div style={{ color: toUpdate.some(r => r.status === "insufficiente") ? "#8F2624" : "#7A5C0E" }}>
            <p className="font-semibold mb-1">Aggiornamento della capacità finanziaria necessario</p>
            <ul className="text-xs leading-relaxed space-y-0.5">
              {toUpdate.map(r => (
                <li key={r.id}>
                  <strong>{r.company.name}</strong>: requisito € {r.required.toLocaleString("it-IT")} su
                  € {r.declared.toLocaleString("it-IT")} attestati —
                  {r.margin < 0
                    ? ` scoperto di € ${Math.abs(r.margin).toLocaleString("it-IT")}, attestazione da integrare`
                    : ` margine residuo ${r.marginPct.toFixed(1)}% (soglia ${params.alertMarginPct}%)`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Card className="p-5 mb-5">
        <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>Parametri di calcolo</p>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Primo veicolo (€)</p>
            <input type="number" value={params.first} onChange={setParam("first")} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Ogni autocarro succ. (€)</p>
            <input type="number" value={params.heavy} onChange={setParam("heavy")} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Ogni veicolo leggero (€)</p>
            <input type="number" value={params.light} onChange={setParam("light")} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Soglia massa leggeri (kg)</p>
            <input type="number" value={params.massThreshold} onChange={setParam("massThreshold")} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Soglia di allerta (%)</p>
            <input type="number" value={params.alertMarginPct} onChange={setParam("alertMarginPct")} className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {rows.map(r => {
          const m = capacityStatusMeta[r.status];
          const usagePct = r.declared > 0 ? Math.min(100, (r.required / r.declared) * 100) : 100;
          return (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold" style={{ color: NAVY_700 }}>{r.company.name}</h3>
                  <p className="text-xs text-slate-400">
                    Albo {r.company.alboNumber || "—"} · {r.company.capacityType || "forma non indicata"}
                    {r.company.capacityExpiry ? ` · attestazione valida fino al ${r.company.capacityExpiry}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: m.color, backgroundColor: m.bg }}>{m.label}</span>
                  <RowActions entity={{ type: "capacita", id: r.company.id, label: `Capacità — ${r.company.name}` }} onEdit={() => setEditing(r.company)} />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Veicoli in disponibilità</p>
                  <p className="text-lg font-bold text-slate-700">{r.fleetCount}</p>
                  <p className="text-xs text-slate-400">{r.heavyCount} pesanti · {r.lightCount} leggeri</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Capacità richiesta</p>
                  <p className="text-lg font-bold" style={{ color: NAVY_700 }}>€ {r.required.toLocaleString("it-IT")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Capacità attestata</p>
                  <p className="text-lg font-bold text-slate-700">€ {r.declared.toLocaleString("it-IT")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Margine</p>
                  <p className="text-lg font-bold" style={{ color: m.color }}>
                    {r.margin < 0 ? "−" : ""}€ {Math.abs(r.margin).toLocaleString("it-IT")}
                  </p>
                  <p className="text-xs" style={{ color: m.color }}>{r.marginPct.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Margine di inserimento</p>
                  {r.margin >= 0 ? (
                    <p className="text-sm font-semibold text-slate-700 leading-tight">
                      +{r.headroomHeavy} pesanti<br />
                      <span className="text-slate-400 font-normal text-xs">oppure +{r.headroomLight} leggeri</span>
                    </p>
                  ) : (
                    <p className="text-sm font-semibold" style={{ color: "#B4302E" }}>Nessuno</p>
                  )}
                </div>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${usagePct}%`, backgroundColor: m.color }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-semibold" style={{ color: m.color }}>
                  {r.declared > 0 ? `${((r.required / r.declared) * 100).toFixed(0)}% della capacità attestata impegnata` : "Capacità non attestata"}
                </span>
                <span className="text-xs text-slate-400">
                  Calcolo: € {params.first.toLocaleString("it-IT")} (1° veicolo)
                  {r.heavyCount > 1 ? ` + € ${params.heavy.toLocaleString("it-IT")} × ${r.heavyCount - 1}` : ""}
                  {(r.heavyCount > 0 ? r.lightCount : r.lightCount - 1) > 0
                    ? ` + € ${params.light.toLocaleString("it-IT")} × ${r.heavyCount > 0 ? r.lightCount : r.lightCount - 1}` : ""}
                </span>
              </div>
            </Card>
          );
        })}
        {rows.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400">
            Nessuna società censita come impresa di autotrasporto.
          </Card>
        )}
      </div>

      <div className="flex gap-2.5 rounded-lg p-4 text-sm mt-5" style={{ backgroundColor: "#F1F2F4" }}>
        <ShieldCheck size={17} className="flex-shrink-0 mt-0.5 text-slate-400" />
        <p className="text-xs leading-relaxed text-slate-500">
          Il requisito è calcolato sui veicoli in <strong>disponibilità</strong> della società, indipendentemente dal titolo
          (proprietà, leasing, noleggio o subnoleggio). Gli importi unitari e la quota ridotta per i veicoli fino a 3,5 t
          sono parametrici: vanno verificati sul regolamento vigente e sulle indicazioni dell'Albo prima di presentare o
          integrare l'attestazione.
        </p>
      </div>

      {editing && (
        <SimpleFormModal
          title={`Capacità finanziaria — ${editing.name}`} fields={CAPACITY_FORM_FIELDS} submitLabel="Salva attestazione"
          initialValues={editing}
          onClose={() => setEditing(null)}
          onSave={(f) => {
            setCompanyList(prev => prev.map(c => c.id === editing.id
              ? { ...c, ...f, declaredCapacity: parseFloat(f.declaredCapacity) || 0 } : c));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GENERATORE CONTRATTO DI NOLEGGIO A FREDDO
// ---------------------------------------------------------------------------
// Compila il modello contrattuale con i dati del subnoleggio: parti, veicolo,
// periodo, canone e condizioni economiche (franchigia RCA, penale danni, furto).
//
// Criterio adottato per i dati mancanti: si lascia una riga da compilare a mano
// ("__________") invece di inventare un valore. Un contratto con un dato errato
// è peggio di un contratto con uno spazio bianco, perché nessuno se ne accorge.

const BLANK = "__________________________";
const val = (v, blank = BLANK) => (v === null || v === undefined || v === "" ? blank : String(v));

const fmtDate = (d) => {
  if (!d) return BLANK;
  const [y, m, g] = String(d).slice(0, 10).split("-");
  return `${g}/${m}/${y}`;
};

// Raggruppamento esplicito delle migliaia: toLocaleString("it-IT") non separa
// i numeri di 4 cifre (1150,00 ma 12.500,00), producendo importi formattati in
// modo incoerente nello stesso documento. Su un contratto da firmare non è
// accettabile, quindi la formattazione è imposta a mano.
const groupThousands = (intPart) => intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const fmtNumber = (n, decimals = 0) => {
  const fixed = Math.abs(Number(n)).toFixed(decimals);
  const [i, d] = fixed.split(".");
  const sign = Number(n) < 0 ? "-" : "";
  return sign + groupThousands(i) + (d ? "," + d : "");
};

const fmtEuro = (n) =>
  n === null || n === undefined || n === "" || !Number.isFinite(Number(n))
    ? BLANK
    : `€ ${fmtNumber(n, 2)}`;

/** Intestazione di una parte contrattuale */
function partyBlock(company) {
  if (!company) return BLANK;
  return [
    val(company.name),
    `con sede legale in ${val(company.legalAddress)}`,
    `C.F./P.IVA ${val(company.vat)}`,
    `iscritta al Registro delle Imprese di ${val(company.city)}, REA n. ${val(company.reaNumber)}`,
    `iscritta all'Albo degli Autotrasportatori al n. ${val(company.alboNumber, "__________ (ove applicabile)")}`,
    `in persona del legale rappresentante pro tempore ${val(company.legalRep)}`,
  ].join(", ");
}

/**
 * Restituisce il valore se identico su tutti i veicoli, altrimenti null.
 * Serve a decidere se una condizione può essere scritta nell'articolo oppure
 * se va rinviata all'Allegato A perché varia da mezzo a mezzo: scrivere un
 * canone unico in un contratto quadro dove i canoni differiscono sarebbe un
 * errore sostanziale, non di forma.
 */
function uniformValue(items, pick) {
  if (!items.length) return null;
  const first = pick(items[0]);
  return items.every((i) => pick(i) === first) ? first : null;
}

const PER_VEHICLE = "secondo quanto indicato per ciascun veicolo nell'Allegato A";

/**
 * Costruisce il contratto. Accetta un singolo subnoleggio oppure un elenco:
 * con più veicoli genera un contratto quadro, con il dettaglio per mezzo
 * riportato nell'Allegato A.
 * @param input  subnoleggio singolo oppure array di subnoleggi
 * @param ctx    { vehicleList, granting, using }
 */
function buildRentalContract(input, ctx) {
  const items = Array.isArray(input) ? input : [input];
  const { granting, using, vehicleList = [] } = ctx;
  const collective = items.length > 1;

  const lineFor = (sr) => ({
    sr,
    vehicle: ctx.vehicle || vehicleList.find((v) => v.plate === sr.vehicle),
    calc: ctx.proRata && !collective ? ctx.proRata : proRata(sr.fee, sr.start, sr.end),
  });
  const lines = items.map(lineFor);

  const sr = items[0];
  const vehicle = lines[0].vehicle;
  const proRataCalc = lines[0].calc;

  // Condizioni economiche: uniformi o rinviate all'Allegato A
  const uFee = uniformValue(items, (i) => i.fee);
  const uStart = uniformValue(items, (i) => i.start);
  const uEnd = uniformValue(items, (i) => i.end);
  const uRca = uniformValue(items, (i) => i.deductibleRCA);
  const uDamage = uniformValue(items, (i) => i.damagePenalty);
  const uTheftMode = uniformValue(items, (i) => i.theftMode);
  const uTheftValue = uniformValue(items, (i) => i.theftValue);
  const uKm = uniformValue(items, (i) => i.includedKm);
  const uDeposit = uniformValue(items, (i) => i.securityDeposit);
  const uInsurance = uniformValue(items, (i) => i.insuranceIncluded);
  const uMaint = uniformValue(items, (i) => i.maintenanceIncluded);

  const totalPeriod = lines.reduce((t, l) => t + (l.calc?.total || 0), 0);
  const totalMonthly = items.reduce((t, i) => t + (Number(i.fee) || 0), 0);

  const theftText = uTheftMode === null || uTheftValue === null
    ? PER_VEHICLE
    : uTheftMode === "importo"
      ? `${fmtEuro(uTheftValue)} (importo fisso)`
      : `${val(uTheftValue)}% del valore del veicolo`;

  const articles = [
    ["PREMESSE", `a) Il Locatore dispone legittimamente dei veicoli oggetto del presente contratto ed è autorizzato a concederne l'utilizzo al Locatario nei limiti previsti dalla legge e dagli eventuali contratti attraverso i quali ne abbia acquisito la disponibilità;

b) il Locatario esercita attività di trasporto e dichiara di possedere tutte le autorizzazioni, licenze, iscrizioni e requisiti necessari per lo svolgimento della propria attività;

c) il Locatario ha manifestato l'esigenza di acquisire la disponibilità temporanea di uno o più veicoli senza conducente;

d) il Locatore intende concedere tali veicoli in noleggio a freddo, senza fornitura di conducente, personale operativo o servizi di trasporto;

e) l'elenco dei veicoli, le relative targhe, caratteristiche, canoni e condizioni economiche sono indicati nell'Allegato A – Elenco Veicoli e Condizioni Economiche, che costituisce parte integrante del presente contratto.

Le premesse e gli allegati costituiscono parte integrante e sostanziale del presente contratto.`],

    ["ART. 1 – OGGETTO DEL CONTRATTO", `Il Locatore concede al Locatario, che accetta, in noleggio senza conducente – c.d. noleggio a freddo, ${collective ? `i ${items.length} veicoli identificati` : "il veicolo identificato"} nell'Allegato A.${collective ? `

Il presente contratto ha natura di contratto quadro: disciplina in modo unitario il rapporto fra le Parti, mentre le condizioni economiche e tecniche di ciascun veicolo sono riportate nelle rispettive schede dell'Allegato A, che ne costituiscono parte integrante.` : ""}

Il noleggio comprende esclusivamente la disponibilità del veicolo. Salvo diverso accordo scritto, non sono compresi: conducente; carburante; AdBlue; pedaggi; parcheggi; lavaggi; personale operativo; attività di carico e scarico; ulteriori servizi non espressamente indicati nel presente contratto.

Il Locatario organizza autonomamente la propria attività di trasporto e mantiene la piena responsabilità dell'utilizzo dei veicoli.`],

    ["ART. 2 – DESTINAZIONE E UTILIZZO DEI VEICOLI", `I veicoli dovranno essere utilizzati esclusivamente per attività lecite e compatibili con: caratteristiche tecniche del mezzo; carta di circolazione; autorizzazioni amministrative; coperture assicurative; normativa in materia di circolazione stradale; normativa relativa all'autotrasporto.

È vietato utilizzare il mezzo: per competizioni o prove sportive; per trasporto di merci vietate o pericolose senza le necessarie autorizzazioni; in condizioni di sovraccarico; in violazione delle prescrizioni previste dalla carta di circolazione; per attività illecite; fuori dai territori consentiti dalle coperture assicurative.`],

    ["ART. 3 – CONDUCENTI", `I veicoli potranno essere condotti esclusivamente da soggetti muniti di patente valida e idonea alla categoria del veicolo; autorizzati dal Locatario; in possesso delle eventuali qualificazioni professionali richieste; regolarmente impiegati o comunque legittimamente utilizzabili dal Locatario secondo la normativa vigente.

Il Locatario assume ogni responsabilità relativa alla scelta, gestione e condotta dei propri conducenti. Il Locatore non esercita alcun potere direttivo, organizzativo o disciplinare nei confronti degli stessi.`],

    ["ART. 4 – DURATA", `${uStart && uEnd
      ? `Il contratto avrà durata dal ${fmtDate(uStart)} al ${fmtDate(uEnd)}${proRataCalc?.days ? `, per complessivi ${proRataCalc.days} giorni di noleggio` : ""}.`
      : `La durata del noleggio è stabilita distintamente per ciascun veicolo ${PER_VEHICLE}.`}

Salvo condizioni differenti riportate nell'Allegato A, ciascuna Parte potrà recedere mediante comunicazione scritta con preavviso di almeno 30 giorni. Restano ferme le ipotesi di risoluzione immediata previste dal presente contratto.`],

    ["ART. 5 – CANONE DI NOLEGGIO", `${uFee !== null
      ? `Il Locatario corrisponderà al Locatore, per ciascun veicolo, il canone di ${fmtEuro(uFee)} mensili, oltre IVA di legge.${collective ? ` Il canone complessivo per i ${items.length} veicoli oggetto del presente contratto è pari a ${fmtEuro(totalMonthly)} mensili, oltre IVA.` : ""}`
      : `Il canone è stabilito distintamente per ciascun veicolo ${PER_VEHICLE}. Il canone complessivo per i ${items.length} veicoli oggetto del presente contratto è pari a ${fmtEuro(totalMonthly)} mensili, oltre IVA.`}

${uStart && uEnd && proRataCalc?.days
  ? `Per il periodo contrattuale indicato all'Art. 4, il corrispettivo è determinato sulla base di un canone giornaliero pari al canone mensile diviso 30, per ${proRataCalc.days} giorni effettivi di noleggio${collective ? `, per un totale complessivo di ${fmtEuro(totalPeriod)} oltre IVA` : ` di ${fmtEuro(proRataCalc.daily)} giornalieri, per un totale di ${fmtEuro(proRataCalc.total)} oltre IVA`}.`
  : `Il corrispettivo di ciascun periodo è calcolato sulla base del canone giornaliero (canone mensile diviso 30) moltiplicato per i giorni effettivi di noleggio, come dettagliato nell'Allegato A. Il corrispettivo complessivo dei periodi indicati è pari a ${fmtEuro(totalPeriod)} oltre IVA.`}

Il canone decorre dalla data di consegna del veicolo e termina alla data della sua effettiva riconsegna al Locatore, documentata mediante verbale di riconsegna. L'eventuale inutilizzo del veicolo per cause imputabili al Locatario non determina sospensione o riduzione del canone.`],

    ["ART. 6 – FATTURAZIONE E PAGAMENTI", `La fatturazione avverrà con periodicità mensile posticipata, salvo diverso accordo scritto.

Il pagamento dovrà essere effettuato entro ______ giorni data fattura mediante bonifico bancario. In caso di ritardato pagamento decorreranno gli interessi moratori previsti dalla normativa applicabile alle transazioni commerciali. Restano inoltre a carico del Locatario eventuali spese sostenute per il recupero del credito.`],

    ["ART. 7 – DEPOSITO CAUZIONALE", `Il Locatore potrà richiedere un deposito cauzionale pari a ${uDeposit !== null ? `${fmtEuro(uDeposit)} per ciascun veicolo` : PER_VEHICLE}.

Il deposito non costituisce anticipo sui canoni. Il Locatore potrà utilizzarlo, previa rendicontazione, per compensare: canoni insoluti; franchigie assicurative; danni; multe e relativi costi; mancato carburante; mancata riconsegna di accessori; spese di recupero; ulteriori somme dovute dal Locatario.`],

    ["ART. 8 – CONSEGNA DEL VEICOLO", `Al momento della consegna verrà redatto apposito Verbale di Consegna (Allegato B), nel quale saranno riportati almeno: targa; marca e modello; chilometraggio; livello carburante; stato della carrozzeria; stato degli pneumatici; eventuali danni preesistenti; dotazioni presenti; documentazione consegnata; numero delle chiavi; eventuali dispositivi elettronici; documentazione fotografica.

La sottoscrizione del verbale comporta accettazione dello stato del mezzo, fatti salvi eventuali vizi occulti.`],

    ["ART. 9 – CUSTODIA DEL VEICOLO", `Dal momento della consegna e fino alla riconsegna, il Locatario assume la custodia del veicolo e dovrà adottare tutte le misure necessarie a prevenirne furto, incendio, danneggiamento, uso improprio, sottrazione e utilizzo da parte di soggetti non autorizzati.

Il Locatario risponderà dei danni derivanti dalla violazione degli obblighi di custodia nei limiti consentiti dalla legge e dalle coperture assicurative applicabili.`],

    ["ART. 10 – CHILOMETRAGGIO", `${uKm === null
      ? `Il chilometraggio contrattuale è stabilito distintamente per ciascun veicolo ${PER_VEHICLE}.`
      : uKm
        ? `Il contratto prevede un chilometraggio massimo di ${fmtNumber(uKm)} km/mese per ciascun veicolo. Gli eventuali chilometri eccedenti saranno fatturati al costo di ${fmtEuro(uniformValue(items, (i) => i.kmOverageRate))} + IVA/km.`
        : "Il contratto prevede chilometraggio illimitato."}

Il chilometraggio sarà rilevato alla consegna, durante eventuali controlli e alla riconsegna. È vietata qualsiasi alterazione o manomissione del contachilometri.`],

    ["ART. 11 – MANUTENZIONE ORDINARIA", `La manutenzione ordinaria è a carico ${uMaint === null ? `del soggetto indicato ${PER_VEHICLE}` : uMaint === false ? "del Locatario" : "del Locatore"}, secondo quanto specificato nell'Allegato A.

Il Locatario è comunque tenuto a verificare regolarmente livelli dei liquidi, pressione pneumatici, spie e segnalazioni, condizioni generali del veicolo e scadenze indicate dal mezzo. Qualsiasi anomalia dovrà essere tempestivamente comunicata al Locatore.`],

    ["ART. 12 – MANUTENZIONE STRAORDINARIA", `Salvo che il guasto derivi da uso improprio, incidente, negligenza o inosservanza delle prescrizioni, la manutenzione straordinaria relativa alla normale usura sarà sostenuta dal soggetto indicato nell'Allegato A.

Nessun intervento di manutenzione straordinaria potrà essere effettuato senza preventiva autorizzazione scritta del Locatore, salvo interventi urgenti necessari a garantire la sicurezza.`],

    ["ART. 13 – PNEUMATICI", `Le Parti stabiliscono nell'Allegato A le condizioni relative a sostituzione pneumatici, forature, danneggiamenti, usura anomala, pneumatici invernali ed eventuali pneumatici aggiuntivi.

I danni agli pneumatici causati da urti, marciapiedi, sovraccarico, uso improprio o negligenza saranno a carico del Locatario.`],

    ["ART. 14 – GUASTO E FERMO TECNICO", `In caso di guasto il Locatario dovrà darne immediata comunicazione al Locatore e non potrà procedere autonomamente a riparazioni rilevanti senza autorizzazione.

L'eventuale disponibilità di un veicolo sostitutivo dovrà essere espressamente prevista nell'Allegato A. In assenza di tale previsione, il Locatore non assume automaticamente l'obbligo di fornire un mezzo sostitutivo.`],

    ["ART. 15 – ASSICURAZIONE", `Per ${collective ? "ciascun veicolo" : "il veicolo"} dovranno essere mantenute le coperture assicurative obbligatorie previste dalla legge. La copertura assicurativa è ${uInsurance === null ? `stabilita ${PER_VEHICLE}` : uInsurance === false ? "a carico del Locatario" : "compresa nel canone e a cura del Locatore"}.

Nell'Allegato D sono indicate le garanzie presenti (RCA, furto, incendio, Kasko, collisione, eventi naturali, eventi sociopolitici, cristalli, assistenza stradale) e le relative franchigie e scoperti.`],

    ["ART. 16 – FRANCHIGIE E SCOPERTI", `In caso di sinistro imputabile al Locatario o al conducente, sono posti a carico del Locatario gli importi relativi alle franchigie e agli scoperti previsti dalla polizza, come di seguito determinati:

• Franchigia RCA: ${uRca !== null ? `${fmtEuro(uRca)} per sinistro` : PER_VEHICLE};
• Penale per danni al veicolo: ${uDamage !== null ? `${fmtEuro(uDamage)} per evento` : PER_VEHICLE};
• Furto, rapina o incendio: ${theftText}.

Rimangono altresì a carico del Locatario i danni non coperti dall'assicurazione quando derivanti da comportamento doloso, colposo, uso improprio o violazione delle condizioni assicurative imputabile al Locatario o ai suoi conducenti.

Gli importi di cui al presente articolo sono addebitati a titolo di rimborso del danno e, in quanto tali, non costituiscono corrispettivo di una prestazione: sono pertanto riaddebitati senza applicazione dell'IVA, quali somme escluse dalla base imponibile ai sensi dell'art. 15, comma 1, n. 1, del DPR 26 ottobre 1972 n. 633.`],

    ["ART. 17 – SINISTRI", `In caso di incidente il Locatario dovrà: 1) mettere in sicurezza il veicolo; 2) compilare, ove possibile, la constatazione amichevole; 3) acquisire generalità delle controparti; 4) acquisire fotografie; 5) identificare eventuali testimoni; 6) richiedere l'intervento delle autorità quando necessario; 7) comunicare tempestivamente il sinistro al Locatore; 8) trasmettere la documentazione richiesta entro 24/48 ore dall'evento.

Il Locatario dovrà collaborare nella gestione della pratica assicurativa.`],

    ["ART. 18 – FURTO, RAPINA E INCENDIO", `In caso di furto, rapina, incendio o tentato furto il Locatario dovrà immediatamente informare le Forze dell'Ordine, presentare denuncia, informare il Locatore, trasmettere copia della denuncia e riconsegnare eventuali chiavi rimaste in suo possesso.

L'eventuale responsabilità economica sarà determinata sulla base delle coperture assicurative, delle franchigie di cui all'Art. 16 e delle circostanze dell'evento.`],

    ["ART. 19 – MULTE E VIOLAZIONI", `Sono integralmente a carico del Locatario tutte le conseguenze economiche derivanti dalle violazioni commesse durante il periodo di disponibilità del veicolo, incluse sanzioni amministrative, ZTL, divieti, parcheggi, sovraccarichi, pedaggi, violazioni della normativa sul trasporto e violazioni relative ai tempi di guida e riposo imputabili al conducente o all'organizzazione del Locatario.

Il Locatario autorizza il Locatore a comunicare alle autorità competenti i dati necessari all'identificazione dell'utilizzatore del mezzo nei casi previsti dalla legge. Potrà essere applicato un costo amministrativo di € ______ + IVA per ciascuna pratica gestita, ove contrattualmente e legalmente consentito.`],

    ["ART. 20 – PEDAGGI, TELEPASS E DISPOSITIVI", `Salvo diverso accordo, pedaggi autostradali, parcheggi, traghetti e analoghe spese sono a carico del Locatario.

Qualora il Locatore metta a disposizione dispositivi Telepass o equivalenti, gli importi saranno riaddebitati al Locatario secondo rendicontazione. È vietato utilizzare i dispositivi assegnati al veicolo su mezzi differenti senza preventiva autorizzazione.`],

    ["ART. 21 – GPS E TELEMATICA", `Il veicolo potrà essere dotato di sistemi GPS e telematici per localizzazione del mezzo, rilevazione chilometrica, diagnostica, manutenzione, sicurezza, recupero in caso di furto e gestione della flotta.

Il trattamento dei dati dovrà avvenire nel rispetto della normativa applicabile in materia di protezione dei dati personali. Il Locatario si impegna a fornire ai propri dipendenti e collaboratori le informazioni eventualmente necessarie. È vietata la rimozione, disattivazione o manomissione dei dispositivi.`],

    ["ART. 22 – DIVIETO DI SUBNOLEGGIO E CESSIONE", `Il Locatario non potrà cedere, sublocare, subnoleggiare o concedere a qualsiasi titolo il veicolo a soggetti terzi senza preventiva autorizzazione scritta del Locatore.

È altresì vietata la cessione del presente contratto senza consenso scritto del Locatore. L'eventuale utilizzo infragruppo dovrà essere preventivamente autorizzato e dovrà rispettare la normativa applicabile.`],

    ["ART. 23 – OBBLIGHI DELL'IMPRESA DI TRASPORTO", `Il Locatario dichiara di possedere e si impegna a mantenere per tutta la durata del contratto i requisiti, le iscrizioni e le autorizzazioni necessarie per l'attività esercitata.

Il Locatario è responsabile della verifica della compatibilità dell'utilizzo del veicolo con la propria iscrizione all'Albo, il REN ove applicabile, licenze e autorizzazioni, tipologia di trasporto effettuato, massa del veicolo, eventuali autorizzazioni internazionali e normativa nazionale ed europea applicabile.`],

    ["ART. 24 – DOCUMENTAZIONE A BORDO", `Le Parti si impegnano a garantire la presenza e/o disponibilità della documentazione prevista dalla normativa vigente per dimostrare la legittima disponibilità del veicolo.

Il Locatario dovrà custodire la documentazione e renderla disponibile in occasione di eventuali controlli.`],

    ["ART. 25 – DIVIETO DI MODIFICHE", `Il Locatario non potrà effettuare modifiche strutturali o installazioni permanenti sul veicolo senza autorizzazione scritta del Locatore.

In particolare sono vietate, senza autorizzazione: modifiche alla carrozzeria; installazione di scaffalature; installazione di dispositivi elettrici; applicazione permanente di adesivi; modifica delle centraline; manomissione dei dispositivi telematici.`],

    ["ART. 26 – PUBBLICITÀ E BRANDIZZAZIONE", `L'applicazione di loghi, adesivi, livree o materiale pubblicitario dovrà essere preventivamente autorizzata dal Locatore.

Alla riconsegna il veicolo dovrà essere riportato alle condizioni originarie, salvo diverso accordo. I costi di rimozione e ripristino saranno a carico del Locatario.`],

    ["ART. 27 – RICONSEGNA", `Alla cessazione del contratto ${collective ? "ciascun veicolo dovrà essere riconsegnato" : "il veicolo dovrà essere riconsegnato"} nel luogo indicato dal Locatore: ${val(sr.returnLocation, "____________________________________________")}.

${collective ? "Ogni mezzo" : "Il mezzo"} dovrà essere restituito: libero da merci ed effetti personali; con tutti i documenti; con tutte le chiavi; con tutte le dotazioni; nelle condizioni compatibili con la normale usura; con livello carburante concordato; privo di adesivi o personalizzazioni non autorizzate.`],

    ["ART. 28 – VERBALE DI RICONSEGNA E DANNI", `Alla riconsegna sarà redatto apposito verbale (Allegato F) con documentazione fotografica, confrontando le condizioni del veicolo con quelle riportate nel verbale iniziale.

Non saranno addebitati i deterioramenti riconducibili alla normale usura. Saranno invece imputabili al Locatario, ove di sua responsabilità: ammaccature; graffi rilevanti; rotture; parti mancanti; danni agli interni; danni da uso improprio; danni agli pneumatici; danni derivanti da sovraccarico; rimozione di componenti; manomissioni; costi necessari al ripristino di modifiche non autorizzate.`],

    ["ART. 29 – MANCATA O RITARDATA RICONSEGNA", `Qualora il Locatario non restituisca il veicolo alla scadenza prevista, senza autorizzazione del Locatore, continuerà a essere dovuto il corrispettivo previsto dal contratto fino all'effettiva riconsegna, fatto salvo il maggior danno nei casi consentiti dalla legge.

Potrà inoltre essere prevista nell'Allegato A una maggiorazione giornaliera per ritardata riconsegna.`],

    ["ART. 30 – RISOLUZIONE PER INADEMPIMENTO", `Il Locatore potrà chiedere la risoluzione del contratto nei casi previsti dalla legge e, ove ne ricorrano i presupposti, avvalersi della clausola risolutiva espressa per le violazioni specificamente indicate dalle Parti, tra cui: mancato pagamento dei canoni; subnoleggio non autorizzato; utilizzo illecito del mezzo; utilizzo da parte di soggetti non autorizzati; grave violazione degli obblighi di custodia; manomissione del veicolo; manomissione GPS; mancata riconsegna; perdita dei requisiti necessari per l'attività di trasporto; utilizzo del veicolo in violazione delle condizioni assicurative.

La risoluzione non pregiudica il diritto al recupero delle somme maturate e all'eventuale risarcimento dei danni.`],

    ["ART. 31 – SOSPENSIONE DEL SERVIZIO PER MOROSITÀ", `In presenza di fatture scadute e non pagate, il Locatore potrà intimare il pagamento concedendo un termine di ______ giorni.

Decorso inutilmente tale termine, potrà richiedere la riconsegna dei veicoli e adottare le iniziative contrattualmente e legalmente consentite.`],

    ["ART. 32 – RESPONSABILITÀ DEL LOCATARIO", `Il Locatario risponde dell'utilizzo dei veicoli durante il periodo di disponibilità e delle attività di trasporto effettuate con gli stessi.

Resta esclusa qualsiasi responsabilità del Locatore relativamente all'organizzazione dei servizi di trasporto del Locatario, ai rapporti di lavoro con i conducenti, alle merci trasportate, ai rapporti tra Locatario e propri committenti e alle violazioni imputabili al Locatario o ai suoi conducenti. Resta ferma la responsabilità del Locatore nei casi inderogabilmente previsti dalla legge.`],

    ["ART. 33 – RESPONSABILITÀ PER MERCI TRASPORTATE", `Il Locatore non assume alcun obbligo di custodia o trasporto delle merci caricate sui veicoli.

Il Locatario rimane esclusivamente responsabile della merce trasportata e delle eventuali coperture assicurative vettoriali o merci necessarie.`],

    ["ART. 34 – CONTROLLI SUI VEICOLI", `Previo ragionevole preavviso, salvo situazioni urgenti, il Locatore potrà richiedere verifiche sullo stato dei mezzi.

Il Locatario dovrà consentire l'esecuzione dei controlli necessari alla verifica di chilometraggio, manutenzione, sicurezza, stato d'uso, pneumatici e dispositivi telematici.`],

    ["ART. 35 – RESTITUZIONE ANTICIPATA DEL VEICOLO", `Il Locatore potrà richiedere la restituzione anticipata del veicolo qualora si verifichi un grave inadempimento contrattuale o venga meno il titolo che consente legittimamente la disponibilità del mezzo, secondo quanto previsto dalla legge e dal presente contratto.`],

    ["ART. 36 – FORZA MAGGIORE", `Nessuna Parte sarà responsabile per l'inadempimento derivante direttamente da eventi di forza maggiore non ragionevolmente prevedibili o evitabili. La Parte interessata dovrà informare tempestivamente l'altra Parte.`],

    ["ART. 37 – COMUNICAZIONI", `Le comunicazioni formali relative al contratto dovranno essere effettuate tramite PEC o altro mezzo idoneo a documentarne la ricezione.

PEC Locatore: ${val(granting?.pec)}
PEC Locatario: ${val(using?.pec)}`],

    ["ART. 38 – TRATTAMENTO DEI DATI", `Le Parti dichiarano di trattare i dati personali acquisiti nell'ambito del rapporto contrattuale nel rispetto del Regolamento UE 2016/679 e della normativa nazionale applicabile.`],

    ["ART. 39 – MODIFICHE CONTRATTUALI", `Qualsiasi modifica al presente contratto dovrà risultare da atto scritto sottoscritto dalle Parti. Eventuali tolleranze rispetto a comportamenti in violazione del contratto non costituiscono rinuncia ai relativi diritti.`],

    ["ART. 40 – LEGGE APPLICABILE", `Il presente contratto è regolato dalla legge italiana e dalla normativa europea direttamente applicabile.`],

    ["ART. 41 – FORO COMPETENTE", `Per qualsiasi controversia relativa all'interpretazione, esecuzione, validità o cessazione del presente contratto sarà competente, nei limiti consentiti dalla legge, il Foro di ${val(granting?.city)}.`],

    ["ART. 42 – ALLEGATI", `Costituiscono parte integrante del presente contratto:
Allegato A – Elenco veicoli e condizioni economiche
Allegato B – Verbale di consegna
Allegato C – Scheda stato d'uso e documentazione fotografica
Allegato D – Condizioni assicurative, franchigie e scoperti
Allegato E – Tariffario danni e costi amministrativi
Allegato F – Verbale di riconsegna
Allegato G – Informativa relativa ai dispositivi GPS/telematici, ove applicabile.`],
  ];

  // Scheda di dettaglio per un singolo veicolo
  const sheetFor = ({ sr: r, vehicle: v, calc }) => [
    ["Targa", val(v?.plate, r.vehicle)],
    ["Telaio (VIN)", val(v?.vin)],
    ["Marca e modello", v ? `${val(v.make)} ${val(v.model)} ${v.version || ""}`.trim() : BLANK],
    ["Categoria / massa complessiva", v?.maxLadenMass ? `${val(v.vehicleCategory)} — ${fmtNumber(v.maxLadenMass)} kg` : val(v?.vehicleCategory)],
    ["Alimentazione / classe Euro", v ? `${val(v.fuel)} — ${val(v.euroClass)}` : BLANK],
    ["N° carta di circolazione", val(v?.docNumber)],
    ["Km alla consegna", v?.km != null ? fmtNumber(v.km) : BLANK],
    ["Decorrenza", fmtDate(r.start)],
    ["Scadenza", fmtDate(r.end)],
    ["Giorni di noleggio", calc?.days ? String(calc.days) : BLANK],
    ["Canone mensile", fmtEuro(r.fee)],
    ["Canone giornaliero (canone ÷ 30)", calc?.daily ? fmtEuro(calc.daily) : BLANK],
    ["Corrispettivo del periodo", calc?.total ? fmtEuro(calc.total) : BLANK],
    ["Chilometraggio", r.includedKm ? `${fmtNumber(r.includedKm)} km/mese` : "Illimitato"],
    ["Costo km eccedente", r.kmOverageRate ? `${fmtEuro(r.kmOverageRate)}/km` : "—"],
    ["Franchigia RCA", fmtEuro(r.deductibleRCA)],
    ["Penale danni al veicolo", fmtEuro(r.damagePenalty)],
    ["Furto / rapina / incendio", r.theftMode === "importo" ? `${fmtEuro(r.theftValue)} (importo fisso)` : `${val(r.theftValue)}% del valore del veicolo`],
    ["Deposito cauzionale", fmtEuro(r.securityDeposit)],
    ["Assicurazione", r.insuranceIncluded === false ? "A carico del Locatario" : "Compresa nel canone"],
    ["Manutenzione ordinaria", r.maintenanceIncluded === false ? "A carico del Locatario" : "Compresa nel canone"],
  ];

  const allegatoA = sheetFor(lines[0]);

  // Prospetto riepilogativo: una riga per veicolo, usato solo nel contratto quadro
  const summaryRows = lines.map(({ sr: r, vehicle: v, calc }) => [
    val(v?.plate, r.vehicle),
    v ? `${val(v.make)} ${val(v.model)}` : BLANK,
    v?.maxLadenMass ? `${fmtNumber(v.maxLadenMass)} kg` : "—",
    `${fmtDate(r.start)} – ${fmtDate(r.end)}`,
    calc?.days ? String(calc.days) : "—",
    fmtEuro(r.fee),
    calc?.total ? fmtEuro(calc.total) : "—",
    fmtEuro(r.deductibleRCA),
    fmtEuro(r.damagePenalty),
    r.theftMode === "importo" ? fmtEuro(r.theftValue) : `${val(r.theftValue)}%`,
  ]);

  const sheets = lines.map((l) => ({
    plate: val(l.vehicle?.plate, l.sr.vehicle),
    rows: sheetFor(l),
  }));

  return {
    articles, allegatoA, granting, using, vehicle, subRental: sr,
    proRata: proRataCalc, collective, sheets, summaryRows,
    totals: { monthly: totalMonthly, period: totalPeriod, count: items.length },
  };
}

/** Documento HTML pronto per la stampa o l'archiviazione */
function renderContractHtml(contract) {
  const { articles, allegatoA, granting, using, vehicle, collective, sheets, summaryRows, totals } = contract;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const par = (t) => esc(t).split("\n\n").map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");

  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"/>
<title>${collective ? `Contratto quadro di noleggio — ${totals.count} veicoli` : `Contratto di noleggio a freddo — ${esc(vehicle?.plate || "")}`}</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  body { font-family: Calibri, "Segoe UI", sans-serif; font-size: 10.5pt; line-height: 1.5; color: #222; }
  h1 { font-size: 16pt; color: #12596B; text-align: center; margin: 0 0 4pt; }
  .sub { text-align: center; color: #9C7E12; font-size: 10pt; margin-bottom: 18pt; }
  h2 { font-size: 11pt; color: #12596B; margin: 16pt 0 4pt; border-bottom: 1px solid #2FA8C4; padding-bottom: 2pt; page-break-after: avoid; }
  p { margin: 0 0 7pt; text-align: justify; }
  .parties { background: #F5F6F8; padding: 10pt; margin-bottom: 12pt; }
  .parties p { margin-bottom: 8pt; }
  .role { font-weight: bold; color: #12596B; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 10pt; }
  td { border: 1px solid #d5d9df; padding: 5pt 7pt; }
  td:first-child { width: 42%; background: #F5F6F8; font-weight: 600; color: #12596B; }
  table.grid { font-size: 8.5pt; }
  table.grid td, table.grid th { border: 1px solid #d5d9df; padding: 3pt 4pt; text-align: right; }
  table.grid th { background: #12596B; color: #fff; font-weight: 600; text-align: center; }
  table.grid td:first-child { width: auto; background: transparent; text-align: left; }
  table.grid td.plate { font-weight: 700; color: #12596B; }
  table.grid td:nth-child(2) { text-align: left; }
  table.grid tfoot td { background: #F5F6F8; font-weight: 700; color: #12596B; }
  table.grid tfoot td:first-child { text-align: right; }
  .sign { margin-top: 26pt; page-break-inside: avoid; }
  .sign-row { display: flex; gap: 40pt; margin-top: 16pt; }
  .sign-col { flex: 1; }
  .line { border-bottom: 1px solid #666; height: 26pt; margin-bottom: 3pt; }
  .small { font-size: 9pt; color: #555; }
  .pagebreak { page-break-before: always; }
  @media print { .noprint { display: none; } }
</style></head>
<body>

<h1>${collective ? "CONTRATTO QUADRO DI NOLEGGIO A FREDDO DI VEICOLI" : "CONTRATTO DI NOLEGGIO A FREDDO DI VEICOLI"}</h1>
<div class="sub">Noleggio senza conducente tra imprese${collective ? ` &middot; ${totals.count} veicoli` : ""}</div>

<div class="parties">
  <p><span class="role">TRA</span><br/>${esc(partyBlock(granting))}, di seguito denominata <strong>&ldquo;Locatore&rdquo;</strong></p>
  <p><span class="role">E</span><br/>${esc(partyBlock(using))}, di seguito denominata <strong>&ldquo;Locatario&rdquo;</strong></p>
  <p class="small">Locatore e Locatario, congiuntamente, anche le &ldquo;Parti&rdquo;.</p>
</div>

${articles.map(([t, b]) => `<h2>${esc(t)}</h2>${par(b)}`).join("\n")}

<div class="pagebreak"></div>
<h2>ALLEGATO A – ELENCO VEICOLI E CONDIZIONI ECONOMICHE</h2>
${collective ? `
<p class="small">Prospetto riepilogativo dei ${totals.count} veicoli oggetto del contratto quadro. Le schede di dettaglio seguono nelle pagine successive.</p>
<table class="grid">
  <thead><tr>
    <th>Targa</th><th>Veicolo</th><th>Massa</th><th>Periodo</th><th>Giorni</th>
    <th>Canone/mese</th><th>Corrispettivo</th><th>Franch. RCA</th><th>Penale danni</th><th>Furto</th>
  </tr></thead>
  <tbody>
    ${summaryRows.map((r) => `<tr>${r.map((c, i) => `<td class="${i === 0 ? "plate" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}
  </tbody>
  <tfoot><tr>
    <td colspan="5">TOTALE ${totals.count} veicoli</td>
    <td>${esc(fmtEuro(totals.monthly))}</td>
    <td>${esc(fmtEuro(totals.period))}</td>
    <td colspan="3"></td>
  </tr></tfoot>
</table>

${sheets.map((sh, i) => `
  <div class="${i === 0 ? "" : "pagebreak"}"></div>
  <h2>ALLEGATO A.${i + 1} – SCHEDA VEICOLO ${esc(sh.plate)}</h2>
  <table>${sh.rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
  <p class="small">Il Locatore ______________________&nbsp;&nbsp;&nbsp;&nbsp;Il Locatario ______________________</p>
`).join("")}
` : `<table>${allegatoA.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>`}

<div class="sign">
  <p>Luogo ______________________________&nbsp;&nbsp;&nbsp;&nbsp;Data ______________________________</p>
  <div class="sign-row">
    <div class="sign-col">
      <p class="small"><strong>IL LOCATORE</strong><br/>${esc(granting?.name || BLANK)}<br/>${esc(granting?.legalRep || BLANK)}</p>
      <div class="line"></div><p class="small">Firma</p>
    </div>
    <div class="sign-col">
      <p class="small"><strong>IL LOCATARIO</strong><br/>${esc(using?.name || BLANK)}<br/>${esc(using?.legalRep || BLANK)}</p>
      <div class="line"></div><p class="small">Firma</p>
    </div>
  </div>

  <h2>APPROVAZIONE SPECIFICA DELLE CLAUSOLE</h2>
  <p class="small">Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c., ove applicabili, le Parti dichiarano di aver letto e di approvare specificamente le clausole relative, tra l'altro, a: durata e recesso; canoni e pagamenti; deposito cauzionale; custodia; chilometraggio; manutenzione; guasti; assicurazioni e franchigie; sinistri; multe; GPS e telematica; divieto di subnoleggio e cessione; riconsegna e danni; ritardata riconsegna; risoluzione; morosità; responsabilità; controlli; restituzione anticipata e foro competente.</p>
  <div class="sign-row">
    <div class="sign-col"><div class="line"></div><p class="small">Firma specifica — Locatore</p></div>
    <div class="sign-col"><div class="line"></div><p class="small">Firma specifica — Locatario</p></div>
  </div>
</div>

</body></html>`;
}

// ---------------------------------------------------------------------------
// ANTEPRIMA, STAMPA E DOWNLOAD DEL CONTRATTO
// ---------------------------------------------------------------------------
function ContractPrintModal({ subRental, subRentals, vehicleList, onClose }) {
  const items = subRentals && subRentals.length ? subRentals : [subRental];
  const first = items[0];
  const collective = items.length > 1;

  const granting = LIVE.companies.find(c => c.id === first.granting);
  const using = LIVE.companies.find(c => c.id === first.using);
  const contract = buildRentalContract(collective ? items : first, { vehicleList, granting, using });
  const html = renderContractHtml(contract);

  // Stampa da iframe isolato: non dipende da window.open, spesso bloccato
  const print = () => {
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "-10000px";
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    frame.onload = () => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => document.body.removeChild(frame), 1000);
    };
    if (doc.readyState === "complete") frame.onload();
  };

  const download = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = collective
      ? `contratto_quadro_${items.length}_veicoli_${first.start}.html`
      : `contratto_noleggio_${first.vehicle}_${first.start}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const missing = [];
  const senzaAnagrafica = items.filter(i => !vehicleList.find(v => v.plate === i.vehicle));
  if (senzaAnagrafica.length) missing.push(`anagrafica di ${senzaAnagrafica.map(i => i.vehicle).join(", ")}`);
  if (!granting?.vat) missing.push("P.IVA del Locatore");
  if (!using?.vat) missing.push("P.IVA del Locatario");
  if (items.some(i => !i.end)) missing.push("data di scadenza");

  // In un contratto quadro le parti devono essere le stesse per tutti i veicoli
  const partiDiverse = items.some(i => i.granting !== first.granting || i.using !== first.using);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>CONTRATTO DI NOLEGGIO A FREDDO</p>
            <h3 className="text-lg font-bold text-white">
              {collective ? `${items.length} veicoli` : first.vehicle} · {companyName(first.granting)} → {companyName(first.using)}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        {partiDiverse && (
          <div className="flex gap-2.5 px-6 py-3 text-xs flex-shrink-0" style={{ backgroundColor: "#FBEAEA", color: "#8F2624" }}>
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>
              I veicoli selezionati non hanno le stesse parti contrattuali: un contratto quadro unico non è utilizzabile.
              Generare contratti separati per ciascuna coppia Locatore/Locatario.
            </span>
          </div>
        )}

        {missing.length > 0 && (
          <div className="flex gap-2.5 px-6 py-3 text-xs flex-shrink-0" style={{ backgroundColor: "#FBF1DC", color: "#7A5C0E" }}>
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>Dati mancanti, lasciati da completare a mano sul documento: {missing.join(", ")}.</span>
          </div>
        )}

        <div className="flex-1 overflow-hidden p-4">
          <iframe title="Anteprima contratto" srcDoc={html}
            className="w-full h-full border border-slate-200 rounded-lg bg-white" />
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
          <button onClick={print}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition"
            style={{ backgroundColor: NAVY_700 }}>
            <Printer size={15} /> Stampa contratto
          </button>
          <button onClick={download}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
            style={{ borderColor: NAVY_700, color: NAVY_700 }}>
            <Download size={15} /> Scarica documento
          </button>
          <p className="text-xs text-slate-400 ml-auto">
            {collective
              ? `Allegato A: prospetto riepilogativo + ${items.length} schede veicolo.`
              : "Allegato A compilato con targa, periodo, canone e franchigie del contratto."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RINNOVI SUBNOLEGGIO — rinnovo massivo e riepilogo scadenze riga per riga
// ---------------------------------------------------------------------------
const localISODate = (date = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const TODAY = localISODate();
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// Somma giorni a una data ISO restituendo ISO: usata per i termini di legge
const addDays = (isoDate, n) => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Canone giornaliero convenzionale su base 30 giorni; il totale del periodo è
// riproporzionato sui giorni effettivi di noleggio.
// La scadenza non può precedere l'inizio: restituisce il messaggio d'errore
// oppure null se il periodo è valido.
function validatePeriod(start, end) {
  if (!start || !end) return null;
  if (daysBetween(start, end) < 0) {
    return `La data di scadenza (${end}) non può essere precedente all'inizio del noleggio (${start})`;
  }
  return null;
}

function proRata(monthlyFee, start, end, basis = 30) {
  const fee = parseFloat(monthlyFee) || 0;
  if (!start || !end || validatePeriod(start, end)) return { days: 0, daily: 0, total: 0, invalid: !!validatePeriod(start, end) };
  const days = Math.max(0, daysBetween(start, end) + 1);
  // Il canone giornaliero viene arrotondato ai centesimi e il totale è derivato
  // da quello, così l'importo esposto è ricalcolabile dal locatario in fattura.
  const daily = Math.round((fee / basis) * 100) / 100;
  return { days, daily, total: Math.round(daily * days * 100) / 100 };
}

function ConditionsFields({ values, onChange, compact }) {
  const set = (k) => (e) => onChange({ ...values, [k]: e.target.value });
  const cls = compact
    ? "w-full border border-slate-300 rounded-md px-2 py-1 text-xs"
    : "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm";
  return (
    <>
      <div>
        {!compact && <p className="text-xs text-slate-500 mb-1">Franchigia RCA (€)</p>}
        <input type="number" value={values.deductibleRCA ?? ""} onChange={set("deductibleRCA")} className={cls} placeholder="Franch. RCA" />
      </div>
      <div>
        {!compact && <p className="text-xs text-slate-500 mb-1">Penale danni (€)</p>}
        <input type="number" value={values.damagePenalty ?? ""} onChange={set("damagePenalty")} className={cls} placeholder="Penale danni" />
      </div>
      <div>
        {!compact && <p className="text-xs text-slate-500 mb-1">Furto — modalità</p>}
        <select value={values.theftMode ?? "percentuale"} onChange={set("theftMode")} className={cls}>
          <option value="percentuale">% sul valore</option>
          <option value="importo">Importo fisso</option>
        </select>
      </div>
      <div>
        {!compact && <p className="text-xs text-slate-500 mb-1">Furto — {values.theftMode === "importo" ? "importo (€)" : "percentuale (%)"}</p>}
        <input type="number" value={values.theftValue ?? ""} onChange={set("theftValue")} className={cls}
          placeholder={values.theftMode === "importo" ? "€ furto" : "% furto"} />
      </div>
    </>
  );
}

function RinnoviView({ list, setList, vehicleList }) {
  const [tab, setTab] = useState("scadenze");
  const [horizon, setHorizon] = useState(90);

  // ---- Stato rinnovo massivo ----
  const [selected, setSelected] = useState({});
  const [bulk, setBulk] = useState({
    using: "", start: "2026-09-01", end: "2027-08-31", fee: "",
    deductibleRCA: 1000, damagePenalty: 750, theftMode: "percentuale", theftValue: 10,
  });
  const [bulkDone, setBulkDone] = useState(null);

  // ---- Stato riepilogo riga per riga ----
  const [drafts, setDrafts] = useState({});
  const [renewedRows, setRenewedRows] = useState([]);
  const [contractFor, setContractFor] = useState(null);
  const [collectiveFor, setCollectiveFor] = useState(null);
  const [bulkContracts, setBulkContracts] = useState([]);

  const withDays = list.map(sr => ({ ...sr, daysToEnd: daysBetween(TODAY, sr.end) }));
  // Le righe già rinnovate in questa sessione restano visibili con l'esito,
  // anche se la nuova scadenza le porta fuori dall'orizzonte selezionato.
  const expiring = withDays
    .filter(sr => (sr.status === "attivo" && sr.daysToEnd <= horizon) || renewedRows.includes(sr.id))
    .sort((a, b) => a.daysToEnd - b.daysToEnd);

  const selectedPlates = Object.keys(selected).filter(p => selected[p]);
  const bulkCalc = proRata(bulk.fee, bulk.start, bulk.end);
  const bulkPeriodError = validatePeriod(bulk.start, bulk.end);

  const applyBulk = () => {
    if (validatePeriod(bulk.start, bulk.end)) return;   // guardia: periodo non valido
    const conditions = {
      deductibleRCA: parseFloat(bulk.deductibleRCA) || 0,
      damagePenalty: parseFloat(bulk.damagePenalty) || 0,
      theftMode: bulk.theftMode,
      theftValue: parseFloat(bulk.theftValue) || 0,
    };
    setList(prev => {
      let next = [...prev];
      selectedPlates.forEach(plate => {
        const idx = next.findIndex(sr => sr.vehicle === plate && sr.status === "attivo");
        const payload = {
          vehicle: plate, using: bulk.using, start: bulk.start, end: bulk.end,
          fee: parseFloat(bulk.fee) || 0, status: "attivo", ...conditions,
        };
        if (idx >= 0) {
          next[idx] = { ...next[idx], ...payload };
        } else {
          const v = vehicleList.find(x => x.plate === plate);
          next = [{
            id: `sr${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
            granting: v?.company || "demo", vehicleCost: tcoDi(v), ...payload,
          }, ...next];
        }
      });
      return next;
    });
    setBulkDone({ count: selectedPlates.length, total: bulkCalc.total * selectedPlates.length });
    setBulkContracts(selectedPlates.map(plate => ({
      id: `bulk-${plate}`, vehicle: plate,
      granting: (vehicleList.find(v => v.plate === plate)?.company) || "demo",
      using: bulk.using, start: bulk.start, end: bulk.end,
      fee: parseFloat(bulk.fee) || 0, status: "attivo", ...conditions,
    })));
    setSelected({});
  };

  const draftFor = (sr) => drafts[sr.id] || {
    using: sr.using, start: sr.end, end: "", fee: sr.fee,
    deductibleRCA: sr.deductibleRCA, damagePenalty: sr.damagePenalty,
    theftMode: sr.theftMode, theftValue: sr.theftValue,
  };
  const updateDraft = (id, patch) => setDrafts(d => ({ ...d, [id]: { ...draftFor(list.find(s => s.id === id)), ...patch } }));

  const renewRow = (sr) => {
    const d = draftFor(sr);
    if (!d.end || !d.using) return;
    if (validatePeriod(d.start, d.end)) return;         // guardia: periodo non valido
    setList(prev => prev.map(x => x.id === sr.id ? {
      ...x, using: d.using, start: d.start, end: d.end, fee: parseFloat(d.fee) || 0,
      deductibleRCA: parseFloat(d.deductibleRCA) || 0, damagePenalty: parseFloat(d.damagePenalty) || 0,
      theftMode: d.theftMode, theftValue: parseFloat(d.theftValue) || 0, status: "attivo",
    } : x));
    setRenewedRows(r => [...r, sr.id]);
  };

  const exportExpiring = expiring.map(sr => {
    const c = proRata(sr.fee, sr.start, sr.end);
    return {
      "Targa": sr.vehicle, "Concedente": companyName(sr.granting), "Locataria": companyName(sr.using),
      "Inizio": sr.start, "Scadenza": sr.end, "Giorni residui": sr.daysToEnd,
      "Canone mensile": sr.fee, "Giorni periodo": c.days, "Totale periodo": c.total,
      "Franchigia RCA": sr.deductibleRCA, "Penale danni": sr.damagePenalty,
      "Furto": sr.theftMode === "importo" ? `€ ${sr.theftValue}` : `${sr.theftValue}%`,
    };
  });

  return (
    <div>
      <SectionTitle
        title="Rinnovi Subnoleggio"
        sub="Riepilogo dei contratti in scadenza e rinnovo massivo per targhe selezionate, con ricalcolo del canone sui giorni effettivi"
        action={<ExportButton rows={exportExpiring} filename="subnoleggi_in_scadenza" sheetName="In scadenza" />}
      />

      <div className="flex border-b border-slate-200 mb-5">
        {[
          { id: "scadenze", label: `In scadenza (${expiring.length})` },
          { id: "massivo", label: "Rinnovo massivo" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- IN SCADENZA — riga per riga ---------------- */}
      {tab === "scadenze" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-500">Orizzonte:</span>
            {[30, 60, 90, 180].map(h => (
              <button key={h} onClick={() => setHorizon(h)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                style={horizon === h ? { backgroundColor: NAVY_700, color: "#fff", borderColor: NAVY_700 } : { color: "#64748b", borderColor: "#e2e8f0" }}>
                {h} giorni
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {expiring.map(sr => {
              const d = draftFor(sr);
              const calc = proRata(d.fee, d.start, d.end);
              const periodError = validatePeriod(d.start, d.end);
              const done = renewedRows.includes(sr.id);
              const urgency = sr.daysToEnd <= 30 ? "#B4302E" : sr.daysToEnd <= 60 ? "#B07A12" : "#1B6DB0";
              return (
                <Card key={sr.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold" style={{ color: NAVY_700 }}>{sr.vehicle}</span>
                      <span className="text-xs text-slate-400">
                        {companyName(sr.granting)} → {companyName(sr.using)} · scade il {sr.end}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: urgency, backgroundColor: `${urgency}18` }}>
                        {sr.daysToEnd < 0 ? `scaduto da ${Math.abs(sr.daysToEnd)} gg` : `${sr.daysToEnd} giorni`}
                      </span>
                    </div>
                    {done
                      ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#2E7D5B" }}><CheckCircle2 size={13} /> Rinnovato</span>
                          <button onClick={() => setContractFor(list.find(x => x.id === sr.id))}
                            className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition hover:bg-slate-50"
                            style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                            <FileSignature size={13} /> Genera contratto
                          </button>
                        </div>
                      )
                      : <button onClick={() => renewRow(sr)} disabled={!d.end || !d.using || !!periodError}
                          className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg text-white disabled:opacity-40 transition"
                          style={{ backgroundColor: NAVY_700 }}>
                          <Repeat size={13} /> Rinnova
                        </button>}
                  </div>

                  <div className="grid grid-cols-8 gap-2 items-end">
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Società locataria</p>
                      <select value={d.using} onChange={e => updateDraft(sr.id, { using: e.target.value })}
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs" disabled={done}>
                        <option value="">Seleziona...</option>
                        {LIVE.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Dal</p>
                      <input type="date" value={d.start} onChange={e => updateDraft(sr.id, { start: e.target.value })}
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs" disabled={done} />
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: periodError ? "#B4302E" : "#64748b" }}>Al</p>
                      <input type="date" value={d.end} onChange={e => updateDraft(sr.id, { end: e.target.value })}
                        className="w-full border rounded-md px-2 py-1 text-xs" disabled={done}
                        style={{ borderColor: periodError ? "#B4302E" : "#cbd5e1" }} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Canone/mese</p>
                      <input type="number" value={d.fee} onChange={e => updateDraft(sr.id, { fee: e.target.value })}
                        className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs" disabled={done} />
                    </div>
                    <ConditionsFields compact values={d} onChange={patch => updateDraft(sr.id, patch)} />
                  </div>

                  {periodError && (
                    <div className="flex gap-2 rounded-md p-2 text-xs mt-2.5" style={{ backgroundColor: "#FBEAEA", color: "#B4302E" }}>
                      <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {periodError}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                    <span>Giorni: <strong className="text-slate-700">{calc.days}</strong></span>
                    <span>Canone/giorno: <strong className="text-slate-700">€ {calc.daily.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</strong></span>
                    <span>Totale periodo: <strong style={{ color: NAVY_700 }}>€ {calc.total.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</strong></span>
                    <span className="ml-auto">
                      RCA € {d.deductibleRCA || 0} · Danni € {d.damagePenalty || 0} · Furto {d.theftMode === "importo" ? `€ ${d.theftValue || 0}` : `${d.theftValue || 0}%`}
                    </span>
                  </div>
                </Card>
              );
            })}
            {expiring.length === 0 && (
              <Card className="p-8 text-center text-sm text-slate-400">
                Nessun subnoleggio in scadenza nei prossimi {horizon} giorni.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ---------------- RINNOVO MASSIVO ---------------- */}
      {tab === "massivo" && (
        <div>
          {bulkDone && (
            <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>
              <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Rinnovo massivo applicato</p>
                <p className="text-xs mt-0.5">
                  {bulkDone.count} contratti aggiornati · valore complessivo del periodo € {bulkDone.total.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </p>
                {bulkContracts.length > 0 && (
                  <div className="mt-3">
                    <button onClick={() => setCollectiveFor(bulkContracts)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
                      style={{ backgroundColor: NAVY_700 }}>
                      <FileSignature size={15} /> Stampa contratto quadro ({bulkContracts.length} veicoli)
                    </button>
                    <p className="text-xs mt-2 mb-1.5" style={{ color: "#2E7D5B" }}>
                      Oppure genera un contratto separato per singola targa:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {bulkContracts.map(c => (
                        <button key={c.id} onClick={() => setContractFor(c)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border transition hover:bg-slate-50"
                          style={{ borderColor: "#2E7D5B", color: "#2E7D5B" }}>
                          <FileSignature size={11} /> {c.vehicle}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <Card className="p-5">
              <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>1 · Seleziona le targhe</p>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setSelected(Object.fromEntries(vehicleList.map(v => [v.plate, true])))}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800">Seleziona tutte</button>
                <span className="text-slate-300">·</span>
                <button onClick={() => setSelected(Object.fromEntries(expiring.map(s => [s.vehicle, true])))}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800">Solo in scadenza ({expiring.length})</button>
                <span className="text-slate-300">·</span>
                <button onClick={() => setSelected({})} className="text-xs font-medium text-slate-500 hover:text-slate-800">Azzera</button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 border-t border-slate-100 pt-2">
                {[...vehicleList].sort((a, b) => a.plate.localeCompare(b.plate)).map(v => {
                  const active = list.find(sr => sr.vehicle === v.plate && sr.status === "attivo");
                  return (
                    <label key={v.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                      <input type="checkbox" checked={!!selected[v.plate]}
                        onChange={() => setSelected(s => ({ ...s, [v.plate]: !s[v.plate] }))}
                        className="w-3.5 h-3.5 rounded" style={{ accentColor: GOLD_500 }} />
                      <span className="font-medium text-slate-700">{v.plate}</span>
                      <span className="text-xs text-slate-400">{v.make} {v.model}</span>
                      {active && <span className="text-xs ml-auto text-slate-400">scad. {active.end}</span>}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2">{selectedPlates.length} targhe selezionate</p>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>2 · Condizioni da applicare</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Società locataria</p>
                  <select value={bulk.using} onChange={e => setBulk(b => ({ ...b, using: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleziona...</option>
                    {LIVE.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Inizio noleggio</p>
                  <input type="date" value={bulk.start} onChange={e => setBulk(b => ({ ...b, start: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: bulkPeriodError ? "#B4302E" : "#64748b" }}>Fine noleggio</p>
                  <input type="date" value={bulk.end} onChange={e => setBulk(b => ({ ...b, end: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: bulkPeriodError ? "#B4302E" : "#cbd5e1" }} />
                </div>
                {bulkPeriodError && (
                  <div className="col-span-2 flex gap-2 rounded-lg p-2.5 text-xs" style={{ backgroundColor: "#FBEAEA", color: "#B4302E" }}>
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {bulkPeriodError}
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Canone mensile (€)</p>
                  <input type="number" value={bulk.fee} onChange={e => setBulk(b => ({ ...b, fee: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
                </div>
                <ConditionsFields values={bulk} onChange={v => setBulk(v)} />
              </div>
            </Card>
          </div>

          <Card className="p-5 mb-5">
            <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>3 · Riepilogo e ricalcolo sui giorni effettivi</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Giorni di noleggio</p>
                <p className="text-xl font-bold" style={{ color: NAVY_700 }}>{bulkCalc.days}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Canone giornaliero</p>
                <p className="text-xl font-bold" style={{ color: NAVY_700 }}>€ {bulkCalc.daily.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-400">canone ÷ 30</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Totale per veicolo</p>
                <p className="text-xl font-bold" style={{ color: NAVY_700 }}>€ {bulkCalc.total.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Totale complessivo</p>
                <p className="text-xl font-bold" style={{ color: "#2E7D5B" }}>
                  € {(bulkCalc.total * selectedPlates.length).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400">{selectedPlates.length} veicoli</p>
              </div>
            </div>
            {selectedPlates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                {selectedPlates.map(p => (
                  <span key={p} className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "#E3F2F6", color: NAVY_700 }}>{p}</span>
                ))}
              </div>
            )}
          </Card>

          <button onClick={applyBulk} disabled={selectedPlates.length === 0 || !bulk.using || !bulk.end || !bulk.fee || !!bulkPeriodError}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}>
            <Repeat size={15} /> Applica rinnovo a {selectedPlates.length} targhe
          </button>
          <p className="text-xs text-slate-400 mt-2">
            L'operazione aggiorna esclusivamente i contratti delle targhe selezionate; gli altri subnoleggi restano invariati.
          </p>
        </div>
      )}

      {contractFor && (
        <ContractPrintModal subRental={contractFor} vehicleList={vehicleList} onClose={() => setContractFor(null)} />
      )}
      {collectiveFor && (
        <ContractPrintModal subRentals={collectiveFor} vehicleList={vehicleList} onClose={() => setCollectiveFor(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RIFORNIMENTI — scheda per mezzo, inserimento validato e caricamento massivo
// ---------------------------------------------------------------------------
function RefuelFormModal({ transactions, vehicleList, initialValues, onClose, onSave }) {
  const [form, setForm] = useState(initialValues || {
    vehicle: "", date: TODAY, odometer: "", litres: "", amount: "", source: "",
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Esclude il record in modifica dallo storico, altrimenti si validerebbe contro sé stesso
  const history = initialValues ? transactions.filter(t => t.id !== initialValues.id) : transactions;
  const last = form.vehicle ? vehicleFuelHistory(form.vehicle, history).filter(t => t.date <= form.date).pop() : null;

  const check = form.vehicle && form.date && form.odometer !== "" && form.litres !== ""
    ? validateRefuel({ plate: form.vehicle, date: form.date, odometer: form.odometer, litres: form.litres }, history)
    : { errors: [], warnings: [] };

  const complete = form.vehicle && form.date && form.odometer !== "" && form.litres !== "";
  const canSave = complete && check.errors.length === 0;
  const delta = last && form.odometer !== "" ? parseFloat(form.odometer) - last.odometer : null;
  const kmPerL = delta > 0 && parseFloat(form.litres) > 0 ? delta / parseFloat(form.litres) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <h3 className="text-lg font-bold text-white">{initialValues ? "Modifica rifornimento" : "Nuovo rifornimento"}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col">
              <p className="text-xs text-slate-500 mb-1">Veicolo *</p>
              <VehiclePicker value={form.vehicle} onChange={v => setForm(f => ({ ...f, vehicle: v }))} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Data *</p>
              <input type="date" value={form.date} onChange={set("date")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">
                Km *{last && <span className="text-slate-400"> — ultima lettura {last.odometer.toLocaleString("it-IT")}</span>}
              </p>
              <input type="number" value={form.odometer} onChange={set("odometer")}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: check.errors.length ? "#B4302E" : "#cbd5e1" }} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Litri *</p>
              <input type="number" step="0.01" value={form.litres} onChange={set("litres")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Importo (€)</p>
              <input type="number" step="0.01" value={form.amount} onChange={set("amount")} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">Fonte</p>
              <input value={form.source} onChange={set("source")} placeholder="Cisterna interna, fuel card, distributore..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {(delta !== null || kmPerL) && (
            <div className="rounded-lg p-3 text-sm flex gap-4" style={{ backgroundColor: "#F5F6F8" }}>
              <span className="text-slate-500">Percorrenza: <strong className="text-slate-700">{delta !== null ? `${delta.toLocaleString("it-IT")} km` : "—"}</strong></span>
              <span className="text-slate-500">Media: <strong className="text-slate-700">{kmPerL ? `${kmPerL.toFixed(2).replace(".", ",")} km/L` : "—"}</strong></span>
            </div>
          )}

          {check.errors.map((e, i) => (
            <div key={i} className="flex gap-2 rounded-lg p-2.5 text-xs" style={{ backgroundColor: "#FBEAEA", color: "#B4302E" }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {e}
            </div>
          ))}
          {check.warnings.map((w, i) => (
            <div key={i} className="flex gap-2 rounded-lg p-2.5 text-xs" style={{ backgroundColor: "#FBF1DC", color: "#7A5C0E" }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {w}
            </div>
          ))}

          <button disabled={!canSave}
            onClick={() => onSave({
              ...form,
              odometer: parseFloat(form.odometer) || 0,
              litres: parseFloat(form.litres) || 0,
              amount: parseFloat(form.amount) || 0,
            })}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}>
            {check.errors.length > 0 ? "Correggi i km per salvare" : initialValues ? "Salva modifiche" : "Registra rifornimento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RifornimentiView({ list, setList, vehicleList }) {
  const [plateFilter, setPlateFilter] = useState("tutti");
  const [showForm, setShowForm] = useState(false);
  const [bulk, setBulk] = useState(null);
  const [bulkDone, setBulkDone] = useState(null);
  const crud = useCrudModals(setList, "Rifornimenti", t => `${t.vehicle} — ${t.date} (${t.litres} L)`);

  const shown = list
    .filter(t => plateFilter === "tutti" || t.vehicle === plateFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Arricchisce ogni riga con percorrenza e media rispetto al rifornimento precedente
  const enriched = shown.map(t => {
    const prev = vehicleFuelHistory(t.vehicle, list).filter(x => x.date <= t.date && x.id !== t.id).pop();
    const delta = prev ? t.odometer - prev.odometer : null;
    const kmPerL = delta > 0 && t.litres > 0 ? delta / t.litres : null;
    const anomalous = kmPerL !== null && (kmPerL < KM_RULES.minKmPerLitre || kmPerL > KM_RULES.maxKmPerLitre);
    return { ...t, delta, kmPerL, anomalous };
  });

  const totLitres = shown.reduce((s, t) => s + t.litres, 0);
  const totAmount = shown.reduce((s, t) => s + (t.amount || 0), 0);
  const anomalies = enriched.filter(t => t.anomalous).length;

  const handleBulkFile = (files) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await caricaXLSX();
        const wb = XLSX.read(ev.target.result, { type: "array" });
        let rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        rows = rows.filter(r => !String(Object.values(r)[0] ?? "").includes("OBBLIGATORIO"));
        setBulk({ fileName: file.name, rows: validateImportRows(rows, IMPORT_TEMPLATES.rifornimenti, list) });
        setBulkDone(null);
      } catch { setBulk({ fileName: file.name, rows: null, error: "File non leggibile: usa il template .xlsx." }); }
    };
    reader.readAsArrayBuffer(file);
  };

  const applyBulk = () => {
    const valid = bulk.rows.filter(r => r.errors.length === 0);
    setList(prev => {
      let next = [...prev];
      valid.forEach(r => {
        const idx = next.findIndex(t => `${t.vehicle}|${t.date}|${t.odometer}` === r.key);
        if (idx >= 0) next[idx] = { ...next[idx], ...r.record };
        else next = [...next, { id: `ft${Date.now()}${Math.random().toString(36).slice(2, 5)}`, ...r.record }];
      });
      return next;
    });
    setBulkDone({ imported: valid.length, skipped: bulk.rows.length - valid.length });
    setBulk(null);
  };

  const exportRows = enriched.map(t => ({
    "Targa": t.vehicle, "Data": t.date, "Km": t.odometer, "Litri": t.litres,
    "Importo (€)": t.amount || "", "Percorrenza (km)": t.delta ?? "",
    "Media km/L": t.kmPerL ? Math.round(t.kmPerL * 100) / 100 : "", "Fonte": t.source || "",
    "Anomalia": t.anomalous ? "SI" : "",
  }));

  const columns = [
    { key: "vehicle", label: "Targa", filterType: "select", options: [...new Set(list.map(t => t.vehicle))] },
    { key: "date", label: "Data" },
    { key: "odometer", label: "Km", render: t => t.odometer.toLocaleString("it-IT") },
    { key: "delta", label: "Percorrenza", render: t => t.delta !== null ? `${t.delta.toLocaleString("it-IT")} km` : "—" },
    { key: "litres", label: "Litri", render: t => t.litres.toLocaleString("it-IT") },
    { key: "kmPerL", label: "Media km/L", render: t => t.kmPerL ? (
      <span className="font-semibold" style={{ color: t.anomalous ? "#B4302E" : NAVY_700 }}>
        {t.kmPerL.toFixed(2).replace(".", ",")}{t.anomalous && " ⚠"}
      </span>
    ) : "—" },
    { key: "amount", label: "Importo", render: t => t.amount ? `€ ${t.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}` : "—" },
    { key: "source", label: "Fonte" },
    { key: "_actions", label: "", sortable: false, filterable: false, render: t => <RowActions entity={{ type: "rifornimento", id: t.id, label: `${t.vehicle} — ${t.date}` }} onEdit={() => crud.requestEdit(t)} onDelete={() => crud.requestDelete(t)} /> },
  ];

  return (
    <div>
      <SectionTitle
        title="Rifornimenti"
        sub="Registro per veicolo con controllo chilometrico: letture in diminuzione rifiutate, percorrenze e consumi anomali segnalati"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="rifornimenti" sheetName="Rifornimenti" />
            <NewRecordButton label="Nuovo rifornimento" onClick={() => setShowForm(true)} />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <KPI icon={Fuel} label="Rifornimenti" value={shown.length} sub={plateFilter === "tutti" ? "tutta la flotta" : plateFilter} />
        <KPI icon={Droplet} label="Litri erogati" value={totLitres.toLocaleString("it-IT")} accent="#1B6DB0" />
        <KPI icon={Coins} label="Spesa carburante" value={`€ ${totAmount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`} accent="#B07A12" />
        <KPI icon={AlertTriangle} label="Consumi anomali" value={anomalies} sub="da verificare" accent={anomalies > 0 ? "#B4302E" : "#2E7D5B"} />
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Veicolo:</span>
            <select value={plateFilter} onChange={e => setPlateFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option value="tutti">Tutta la flotta</option>
              {vehicleList.map(v => <option key={v.id} value={v.plate}>{v.plate} — {v.make} {v.model}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadTemplate("rifornimenti")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
              style={{ borderColor: NAVY_700, color: NAVY_700 }}>
              <Download size={14} /> Template rifornimenti
            </button>
            <FileUploadButton accept=".xlsx,.xls,.csv" label="Caricamento massivo" onFiles={handleBulkFile} />
          </div>
        </div>
      </Card>

      {bulkDone && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>
          <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Caricamento completato</p>
            <p className="text-xs mt-0.5">
              {bulkDone.imported} rifornimenti importati
              {bulkDone.skipped > 0 ? ` · ${bulkDone.skipped} scartati per errori di km` : ""}
            </p>
          </div>
        </div>
      )}

      {bulk && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Anteprima caricamento — {bulk.fileName}</p>
            <button onClick={() => setBulk(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          {bulk.error && <p className="text-sm" style={{ color: "#B4302E" }}>{bulk.error}</p>}
          {bulk.rows && (() => {
            const ok = bulk.rows.filter(r => r.errors.length === 0);
            const ko = bulk.rows.filter(r => r.errors.length > 0);
            const warn = ok.filter(r => r.warnings.length > 0);
            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
                  <div><p className="text-xs text-slate-400 mb-1">Righe lette</p><p className="text-xl font-bold" style={{ color: NAVY_700 }}>{bulk.rows.length}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Importabili</p><p className="text-xl font-bold" style={{ color: "#2E7D5B" }}>{ok.length}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Con segnalazioni</p><p className="text-xl font-bold" style={{ color: "#B07A12" }}>{warn.length}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Scartate</p><p className="text-xl font-bold" style={{ color: "#B4302E" }}>{ko.length}</p></div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {[...ko, ...warn].map(r => (
                    <div key={r.rowNumber} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                      <span className="font-semibold text-slate-700">Riga {r.rowNumber}</span>
                      <span className="text-slate-400"> — {r.record.vehicle} · {r.record.date} · {(r.record.odometer ?? 0).toLocaleString("it-IT")} km</span>
                      {r.errors.map((e, i) => <p key={i} className="text-xs mt-0.5" style={{ color: "#B4302E" }}>✕ {e}</p>)}
                      {r.warnings.map((w, i) => <p key={i} className="text-xs mt-0.5" style={{ color: "#B07A12" }}>⚠ {w}</p>)}
                    </div>
                  ))}
                  {ko.length === 0 && warn.length === 0 && <p className="text-sm text-slate-400">Nessuna anomalia rilevata.</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={applyBulk} disabled={ok.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
                    style={{ backgroundColor: NAVY_700 }}>
                    <ArrowDownToLine size={15} /> Importa {ok.length} rifornimenti
                  </button>
                  <ExportButton rows={ko.map(r => ({ "Riga": r.rowNumber, "Targa": r.record.vehicle, "Data": r.record.date, "Km": r.record.odometer, "Errori": r.errors.join(" · ") }))}
                    filename="rifornimenti_scartati" sheetName="Scartati" label="Esporta scartati" />
                </div>
              </>
            );
          })()}
        </Card>
      )}

      <Card>
        <DataTable columns={columns} data={enriched} emptyLabel="Nessun rifornimento registrato." />
      </Card>

      {showForm && (
        <RefuelFormModal transactions={list} vehicleList={vehicleList}
          onClose={() => setShowForm(false)}
          onSave={(f) => { setList(prev => [...prev, { id: `ft${Date.now()}`, ...f }]); setShowForm(false); }} />
      )}
      {crud.editing && (
        <RefuelFormModal transactions={list} vehicleList={vehicleList} initialValues={crud.editing}
          onClose={crud.cancelEdit} onSave={crud.confirmEdit} />
      )}
      {crud.deleting && (
        <PinConfirmModal itemLabel={`il rifornimento di ${crud.deleting.vehicle} del ${crud.deleting.date}`}
          moduleLabel="Rifornimenti" onClose={crud.cancelDelete} onConfirm={crud.confirmDelete} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PIPELINE KANBAN — avanzamento per stati con drag & drop e note di aggiornamento
// ---------------------------------------------------------------------------
// Ogni spostamento fra colonne, e ogni apertura di una scheda, consente di
// registrare una nota datata: la cronologia resta allegata al record e
// costituisce il diario di lavorazione del mezzo.
function UpdateNoteModal({ title, subtitle, from, to, stageMeta, onClose, onConfirm, optional }) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>NOTA DI AGGIORNAMENTO</p>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          {from && to && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{ color: stageMeta[from]?.color, backgroundColor: `${stageMeta[from]?.color}18` }}>
                {stageMeta[from]?.label || from}
              </span>
              <ArrowRight size={14} className="text-slate-400" />
              <span className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{ color: stageMeta[to]?.color, backgroundColor: `${stageMeta[to]?.color}18` }}>
                {stageMeta[to]?.label || to}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 mb-1">Nota di aggiornamento{optional ? " (facoltativa)" : ""}</p>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4} autoFocus
              placeholder="Descrivi l'avanzamento dei lavori, l'esito o le azioni successive..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
              Annulla
            </button>
            <button onClick={() => onConfirm(text.trim())} disabled={!optional && !text.trim()}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-40 transition"
              style={{ backgroundColor: NAVY_700 }}>
              Salva aggiornamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordTimelineModal({ record, stageMeta, title, fields, entityType, onClose, onAddNote, onEdit, onDelete }) {
  const updates = [...(record.updates || [])].sort((a, b) => b.date.localeCompare(a.date));
  const [adding, setAdding] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>{title}</p>
            <h3 className="text-lg font-bold text-white">{record.vehicle}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: stageMeta[record.status]?.color, backgroundColor: `${stageMeta[record.status]?.color}18` }}>
              {stageMeta[record.status]?.label || record.status}
            </span>
            <RowActions
              entity={{ type: entityType || "record", id: record.id, label: `${title} — ${record.vehicle}` }}
              onEdit={onEdit ? () => { onClose(); onEdit(record); } : undefined}
              onDelete={onDelete ? () => { onClose(); onDelete(record); } : undefined} />
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            {fields.map(f => (
              <React.Fragment key={f.label}>
                <dt className="text-slate-400">{f.label}</dt>
                <dd className="text-slate-700 font-medium">{f.value(record) ?? "—"}</dd>
              </React.Fragment>
            ))}
          </dl>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Diario di lavorazione</p>
              <button onClick={() => setAdding(true)}
                className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition hover:bg-slate-50"
                style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                <Plus size={12} /> Aggiungi nota
              </button>
            </div>
            {updates.length === 0 && <p className="text-sm text-slate-400">Nessun aggiornamento registrato.</p>}
            <div className="space-y-3">
              {updates.map((u, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: GOLD_500 }} />
                    {i < updates.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-slate-400">{u.date}</p>
                      {u.from && u.to && (
                        <span className="text-xs text-slate-400">
                          {stageMeta[u.from]?.label || u.from} → <strong className="text-slate-600">{stageMeta[u.to]?.label || u.to}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5">{u.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {adding && (
        <UpdateNoteModal
          title={`Nota — ${record.vehicle}`} subtitle="Aggiornamento sulla lavorazione in corso" stageMeta={stageMeta}
          onClose={() => setAdding(false)}
          onConfirm={(text) => { onAddNote(text); setAdding(false); }}
        />
      )}
    </div>
  );
}

function KanbanBoard({ items, stages, stageMeta, onMove, onOpen, renderCard }) {
  const [overStage, setOverStage] = useState(null);

  // --- Trascinamento unificato ---------------------------------------------
  // Un solo meccanismo per mouse, dito e pennino, basato su pointer events.
  // Il drag & drop HTML5 è stato abbandonato: non risponde al tocco e, senza
  // dataTransfer.setData, su alcuni browser non si avvia nemmeno col mouse.
  // Col dito il trascinamento parte solo dopo uno spostamento orizzontale, così
  // lo scorrimento verticale della colonna resta possibile; col mouse bastano
  // pochi pixel in qualsiasi direzione.
  const colRefs = React.useRef({});
  const gesture = React.useRef(null);
  const suppressClick = React.useRef(false);
  const [touchDrag, setTouchDrag] = useState(null);   // { id, x, y, stage }

  const stageAtPoint = (x, y) => {
    for (const st of stages) {
      const el = colRefs.current[st];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top - 40 && y <= r.bottom + 40) return st;
    }
    return null;
  };

  const onCardPointerDown = (e, item) => {
    // Il click generato dal trascinamento precedente è già stato assorbito:
    // azzerare qui, e non a tempo, evita che un tocco rapido successivo vada perso.
    suppressClick.current = false;
    gesture.current = {
      id: item.id, x: e.clientX, y: e.clientY, moved: false,
      status: item.status, touch: e.pointerType !== "mouse",
    };
    if (e.currentTarget.setPointerCapture && e.pointerId != null) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* non supportato */ }
    }
  };

  const onCardPointerMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.moved) {
      // Col dito si pretende un'intenzione orizzontale per non rubare lo scroll;
      // col mouse qualunque spostamento apprezzabile avvia il trascinamento.
      const avviato = g.touch
        ? (Math.abs(dx) >= 12 && Math.abs(dx) >= Math.abs(dy))
        : (Math.abs(dx) >= 5 || Math.abs(dy) >= 5);
      if (!avviato) return;
    }
    g.moved = true;
    setTouchDrag({ id: g.id, x: e.clientX, y: e.clientY, stage: stageAtPoint(e.clientX, e.clientY) });
  };

  const endGesture = (item) => {
    const g = gesture.current;
    gesture.current = null;
    const drag = touchDrag;
    setTouchDrag(null);
    if (!g || !g.moved) return;                        // tocco semplice: apre la scheda
    suppressClick.current = true;                      // evita l'apertura dopo il trascinamento
    const target = drag?.stage;
    if (target && target !== item.status) onMove(item, target);
  };

  const draggedItem = touchDrag ? items.find(i => i.id === touchDrag.id) : null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {stages.map((stage, idx) => {
        const col = items.filter(i => i.status === stage);
        const m = stageMeta[stage];
        const isOver = touchDrag?.stage === stage;
        return (
          <div key={stage}
            ref={el => { colRefs.current[stage] = el; }}
            className="flex-shrink-0 w-60 rounded-xl border transition"
            style={{
              backgroundColor: isOver ? `${m.color}0F` : "#F8FAFC",
              borderColor: isOver ? m.color : "#E2E8F0",
            }}>
            <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: m.color }}>{m.label}</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ color: m.color, backgroundColor: `${m.color}18` }}>{col.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[120px]">
              {col.map(item => (
                <div key={item.id} draggable={false}
                  onPointerDown={e => onCardPointerDown(e, item)}
                  onPointerMove={onCardPointerMove}
                  onPointerUp={() => endGesture(item)}
                  onPointerCancel={() => endGesture(item)}
                  onClick={() => { if (!suppressClick.current) onOpen(item); }}
                  className="bg-white rounded-lg border border-slate-200 p-2.5 cursor-pointer hover:border-slate-300 hover:shadow-sm transition select-none"
                  style={{
                    opacity: touchDrag?.id === item.id ? 0.4 : 1,
                    borderLeft: `4px solid ${m.color}`,
                    touchAction: "pan-y",
                  }}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">{renderCard(item)}</div>
                    {(item.updates?.length > 0) && (
                      <span className="flex items-center gap-0.5 text-xs flex-shrink-0" style={{ color: "#94a3b8" }}
                        title={`${item.updates.length} aggiornamenti`}>
                        <History size={12} /> {item.updates.length}
                      </span>
                    )}
                  </div>

                  {/* Avanzamento anche senza trascinamento: su schermi piccoli, o
                      quando le colonne non sono entrambe visibili, il trascinamento
                      diventa scomodo e i pulsanti restano l'unica via pratica. */}
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); const prev = stages[idx - 1]; if (prev) onMove(item, prev); }}
                      onPointerDown={(e) => e.stopPropagation()}
                      disabled={idx === 0}
                      title={idx > 0 ? `Riporta a ${stageMeta[stages[idx - 1]]?.label}` : "Primo stato"}
                      className="p-1 rounded-md border border-slate-200 text-slate-400 disabled:opacity-30 enabled:hover:bg-slate-50 enabled:hover:text-slate-700 transition">
                      <ChevronDown size={13} className="rotate-90" />
                    </button>
                    <span className="flex-1 text-center text-xs italic" style={{ color: "#cbd5e1" }}>
                      tocca e trascina
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); const next = stages[idx + 1]; if (next) onMove(item, next); }}
                      onPointerDown={(e) => e.stopPropagation()}
                      disabled={idx === stages.length - 1}
                      title={idx < stages.length - 1 ? `Porta a ${stageMeta[stages[idx + 1]]?.label}` : "Ultimo stato"}
                      className="p-1 rounded-md border border-slate-200 text-slate-400 disabled:opacity-30 enabled:hover:bg-slate-50 enabled:hover:text-slate-700 transition">
                      <ChevronDown size={13} className="-rotate-90" />
                    </button>
                  </div>
                </div>
              ))}
              {col.length === 0 && <p className="text-xs text-slate-300 text-center py-4">Trascina qui</p>}
            </div>
          </div>
        );
      })}

      {/* Anteprima che segue il dito durante il trascinamento */}
      {touchDrag && draggedItem && (
        <div className="fixed pointer-events-none z-50 bg-white rounded-lg border-2 shadow-xl px-3 py-2 text-sm"
          style={{
            left: touchDrag.x - 70, top: touchDrag.y - 28, width: 180,
            borderColor: stageMeta[touchDrag.stage]?.color || GOLD_500,
          }}>
          <p className="font-semibold text-slate-800">{draggedItem.vehicle}</p>
          <p className="text-xs" style={{ color: stageMeta[touchDrag.stage]?.color || "#94a3b8" }}>
            {touchDrag.stage ? `→ ${stageMeta[touchDrag.stage]?.label}` : "trascina su una colonna"}
          </p>
        </div>
      )}
    </div>
  );
}

// Hook condiviso: gestisce spostamento con nota e aggiunta nota da scheda aperta
function usePipeline(setList) {
  const [pendingMove, setPendingMove] = useState(null);
  const [opened, setOpened] = useState(null);

  const requestMove = (item, toStage) => setPendingMove({ item, to: toStage });

  const confirmMove = (text) => {
    const { item, to } = pendingMove;
    setList(prev => prev.map(r => r.id === item.id ? {
      ...r, status: to,
      updates: [...(r.updates || []), { date: TODAY, from: item.status, to, text: text || "Stato aggiornato senza nota." }],
    } : r));
    setPendingMove(null);
  };

  const addNote = (item, text) => {
    setList(prev => prev.map(r => r.id === item.id ? {
      ...r, updates: [...(r.updates || []), { date: TODAY, text }],
    } : r));
  };

  return { pendingMove, setPendingMove, opened, setOpened, requestMove, confirmMove, addNote };
}

// ---------------------------------------------------------------------------
// MOTORE ECONOMICO — ammortamento contratti e costo del fermo tecnico
// ---------------------------------------------------------------------------
// Le due analisi condividono la stessa base: il costo giornaliero che il
// veicolo genera anche quando non produce. Calcolarlo una volta sola evita che
// fermo tecnico e ammortamento diano numeri diversi sullo stesso mezzo.

const monthsBetween = (a, b) => {
  const d1 = new Date(a), d2 = new Date(b);
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
    + (d2.getDate() >= d1.getDate() ? 0 : -1);
};

/**
 * Durata contrattuale in mesi.
 *
 * I contratti si scrivono per convenzione "dal 08/09/2022 al 07/09/2027", cioè
 * fino al giorno precedente l'anniversario: sono 60 mesi, non 59. Il conteggio
 * per date puro darebbe 59 e sottostimerebbe la durata di un mese, gonfiando
 * la quota mensile di competenza dell'anticipo. Si tollera quindi un giorno.
 */
const contractMonths = (start, end) => {
  const d1 = new Date(start), d2 = new Date(end);
  let m = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  if (d2.getDate() < d1.getDate() - 1) m -= 1;
  return Math.max(1, m);
};

/**
 * Piano di ammortamento di un contratto fino a scadenza.
 *
 * Criterio: competenza economica lineare. L'anticipo (maxi-canone) non è un
 * costo del mese in cui viene pagato ma un costo anticipato da ripartire su
 * tutta la durata — è la differenza fra cassa e competenza, e ignorarla fa
 * apparire i primi mesi molto più cari del reale.
 *
 * Il riscatto NON entra nel costo di competenza del noleggio: è il prezzo di
 * un'eventuale acquisizione futura del bene, non un costo del periodo. Viene
 * però esposto separatamente perché è un impegno finanziario a scadenza.
 */
function amortizationPlan(contract, asOf = TODAY) {
  const fee = Number(contract.fee) || 0;
  const down = Number(contract.downPayment) || 0;
  const buyout = Number(contract.buyout) || 0;
  if (!contract.start || !contract.end) return null;

  const totalMonths = contractMonths(contract.start, contract.end);
  const totalDays = Math.max(1, daysBetween(contract.start, contract.end));

  let elapsedMonths = monthsBetween(contract.start, asOf);
  elapsedMonths = Math.min(totalMonths, Math.max(0, elapsedMonths));
  const elapsedDays = Math.min(totalDays, Math.max(0, daysBetween(contract.start, asOf)));

  const remainingMonths = totalMonths - elapsedMonths;
  const remainingDays = totalDays - elapsedDays;

  // Competenza: canone + quota di anticipo
  const downPerMonth = down / totalMonths;
  const monthlyCost = fee + downPerMonth;
  const dailyCost = (monthlyCost * 12) / 365;

  // Esborso di cassa
  const cashTotal = down + fee * totalMonths + buyout;
  const cashPaid = down + fee * elapsedMonths;
  const cashRemaining = fee * remainingMonths + buyout;

  // Competenza maturata / residua (esclude il riscatto)
  const accruedTotal = down + fee * totalMonths;
  const accrued = monthlyCost * elapsedMonths;
  const accruedRemaining = monthlyCost * remainingMonths;

  return {
    contract, totalMonths, elapsedMonths, remainingMonths, totalDays, elapsedDays, remainingDays,
    progressPct: (elapsedMonths / totalMonths) * 100,
    downPayment: down, buyout, fee,
    downPerMonth, monthlyCost, dailyCost,
    cashTotal, cashPaid, cashRemaining,
    accruedTotal, accrued, accruedRemaining,
    expired: remainingMonths <= 0,
  };
}

/** Costo fisso giornaliero di un veicolo: matura anche a mezzo fermo */
function dailyFixedCost(plate, contractList) {
  const c = contractList.find(x => x.vehicle === plate && x.status === "attivo")
    || contractList.find(x => x.vehicle === plate && x.status !== "bozza");
  const plan = c ? amortizationPlan(c) : null;
  const f = costiFissiVeicolo(LIVE.vehicles.find(v => v.plate === plate), plate);

  const contractDaily = plan ? plan.dailyCost : 0;
  const insuranceDaily = (f.insurance || 0) / 365;
  const taxDaily = (f.roadTax || 0) / 365;
  const telematicsDaily = (f.telematics || 0) / 365;
  const otherDaily = (f.other || 0) / 365;

  return {
    contract: c, plan,
    contractDaily, insuranceDaily, taxDaily, telematicsDaily, otherDaily,
    total: contractDaily + insuranceDaily + taxDaily + telematicsDaily + otherDaily,
  };
}

/**
 * Costo di un fermo tecnico, dal fermo alla rimessa in servizio.
 *
 * Tre componenti, tenute distinte perché hanno natura diversa:
 *  1. COSTI FISSI che maturano comunque (canone, assicurazione, bollo, GPS):
 *     non sono causati dal fermo, ma durante il fermo non sono coperti da
 *     alcuna produzione. È la perdita economica del mezzo immobilizzato.
 *  2. MANCATO RICAVO se il mezzo era a reddito (subnoleggio): è il costo
 *     opportunità, la voce che di solito pesa di più e che quasi nessuno misura.
 *  3. COSTI AGGIUNTIVI del fermo: veicolo sostitutivo, traino, ecc.
 * Il costo della riparazione è tenuto FUORI dal costo del fermo ed esposto a
 * parte: sommarli confonde il costo dell'intervento con quello dell'attesa.
 */
function downtimeCost(event, { contractList, subRentalList, asOf = TODAY }) {
  const end = event.end || asOf;
  const days = Math.max(1, daysBetween(event.start, end) + 1);
  const ongoing = !event.end;

  const fixed = dailyFixedCost(event.vehicle, contractList);

  const sub = subRentalList.find(sr =>
    sr.vehicle === event.vehicle && sr.status === "attivo" &&
    sr.start <= event.start && (!sr.end || sr.end >= event.start));
  const lostRevenueDaily = sub ? (Number(sub.fee) || 0) / 30 : 0;

  const replacementDaily = Number(event.replacementDailyCost) || 0;

  const fixedTotal = fixed.total * days;
  const lostRevenueTotal = lostRevenueDaily * days;
  const replacementTotal = replacementDaily * days;
  const downtimeTotal = fixedTotal + lostRevenueTotal + replacementTotal;

  return {
    event, days, ongoing,
    dailyFixed: fixed.total, dailyLostRevenue: lostRevenueDaily, dailyReplacement: replacementDaily,
    dailyTotal: fixed.total + lostRevenueDaily + replacementDaily,
    fixedTotal, lostRevenueTotal, replacementTotal, downtimeTotal,
    repairCost: Number(event.repairCost) || 0,
    grandTotal: downtimeTotal + (Number(event.repairCost) || 0),
    breakdown: fixed, subRental: sub,
  };
}

// ---------------------------------------------------------------------------
// ANALISI ECONOMICA — Fermo tecnico e Ammortamento contratti
// ---------------------------------------------------------------------------
function AnalisiEconomicaView({ vehicleList, contractList, subRentalList }) {
  const [tab, setTab] = useState("fermi");
  // I fermi tecnici erano tenuti in memoria volatile: ogni ricarica della
  // pagina li azzerava, riportando i costi di fermo ai soli dati di esempio.
  const [events, setEvents] = usePersistentState("downtimeEvents", seedDowntimeEvents);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const crud = useCrudModals(setEvents, "Fermi tecnici", e => `${e.vehicle} — ${e.description}`);

  const rows = events
    .map(e => downtimeCost(e, { contractList, subRentalList }))
    .sort((a, b) => b.event.start.localeCompare(a.event.start));

  const ongoing = rows.filter(r => r.ongoing);
  const totDays = rows.reduce((t, r) => t + r.days, 0);
  const totDowntime = rows.reduce((t, r) => t + r.downtimeTotal, 0);
  const totRepair = rows.reduce((t, r) => t + r.repairCost, 0);

  const plans = contractList
    .filter(c => c.status !== "chiuso")
    .map(c => amortizationPlan(c))
    .filter(Boolean)
    .sort((a, b) => b.cashRemaining - a.cashRemaining);

  const impegnoResiduo = plans.reduce((t, p) => t + p.cashRemaining, 0);
  const competenzaMensile = plans.filter(p => !p.expired).reduce((t, p) => t + p.monthlyCost, 0);
  const riscattiTotali = plans.reduce((t, p) => t + p.buyout, 0);

  const exportFermi = rows.map(r => ({
    "Targa": r.event.vehicle, "Causa": DOWNTIME_CAUSES[r.event.cause]?.label, "Descrizione": r.event.description,
    "Fermo dal": r.event.start, "Rimesso in servizio": r.event.end || "in corso", "Giorni": r.days,
    "Costi fissi/giorno": Math.round(r.dailyFixed * 100) / 100,
    "Mancato ricavo/giorno": Math.round(r.dailyLostRevenue * 100) / 100,
    "Sostitutivo/giorno": r.dailyReplacement,
    "Costo fermo": Math.round(r.downtimeTotal * 100) / 100,
    "Costo riparazione": r.repairCost,
    "Costo totale evento": Math.round(r.grandTotal * 100) / 100,
  }));

  const exportPiani = plans.map(p => ({
    "Targa": p.contract.vehicle, "Tipo": p.contract.type, "Fornitore": p.contract.supplier,
    "Inizio": p.contract.start, "Scadenza": p.contract.end, "Durata (mesi)": p.totalMonths,
    "Mesi trascorsi": p.elapsedMonths, "Mesi residui": p.remainingMonths,
    "Anticipo": p.downPayment, "Canone mensile": p.fee, "Riscatto": p.buyout,
    "Costo mensile di competenza": Math.round(p.monthlyCost * 100) / 100,
    "Costo giornaliero": Math.round(p.dailyCost * 100) / 100,
    "Esborso totale": Math.round(p.cashTotal * 100) / 100,
    "Già pagato": Math.round(p.cashPaid * 100) / 100,
    "Impegno residuo": Math.round(p.cashRemaining * 100) / 100,
    "Avanzamento %": p.progressPct.toFixed(1),
  }));

  const eur = (n) => `€ ${fmtNumber(n, 2)}`;

  return (
    <div>
      <SectionTitle
        title="Analisi Economica"
        sub="Costo dei fermi tecnici dal momento del fermo alla rimessa in servizio e piani di ammortamento dei contratti fino a scadenza"
        action={
          <div className="flex gap-2">
            <ExportButton rows={tab === "fermi" ? exportFermi : exportPiani}
              filename={tab === "fermi" ? "fermi_tecnici" : "ammortamento_contratti"}
              sheetName={tab === "fermi" ? "Fermi" : "Ammortamenti"} />
            {tab === "fermi" && <NewRecordButton label="Nuovo fermo" onClick={() => setShowForm(true)} />}
          </div>
        }
      />

      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "fermi", label: `Fermo tecnico (${ongoing.length} in corso)` },
          { id: "ammortamenti", label: "Ammortamento contratti" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "fermi" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
            <KPI icon={Clock} label="Giorni di fermo" value={totDays} sub={`${rows.length} eventi`} accent="#B07A12" />
            <KPI icon={Coins} label="Costo dei fermi" value={eur(totDowntime)} sub="esclusa riparazione" accent="#B4302E" />
            <KPI icon={Wrench} label="Costo riparazioni" value={eur(totRepair)} accent="#1B6DB0" />
            <KPI icon={TrendingDown} label="Impatto totale" value={eur(totDowntime + totRepair)} sub="fermo + riparazioni" accent="#B4302E" />
          </div>

          {ongoing.length > 0 && (
            <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#FBEAEA" }}>
              <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" style={{ color: "#B4302E" }} />
              <div style={{ color: "#8F2624" }}>
                <p className="font-semibold mb-1">Fermi ancora aperti — il costo continua a maturare</p>
                <ul className="text-xs space-y-0.5">
                  {ongoing.map(r => (
                    <li key={r.event.id}>
                      <strong>{r.event.vehicle}</strong>: fermo dal {r.event.start} ({r.days} giorni) —
                      {" "}{eur(r.dailyTotal)}/giorno, già {eur(r.downtimeTotal)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Card>
            <DataTable
              columns={[
                { key: "vehicle", label: "Targa", accessor: r => r.event.vehicle,
                  filterType: "select", options: [...new Set(events.map(e => e.vehicle))] },
                { key: "cause", label: "Causa", accessor: r => DOWNTIME_CAUSES[r.event.cause]?.label,
                  filterType: "select", options: Object.values(DOWNTIME_CAUSES).map(c => c.label),
                  render: r => {
                    const c = DOWNTIME_CAUSES[r.event.cause] || {};
                    return <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ color: c.color, backgroundColor: `${c.color}18` }}>{c.label}</span>;
                  } },
                { key: "start", label: "Fermo dal", accessor: r => r.event.start },
                { key: "end", label: "In servizio dal", accessor: r => r.event.end || "",
                  render: r => r.event.end || <span className="text-xs font-semibold" style={{ color: "#B4302E" }}>in corso</span> },
                { key: "days", label: "Giorni", accessor: r => r.days },
                { key: "dailyTotal", label: "€/giorno", accessor: r => r.dailyTotal, render: r => eur(r.dailyTotal) },
                { key: "downtimeTotal", label: "Costo fermo", accessor: r => r.downtimeTotal,
                  render: r => <span className="font-semibold" style={{ color: "#B4302E" }}>{eur(r.downtimeTotal)}</span> },
                { key: "repairCost", label: "Riparazione", accessor: r => r.repairCost, render: r => eur(r.repairCost) },
                { key: "_actions", label: "", sortable: false, filterable: false, render: r => (
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setDetail(r); }} title="Dettaglio calcolo"
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                      <Search size={14} />
                    </button>
                    <RowActions entity={{ type: "fermo", id: r.event.id, label: `${r.event.vehicle} — fermo` }}
                      onEdit={() => crud.requestEdit(r.event)} onDelete={() => crud.requestDelete(r.event)} />
                  </div>
                )},
              ]}
              data={rows} getRowKey={r => r.event.id}
              emptyLabel="Nessun fermo tecnico registrato."
            />
          </Card>
        </>
      )}

      {tab === "ammortamenti" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
            <KPI icon={FileText} label="Contratti attivi" value={plans.filter(p => !p.expired).length} sub={`su ${plans.length} totali`} />
            <KPI icon={Coins} label="Competenza mensile" value={eur(competenzaMensile)} sub="canoni + quota anticipi" accent="#1B6DB0" />
            <KPI icon={Wallet} label="Impegno residuo" value={eur(impegnoResiduo)} sub="canoni futuri + riscatti" accent="#B07A12" />
            <KPI icon={Banknote} label="Riscatti a scadenza" value={eur(riscattiTotali)} accent="#2E7D5B" />
          </div>

          <div className="space-y-3">
            {plans.map(p => {
              const c = p.contract;
              const color = p.expired ? "#B4302E" : p.progressPct > 80 ? "#B07A12" : "#2E7D5B";
              return (
                <Card key={c.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold" style={{ color: NAVY_700 }}>
                        {c.vehicle} <span className="text-sm font-normal text-slate-400 capitalize">· {c.type} · {c.supplier}</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {c.start} → {c.end} · {p.totalMonths} mesi
                        {c.status === "bozza" ? " · contratto in bozza" : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ color, backgroundColor: `${color}18` }}>
                      {p.expired ? "In scadenza / scaduto" : `${p.remainingMonths} mesi residui`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Anticipo versato</p>
                      <p className="text-base font-bold text-slate-700">{eur(p.downPayment)}</p>
                      {p.downPayment > 0 && <p className="text-xs text-slate-400">{eur(p.downPerMonth)}/mese di competenza</p>}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Canone</p>
                      <p className="text-base font-bold text-slate-700">{eur(p.fee)}</p>
                      <p className="text-xs text-slate-400">al mese</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Competenza</p>
                      <p className="text-base font-bold" style={{ color: NAVY_700 }}>{eur(p.monthlyCost)}</p>
                      <p className="text-xs text-slate-400">{eur(p.dailyCost)}/giorno</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Esborso totale</p>
                      <p className="text-base font-bold text-slate-700">{eur(p.cashTotal)}</p>
                      <p className="text-xs text-slate-400">pagato {eur(p.cashPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Impegno residuo</p>
                      <p className="text-base font-bold" style={{ color: "#B07A12" }}>{eur(p.cashRemaining)}</p>
                      <p className="text-xs text-slate-400">{p.remainingMonths} canoni</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Riscatto</p>
                      <p className="text-base font-bold" style={{ color: p.buyout ? "#2E7D5B" : "#94a3b8" }}>
                        {p.buyout ? eur(p.buyout) : "—"}
                      </p>
                      {p.buyout > 0 && <p className="text-xs text-slate-400">a scadenza</p>}
                    </div>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, p.progressPct)}%`, backgroundColor: color }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-xs">
                    <span style={{ color }}>{p.progressPct.toFixed(0)}% del contratto trascorso ({p.elapsedMonths}/{p.totalMonths} mesi)</span>
                    <span className="text-slate-400">
                      Competenza maturata {eur(p.accrued)} · residua {eur(p.accruedRemaining)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2.5 rounded-lg p-4 text-sm mt-5" style={{ backgroundColor: "#F1F2F4" }}>
            <ShieldCheck size={17} className="flex-shrink-0 mt-0.5 text-slate-400" />
            <p className="text-xs leading-relaxed text-slate-500">
              <strong>Criterio di calcolo.</strong> L'anticipo non è imputato al mese di pagamento ma ripartito
              linearmente sulla durata del contratto: è la differenza fra cassa e competenza, e ignorarla farebbe
              apparire i primi mesi molto più onerosi del reale. Il riscatto è escluso dal costo di competenza —
              è il prezzo di un'eventuale acquisizione futura del bene, non un costo del periodo — ma è esposto
              a parte perché costituisce un impegno finanziario a scadenza.
            </p>
          </div>
        </>
      )}

      {detail && <DowntimeDetailModal row={detail} onClose={() => setDetail(null)} />}

      {showForm && (
        <SimpleFormModal
          title="Nuovo fermo tecnico" fields={DOWNTIME_FORM_FIELDS} submitLabel="Registra fermo"
          onClose={() => setShowForm(false)}
          onSave={(f) => {
            setEvents(prev => [{ id: `dt${Date.now()}`, ...f,
              repairCost: parseFloat(f.repairCost) || 0,
              replacementDailyCost: parseFloat(f.replacementDailyCost) || 0,
              end: f.end || null }, ...prev]);
            setShowForm(false);
          }}
        />
      )}
      {crud.editing && (
        <SimpleFormModal
          title={`Modifica fermo — ${crud.editing.vehicle}`} fields={DOWNTIME_FORM_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f,
            repairCost: parseFloat(f.repairCost) || 0,
            replacementDailyCost: parseFloat(f.replacementDailyCost) || 0,
            end: f.end || null })}
        />
      )}
      {crud.deleting && (
        <PinConfirmModal itemLabel={`il fermo di ${crud.deleting.vehicle} del ${crud.deleting.start}`}
          moduleLabel="Fermi tecnici" onClose={crud.cancelDelete} onConfirm={crud.confirmDelete} />
      )}
    </div>
  );
}

const DOWNTIME_FORM_FIELDS = [
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "cause", label: "Causa del fermo", type: "select", required: true,
    options: Object.entries(DOWNTIME_CAUSES).map(([value, m]) => ({ value, label: m.label })) },
  { key: "description", label: "Descrizione", span: 2 },
  { key: "start", label: "Fermo dal", type: "date", required: true },
  { key: "end", label: "Rimesso in servizio il (vuoto = in corso)", type: "date" },
  { key: "repairCost", label: "Costo riparazione (€)", type: "number" },
  { key: "replacementDailyCost", label: "Veicolo sostitutivo (€/giorno)", type: "number" },
];

// Dettaglio del calcolo: rende verificabile ogni euro esposto
function DowntimeDetailModal({ row, onClose }) {
  const eur = (n) => `€ ${fmtNumber(n, 2)}`;
  const b = row.breakdown;
  const voci = [
    ["Canone / quota contratto", b.contractDaily],
    ["Assicurazione", b.insuranceDaily],
    ["Bollo", b.taxDaily],
    ["Telematica / GPS", b.telematicsDaily],
    ["Altri costi fissi", b.otherDaily],
  ];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>DETTAGLIO COSTO DEL FERMO</p>
            <h3 className="text-lg font-bold text-white">{row.event.vehicle} · {row.days} giorni</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            {row.event.description} — fermo dal {row.event.start}
            {row.event.end ? ` al ${row.event.end}` : " (ancora in corso)"}.
          </p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>
              1 · Costi fissi che maturano comunque
            </p>
            <table className="w-full text-sm min-w-[640px]">
              <tbody>
                {voci.map(([k, v]) => (
                  <tr key={k} className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-600">{k}</td>
                    <td className="py-1.5 text-right text-slate-700">{eur(v)}/gg</td>
                    <td className="py-1.5 text-right font-medium text-slate-700">{eur(v * row.days)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 font-semibold" style={{ color: NAVY_700 }}>Totale costi fissi</td>
                  <td className="py-1.5 text-right font-semibold" style={{ color: NAVY_700 }}>{eur(row.dailyFixed)}/gg</td>
                  <td className="py-1.5 text-right font-bold" style={{ color: NAVY_700 }}>{eur(row.fixedTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>
              2 · Mancato ricavo
            </p>
            {row.subRental ? (
              <p className="text-sm text-slate-600">
                Veicolo subnoleggiato a {companyName(row.subRental.using)} per {eur(row.subRental.fee)}/mese →
                <strong className="text-slate-800"> {eur(row.dailyLostRevenue)}/giorno</strong> non fatturabili,
                per un totale di <strong style={{ color: "#B4302E" }}>{eur(row.lostRevenueTotal)}</strong>.
              </p>
            ) : (
              <p className="text-sm text-slate-400">Veicolo non a reddito nel periodo: nessun ricavo perduto.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>
              3 · Costi aggiuntivi del fermo
            </p>
            <p className="text-sm text-slate-600">
              {row.dailyReplacement > 0
                ? <>Veicolo sostitutivo {eur(row.dailyReplacement)}/giorno → <strong>{eur(row.replacementTotal)}</strong></>
                : "Nessun veicolo sostitutivo impiegato."}
            </p>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: "#FBEAEA" }}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span style={{ color: "#8F2624" }}>Costo del fermo ({row.days} giorni × {eur(row.dailyTotal)})</span>
              <strong style={{ color: "#B4302E" }}>{eur(row.downtimeTotal)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span style={{ color: "#8F2624" }}>Costo della riparazione</span>
              <strong style={{ color: "#B4302E" }}>{eur(row.repairCost)}</strong>
            </div>
            <div className="flex items-center justify-between text-base pt-2 border-t" style={{ borderColor: "#f0c9c8" }}>
              <span className="font-semibold" style={{ color: "#8F2624" }}>Impatto totale dell'evento</span>
              <strong style={{ color: "#B4302E" }}>{eur(row.grandTotal)}</strong>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Il costo della riparazione è tenuto distinto da quello del fermo: il primo è il prezzo dell'intervento,
            il secondo è il prezzo dell'attesa. Sommarli senza distinguerli impedisce di capire su quale delle due
            voci conviene intervenire.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRESE IN CARICO — richieste in entrata e in uscita fra aziende della rete
// ---------------------------------------------------------------------------
function HandoverDetailModal({ hv, direction, currentCompany, onClose, onAccept, onReject, onCancel }) {
  const [note, setNote] = useState("");
  const [mode, setMode] = useState(null);   // accetta | rifiuta
  const eur = (n) => `€ ${fmtNumber(n, 2)}`;
  const st = HANDOVER_STATUS[hv.status];
  const pending = hv.status === "inviata";

  const condizioni = [
    ["Veicolo", hv.vehicle],
    ["Locatore", companyName(hv.from)],
    ["Locatario", companyName(hv.to)],
    ["Decorrenza", hv.start],
    ["Scadenza", hv.end || "—"],
    ["Canone mensile", eur(hv.fee)],
    ["Franchigia RCA", eur(hv.deductibleRCA)],
    ["Penale danni", eur(hv.damagePenalty)],
    ["Furto", hv.theftMode === "importo" ? eur(hv.theftValue) : `${hv.theftValue}% del valore`],
    ["Riferimento contratto", hv.contractRef || "—"],
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>
              {direction === "in" ? "RICHIESTA DI PRESA IN CARICO" : "RICHIESTA INVIATA"}
            </p>
            <h3 className="text-lg font-bold text-white">
              {hv.vehicle} · {companyName(hv.from)} → {companyName(hv.to)}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: st.color, backgroundColor: `${st.color}18` }}>{st.label}</span>
            <span className="text-xs text-slate-400">inviata il {hv.sentAt}</span>
          </div>

          <table className="w-full text-sm min-w-[640px]">
            <tbody>
              {condizioni.map(([k, v]) => (
                <tr key={k} className="border-b border-slate-100">
                  <td className="py-1.5 text-slate-400 w-1/2">{k}</td>
                  <td className="py-1.5 text-slate-700 font-medium">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {hv.note && (
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "#F5F6F8" }}>
              <p className="text-xs text-slate-400 mb-1">Nota del mittente</p>
              <p className="text-slate-700">{hv.note}</p>
            </div>
          )}
          {hv.responseNote && (
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "#F5F6F8" }}>
              <p className="text-xs text-slate-400 mb-1">Risposta del destinatario ({hv.respondedAt})</p>
              <p className="text-slate-700">{hv.responseNote}</p>
            </div>
          )}

          {direction === "in" && pending && (
            <>
              {mode && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    {mode === "accetta" ? "Nota di accettazione (facoltativa)" : "Motivo del rifiuto"}
                  </p>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} autoFocus
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder={mode === "accetta" ? "Es. ritiro previsto il 01/09" : "Es. condizioni economiche non concordate"} />
                </div>
              )}
              <div className="flex gap-2">
                {mode !== "rifiuta" && (
                  <button onClick={() => mode === "accetta" ? onAccept(hv, note) : setMode("accetta")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm text-white transition"
                    style={{ backgroundColor: "#2E7D5B" }}>
                    <CheckCircle2 size={15} /> {mode === "accetta" ? "Conferma presa in carico" : "Accetta"}
                  </button>
                )}
                {mode !== "accetta" && (
                  <button onClick={() => mode === "rifiuta" ? (note.trim() && onReject(hv, note)) : setMode("rifiuta")}
                    disabled={mode === "rifiuta" && !note.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm border disabled:opacity-40 transition"
                    style={{ borderColor: "#B4302E", color: "#B4302E" }}>
                    <X size={15} /> {mode === "rifiuta" ? "Conferma rifiuto" : "Rifiuta"}
                  </button>
                )}
                {mode && (
                  <button onClick={() => { setMode(null); setNote(""); }}
                    className="px-4 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 text-slate-600 hover:bg-slate-50">
                    Annulla
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Accettando, il veicolo entra nella flotta di {companyName(hv.to)} con le condizioni indicate e resta
                tracciato come mezzo in disponibilità da {companyName(hv.from)}.
              </p>
            </>
          )}

          {direction === "out" && pending && (
            <button onClick={() => onCancel(hv)}
              className="w-full py-2.5 rounded-lg font-semibold text-sm border transition hover:bg-slate-50"
              style={{ borderColor: "#B4302E", color: "#B4302E" }}>
              Annulla la richiesta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PreseInCaricoView({ handovers, currentCompany, onAccept, onReject, onCancel, onNew, vehicleList }) {
  const [tab, setTab] = useState("in");
  const [open, setOpen] = useState(null);

  const incoming = handovers.filter(h => h.to === currentCompany);
  const outgoing = handovers.filter(h => h.from === currentCompany);
  const rows = tab === "in" ? incoming : outgoing;
  const pendingIn = incoming.filter(h => h.status === "inviata").length;

  const eur = (n) => `€ ${fmtNumber(n, 2)}`;
  const exportRows = rows.map(h => ({
    "Veicolo": h.vehicle, "Locatore": companyName(h.from), "Locatario": companyName(h.to),
    "Decorrenza": h.start, "Scadenza": h.end || "", "Canone": h.fee,
    "Stato": HANDOVER_STATUS[h.status].label, "Inviata il": h.sentAt, "Risposta il": h.respondedAt || "",
  }));

  return (
    <div>
      <SectionTitle
        title="Prese in Carico"
        sub={`Scambio veicoli con le aziende della rete Matherion — operi come ${companyName(currentCompany)}`}
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="prese_in_carico" sheetName="Prese in carico" />
            <NewRecordButton label="Nuova richiesta" onClick={onNew} />
          </div>
        }
      />

      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "in", label: `Ricevute${pendingIn ? ` (${pendingIn} da confermare)` : ""}` },
          { id: "out", label: `Inviate (${outgoing.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <DataTable
          columns={[
            { key: "vehicle", label: "Veicolo", render: h => {
              const v = vehicleList.find(x => x.plate === h.vehicle);
              return (<>{h.vehicle}<span className="block text-xs text-slate-400 font-normal">{v ? `${v.make} ${v.model}` : "—"}</span></>);
            } },
            { key: "counterpart", label: tab === "in" ? "Locatore" : "Locatario",
              accessor: h => companyName(tab === "in" ? h.from : h.to) },
            { key: "start", label: "Decorrenza" },
            { key: "end", label: "Scadenza", accessor: h => h.end || "" },
            { key: "fee", label: "Canone", accessor: h => h.fee, render: h => eur(h.fee) },
            { key: "status", label: "Stato",
              accessor: h => HANDOVER_STATUS[h.status].label,
              filterType: "select", options: Object.values(HANDOVER_STATUS).map(s => s.label),
              render: h => {
                const st = HANDOVER_STATUS[h.status];
                return <span className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ color: st.color, backgroundColor: `${st.color}18` }}>{st.label}</span>;
              } },
            { key: "_open", label: "", sortable: false, filterable: false, render: h => (
              <button onClick={() => setOpen(h)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:bg-slate-50"
                style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                {tab === "in" && h.status === "inviata" ? "Esamina" : "Dettaglio"}
              </button>
            )},
          ]}
          data={rows}
          emptyLabel={tab === "in" ? "Nessuna richiesta ricevuta." : "Nessuna richiesta inviata."}
        />
      </Card>

      {open && (
        <HandoverDetailModal hv={open} direction={tab} currentCompany={currentCompany}
          onClose={() => setOpen(null)}
          onAccept={(h, n) => { onAccept(h, n); setOpen(null); }}
          onReject={(h, n) => { onReject(h, n); setOpen(null); }}
          onCancel={(h) => { onCancel(h); setOpen(null); }} />
      )}
    </div>
  );
}

// Avviso all'accesso: le richieste in attesa non devono passare inosservate
function PendingHandoversPopup({ items, onOpen, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>RETE MATHERION</p>
            <h3 className="text-base font-bold text-white">
              {items.length} veicol{items.length === 1 ? "o" : "i"} in attesa di presa in carico
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-3">
          {items.map(h => (
            <div key={h.id} className="border border-slate-200 rounded-lg p-3">
              <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>{h.vehicle}</p>
              <p className="text-xs text-slate-500">
                Da {companyName(h.from)} · dal {h.start} · € {fmtNumber(h.fee, 2)}/mese
              </p>
              {h.note && <p className="text-xs text-slate-400 mt-1">{h.note}</p>}
            </div>
          ))}
          <button onClick={onOpen}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition"
            style={{ backgroundColor: NAVY_700 }}>
            Esamina le richieste
          </button>
          <button onClick={onClose} className="w-full text-xs text-slate-400 hover:text-slate-600">
            Più tardi
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CHAT INTERNA — conversazioni fra aziende della rete, con storico completo
// ---------------------------------------------------------------------------
function ChatView({ threads, setThreads, messages, setMessages, currentCompany, currentUser }) {
  const myThreads = threads.filter(t => t.participants.includes(currentCompany));
  const [activeId, setActiveId] = useState(myThreads[0]?.id || null);
  const [draft, setDraft] = useState("");
  const [showNew, setShowNew] = useState(false);

  const active = myThreads.find(t => t.id === activeId) || null;
  const thread = messages.filter(m => m.thread === activeId)
    .sort((a, b) => a.at.localeCompare(b.at));

  const other = (t) => companyName(t.participants.find(p => p !== currentCompany));
  const lastOf = (t) => messages.filter(m => m.thread === t.id).sort((a, b) => b.at.localeCompare(a.at))[0];

  const send = () => {
    if (!draft.trim() || !active) return;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    setMessages(prev => [...prev, {
      id: `m${Date.now()}`, thread: active.id, from: currentCompany,
      author: currentUser.name, at: now, text: draft.trim(),
    }]);
    setDraft("");
  };

  const exportRows = messages
    .filter(m => myThreads.some(t => t.id === m.thread))
    .map(m => ({
      "Conversazione": threads.find(t => t.id === m.thread)?.subject,
      "Data/Ora": m.at, "Azienda": companyName(m.from), "Autore": m.author, "Messaggio": m.text,
    }));

  return (
    <div>
      <SectionTitle
        title="Chat Interna"
        sub="Comunicazioni con le aziende della rete — ogni messaggio resta tracciato e consultabile"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="chat_interna" sheetName="Messaggi" />
            <NewRecordButton label="Nuova conversazione" onClick={() => setShowNew(true)} />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4" style={{ height: "calc(100vh - 230px)" }}>
        <Card className="p-0 overflow-y-auto">
          {myThreads.map(t => {
            const last = lastOf(t);
            const sel = t.id === activeId;
            return (
              <button key={t.id} onClick={() => setActiveId(t.id)}
                className="w-full text-left px-4 py-3 border-b border-slate-100 transition hover:bg-slate-50"
                style={sel ? { backgroundColor: "#E3F2F6", boxShadow: `inset 3px 0 0 ${GOLD_500}` } : {}}>
                <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>{other(t)}</p>
                <p className="text-xs text-slate-500">{t.subject}</p>
                {last && <p className="text-xs text-slate-400 truncate mt-0.5">{last.text}</p>}
              </button>
            );
          })}
          {myThreads.length === 0 && <p className="p-4 text-sm text-slate-400">Nessuna conversazione.</p>}
        </Card>

        <Card className="col-span-2 flex flex-col p-0">
          {active ? (
            <>
              <div className="px-5 py-3 border-b border-slate-200">
                <p className="text-sm font-bold" style={{ color: NAVY_700 }}>{other(active)}</p>
                <p className="text-xs text-slate-400">{active.subject}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {thread.map(m => {
                  const mine = m.from === currentCompany;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%] rounded-lg px-3 py-2"
                        style={mine ? { backgroundColor: NAVY_700, color: "#fff" } : { backgroundColor: "#F1F2F4", color: "#334155" }}>
                        {!mine && <p className="text-xs font-semibold mb-0.5" style={{ color: NAVY_700 }}>{m.author}</p>}
                        <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                        <p className="text-xs mt-1" style={{ color: mine ? "rgba(255,255,255,.6)" : "#94a3b8" }}>{m.at}</p>
                      </div>
                    </div>
                  );
                })}
                {thread.length === 0 && <p className="text-sm text-slate-400">Nessun messaggio in questa conversazione.</p>}
              </div>
              <div className="p-3 border-t border-slate-200 flex gap-2">
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <button onClick={send} disabled={!draft.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
                  style={{ backgroundColor: NAVY_700 }}>
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
              Seleziona una conversazione
            </div>
          )}
        </Card>
      </div>

      {showNew && (
        <SimpleFormModal
          title="Nuova conversazione" submitLabel="Avvia conversazione"
          fields={[
            { key: "counterpart", label: "Azienda", type: "select", required: true,
              options: LIVE.companies.filter(c => c.id !== currentCompany && c.platformEnabled)
                .map(c => ({ value: c.id, label: c.name })) },
            { key: "subject", label: "Oggetto", required: true, span: 2 },
          ]}
          onClose={() => setShowNew(false)}
          onSave={(f) => {
            const id = `th${Date.now()}`;
            setThreads(prev => [...prev, { id, participants: [currentCompany, f.counterpart], subject: f.subject }]);
            setActiveId(id);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// POSTA ELETTRONICA — fino a tre indirizzi per utente
// ---------------------------------------------------------------------------
function EmailView({ accounts, setAccounts, mails, setMails, currentUser }) {
  const [folder, setFolder] = useState("in");
  const [accountId, setAccountId] = useState("tutti");
  const [open, setOpen] = useState(null);
  const [compose, setCompose] = useState(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [inviato, setInviato] = useState(null);

  const shown = mails
    .filter(m => m.folder === folder)
    .filter(m => accountId === "tutti" || m.account === accountId)
    .sort((a, b) => b.at.localeCompare(a.at));

  const unread = mails.filter(m => m.folder === "in" && !m.read).length;
  const accountAddress = (id) => accounts.find(a => a.id === id)?.address || "—";

  // Il messaggio viene sempre archiviato; la spedizione effettiva passa dal
  // client di posta del computer, perché una pagina che gira in locale non
  // dispone di un server SMTP proprio.
  const send = (f) => {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    setMails(prev => [...prev, {
      id: `ml${Date.now()}`, account: f.account, folder: "out",
      from: accountAddress(f.account), to: f.to, subject: f.subject,
      at: now, body: f.body, read: true,
    }]);
    setCompose(null);
    setInviato({ to: f.to, subject: f.subject, body: f.body, from: accountAddress(f.account) });
  };

  const exportRows = mails.map(m => ({
    "Cartella": m.folder === "in" ? "Ricevuta" : "Inviata", "Data/Ora": m.at,
    "Account": accountAddress(m.account), "Da": m.from, "A": m.to,
    "Oggetto": m.subject, "Testo": m.body,
  }));

  return (
    <div>
      <SectionTitle
        title="Posta Elettronica"
        sub={`${accounts.length} di ${MAX_MAIL_ACCOUNTS} indirizzi registrati · ${unread} messaggi non letti`}
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="posta_elettronica" sheetName="Email" />
            <button onClick={() => setShowAccounts(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
              style={{ borderColor: NAVY_700, color: NAVY_700 }}>
              <Mail size={14} /> Indirizzi
            </button>
            <NewRecordButton label="Scrivi" onClick={() => setCompose({})} />
          </div>
        }
      />

      {inviato && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-4" style={{ backgroundColor: "#E7F5EE" }}>
          <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" style={{ color: "#2E7D5B" }} />
          <div style={{ color: "#2E7D5B" }} className="flex-1">
            <p className="font-semibold">Messaggio archiviato fra gli inviati</p>
            <p className="text-xs mt-0.5">
              Per spedirlo davvero apri il client di posta con il testo già pronto, oppure scarica il file .eml
              e trascinalo in Outlook. La piattaforma in locale non dispone di un server di posta proprio.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={() => apriClientPosta(inviato)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: "#2E7D5B" }}>
                <Mail size={12} /> Apri nel client di posta
              </button>
              <button onClick={() => scaricaEml(inviato)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-white"
                style={{ borderColor: "#2E7D5B", color: "#2E7D5B" }}>
                <Download size={12} /> Scarica .eml
              </button>
              <button onClick={() => setInviato(null)} className="text-xs text-slate-500 hover:text-slate-700 px-2">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        {[{ id: "in", label: `Ricevute${unread ? ` (${unread})` : ""}` }, { id: "out", label: "Inviate" }].map(f => (
          <button key={f.id} onClick={() => setFolder(f.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
            style={folder === f.id ? { backgroundColor: NAVY_700, color: "#fff", borderColor: NAVY_700 } : { color: "#64748b", borderColor: "#e2e8f0" }}>
            {f.label}
          </button>
        ))}
        <select value={accountId} onChange={e => setAccountId(e.target.value)}
          className="ml-2 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white">
          <option value="tutti">Tutti gli indirizzi</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.address}</option>)}
        </select>
      </div>

      <Card className="p-0">
        {shown.map(m => (
          <button key={m.id} onClick={() => { setOpen(m); setMails(p => p.map(x => x.id === m.id ? { ...x, read: true } : x)); }}
            className="w-full text-left px-4 py-3 border-b border-slate-100 transition hover:bg-slate-50 flex items-center gap-3">
            {folder === "in" && !m.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: GOLD_500 }} />}
            <div className="min-w-0 flex-1">
              <p className={`text-sm truncate ${folder === "in" && !m.read ? "font-bold" : "font-medium"}`} style={{ color: NAVY_700 }}>
                {m.subject}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {folder === "in" ? `Da ${m.from}` : `A ${m.to}`} · {accountAddress(m.account)}
              </p>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">{m.at}</span>
          </button>
        ))}
        {shown.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">Nessun messaggio.</p>}
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
              <h3 className="text-base font-bold text-white truncate">{open.subject}</h3>
              <button onClick={() => setOpen(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="text-xs text-slate-400">
                <p>Da: <span className="text-slate-700">{open.from}</span></p>
                <p>A: <span className="text-slate-700">{open.to}</span></p>
                <p>{open.at}</p>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-100 pt-3">{open.body}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setCompose({ to: open.from, subject: `Re: ${open.subject}`, account: open.account }); setOpen(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: NAVY_700 }}>
                  <Send size={14} /> Rispondi
                </button>
                <button onClick={() => apriClientPosta({ to: open.to, subject: open.subject, body: open.body })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50"
                  style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                  <Mail size={14} /> Apri nel client
                </button>
                <button onClick={() => scaricaEml({ from: open.from, to: open.to, subject: open.subject, body: open.body })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50"
                  style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                  <Download size={14} /> Scarica .eml
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {compose && (
        <SimpleFormModal
          title="Nuovo messaggio" submitLabel="Invia"
          initialValues={{ ...compose, account: compose.account || accounts[0]?.id }}
          fields={[
            { key: "account", label: "Invia da", type: "select", required: true,
              options: accounts.map(a => ({ value: a.id, label: a.address })) },
            { key: "to", label: "Destinatario", required: true, span: 2 },
            { key: "subject", label: "Oggetto", required: true, span: 2 },
            { key: "body", label: "Messaggio", required: true, span: 2 },
          ]}
          onClose={() => setCompose(null)}
          onSave={send}
        />
      )}

      {showAccounts && (
        <MailAccountsModal accounts={accounts} setAccounts={setAccounts} onClose={() => setShowAccounts(false)} />
      )}
    </div>
  );
}

function MailAccountsModal({ accounts, setAccounts, onClose }) {
  const [form, setForm] = useState({ address: "", label: "", signature: "" });
  const [error, setError] = useState("");
  const full = accounts.length >= MAX_MAIL_ACCOUNTS;

  const add = () => {
    const addr = form.address.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) { setError("Indirizzo email non valido."); return; }
    if (accounts.some(a => a.address.toLowerCase() === addr)) { setError("Indirizzo già registrato."); return; }
    if (full) { setError(`Limite di ${MAX_MAIL_ACCOUNTS} indirizzi raggiunto.`); return; }
    setAccounts(prev => [...prev, { id: `ma${Date.now()}`, address: addr, label: form.label || "—", signature: form.signature, verified: false }]);
    setForm({ address: "", label: "", signature: "" });
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>INDIRIZZI REGISTRATI</p>
            <h3 className="text-base font-bold text-white">{accounts.length} di {MAX_MAIL_ACCOUNTS}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {accounts.map(a => (
              <div key={a.id} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3">
                <Mail size={17} className="text-slate-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{a.address}</p>
                  <p className="text-xs text-slate-400">{a.label}{a.verified ? " · verificato" : " · in attesa di verifica"}</p>
                </div>
                <button onClick={() => setAccounts(prev => prev.filter(x => x.id !== a.id))}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold mb-2" style={{ color: NAVY_700 }}>Aggiungi indirizzo</p>
            {full ? (
              <p className="text-xs" style={{ color: "#B07A12" }}>
                Hai raggiunto il limite di {MAX_MAIL_ACCOUNTS} indirizzi. Rimuovine uno per aggiungerne un altro.
              </p>
            ) : (
              <div className="space-y-2">
                <input value={form.address} onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setError(""); }}
                  placeholder="indirizzo@azienda.it" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Etichetta (es. Fleet operativo)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                {error && <p className="text-xs" style={{ color: "#B4302E" }}>{error}</p>}
                <button onClick={add} disabled={!form.address.trim()}
                  className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
                  style={{ backgroundColor: NAVY_700 }}>
                  Registra indirizzo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAGAZZINO RICAMBI — giacenze, movimenti e prelievo da codice
// ---------------------------------------------------------------------------
// Il prelievo è il punto delicato: chi lo esegue è in officina mobile, spesso
// sul mezzo, e digita in fretta. Le regole sono quindi bloccanti, non avvisi:
// codice inesistente e quantità superiore alla giacenza non passano.
function findPart(parts, code) {
  const q = String(code || "").trim().toUpperCase();
  if (!q) return null;
  return parts.find(p => p.code.toUpperCase() === q)
    || parts.find(p => p.barcode && p.barcode.toUpperCase() === q)
    || null;
}

function validateWithdrawal(parts, code, qty) {
  const errors = [];
  const part = findPart(parts, code);
  const n = parseFloat(qty);

  if (!code) errors.push("Inserire il codice a barre o il progressivo del ricambio");
  else if (!part) errors.push(`Nessun ricambio corrisponde al codice "${code}"`);

  if (!qty && qty !== 0) errors.push("Indicare la quantità");
  else if (!Number.isFinite(n) || n <= 0) errors.push("La quantità deve essere maggiore di zero");
  else if (part && n > part.stock) {
    errors.push(`Giacenza insufficiente: disponibili ${fmtNumber(part.stock)} ${part.unit}, richiesti ${fmtNumber(n)}`);
  }
  return { part, qty: n, errors };
}

// Costo medio ponderato: il valore di magazzino cambia a ogni carico e deve
// riflettersi sui prelievi successivi, altrimenti il costo imputato al veicolo
// resta fermo al primo acquisto.
function applyLoad(part, qty, unitCost) {
  const q = parseFloat(qty) || 0;
  const c = parseFloat(unitCost);
  const newStock = part.stock + q;
  const newAvg = Number.isFinite(c) && newStock > 0
    ? ((part.stock * part.avgCost) + (q * c)) / newStock
    : part.avgCost;
  return { stock: newStock, avgCost: Math.round(newAvg * 100) / 100 };
}

function PrelievoModal({ parts, vehicleList, maintenanceList, onClose, onConfirm }) {
  const [code, setCode] = useState("");
  const [qty, setQty] = useState("1");
  const [vehicle, setVehicle] = useState("");
  const [intervention, setIntervention] = useState("");
  const [note, setNote] = useState("");

  const check = validateWithdrawal(parts, code, qty);
  const part = check.part;
  const canSave = check.errors.length === 0 && vehicle;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>PRELIEVO DA MAGAZZINO</p>
            <h3 className="text-lg font-bold text-white">Officina mobile</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Codice a barre o progressivo *</p>
            <input value={code} onChange={e => setCode(e.target.value)} autoFocus
              placeholder="Scansiona o digita: 8012345000018 oppure RIC-0001"
              className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono"
              style={{ borderColor: code && !part ? "#B4302E" : "#cbd5e1" }} />
          </div>

          {part && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "#F5F6F8" }}>
              <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>{part.description}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {part.code} · {PART_CATEGORIES[part.category]?.label} · ubicazione {part.location}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-slate-500">Giacenza: <strong className="text-slate-700">{fmtNumber(part.stock)} {part.unit}</strong></span>
                <span className="text-slate-500">Costo medio: <strong className="text-slate-700">€ {fmtNumber(part.avgCost, 2)}</strong></span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Quantità prelevata *</p>
              <input type="number" step="0.01" value={qty} onChange={e => setQty(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-slate-500 mb-1">Veicolo *</p>
              <VehiclePicker value={vehicle} onChange={setVehicle} />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Intervento collegato</p>
            <select value={intervention} onChange={e => setIntervention(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Nessuno / intervento estemporaneo</option>
              {maintenanceList.filter(m => !vehicle || m.vehicle === vehicle).map(m => (
                <option key={m.id} value={m.id}>{m.vehicle} — {m.type} {m.scheduled} ({m.workshop})</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Nota</p>
            <input value={note} onChange={e => setNote(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {part && check.errors.length === 0 && (
            <div className="rounded-lg p-3 text-sm flex items-center justify-between" style={{ backgroundColor: "#F5F6F8" }}>
              <span className="text-slate-500">Giacenza dopo il prelievo</span>
              <strong style={{ color: part.stock - check.qty <= part.minStock ? "#B4302E" : NAVY_700 }}>
                {fmtNumber(part.stock - check.qty)} {part.unit}
                {part.stock - check.qty <= part.minStock ? " — sotto scorta minima" : ""}
              </strong>
            </div>
          )}

          {check.errors.map((e, i) => (
            <div key={i} className="flex gap-2 rounded-lg p-2.5 text-xs" style={{ backgroundColor: "#FBEAEA", color: "#B4302E" }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {e}
            </div>
          ))}

          <button disabled={!canSave}
            onClick={() => onConfirm({ part, qty: check.qty, vehicle, intervention, note })}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}>
            {check.errors.length ? "Correggi per registrare" : "Registra prelievo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MagazzinoView({ parts, setParts, moves, setMoves, vehicleList, maintenanceList, equipment = [] }) {
  const [tab, setTab] = useState("giacenze");
  const [showPrelievo, setShowPrelievo] = useState(false);
  const [showCarico, setShowCarico] = useState(false);
  const [showNewPart, setShowNewPart] = useState(false);
  const crud = useCrudModals(setParts, "Magazzino ricambi", p => `${p.code} — ${p.description}`);

  const eur = (n) => `€ ${fmtNumber(n, 2)}`;
  const sottoscorta = parts.filter(p => p.stock <= p.minStock);
  const valore = parts.reduce((t, p) => t + p.stock * p.avgCost, 0);
  const consumoMese = moves
    .filter(m => m.type === "scarico" && m.date >= "2026-08-01")
    .reduce((t, m) => t + m.qty * (m.unitCost || 0), 0);

  // Registrazione prelievo: scarica la giacenza e imputa il costo al veicolo
  const registraPrelievo = ({ part, qty, vehicle, intervention, note }) => {
    setParts(prev => prev.map(p => p.id === part.id ? { ...p, stock: p.stock - qty } : p));
    setMoves(prev => [{
      id: `sm${Date.now()}`, part: part.id, type: "scarico", qty, date: TODAY,
      unitCost: part.avgCost, supplier: null, docRef: null,
      vehicle, intervention: intervention || null, note,
    }, ...prev]);
    setShowPrelievo(false);
  };

  const registraCarico = (f) => {
    const part = parts.find(p => p.id === f.part);
    if (!part) return;
    const qty = parseFloat(f.qty) || 0;
    const updated = applyLoad(part, qty, f.unitCost);
    setParts(prev => prev.map(p => p.id === part.id ? { ...p, ...updated } : p));
    setMoves(prev => [{
      id: `sm${Date.now()}`, part: part.id, type: "carico", qty, date: f.date || TODAY,
      unitCost: parseFloat(f.unitCost) || 0, supplier: f.supplier, docRef: f.docRef,
      vehicle: null, intervention: null, note: f.note || "",
    }, ...prev]);
    setShowCarico(false);
  };

  const partName = (id) => parts.find(p => p.id === id)?.description || id;
  const partCode = (id) => parts.find(p => p.id === id)?.code || "—";

  const exportGiacenze = parts.map(p => ({
    "Progressivo": p.code, "Codice a barre": p.barcode || "", "Descrizione": p.description,
    "Categoria": PART_CATEGORIES[p.category]?.label, "Unità": p.unit,
    "Giacenza": p.stock, "Scorta minima": p.minStock, "Ubicazione": p.location,
    "Costo medio": p.avgCost, "Valore": Math.round(p.stock * p.avgCost * 100) / 100,
    "Fornitore": p.supplier, "Compatibilità": p.compatible,
  }));

  const exportMovimenti = moves.map(m => ({
    "Data": m.date, "Tipo": MOVE_TYPES[m.type]?.label, "Progressivo": partCode(m.part),
    "Ricambio": partName(m.part), "Quantità": m.qty, "Costo unitario": m.unitCost || "",
    "Valore": Math.round((m.qty * (m.unitCost || 0)) * 100) / 100,
    "Veicolo": m.vehicle || "", "Documento": m.docRef || "", "Fornitore": m.supplier || "", "Nota": m.note || "",
  }));

  return (
    <div>
      <SectionTitle
        title="Magazzino Ricambi"
        sub="Giacenze, acquisti e prelievi dell'officina mobile — lo scarico avviene per codice a barre o progressivo"
        action={
          <div className="flex gap-2">
            <ExportButton rows={tab === "giacenze" ? exportGiacenze : exportMovimenti}
              filename={tab === "giacenze" ? "magazzino_giacenze" : "magazzino_movimenti"}
              sheetName={tab === "giacenze" ? "Giacenze" : "Movimenti"} />
            <button onClick={() => setShowCarico(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
              style={{ borderColor: NAVY_700, color: NAVY_700 }}>
              <ArrowDownToLine size={14} /> Carico
            </button>
            <button onClick={() => setShowPrelievo(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition"
              style={{ backgroundColor: GOLD_500 }}>
              <Barcode size={14} /> Prelievo
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <KPI icon={Package} label="Articoli a catalogo" value={parts.length} />
        <KPI icon={Coins} label="Valore magazzino" value={eur(valore)} sub="a costo medio ponderato" accent="#2E7D5B" />
        <KPI icon={AlertTriangle} label="Sotto scorta" value={sottoscorta.length} sub="da riordinare"
          accent={sottoscorta.length ? "#B4302E" : "#2E7D5B"} />
        <KPI icon={Wrench} label="Consumi del mese" value={eur(consumoMese)} accent="#B07A12" />
      </div>

      {sottoscorta.length > 0 && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#FBEAEA" }}>
          <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" style={{ color: "#B4302E" }} />
          <div style={{ color: "#8F2624" }}>
            <p className="font-semibold mb-1">Articoli sotto la scorta minima</p>
            <ul className="text-xs space-y-0.5">
              {sottoscorta.map(p => (
                <li key={p.id}>
                  <strong>{p.code}</strong> {p.description}: {fmtNumber(p.stock)} {p.unit} disponibili
                  (minimo {fmtNumber(p.minStock)}) — fornitore {p.supplier}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "giacenze", label: "Giacenze" }, { id: "movimenti", label: `Movimenti (${moves.length})` },
          { id: "dotazioni", label: `Dotazioni (${equipment.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
        {tab === "giacenze" && (
          <button onClick={() => setShowNewPart(true)} className="ml-auto text-xs font-semibold px-3 py-1.5 self-center rounded-lg border transition hover:bg-slate-50"
            style={{ borderColor: "#cbd5e1", color: "#475569" }}>
            <Plus size={12} className="inline mr-1" />Nuovo articolo
          </button>
        )}
      </div>

      {tab === "dotazioni" ? (
        <Card>
          <DataTable columns={[
            { key: "code", label: "Codice", render: e => (
              <>{e.code}<span className="block text-xs text-slate-400 font-normal font-mono">{e.serial || "—"}</span></>
            )},
            { key: "description", label: "Dotazione" },
            { key: "category", label: "Categoria", accessor: e => EQUIPMENT_CATEGORIES[e.category]?.label,
              filterType: "select", options: Object.values(EQUIPMENT_CATEGORIES).map(c => c.label) },
            { key: "assignedTo", label: "Collocazione", accessor: e => e.assignedTo || "magazzino",
              render: e => e.assignedTo
                ? (<>{e.assignedTo}<span className="block text-xs text-slate-400 font-normal">
                    {e.assignType === "vehicle" ? "in carico al veicolo" : "in carico al dipendente"}</span></>)
                : <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                    style={{ color: "#2E7D5B", backgroundColor: "#E7F5EE" }}>disponibile a magazzino</span> },
            { key: "value", label: "Valore", accessor: e => e.value, render: e => eur(e.value) },
            { key: "condition", label: "Stato" },
          ]} data={equipment} emptyLabel="Nessuna dotazione a catalogo." />
        </Card>
      ) : tab === "giacenze" ? (
        <Card>
          <DataTable
            columns={[
              { key: "code", label: "Progressivo", render: p => (
                <>{p.code}<span className="block text-xs text-slate-400 font-normal font-mono">{p.barcode || "senza barcode"}</span></>
              )},
              { key: "description", label: "Ricambio", render: p => (
                <>{p.description}<span className="block text-xs text-slate-400 font-normal">{p.compatible}</span></>
              )},
              { key: "category", label: "Categoria", accessor: p => PART_CATEGORIES[p.category]?.label,
                filterType: "select", options: Object.values(PART_CATEGORIES).map(c => c.label),
                render: p => {
                  const c = PART_CATEGORIES[p.category] || {};
                  return <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ color: c.color, backgroundColor: `${c.color}18` }}>{c.label}</span>;
                }},
              { key: "location", label: "Ubicazione" },
              { key: "stock", label: "Giacenza", accessor: p => p.stock, render: p => (
                <span className="font-semibold" style={{ color: p.stock <= p.minStock ? "#B4302E" : NAVY_700 }}>
                  {fmtNumber(p.stock)} {p.unit}{p.stock <= p.minStock ? " ⚠" : ""}
                </span>
              )},
              { key: "minStock", label: "Minimo", accessor: p => p.minStock, render: p => fmtNumber(p.minStock) },
              { key: "avgCost", label: "Costo medio", accessor: p => p.avgCost, render: p => eur(p.avgCost) },
              { key: "value", label: "Valore", accessor: p => p.stock * p.avgCost, render: p => eur(p.stock * p.avgCost) },
              { key: "_actions", label: "", sortable: false, filterable: false, render: p => (
                <RowActions entity={{ type: "ricambio", id: p.id, label: `${p.code} — ${p.description}` }}
                  onEdit={() => crud.requestEdit(p)} onDelete={() => crud.requestDelete(p)} />
              )},
            ]}
            data={parts} emptyLabel="Nessun articolo a catalogo."
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: "date", label: "Data" },
              { key: "type", label: "Tipo", accessor: m => MOVE_TYPES[m.type]?.label,
                filterType: "select", options: Object.values(MOVE_TYPES).map(t => t.label),
                render: m => {
                  const t = MOVE_TYPES[m.type] || {};
                  return <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ color: t.color, backgroundColor: `${t.color}18` }}>{t.label}</span>;
                }},
              { key: "part", label: "Ricambio", accessor: m => partName(m.part), render: m => (
                <>{partName(m.part)}<span className="block text-xs text-slate-400 font-normal">{partCode(m.part)}</span></>
              )},
              { key: "qty", label: "Quantità", accessor: m => m.qty, render: m => (
                <span className="font-semibold" style={{ color: MOVE_TYPES[m.type]?.sign < 0 ? "#B4302E" : "#2E7D5B" }}>
                  {MOVE_TYPES[m.type]?.sign < 0 ? "−" : "+"}{fmtNumber(m.qty)}
                </span>
              )},
              { key: "value", label: "Valore", accessor: m => m.qty * (m.unitCost || 0),
                render: m => eur(m.qty * (m.unitCost || 0)) },
              { key: "vehicle", label: "Veicolo", accessor: m => m.vehicle || "" },
              { key: "docRef", label: "Documento", accessor: m => m.docRef || "" },
              { key: "note", label: "Nota", accessor: m => m.note || "" },
            ]}
            data={moves} emptyLabel="Nessun movimento registrato."
          />
        </Card>
      )}

      {showPrelievo && (
        <PrelievoModal parts={parts} vehicleList={vehicleList} maintenanceList={maintenanceList}
          onClose={() => setShowPrelievo(false)} onConfirm={registraPrelievo} />
      )}

      {showCarico && (
        <SimpleFormModal
          title="Carico da acquisto" submitLabel="Registra carico"
          fields={[
            { key: "part", label: "Ricambio", type: "select", required: true, span: 2,
              options: parts.map(p => ({ value: p.id, label: `${p.code} — ${p.description}` })) },
            { key: "qty", label: "Quantità", type: "number", required: true },
            { key: "unitCost", label: "Costo unitario (€)", type: "number", required: true },
            { key: "date", label: "Data documento", type: "date", default: TODAY },
            { key: "supplier", label: "Fornitore", required: true },
            { key: "docRef", label: "N° fattura / DDT", span: 2 },
            { key: "note", label: "Nota", span: 2 },
          ]}
          onClose={() => setShowCarico(false)} onSave={registraCarico}
        />
      )}

      {showNewPart && (
        <SimpleFormModal
          title="Nuovo articolo a magazzino" submitLabel="Crea articolo"
          fields={PART_FORM_FIELDS}
          onClose={() => setShowNewPart(false)}
          onSave={(f) => {
            const prog = `RIC-${String(parts.length + 1).padStart(4, "0")}`;
            setParts(prev => [{
              id: `p${Date.now()}`, code: f.code || prog, barcode: f.barcode || "",
              description: f.description, category: f.category || "varie", unit: f.unit || "pz",
              stock: parseFloat(f.stock) || 0, minStock: parseFloat(f.minStock) || 0,
              location: f.location || "—", avgCost: parseFloat(f.avgCost) || 0,
              supplier: f.supplier || "—", compatible: f.compatible || "—",
            }, ...prev]);
            setShowNewPart(false);
          }}
        />
      )}

      {crud.editing && (
        <SimpleFormModal title={`Modifica articolo — ${crud.editing.code}`} fields={PART_FORM_FIELDS}
          submitLabel="Salva modifiche" initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f,
            stock: parseFloat(f.stock) || 0, minStock: parseFloat(f.minStock) || 0,
            avgCost: parseFloat(f.avgCost) || 0 })} />
      )}
      {crud.deleting && (
        <PinConfirmModal itemLabel={`l'articolo ${crud.deleting.code} — ${crud.deleting.description}`}
          moduleLabel="Magazzino ricambi" onClose={crud.cancelDelete} onConfirm={crud.confirmDelete} />
      )}
    </div>
  );
}

const PART_FORM_FIELDS = [
  { key: "code", label: "Progressivo interno", placeholder: "assegnato automaticamente se vuoto" },
  { key: "barcode", label: "Codice a barre" },
  { key: "description", label: "Descrizione", required: true, span: 2 },
  { key: "category", label: "Categoria", type: "select",
    options: Object.entries(PART_CATEGORIES).map(([value, c]) => ({ value, label: c.label })) },
  { key: "unit", label: "Unità di misura", type: "select", options: ["pz", "kit", "lt", "kg", "mt"] },
  { key: "stock", label: "Giacenza", type: "number" },
  { key: "minStock", label: "Scorta minima", type: "number" },
  { key: "location", label: "Ubicazione" },
  { key: "avgCost", label: "Costo medio (€)", type: "number" },
  { key: "supplier", label: "Fornitore abituale" },
  { key: "compatible", label: "Compatibilità", span: 2 },
];

// ---------------------------------------------------------------------------
// TRASFERIMENTI MASSIVI
// ---------------------------------------------------------------------------
const branchLabel = (id) => branches.find(b => b.id === id)?.name || id;
const sumCosts = (c) => TRANSFER_COST_ITEMS.reduce((t, i) => t + (parseFloat(c?.[i.key]) || 0), 0);

// Comunicazione ai reparti: ciascuno riceve, oltre ai dati comuni, la propria
// azione di competenza. Una mail identica per tutti verrebbe letta da nessuno.
function buildTransferEmail(batch, { vehicleList, recipients }) {
  const to = departments.filter(d => recipients.includes(d.key));
  const tot = sumCosts(batch.costs);
  const perVeicolo = batch.vehicles.length ? tot / batch.vehicles.length : 0;

  const righeVeicoli = batch.vehicles.map(plate => {
    const v = vehicleList.find(x => x.plate === plate);
    return `  • ${plate}${v ? ` — ${v.make} ${v.model}${v.vin ? ` (telaio ${v.vin})` : ""}` : ""}`;
  }).join("\n");

  const righeCosti = TRANSFER_COST_ITEMS
    .filter(i => parseFloat(batch.costs?.[i.key]) > 0)
    .map(i => `  • ${i.label}: € ${fmtNumber(batch.costs[i.key], 2)}`)
    .join("\n");

  const azioni = to.map(d => `${d.label} (${d.email})\n  → ${d.action}`).join("\n\n");

  const subject = `Trasferimento flotta del ${batch.date} — ${batch.vehicles.length} veicoli verso ${branchLabel(batch.toBranch)}`;

  const body = `Buongiorno,
si comunica il trasferimento dei veicoli di seguito elencati, con richiesta di aggiornamento delle rispettive competenze.

DATI DEL TRASFERIMENTO
  Data: ${batch.date}
  Provenienza: ${batch.fromLabel}
  Destinazione: ${branchLabel(batch.toBranch)}
  Centro di costo destinatario: ${batch.toCostCenter}
  Motivazione: ${batch.reason || "—"}

VEICOLI TRASFERITI (${batch.vehicles.length})
${righeVeicoli}

COSTI DI TRASFERIMENTO
${righeCosti || "  • nessun costo rilevato"}
  ─────────────────────────────
  Totale: € ${fmtNumber(tot, 2)}
  Costo medio per veicolo: € ${fmtNumber(perVeicolo, 2)}

I costi sono imputati come voce "Trasferimenti" al centro di costo ${batch.toCostCenter}.

AZIONI RICHIESTE PER REPARTO

${azioni}

Si prega di dare conferma dell'avvenuto aggiornamento.

Cordiali saluti
Ufficio Flotta — Matherion Fleet OS`;

  return { subject, body, to: to.map(d => d.email).join("; "), recipients: to };
}

function TransferEmailModal({ batch, vehicleList, recipients, setRecipients, onClose, onSend }) {
  const mail = buildTransferEmail(batch, { vehicleList, recipients });
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const text = `A: ${mail.to}\nOggetto: ${mail.subject}\n\n${mail.body}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>COMUNICAZIONE AI REPARTI</p>
            <h3 className="text-lg font-bold text-white">
              {batch.vehicles.length} veicoli → {branchLabel(batch.toBranch)}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-200 flex-shrink-0">
          <p className="text-xs text-slate-500 mb-2">Destinatari — deseleziona i reparti non coinvolti</p>
          <div className="flex flex-wrap gap-1.5">
            {departments.map(d => {
              const on = recipients.includes(d.key);
              return (
                <button key={d.key}
                  onClick={() => setRecipients(on ? recipients.filter(r => r !== d.key) : [...recipients, d.key])}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border transition"
                  style={on ? { backgroundColor: NAVY_700, color: "#fff", borderColor: NAVY_700 }
                            : { color: "#94a3b8", borderColor: "#e2e8f0" }}>
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="text-sm">
            <p className="text-xs text-slate-400">A</p>
            <p className="text-slate-700 break-words">{mail.to || "— nessun destinatario selezionato —"}</p>
          </div>
          <div className="text-sm">
            <p className="text-xs text-slate-400">Oggetto</p>
            <p className="font-semibold" style={{ color: NAVY_700 }}>{mail.subject}</p>
          </div>
          <pre className="text-xs whitespace-pre-wrap font-sans border border-slate-200 rounded-lg p-4 text-slate-700"
            style={{ backgroundColor: "#F8FAFC" }}>{mail.body}</pre>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onSend(mail)} disabled={recipients.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}>
            <Send size={15} /> Invia dalla piattaforma
          </button>
          <button onClick={copy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
            style={{ borderColor: NAVY_700, color: NAVY_700 }}>
            <FileText size={15} /> {copied ? "Copiato" : "Copia testo"}
          </button>
          <p className="text-xs text-slate-400 ml-auto">{recipients.length} reparti selezionati</p>
        </div>
      </div>
    </div>
  );
}

function TrasferimentiMassiviView({ vehicleList, setVehicleList, batches, setBatches, setEventList, onSendMail, equipment = [] }) {
  const [tab, setTab] = useState("nuovo");
  const [selected, setSelected] = useState({});
  const [dest, setDest] = useState({ branch: "", costCenter: "", date: TODAY, reason: "" });
  const [costs, setCosts] = useState({});
  const [q, setQ] = useState("");
  const [mailFor, setMailFor] = useState(null);
  const [recipients, setRecipients] = useState(departments.map(d => d.key));
  const [done, setDone] = useState(null);

  const eur = (n) => `€ ${fmtNumber(n, 2)}`;
  const plates = Object.keys(selected).filter(p => selected[p]);
  const branch = branches.find(b => b.id === dest.branch);
  const totale = sumCosts(costs);
  const perVeicolo = plates.length ? totale / plates.length : 0;

  const shown = vehicleList.filter(v =>
    !q || v.plate.toLowerCase().includes(q.toLowerCase()) ||
    `${v.make} ${v.model}`.toLowerCase().includes(q.toLowerCase()) ||
    (v.costCenter || "").toLowerCase().includes(q.toLowerCase()));

  const canRun = plates.length > 0 && dest.branch && dest.costCenter;

  const esegui = () => {
    if (!canRun) return;
    const fromLabel = [...new Set(plates.map(p => vehicleList.find(v => v.plate === p)?.costCenter || "—"))].join(", ");
    const batch = {
      id: `tb${Date.now()}`, date: dest.date, vehicles: plates,
      fromLabel: `Centri di costo: ${fromLabel}`,
      toBranch: dest.branch, toCostCenter: dest.costCenter, reason: dest.reason,
      costs: { ...costs }, notified: [], status: "completato",
    };

    setVehicleList(prev => prev.map(v => plates.includes(v.plate)
      ? { ...v, costCenter: dest.costCenter, company: branch?.company || v.company } : v));

    setEventList(prev => [...prev, ...plates.map(p =>
      makeEvent(p, dest.date, "trasferimento",
        `Trasferito a ${branchLabel(dest.branch)}`,
        `Centro di costo destinatario ${dest.costCenter}${dest.reason ? ` · ${dest.reason}` : ""} · quota costi di trasferimento ${eur(perVeicolo)}`))]);

    setBatches(prev => [batch, ...prev]);
    setDone(batch);
    setSelected({});
    setCosts({});
    setMailFor(batch);   // la comunicazione parte subito dopo l'esecuzione
  };

  // Valutazione Fleet Manager: costi per centro di costo destinatario
  const perCentro = Object.values(batches.reduce((acc, b) => {
    const t = sumCosts(b.costs);
    acc[b.toCostCenter] = acc[b.toCostCenter] || { costCenter: b.toCostCenter, batches: 0, vehicles: 0, total: 0 };
    acc[b.toCostCenter].batches += 1;
    acc[b.toCostCenter].vehicles += b.vehicles.length;
    acc[b.toCostCenter].total += t;
    return acc;
  }, {})).sort((a, b) => b.total - a.total);

  const totaleGenerale = batches.reduce((t, b) => t + sumCosts(b.costs), 0);
  const veicoliMossi = batches.reduce((t, b) => t + b.vehicles.length, 0);

  const exportBatches = batches.map(b => ({
    "Data": b.date, "Veicoli": b.vehicles.join(", "), "N° veicoli": b.vehicles.length,
    "Provenienza": b.fromLabel, "Destinazione": branchLabel(b.toBranch),
    "Centro di costo": b.toCostCenter, "Motivazione": b.reason,
    ...Object.fromEntries(TRANSFER_COST_ITEMS.map(i => [i.label, parseFloat(b.costs?.[i.key]) || 0])),
    "Totale trasferimento": Math.round(sumCosts(b.costs) * 100) / 100,
    "Costo per veicolo": Math.round((sumCosts(b.costs) / Math.max(1, b.vehicles.length)) * 100) / 100,
    "Reparti notificati": (b.notified || []).length,
  }));

  return (
    <div>
      <SectionTitle
        title="Trasferimenti Massivi"
        sub="Spostamento di più veicoli su filiale e centro di costo, con costi imputati alla destinazione e comunicazione ai reparti"
        action={<ExportButton rows={exportBatches} filename="trasferimenti_massivi" sheetName="Trasferimenti" />}
      />

      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "nuovo", label: "Nuovo trasferimento" },
          { id: "storico", label: `Storico e costi (${batches.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "nuovo" && (
        <>
          {done && (
            <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>
              <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Trasferimento eseguito</p>
                <p className="text-xs mt-0.5">
                  {done.vehicles.length} veicoli su {done.toCostCenter} · costi {eur(sumCosts(done.costs))}
                  {" "}imputati come voce "Trasferimenti" al centro di costo destinatario
                </p>
                <button onClick={() => setMailFor(done)} className="text-xs font-semibold underline mt-1">
                  Riapri la comunicazione ai reparti
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <Card className="p-5">
              <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>1 · Seleziona i veicoli</p>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtra per targa, modello o centro di costo"
                    className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs" />
                </div>
                <button onClick={() => setSelected(Object.fromEntries(shown.map(v => [v.plate, true])))}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap">Tutti i filtrati</button>
                <button onClick={() => setSelected({})} className="text-xs font-medium text-slate-500 hover:text-slate-800">Azzera</button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 border-t border-slate-100 pt-2">
                {shown.map(v => (
                  <label key={v.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                    <input type="checkbox" checked={!!selected[v.plate]}
                      onChange={() => setSelected(s => ({ ...s, [v.plate]: !s[v.plate] }))}
                      className="w-3.5 h-3.5 rounded" style={{ accentColor: GOLD_500 }} />
                    <span className="font-medium text-slate-700">{v.plate}</span>
                    <span className="text-xs text-slate-400">{v.make} {v.model}</span>
                    <span className="text-xs text-slate-400 ml-auto">{v.costCenter}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">{plates.length} veicoli selezionati</p>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>2 · Destinazione</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Filiale di destinazione *</p>
                  <select value={dest.branch}
                    onChange={e => setDest(d => ({ ...d, branch: e.target.value, costCenter: "" }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleziona filiale...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {companyName(b.company)}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Centro di costo *</p>
                  <select value={dest.costCenter} onChange={e => setDest(d => ({ ...d, costCenter: e.target.value }))}
                    disabled={!branch} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">{branch ? "Seleziona..." : "Scegli prima la filiale"}</option>
                    {(branch?.costCenters || []).map(cc => <option key={cc} value={cc}>{cc}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Data trasferimento</p>
                  <input type="date" value={dest.date} onChange={e => setDest(d => ({ ...d, date: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Motivazione</p>
                  <input value={dest.reason} onChange={e => setDest(d => ({ ...d, reason: e.target.value }))}
                    placeholder="es. riequilibrio flotta" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <p className="text-sm font-semibold mt-4 mb-2" style={{ color: NAVY_700 }}>3 · Costi di trasferimento</p>
              <div className="grid grid-cols-3 gap-2">
                {TRANSFER_COST_ITEMS.map(i => (
                  <div key={i.key}>
                    <p className="text-xs text-slate-500 mb-1">{i.label}</p>
                    <input type="number" step="0.01" value={costs[i.key] ?? ""}
                      onChange={e => setCosts(c => ({ ...c, [i.key]: e.target.value }))}
                      placeholder="0,00" className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {plates.length > 0 && (
            <div className="mb-4">
              <EquipmentOnBoardWarning equipment={equipment} plates={plates} />
            </div>
          )}

          <Card className="p-5 mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Veicoli</p>
                <p className="text-xl font-bold" style={{ color: NAVY_700 }}>{plates.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Costo totale trasferimento</p>
                <p className="text-xl font-bold" style={{ color: "#B07A12" }}>{eur(totale)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Costo per veicolo</p>
                <p className="text-xl font-bold" style={{ color: NAVY_700 }}>{eur(perVeicolo)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Imputazione</p>
                <p className="text-sm font-bold" style={{ color: dest.costCenter ? "#2E7D5B" : "#94a3b8" }}>
                  {dest.costCenter || "centro di costo da scegliere"}
                </p>
                <p className="text-xs text-slate-400">voce "Trasferimenti"</p>
              </div>
            </div>
            {plates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 mt-3 border-t border-slate-100">
                {plates.map(p => (
                  <span key={p} className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ backgroundColor: "#E3F2F6", color: NAVY_700 }}>{p}</span>
                ))}
              </div>
            )}
          </Card>

          <button onClick={esegui} disabled={!canRun}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}>
            <ArrowLeftRight size={15} /> Esegui trasferimento e genera comunicazione
          </button>
          <p className="text-xs text-slate-400 mt-2">
            Al termine viene proposta la mail ai reparti, con l'azione di competenza di ciascuno.
          </p>
        </>
      )}

      {tab === "storico" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
            <KPI icon={ArrowLeftRight} label="Trasferimenti" value={batches.length} />
            <KPI icon={Car} label="Veicoli spostati" value={veicoliMossi} accent="#1B6DB0" />
            <KPI icon={Coins} label="Costo totale" value={eur(totaleGenerale)} sub="voce Trasferimenti" accent="#B07A12" />
            <KPI icon={TrendingDown} label="Costo medio/veicolo"
              value={eur(veicoliMossi ? totaleGenerale / veicoliMossi : 0)} accent="#B4302E" />
          </div>

          <Card className="p-5 mb-5">
            <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>
              Costi di trasferimento per centro di costo destinatario
            </p>
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Centro di costo</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Trasferimenti</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Veicoli</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Costo totale</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Per veicolo</th>
                </tr>
              </thead>
              <tbody>
                {perCentro.map(c => (
                  <tr key={c.costCenter} className="border-b border-slate-100">
                    <td className="py-2 font-semibold" style={{ color: NAVY_700 }}>{c.costCenter}</td>
                    <td className="py-2 text-right text-slate-600">{c.batches}</td>
                    <td className="py-2 text-right text-slate-600">{c.vehicles}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: "#B07A12" }}>{eur(c.total)}</td>
                    <td className="py-2 text-right text-slate-600">{eur(c.total / Math.max(1, c.vehicles))}</td>
                  </tr>
                ))}
                {perCentro.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-slate-400">Nessun trasferimento registrato.</td></tr>
                )}
              </tbody>
            </table>
          </Card>

          <Card>
            <DataTable
              columns={[
                { key: "date", label: "Data" },
                { key: "vehicles", label: "Veicoli", accessor: b => b.vehicles.length,
                  render: b => (<>{b.vehicles.length}<span className="block text-xs text-slate-400 font-normal">{b.vehicles.join(", ")}</span></>) },
                { key: "toBranch", label: "Destinazione", accessor: b => branchLabel(b.toBranch) },
                { key: "toCostCenter", label: "Centro di costo",
                  filterType: "select", options: [...new Set(batches.map(b => b.toCostCenter))] },
                { key: "reason", label: "Motivazione" },
                { key: "total", label: "Costo", accessor: b => sumCosts(b.costs),
                  render: b => <span className="font-semibold" style={{ color: "#B07A12" }}>{eur(sumCosts(b.costs))}</span> },
                { key: "perVehicle", label: "Per veicolo", accessor: b => sumCosts(b.costs) / Math.max(1, b.vehicles.length),
                  render: b => eur(sumCosts(b.costs) / Math.max(1, b.vehicles.length)) },
                { key: "notified", label: "Reparti avvisati", accessor: b => (b.notified || []).length,
                  render: b => (b.notified || []).length
                    ? <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: "#2E7D5B", backgroundColor: "#E7F5EE" }}>{b.notified.length} reparti</span>
                    : <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: "#B4302E", backgroundColor: "#FBEAEA" }}>non inviata</span> },
                { key: "_mail", label: "", sortable: false, filterable: false, render: b => (
                  <button onClick={() => setMailFor(b)}
                    className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition hover:bg-slate-50"
                    style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                    <Mail size={12} /> Comunicazione
                  </button>
                )},
              ]}
              data={batches} emptyLabel="Nessun trasferimento registrato."
            />
          </Card>
        </>
      )}

      {mailFor && (
        <TransferEmailModal batch={mailFor} vehicleList={vehicleList}
          recipients={recipients} setRecipients={setRecipients}
          onClose={() => setMailFor(null)}
          onSend={(mail) => {
            onSendMail(mail);
            setBatches(prev => prev.map(b => b.id === mailFor.id ? { ...b, notified: recipients } : b));
            setMailFor(null);
          }} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UTENTI & PERMESSI
// ---------------------------------------------------------------------------
// I profili predefiniti sono un punto di partenza, non una gabbia: dopo averne
// applicato uno si può intervenire sul singolo modulo. Serve perché le deleghe
// reali raramente coincidono con un ruolo teorico.
const ROLE_PRESETS = {
  super_admin: {
    label: "Super Admin",
    describe: "Accesso completo a tutti i moduli",
    apply: (ids) => Object.fromEntries(ids.map(id => [id, "edit"])),
  },
  fleet_manager: {
    label: "Fleet Manager",
    describe: "Modifica su tutta l'operatività, sola lettura sugli utenti",
    apply: (ids) => Object.fromEntries(ids.map(id => [id, id === "utenti" ? "view" : "edit"])),
  },
  amministrazione: {
    label: "Amministrazione",
    describe: "Modifica su contratti, fatture, costi e budget; lettura sul resto",
    apply: (ids) => {
      const edit = ["contratti", "subnoleggio", "rinnovi", "fatturazione", "costi", "budget", "analisi", "capacita", "partner", "accise", "esportazioni"];
      return Object.fromEntries(ids.map(id => [id, edit.includes(id) ? "edit" : id === "utenti" ? "none" : "view"]));
    },
  },
  officina: {
    label: "Officina / Manutenzione",
    describe: "Modifica su manutenzione, magazzino, pneumatici e rifornimenti",
    apply: (ids) => {
      const edit = ["manutenzione", "magazzino", "pneumatici", "rifornimenti", "cisterne", "sinistri"];
      const view = ["dashboard", "flotta", "scadenze"];
      return Object.fromEntries(ids.map(id => [id, edit.includes(id) ? "edit" : view.includes(id) ? "view" : "none"]));
    },
  },
  operativo: {
    label: "Ufficio Flotta operativo",
    describe: "Modifica su flotta, assegnazioni, trasferimenti e scadenze",
    apply: (ids) => {
      const edit = ["flotta", "trasferimenti", "trasferimenti_massivi", "scadenze", "verbali", "rifornimenti", "prese"];
      const none = ["utenti", "costi", "budget", "analisi", "fatturazione"];
      return Object.fromEntries(ids.map(id => [id, edit.includes(id) ? "edit" : none.includes(id) ? "none" : "view"]));
    },
  },
  sola_lettura: {
    label: "Sola lettura",
    describe: "Visualizza tutto, non modifica nulla",
    apply: (ids) => Object.fromEntries(ids.map(id => [id, id === "utenti" ? "none" : "view"])),
  },
};

const ALL_MODULE_IDS = () => NAV.map(n => n.id).concat("utenti");
const moduleLabel = (id) => id === "utenti" ? "Utenti & Permessi" : (NAV.find(n => n.id === id)?.label || id);

const initialUsers = []; // Le identità e le password appartengono al server.


function validateNewUser(form, existing) {
  const errors = [];
  const u = (form.username || "").trim().toLowerCase();
  const e = (form.email || "").trim().toLowerCase();

  if (!u) errors.push("Il nome utente è obbligatorio");
  else if (u.length < 3) errors.push("Il nome utente deve avere almeno 3 caratteri");
  else if (existing.some(x => x.id !== form.id && x.username.toLowerCase() === u)) errors.push(`Il nome utente "${u}" è già in uso`);

  if (!e) errors.push("L'email è obbligatoria");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errors.push("Indirizzo email non valido");
  else if (existing.some(x => x.id !== form.id && x.email.toLowerCase() === e)) errors.push(`L'email "${e}" è già registrata`);

  if (!form.fullName?.trim()) errors.push("Il nome e cognome è obbligatorio");

  if (!form.id) {   // la password si imposta solo alla creazione
    if (!form.password) errors.push("La password è obbligatoria");
    else if (form.password.length < 12) errors.push("La password deve avere almeno 12 caratteri");
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errors.push("La password deve contenere lettere e numeri");
    if (form.password !== form.password2) errors.push("Le due password non coincidono");
  }
  return errors;
}

function UserFormModal({ initial, users, onClose, onSave }) {
  const editing = !!initial;
  const ids = ALL_MODULE_IDS();
  const [form, setForm] = useState(initial || {
    username: "", fullName: "", email: "", password: "", password2: "",
    role: "sola_lettura", company: LIVE.companies[0]?.id || "", active: true,
    permissions: ROLE_PRESETS.sola_lettura.apply(ids),
  });
  const [errors, setErrors] = useState([]);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const applyPreset = (role) => setForm(f => ({ ...f, role, permissions: ROLE_PRESETS[role].apply(ids) }));
  const setPerm = (id, level) => setForm(f => ({ ...f, permissions: { ...f.permissions, [id]: level } }));
  const setAll = (level) => setForm(f => ({ ...f, permissions: Object.fromEntries(ids.map(i => [i, level])) }));

  const counts = ids.reduce((a, id) => { a[form.permissions[id] || "none"]++; return a; },
    { none: 0, view: 0, edit: 0 });

  const submit = () => {
    const problems = validateNewUser(form, users);
    if (problems.length) { setErrors(problems); return; }
    const { password2, ...rest } = form;
    onSave({ ...rest, username: rest.username.trim().toLowerCase(), email: rest.email.trim().toLowerCase() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>
              {editing ? "MODIFICA UTENZA" : "REGISTRAZIONE NUOVA UTENZA"}
            </p>
            <h3 className="text-lg font-bold text-white">{editing ? form.fullName : "Nuovo utente"}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>1 · Credenziali</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Nome utente *</p>
                <input value={form.username} onChange={set("username")} placeholder="es. m.rossi"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Nome e cognome *</p>
                <input value={form.fullName} onChange={set("fullName")}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Email *</p>
                <input value={form.email} onChange={set("email")} placeholder="nome@azienda.it"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              {!editing && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Password *</p>
                    <input type="password" value={form.password} onChange={set("password")}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    <p className="text-xs text-slate-400 mt-1">Almeno 12 caratteri, con lettere e numeri</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Conferma password *</p>
                    <input type="password" value={form.password2} onChange={set("password2")}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">Società</p>
                <select value={form.company} onChange={set("company")}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  {LIVE.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Stato</p>
                <select value={form.active ? "1" : "0"} onChange={e => setForm(f => ({ ...f, active: e.target.value === "1" }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="1">Attivo</option>
                  <option value="0">Disabilitato</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>2 · Profilo di partenza</p>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {Object.entries(ROLE_PRESETS).map(([key, r]) => (
                <button key={key} onClick={() => applyPreset(key)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition"
                  style={form.role === key ? { backgroundColor: NAVY_700, color: "#fff", borderColor: NAVY_700 }
                                           : { color: "#64748b", borderColor: "#e2e8f0" }}>
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">{ROLE_PRESETS[form.role]?.describe}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: GOLD_500 }}>
                3 · Moduli da visualizzare e modificare
              </p>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setAll("edit")} className="text-slate-500 hover:text-slate-800">Tutti in modifica</button>
                <span className="text-slate-300">·</span>
                <button onClick={() => setAll("view")} className="text-slate-500 hover:text-slate-800">Tutti in lettura</button>
                <span className="text-slate-300">·</span>
                <button onClick={() => setAll("none")} className="text-slate-500 hover:text-slate-800">Nessuno</button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              {counts.edit} in modifica · {counts.view} in sola lettura · {counts.none} non visibili
            </p>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {ids.map(id => {
                const cur = form.permissions[id] || "none";
                return (
                  <div key={id} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-slate-700">{moduleLabel(id)}</span>
                    <div className="flex gap-1">
                      {[["none", "Nessuno"], ["view", "Visualizza"], ["edit", "Modifica"]].map(([lvl, lbl]) => (
                        <button key={lvl} onClick={() => setPerm(id, lvl)}
                          className="px-2 py-1 rounded text-xs font-semibold border transition"
                          style={cur === lvl
                            ? { backgroundColor: lvl === "edit" ? "#2E7D5B" : lvl === "view" ? NAVY_700 : "#94a3b8", color: "#fff", borderColor: "transparent" }
                            : { color: "#94a3b8", borderColor: "#e2e8f0" }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {errors.map((e, i) => (
            <div key={i} className="flex gap-2 rounded-lg p-2.5 text-xs" style={{ backgroundColor: "#FBEAEA", color: "#B4302E" }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {e}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <button onClick={submit}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition"
            style={{ backgroundColor: NAVY_700 }}>
            {editing ? "Salva modifiche" : "Registra utenza"}
          </button>
          {!editing && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              In produzione la password non viene conservata dalla piattaforma: la gestisce il servizio di
              autenticazione, che ne memorizza solo l'impronta crittografica.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function UtentiView({ users, setUsers, currentUserId, setCurrentUserId }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const crud = useCrudModals(setUsers, "Utenti & Permessi", u => `${u.fullName} (${u.username})`);
  const ids = ALL_MODULE_IDS();

  const exportRows = users.map(u => ({
    "Nome utente": u.username, "Nome e cognome": u.fullName, "Email": u.email,
    "Profilo": ROLE_PRESETS[u.role]?.label || u.role, "Società": companyName(u.company),
    "Stato": u.active ? "Attivo" : "Disabilitato",
    "Moduli in modifica": ids.filter(i => u.permissions?.[i] === "edit").length,
    "Moduli in sola lettura": ids.filter(i => u.permissions?.[i] === "view").length,
    "Moduli non visibili": ids.filter(i => (u.permissions?.[i] || "none") === "none").length,
    "Dettaglio permessi": ids.filter(i => u.permissions?.[i] !== "none")
      .map(i => `${moduleLabel(i)}: ${PERM[u.permissions?.[i]]}`).join(" | "),
  }));

  return (
    <div>
      <SectionTitle
        title="Utenti & Permessi"
        sub="Registrazione delle utenze e assegnazione dei moduli visualizzabili e modificabili"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="utenti_permessi" sheetName="Utenti" />
            <NewRecordButton label="Nuova utenza" onClick={() => setShowForm(true)} />
          </div>
        }
      />

      <p className="text-sm text-slate-500 mb-5">Le utenze vengono gestite dal server. Ogni persona accede con le proprie credenziali.</p>

      <Card>
        <DataTable
          columns={[
            { key: "username", label: "Utente", render: u => (
              <>{u.fullName}<span className="block text-xs text-slate-400 font-normal">{u.username}</span></>
            )},
            { key: "email", label: "Email" },
            { key: "role", label: "Profilo", accessor: u => ROLE_PRESETS[u.role]?.label || u.role,
              filterType: "select", options: Object.values(ROLE_PRESETS).map(r => r.label) },
            { key: "company", label: "Società", accessor: u => companyName(u.company) },
            { key: "perms", label: "Permessi", sortable: false, filterable: false, render: u => {
              const e = ids.filter(i => u.permissions?.[i] === "edit").length;
              const v = ids.filter(i => u.permissions?.[i] === "view").length;
              return (
                <div className="flex gap-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#2E7D5B", backgroundColor: "#E7F5EE" }}>{e} modifica</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: NAVY_700, backgroundColor: "#E3F2F6" }}>{v} lettura</span>
                </div>
              );
            }},
            { key: "active", label: "Stato", accessor: u => u.active ? "Attivo" : "Disabilitato",
              filterType: "select", options: ["Attivo", "Disabilitato"],
              render: u => (
                <span className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={u.active ? { color: "#2E7D5B", backgroundColor: "#E7F5EE" } : { color: "#6B7280", backgroundColor: "#F1F2F4" }}>
                  {u.active ? "Attivo" : "Disabilitato"}
                </span>
              )},
            { key: "_actions", label: "", sortable: false, filterable: false, render: u => (
              <RowActions entity={{ type: "utente", id: u.id, label: u.fullName }}
                onEdit={() => setEditing(u)} onDelete={() => crud.requestDelete(u)} />
            )},
          ]}
          data={users} emptyLabel="Nessuna utenza registrata."
        />
      </Card>

      {showForm && (
        <UserFormModal users={users} onClose={() => setShowForm(false)}
          onSave={(u) => { setUsers(prev => [{ id: `u${Date.now()}`, ...u }, ...prev]); setShowForm(false); }} />
      )}
      {editing && (
        <UserFormModal initial={editing} users={users} onClose={() => setEditing(null)}
          onSave={(u) => { setUsers(prev => prev.map(x => x.id === editing.id ? { ...x, ...u } : x)); setEditing(null); }} />
      )}
      {crud.deleting && (
        <PinConfirmModal itemLabel={`l'utenza ${crud.deleting.fullName} (${crud.deleting.username})`}
          moduleLabel="Utenti & Permessi" onClose={crud.cancelDelete} onConfirm={crud.confirmDelete} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CARBURANTE & FUEL CARD
// ---------------------------------------------------------------------------
// L'importazione riconosce il tracciato dell'operatore e traduce le sue
// intestazioni nei campi interni. La validazione riusa il controllo
// chilometrico dei rifornimenti: una carta carburante non è esente dagli
// errori di battitura sul contachilometri, anzi è la fonte più frequente.
function parseFuelRows(rawRows, profileKey, { vehicleList, existingTx }) {
  const profile = FUEL_IMPORT_PROFILES[profileKey];
  const m = profile.map;
  const num = (v) => {
    if (v === "" || v == null) return null;
    const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const asDate = (v) => {
    if (!v) return null;
    const t = String(v).trim();
    let mm = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (mm) return `${mm[1]}-${mm[2]}-${mm[3]}`;
    mm = t.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})/);
    if (mm) return `${mm[3]}-${mm[2]}-${mm[1]}`;
    return null;
  };

  const accepted = [];
  return rawRows.map((raw, idx) => {
    const errors = [], warnings = [];
    const rec = {
      date: asDate(raw[m.date]),
      card: String(raw[m.card] ?? "").trim(),
      vehicle: String(raw[m.vehicle] ?? "").trim().toUpperCase(),
      station: String(raw[m.station] ?? "").trim(),
      product: String(raw[m.product] ?? "").trim() || "Gasolio",
      qty: num(raw[m.qty]),
      unitPrice: num(raw[m.unitPrice]),
      amount: num(raw[m.amount]),
      odometer: num(raw[m.odometer]),
      operator: profileKey === "matherion" ? "altro" : profileKey,
    };

    if (!rec.date) errors.push(`Data mancante o non riconosciuta (colonna "${m.date}")`);
    if (!rec.vehicle) errors.push(`Targa mancante (colonna "${m.vehicle}")`);
    else if (!vehicleList.some(v => v.plate.toUpperCase() === rec.vehicle))
      warnings.push(`Targa ${rec.vehicle} non presente in anagrafica flotta`);
    if (rec.qty == null || rec.qty <= 0) errors.push(`Quantità non valida (colonna "${m.qty}")`);

    // Coerenza economica: importo ≠ litri × prezzo indica un tracciato letto male
    if (rec.qty && rec.unitPrice && rec.amount) {
      const atteso = rec.qty * rec.unitPrice;
      if (Math.abs(atteso - rec.amount) > Math.max(0.5, atteso * 0.05)) {
        warnings.push(`Importo ${fmtNumber(rec.amount, 2)} non coerente con ${fmtNumber(rec.qty, 2)} × ${fmtNumber(rec.unitPrice, 3)} = ${fmtNumber(atteso, 2)}`);
      }
    }
    if (rec.amount == null && rec.qty && rec.unitPrice) rec.amount = Math.round(rec.qty * rec.unitPrice * 100) / 100;

    // Controllo chilometrico sullo storico più le righe già accettate del file
    if (rec.odometer != null && rec.vehicle && rec.date) {
      const storico = [...existingTx, ...accepted]
        .filter(t => t.vehicle === rec.vehicle && t.odometer != null)
        .map(t => ({ vehicle: t.vehicle, date: t.date, odometer: t.odometer, litres: t.qty }));
      const check = validateRefuel(
        { plate: rec.vehicle, date: rec.date, odometer: rec.odometer, litres: rec.qty }, storico);
      errors.push(...check.errors);
      warnings.push(...check.warnings.filter(w => !w.includes("non presente in anagrafica")));
    }

    const duplicate = existingTx.some(t => t.date === rec.date && t.vehicle === rec.vehicle
      && Math.abs((t.amount || 0) - (rec.amount || 0)) < 0.01 && Math.abs((t.qty || 0) - (rec.qty || 0)) < 0.01);
    if (duplicate) errors.push("Movimento già presente in archivio (stessa data, targa, litri e importo)");

    if (errors.length === 0) accepted.push(rec);
    return { rowNumber: idx + 2, record: rec, errors, warnings };
  });
}

function CarburanteView({ cards, setCards, tx, setTx, vehicleList }) {
  const [tab, setTab] = useState("movimenti");
  const [profileKey, setProfileKey] = useState("q8");
  const [preview, setPreview] = useState(null);
  const [imported, setImported] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const crudCards = useCrudModals(setCards, "Fuel card", c => `${FUEL_OPERATORS[c.operator]?.label} ${c.number}`);
  const crudTx = useCrudModals(setTx, "Rifornimenti fuel card", t => `${t.vehicle} — ${t.date}`);

  const eur = (n) => `€ ${fmtNumber(n || 0, 2)}`;
  const spesaMese = tx.filter(t => t.date >= "2026-08-01").reduce((a, t) => a + (t.amount || 0), 0);
  const litriMese = tx.filter(t => t.date >= "2026-08-01").reduce((a, t) => a + (t.qty || 0), 0);
  const prezzoMedio = litriMese ? spesaMese / litriMese : 0;

  const scaricaTemplate = async () => {
    const XLSX = await caricaXLSX();
    const m = FUEL_IMPORT_PROFILES[profileKey].map;
    const headers = Object.values(m);
    const esempio = {
      [m.date]: "2026-08-20", [m.card]: "7080 1234 5678 9012", [m.vehicle]: "FR001AB",
      [m.station]: "Punto vendita", [m.product]: "Gasolio", [m.qty]: 45.2,
      [m.unitPrice]: 1.549, [m.amount]: 70.02, [m.odometer]: 42500,
    };
    const ws = XLSX.utils.json_to_sheet([esempio], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    downloadWorkbook(wb, `template_carburante_${profileKey}`);
  };

  const onFile = (files) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await caricaXLSX();
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        setPreview({ fileName: file.name, rows: parseFuelRows(rows, profileKey, { vehicleList, existingTx: tx }) });
        setImported(null);
      } catch { setPreview({ fileName: file.name, rows: null, error: "File non leggibile: usa il template dell'operatore." }); }
    };
    reader.readAsArrayBuffer(file);
  };

  const applica = () => {
    const ok = preview.rows.filter(r => r.errors.length === 0);
    setTx(prev => [...ok.map((r, i) => ({ id: `ftx${Date.now()}${i}`, ...r.record })), ...prev]);
    setImported({ n: ok.length, skip: preview.rows.length - ok.length });
    setPreview(null);
  };

  const exportTx = tx.map(t => ({
    "Data": t.date, "Operatore": FUEL_OPERATORS[t.operator]?.label, "Carta": t.card, "Targa": t.vehicle,
    "Punto vendita": t.station, "Prodotto": t.product, "Litri": t.qty,
    "Prezzo unitario": t.unitPrice, "Importo": t.amount, "Km": t.odometer || "",
  }));
  const exportCards = cards.map(c => ({
    "Operatore": FUEL_OPERATORS[c.operator]?.label, "Numero": c.number,
    "Assegnata a": c.assignedTo || "in giacenza", "Tipo": c.assignType || "",
    "Scadenza": c.expiry, "Canone mensile": c.monthlyFee, "Stato": c.status,
  }));

  return (
    <div>
      <SectionTitle
        title="Carburante & Fuel Card"
        sub="Carte carburante di tutti gli operatori, movimenti e importazione con tracciato dedicato"
        action={
          <div className="flex gap-2">
            <ExportButton rows={tab === "carte" ? exportCards : exportTx}
              filename={tab === "carte" ? "fuel_card" : "rifornimenti_fuel_card"}
              sheetName={tab === "carte" ? "Carte" : "Movimenti"} />
            <NewRecordButton label={tab === "carte" ? "Nuova carta" : "Nuovo movimento"}
              onClick={() => tab === "carte" ? setShowCard(true) : setShowTx(true)} />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <KPI icon={Fuel} label="Spesa del mese" value={eur(spesaMese)} accent="#B07A12" />
        <KPI icon={Droplet} label="Litri del mese" value={fmtNumber(litriMese, 1)} accent="#12798F" />
        <KPI icon={Coins} label="Prezzo medio" value={`€ ${fmtNumber(prezzoMedio, 3)}/l`} accent="#2E7D5B" />
        <KPI icon={Receipt} label="Carte attive" value={cards.filter(c => c.status === "attiva").length}
          sub={`su ${cards.length} totali`} />
      </div>

      <Card className="p-5 mb-5">
        <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>Importazione movimenti da fuel card</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Tracciato dell'operatore</p>
            <select value={profileKey} onChange={e => setProfileKey(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              {Object.entries(FUEL_IMPORT_PROFILES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </div>
          <button onClick={scaricaTemplate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
            style={{ borderColor: NAVY_700, color: NAVY_700 }}>
            <Download size={14} /> Template {FUEL_IMPORT_PROFILES[profileKey].label}
          </button>
          <FileUploadButton accept=".xlsx,.xls,.csv" label="Carica file operatore" onFiles={onFile} />
          <p className="text-xs text-slate-400 ml-auto max-w-sm">
            Le intestazioni attese sono quelle dell'estratto dell'operatore: non serve rinominare le colonne.
          </p>
        </div>
      </Card>

      {imported && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>
          <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Importazione completata</p>
            <p className="text-xs mt-0.5">{imported.n} movimenti importati{imported.skip ? ` · ${imported.skip} scartati` : ""}</p>
          </div>
        </div>
      )}

      {preview && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Anteprima — {preview.fileName}</p>
            <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          {preview.error && <p className="text-sm" style={{ color: "#B4302E" }}>{preview.error}</p>}
          {preview.rows && (() => {
            const ok = preview.rows.filter(r => !r.errors.length);
            const ko = preview.rows.filter(r => r.errors.length);
            const warn = ok.filter(r => r.warnings.length);
            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
                  <div><p className="text-xs text-slate-400 mb-1">Righe lette</p><p className="text-xl font-bold" style={{ color: NAVY_700 }}>{preview.rows.length}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Importabili</p><p className="text-xl font-bold" style={{ color: "#2E7D5B" }}>{ok.length}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Con segnalazioni</p><p className="text-xl font-bold" style={{ color: "#B07A12" }}>{warn.length}</p></div>
                  <div><p className="text-xs text-slate-400 mb-1">Scartate</p><p className="text-xl font-bold" style={{ color: "#B4302E" }}>{ko.length}</p></div>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
                  {[...ko, ...warn].map(r => (
                    <div key={r.rowNumber} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                      <span className="font-semibold text-slate-700">Riga {r.rowNumber}</span>
                      <span className="text-slate-400"> — {r.record.vehicle || "targa?"} · {r.record.date || "data?"} · {fmtNumber(r.record.qty || 0, 2)} lt</span>
                      {r.errors.map((e, i) => <p key={i} className="text-xs mt-0.5" style={{ color: "#B4302E" }}>✕ {e}</p>)}
                      {r.warnings.map((w, i) => <p key={i} className="text-xs mt-0.5" style={{ color: "#B07A12" }}>⚠ {w}</p>)}
                    </div>
                  ))}
                  {!ko.length && !warn.length && <p className="text-sm text-slate-400">Nessuna anomalia rilevata.</p>}
                </div>
                <button onClick={applica} disabled={!ok.length}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: NAVY_700 }}>
                  <ArrowDownToLine size={15} /> Importa {ok.length} movimenti
                </button>
              </>
            );
          })()}
        </Card>
      )}

      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "movimenti", label: `Movimenti (${tx.length})` }, { id: "carte", label: `Carte (${cards.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "movimenti" ? (
        <Card>
          <DataTable
            columns={[
              { key: "date", label: "Data" },
              { key: "operator", label: "Operatore", accessor: t => FUEL_OPERATORS[t.operator]?.label,
                filterType: "select", options: Object.values(FUEL_OPERATORS).map(o => o.label),
                render: t => {
                  const o = FUEL_OPERATORS[t.operator] || {};
                  return <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                    style={{ color: o.color, backgroundColor: `${o.color}18` }}>{o.label}</span>;
                }},
              { key: "vehicle", label: "Targa" },
              { key: "station", label: "Punto vendita" },
              { key: "product", label: "Prodotto", filterType: "select", options: [...new Set(tx.map(t => t.product))] },
              { key: "qty", label: "Litri", accessor: t => t.qty, render: t => fmtNumber(t.qty, 2) },
              { key: "unitPrice", label: "€/litro", accessor: t => t.unitPrice, render: t => fmtNumber(t.unitPrice, 3) },
              { key: "amount", label: "Importo", accessor: t => t.amount, render: t => <span className="font-semibold">{eur(t.amount)}</span> },
              { key: "_actions", label: "", sortable: false, filterable: false, render: t => (
                <RowActions entity={{ type: "rifornimento_card", id: t.id, label: `${t.vehicle} ${t.date}` }}
                  onEdit={() => crudTx.requestEdit(t)} onDelete={() => crudTx.requestDelete(t)} />
              )},
            ]}
            data={tx} emptyLabel="Nessun movimento registrato."
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: "operator", label: "Operatore", accessor: c => FUEL_OPERATORS[c.operator]?.label,
                filterType: "select", options: Object.values(FUEL_OPERATORS).map(o => o.label) },
              { key: "number", label: "Numero carta", render: c => <span className="font-mono text-xs">{c.number}</span> },
              { key: "assignedTo", label: "Assegnata a", accessor: c => c.assignedTo || "",
                render: c => c.assignedTo
                  ? (<>{c.assignedTo}<span className="block text-xs text-slate-400 font-normal">{c.assignType === "vehicle" ? "veicolo" : "conducente"}</span></>)
                  : <span className="text-slate-400">in giacenza</span> },
              { key: "expiry", label: "Scadenza" },
              { key: "monthlyFee", label: "Canone", accessor: c => c.monthlyFee, render: c => c.monthlyFee ? eur(c.monthlyFee) : "—" },
              { key: "status", label: "Stato", filterType: "select", options: ["attiva", "sospesa", "bloccata"],
                render: c => (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                    style={c.status === "attiva" ? { color: "#2E7D5B", backgroundColor: "#E7F5EE" } : { color: "#B07A12", backgroundColor: "#FBF1DC" }}>
                    {c.status}
                  </span>
                )},
              { key: "_actions", label: "", sortable: false, filterable: false, render: c => (
                <RowActions entity={{ type: "fuel_card", id: c.id, label: c.number }}
                  onEdit={() => crudCards.requestEdit(c)} onDelete={() => crudCards.requestDelete(c)} />
              )},
            ]}
            data={cards} emptyLabel="Nessuna carta registrata."
          />
        </Card>
      )}

      {showCard && (
        <SimpleFormModal title="Nuova fuel card" fields={FUEL_CARD_FIELDS} submitLabel="Registra carta"
          onClose={() => setShowCard(false)}
          onSave={(f) => { setCards(prev => [{ id: `fc${Date.now()}`, ...f, monthlyFee: parseFloat(f.monthlyFee) || 0 }, ...prev]); setShowCard(false); }} />
      )}
      {crudCards.editing && (
        <SimpleFormModal title={`Modifica carta — ${crudCards.editing.number}`} fields={FUEL_CARD_FIELDS}
          submitLabel="Salva modifiche" initialValues={crudCards.editing} onClose={crudCards.cancelEdit}
          onSave={(f) => crudCards.confirmEdit({ ...f, monthlyFee: parseFloat(f.monthlyFee) || 0 })} />
      )}
      {crudCards.deleting && (
        <PinConfirmModal itemLabel={`la carta ${crudCards.deleting.number}`} moduleLabel="Fuel card"
          onClose={crudCards.cancelDelete} onConfirm={crudCards.confirmDelete} />
      )}

      {showTx && (
        <SimpleFormModal title="Nuovo movimento carburante" fields={FUEL_TX_FIELDS} submitLabel="Registra movimento"
          onClose={() => setShowTx(false)}
          onSave={(f) => { setTx(prev => [{ id: `ftx${Date.now()}`, ...f,
            qty: parseFloat(f.qty) || 0, unitPrice: parseFloat(f.unitPrice) || 0,
            amount: parseFloat(f.amount) || Math.round((parseFloat(f.qty) || 0) * (parseFloat(f.unitPrice) || 0) * 100) / 100,
            odometer: parseFloat(f.odometer) || null }, ...prev]); setShowTx(false); }} />
      )}
      {crudTx.editing && (
        <SimpleFormModal title={`Modifica movimento — ${crudTx.editing.vehicle}`} fields={FUEL_TX_FIELDS}
          submitLabel="Salva modifiche" initialValues={crudTx.editing} onClose={crudTx.cancelEdit}
          onSave={(f) => crudTx.confirmEdit({ ...f, qty: parseFloat(f.qty) || 0,
            unitPrice: parseFloat(f.unitPrice) || 0, amount: parseFloat(f.amount) || 0 })} />
      )}
      {crudTx.deleting && (
        <PinConfirmModal itemLabel={`il movimento di ${crudTx.deleting.vehicle} del ${crudTx.deleting.date}`}
          moduleLabel="Rifornimenti fuel card" onClose={crudTx.cancelDelete} onConfirm={crudTx.confirmDelete} />
      )}
    </div>
  );
}

const FUEL_CARD_FIELDS = [
  { key: "operator", label: "Operatore", type: "select", required: true,
    options: Object.entries(FUEL_OPERATORS).map(([value, o]) => ({ value, label: o.label })) },
  { key: "number", label: "Numero carta", required: true },
  { key: "assignType", label: "Assegnata a", type: "select",
    options: [{ value: "vehicle", label: "Veicolo" }, { value: "driver", label: "Conducente" }] },
  { key: "assignedTo", label: "Targa o nominativo" },
  { key: "expiry", label: "Scadenza", type: "date" },
  { key: "monthlyFee", label: "Canone mensile (€)", type: "number" },
  { key: "status", label: "Stato", type: "select", default: "attiva", options: ["attiva", "sospesa", "bloccata"] },
];

const FUEL_TX_FIELDS = [
  { key: "date", label: "Data", type: "date", required: true },
  { key: "vehicle", label: "Targa", required: true, type: "vehicle" },
  { key: "operator", label: "Operatore", type: "select", required: true,
    options: Object.entries(FUEL_OPERATORS).map(([value, o]) => ({ value, label: o.label })) },
  { key: "card", label: "Numero carta" },
  { key: "station", label: "Punto vendita" },
  { key: "product", label: "Prodotto", type: "select", default: "Gasolio",
    options: ["Gasolio", "Benzina", "AdBlue", "GPL", "Metano", "Ricarica elettrica"] },
  { key: "qty", label: "Litri / kWh", type: "number", required: true },
  { key: "unitPrice", label: "Prezzo unitario (€)", type: "number" },
  { key: "amount", label: "Importo (€)", type: "number" },
  { key: "odometer", label: "Km al rifornimento", type: "number" },
];

// ---------------------------------------------------------------------------
// TELEPASS & PEDAGGI
// ---------------------------------------------------------------------------
function PedaggiView({ devices, setDevices, tx, setTx, vehicleList }) {
  const [tab, setTab] = useState("transiti");
  const [showDev, setShowDev] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imported, setImported] = useState(null);
  const crudDev = useCrudModals(setDevices, "Dispositivi pedaggio", d => `${d.serial}`);
  const crudTx = useCrudModals(setTx, "Transiti", t => `${t.vehicle} — ${t.date}`);
  const eur = (n) => `€ ${fmtNumber(n || 0, 2)}`;

  const spesaMese = tx.filter(t => t.date >= "2026-08-01").reduce((a, t) => a + (t.amount || 0), 0);
  const canoni = devices.filter(d => d.status === "attivo").reduce((a, d) => a + (d.monthlyFee || 0), 0);
  const senzaDispositivo = vehicleList.filter(v => !devices.some(d => d.vehicle === v.plate && d.status === "attivo"));

  const template = async () => {
    const XLSX = await caricaXLSX();
    const ws = XLSX.utils.json_to_sheet([{
      "Data": "2026-08-20", "Dispositivo": "TP-4471820", "Targa": "FR001AB",
      "Rete": "A12", "Entrata": "Livorno", "Uscita": "Pisa Centro", "Classe": "A", "Importo": 3.40,
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    downloadWorkbook(wb, "template_pedaggi");
  };

  const onFile = (files) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await caricaXLSX();
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        const parsed = rows.map((r, i) => {
          const errors = [], warnings = [];
          const rec = {
            date: String(r["Data"] ?? "").slice(0, 10),
            device: String(r["Dispositivo"] ?? "").trim(),
            vehicle: String(r["Targa"] ?? "").trim().toUpperCase(),
            network: String(r["Rete"] ?? "").trim(),
            entry: String(r["Entrata"] ?? "").trim(),
            exit: String(r["Uscita"] ?? "").trim(),
            tollClass: String(r["Classe"] ?? "").trim(),
            amount: parseFloat(String(r["Importo"] ?? "").replace(",", ".")) || 0,
          };
          if (!/^\d{4}-\d{2}-\d{2}$/.test(rec.date)) errors.push("Data non valida (attesa AAAA-MM-GG)");
          if (!rec.amount) errors.push("Importo mancante");
          const dev = devices.find(d => d.serial === rec.device);
          if (rec.device && !dev) warnings.push(`Dispositivo ${rec.device} non censito`);
          // Il transito attribuito a una targa diversa da quella del dispositivo
          // è il caso tipico dell'apparato spostato senza aggiornare l'anagrafica
          else if (dev && rec.vehicle && dev.vehicle && dev.vehicle !== rec.vehicle) {
            warnings.push(`Dispositivo ${rec.device} risulta assegnato a ${dev.vehicle}, transito su ${rec.vehicle}`);
          }
          if (rec.vehicle && !vehicleList.some(v => v.plate === rec.vehicle)) warnings.push(`Targa ${rec.vehicle} non in anagrafica`);
          return { rowNumber: i + 2, record: rec, errors, warnings };
        });
        setPreview({ fileName: file.name, rows: parsed }); setImported(null);
      } catch { setPreview({ fileName: file.name, rows: null, error: "File non leggibile." }); }
    };
    reader.readAsArrayBuffer(file);
  };

  const applica = () => {
    const ok = preview.rows.filter(r => !r.errors.length);
    setTx(prev => [...ok.map((r, i) => ({ id: `tt${Date.now()}${i}`, ...r.record })), ...prev]);
    setImported({ n: ok.length, skip: preview.rows.length - ok.length });
    setPreview(null);
  };

  const exportTx = tx.map(t => ({ "Data": t.date, "Dispositivo": t.device, "Targa": t.vehicle,
    "Rete": t.network, "Entrata": t.entry, "Uscita": t.exit, "Classe": t.tollClass, "Importo": t.amount }));
  const exportDev = devices.map(d => ({ "Operatore": TOLL_OPERATORS[d.operator]?.label, "Seriale": d.serial,
    "Targa": d.vehicle || "in giacenza", "Classe": d.tollClass, "Attivazione": d.activation,
    "Canone mensile": d.monthlyFee, "Stato": d.status }));

  return (
    <div>
      <SectionTitle
        title="Telepass & Pedaggi"
        sub="Dispositivi di telepedaggio, transiti autostradali e importazione degli estratti"
        action={
          <div className="flex gap-2">
            <ExportButton rows={tab === "dispositivi" ? exportDev : exportTx}
              filename={tab === "dispositivi" ? "dispositivi_pedaggio" : "transiti_pedaggi"}
              sheetName={tab === "dispositivi" ? "Dispositivi" : "Transiti"} />
            <NewRecordButton label={tab === "dispositivi" ? "Nuovo dispositivo" : "Nuovo transito"}
              onClick={() => tab === "dispositivi" ? setShowDev(true) : setShowTx(true)} />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <KPI icon={Receipt} label="Pedaggi del mese" value={eur(spesaMese)} accent="#B07A12" />
        <KPI icon={Gauge} label="Dispositivi attivi" value={devices.filter(d => d.status === "attivo").length}
          sub={`${devices.filter(d => d.status !== "attivo").length} in giacenza`} />
        <KPI icon={Coins} label="Canoni mensili" value={eur(canoni)} accent="#12798F" />
        <KPI icon={AlertTriangle} label="Veicoli senza dispositivo" value={senzaDispositivo.length}
          accent={senzaDispositivo.length ? "#B4302E" : "#2E7D5B"} />
      </div>

      <Card className="p-5 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Importazione transiti</p>
          <button onClick={template}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
            style={{ borderColor: NAVY_700, color: NAVY_700 }}>
            <Download size={14} /> Template
          </button>
          <FileUploadButton accept=".xlsx,.xls,.csv" label="Carica estratto" onFiles={onFile} />
        </div>
      </Card>

      {imported && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>
          <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs">{imported.n} transiti importati{imported.skip ? ` · ${imported.skip} scartati` : ""}</p>
        </div>
      )}

      {preview && preview.rows && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Anteprima — {preview.fileName}</p>
            <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          {(() => {
            const ok = preview.rows.filter(r => !r.errors.length);
            const problemi = preview.rows.filter(r => r.errors.length || r.warnings.length);
            return (
              <>
                <p className="text-sm text-slate-500 mb-3">
                  {ok.length} transiti importabili su {preview.rows.length} · totale {eur(ok.reduce((a, r) => a + r.record.amount, 0))}
                </p>
                <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
                  {problemi.map(r => (
                    <div key={r.rowNumber} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                      <span className="font-semibold text-slate-700">Riga {r.rowNumber}</span>
                      <span className="text-slate-400"> — {r.record.vehicle} · {r.record.date}</span>
                      {r.errors.map((e, i) => <p key={i} className="text-xs mt-0.5" style={{ color: "#B4302E" }}>✕ {e}</p>)}
                      {r.warnings.map((w, i) => <p key={i} className="text-xs mt-0.5" style={{ color: "#B07A12" }}>⚠ {w}</p>)}
                    </div>
                  ))}
                  {!problemi.length && <p className="text-sm text-slate-400">Nessuna anomalia rilevata.</p>}
                </div>
                <button onClick={applica} disabled={!ok.length}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: NAVY_700 }}>
                  <ArrowDownToLine size={15} /> Importa {ok.length} transiti
                </button>
              </>
            );
          })()}
        </Card>
      )}

      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "transiti", label: `Transiti (${tx.length})` }, { id: "dispositivi", label: `Dispositivi (${devices.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "transiti" ? (
        <Card>
          <DataTable columns={[
            { key: "date", label: "Data" },
            { key: "vehicle", label: "Targa", filterType: "select", options: [...new Set(tx.map(t => t.vehicle))] },
            { key: "device", label: "Dispositivo" },
            { key: "network", label: "Rete" },
            { key: "tratta", label: "Tratta", accessor: t => `${t.entry} → ${t.exit}` },
            { key: "tollClass", label: "Classe" },
            { key: "amount", label: "Importo", accessor: t => t.amount, render: t => <span className="font-semibold">{eur(t.amount)}</span> },
            { key: "_actions", label: "", sortable: false, filterable: false, render: t => (
              <RowActions entity={{ type: "transito", id: t.id, label: `${t.vehicle} ${t.date}` }}
                onEdit={() => crudTx.requestEdit(t)} onDelete={() => crudTx.requestDelete(t)} />
            )},
          ]} data={tx} emptyLabel="Nessun transito registrato." />
        </Card>
      ) : (
        <Card>
          <DataTable columns={[
            { key: "operator", label: "Operatore", accessor: d => TOLL_OPERATORS[d.operator]?.label,
              filterType: "select", options: Object.values(TOLL_OPERATORS).map(o => o.label) },
            { key: "serial", label: "Seriale", render: d => <span className="font-mono text-xs">{d.serial}</span> },
            { key: "vehicle", label: "Veicolo", accessor: d => d.vehicle || "",
              render: d => d.vehicle || <span className="text-slate-400">in giacenza</span> },
            { key: "tollClass", label: "Classe" },
            { key: "monthlyFee", label: "Canone", accessor: d => d.monthlyFee, render: d => eur(d.monthlyFee) },
            { key: "status", label: "Stato", filterType: "select", options: ["attivo", "giacenza", "cessato"] },
            { key: "_actions", label: "", sortable: false, filterable: false, render: d => (
              <RowActions entity={{ type: "dispositivo_pedaggio", id: d.id, label: d.serial }}
                onEdit={() => crudDev.requestEdit(d)} onDelete={() => crudDev.requestDelete(d)} />
            )},
          ]} data={devices} emptyLabel="Nessun dispositivo registrato." />
        </Card>
      )}

      {showDev && <SimpleFormModal title="Nuovo dispositivo" fields={TOLL_DEVICE_FIELDS} submitLabel="Registra dispositivo"
        onClose={() => setShowDev(false)}
        onSave={f => { setDevices(p => [{ id: `td${Date.now()}`, ...f, monthlyFee: parseFloat(f.monthlyFee) || 0 }, ...p]); setShowDev(false); }} />}
      {crudDev.editing && <SimpleFormModal title={`Modifica ${crudDev.editing.serial}`} fields={TOLL_DEVICE_FIELDS}
        submitLabel="Salva modifiche" initialValues={crudDev.editing} onClose={crudDev.cancelEdit}
        onSave={f => crudDev.confirmEdit({ ...f, monthlyFee: parseFloat(f.monthlyFee) || 0 })} />}
      {crudDev.deleting && <PinConfirmModal itemLabel={`il dispositivo ${crudDev.deleting.serial}`}
        moduleLabel="Dispositivi pedaggio" onClose={crudDev.cancelDelete} onConfirm={crudDev.confirmDelete} />}

      {showTx && <SimpleFormModal title="Nuovo transito" fields={TOLL_TX_FIELDS} submitLabel="Registra transito"
        onClose={() => setShowTx(false)}
        onSave={f => { setTx(p => [{ id: `tt${Date.now()}`, ...f, amount: parseFloat(f.amount) || 0 }, ...p]); setShowTx(false); }} />}
      {crudTx.editing && <SimpleFormModal title="Modifica transito" fields={TOLL_TX_FIELDS} submitLabel="Salva modifiche"
        initialValues={crudTx.editing} onClose={crudTx.cancelEdit}
        onSave={f => crudTx.confirmEdit({ ...f, amount: parseFloat(f.amount) || 0 })} />}
      {crudTx.deleting && <PinConfirmModal itemLabel={`il transito di ${crudTx.deleting.vehicle}`}
        moduleLabel="Transiti" onClose={crudTx.cancelDelete} onConfirm={crudTx.confirmDelete} />}
    </div>
  );
}

const TOLL_DEVICE_FIELDS = [
  { key: "operator", label: "Operatore", type: "select", required: true,
    options: Object.entries(TOLL_OPERATORS).map(([value, o]) => ({ value, label: o.label })) },
  { key: "serial", label: "Seriale dispositivo", required: true },
  { key: "vehicle", label: "Veicolo assegnato", type: "vehicle" },
  { key: "tollClass", label: "Classe tariffaria", type: "select", options: ["A", "B", "3", "4", "5"] },
  { key: "activation", label: "Data attivazione", type: "date" },
  { key: "monthlyFee", label: "Canone mensile (€)", type: "number" },
  { key: "status", label: "Stato", type: "select", default: "attivo", options: ["attivo", "giacenza", "cessato"] },
];

const TOLL_TX_FIELDS = [
  { key: "date", label: "Data", type: "date", required: true },
  { key: "vehicle", label: "Targa", type: "vehicle", required: true },
  { key: "device", label: "Dispositivo" },
  { key: "network", label: "Rete autostradale" },
  { key: "entry", label: "Entrata" },
  { key: "exit", label: "Uscita" },
  { key: "tollClass", label: "Classe", type: "select", options: ["A", "B", "3", "4", "5"] },
  { key: "amount", label: "Importo (€)", type: "number", required: true },
];

// ---------------------------------------------------------------------------
// DOTAZIONI DI BORDO
// ---------------------------------------------------------------------------
// Il punto critico non è censire le dotazioni, ma non perderle: quando un
// mezzo cambia centro di costo o rientra da un noleggio breve, ciò che è a
// bordo va scaricato con un verbale. La funzione sotto è usata sia dal modulo
// sia dai trasferimenti per intercettare il problema prima che si verifichi.
function equipmentOnVehicle(equipment, plate) {
  return equipment.filter(e => e.assignType === "vehicle" && e.assignedTo === plate);
}
function equipmentOfDriver(equipment, driver) {
  return equipment.filter(e => e.assignType === "driver" && e.assignedTo === driver);
}

function EquipmentRecordModal({ record, equipment, onClose }) {
  const items = equipment.filter(e => record.items.includes(e.id));
  const isAffido = record.type === "affidamento";
  const totale = items.reduce((t, e) => t + (e.value || 0), 0);

  const html = (() => {
    const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const righe = items.map((e, i) => `<tr>
        <td>${i + 1}</td><td>${esc(e.code)}</td><td>${esc(e.description)}</td>
        <td>${esc(e.serial || "—")}</td><td>${esc(EQUIPMENT_CATEGORIES[e.category]?.label)}</td>
        <td style="text-align:right">€ ${fmtNumber(e.value || 0, 2)}</td></tr>`).join("");
    return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<title>Verbale di ${isAffido ? "affidamento" : "riconsegna"} dotazioni</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  body { font-family: Calibri, "Segoe UI", sans-serif; font-size: 10.5pt; color: #222; line-height: 1.5; }
  h1 { font-size: 15pt; color: #12596B; text-align: center; margin: 0 0 3pt; }
  .sub { text-align: center; color: #14788F; font-size: 10pt; margin-bottom: 16pt; }
  h2 { font-size: 11pt; color: #12596B; margin: 14pt 0 5pt; border-bottom: 1px solid #2FA8C4; padding-bottom: 2pt; }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0; font-size: 9.5pt; }
  th { background: #12596B; color: #fff; padding: 4pt 6pt; text-align: left; }
  td { border: 1px solid #d5d9df; padding: 4pt 6pt; }
  .box { background: #F4F7F9; padding: 9pt; margin-bottom: 10pt; }
  .line { border-bottom: 1px solid #666; height: 26pt; margin-bottom: 3pt; }
  .small { font-size: 9pt; color: #555; }
  .cols { display: flex; gap: 40pt; margin-top: 18pt; }
  .col { flex: 1; }
</style></head><body>
<h1>VERBALE DI ${isAffido ? "AFFIDAMENTO" : "RICONSEGNA"} DOTAZIONI</h1>
<div class="sub">${isAffido ? "Consegna in uso e assunzione di responsabilità" : "Restituzione e scarico di responsabilità"}</div>

<div class="box">
  <p><strong>Data:</strong> ${esc(record.date)}<br/>
  <strong>${record.assignType === "vehicle" ? "Veicolo" : "Dipendente"}:</strong> ${esc(record.target)}<br/>
  <strong>Numero dotazioni:</strong> ${items.length} &nbsp;·&nbsp; <strong>Valore complessivo:</strong> € ${fmtNumber(totale, 2)}</p>
</div>

<h2>ELENCO DELLE DOTAZIONI</h2>
<table>
  <thead><tr><th>#</th><th>Codice</th><th>Descrizione</th><th>Matricola</th><th>Categoria</th><th style="text-align:right">Valore</th></tr></thead>
  <tbody>${righe}</tbody>
</table>

<h2>DICHIARAZIONI</h2>
${isAffido ? `
<p>Il sottoscritto dichiara di ricevere in uso le dotazioni sopra elencate, di averne verificato lo stato e la
completezza, e si impegna a: custodirle con diligenza; utilizzarle esclusivamente per finalità di servizio e
secondo le istruzioni ricevute; segnalare tempestivamente guasti, smarrimenti o sottrazioni; restituirle a
semplice richiesta e comunque alla cessazione dell'assegnazione del veicolo o del rapporto di lavoro.</p>
<p>La mancata restituzione o il danneggiamento per incuria potranno comportare l'addebito del valore residuo,
nei limiti consentiti dalla legge e dal contratto applicato.</p>` : `
<p>Si dà atto che le dotazioni sopra elencate sono state riconsegnate e verificate. Con la sottoscrizione del
presente verbale il consegnatario è liberato da ogni responsabilità di custodia relativa ai beni indicati,
fatte salve le contestazioni per ammanchi o danni annotati di seguito.</p>`}
${record.note ? `<p><strong>Note:</strong> ${esc(record.note)}</p>` : ""}

<div class="cols">
  <div class="col"><div class="line"></div><p class="small">Il consegnante — Ufficio Flotta</p></div>
  <div class="col"><div class="line"></div><p class="small">${isAffido ? "Per accettazione — il consegnatario" : "Per riconsegna — il consegnatario"}</p></div>
</div>
</body></html>`;
  })();

  const stampa = () => {
    const f = document.createElement("iframe");
    f.style.position = "fixed"; f.style.right = "-10000px";
    document.body.appendChild(f);
    const d = f.contentWindow.document; d.open(); d.write(html); d.close();
    const go = () => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => document.body.removeChild(f), 800); };
    f.onload = go; if (d.readyState === "complete") go();
  };
  const scarica = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `verbale_${record.type}_${record.target}_${record.date}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>
              VERBALE DI {isAffido ? "AFFIDAMENTO" : "RICONSEGNA"}
            </p>
            <h3 className="text-lg font-bold text-white">{record.target} · {items.length} dotazioni</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <iframe title="Verbale" srcDoc={html} className="w-full h-full border border-slate-200 rounded-lg bg-white" />
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
          <button onClick={stampa} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: NAVY_700 }}><Printer size={15} /> Stampa per la firma</button>
          <button onClick={scarica} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-slate-50"
            style={{ borderColor: NAVY_700, color: NAVY_700 }}><Download size={15} /> Scarica</button>
        </div>
      </div>
    </div>
  );
}

function AssignEquipmentModal({ equipment, vehicleList, mode, preset, onClose, onConfirm }) {
  const [assignType, setAssignType] = useState(preset?.assignType || "vehicle");
  const [target, setTarget] = useState(preset?.target || "");
  const [sel, setSel] = useState(Object.fromEntries((preset?.items || []).map(i => [i, true])));
  const [note, setNote] = useState("");
  const [date, setDate] = useState(TODAY);

  const isAffido = mode === "affidamento";
  // In affidamento si sceglie fra le dotazioni libere; in riconsegna fra quelle
  // effettivamente in carico al soggetto indicato.
  const disponibili = isAffido
    ? equipment.filter(e => !e.assignedTo)
    : equipment.filter(e => e.assignType === assignType && e.assignedTo === target);

  const chosen = Object.keys(sel).filter(k => sel[k]);
  const drivers = [...new Set(equipment.filter(e => e.assignType === "driver").map(e => e.assignedTo))]
    .concat(vehicleList.map(v => v.driver).filter(d => d && d !== "—"));
  const uniqueDrivers = [...new Set(drivers)];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>
              {isAffido ? "AFFIDAMENTO DOTAZIONI" : "RICONSEGNA DOTAZIONI"}
            </p>
            <h3 className="text-lg font-bold text-white">{isAffido ? "Consegna in uso" : "Scarico di responsabilità"}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Affidatario</p>
              <select value={assignType} onChange={e => { setAssignType(e.target.value); setTarget(""); setSel({}); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="vehicle">Veicolo</option>
                <option value="driver">Dipendente</option>
              </select>
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-slate-500 mb-1">{assignType === "vehicle" ? "Targa" : "Nominativo"}</p>
              {assignType === "vehicle"
                ? <VehiclePicker value={target} onChange={setTarget} />
                : (
                  <select value={target} onChange={e => { setTarget(e.target.value); setSel({}); }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleziona...</option>
                    {uniqueDrivers.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Data</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">
              Dotazioni {isAffido ? "disponibili" : "in carico"} — selezione multipla
            </p>
            <div className="border border-slate-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
              {disponibili.map(e => (
                <label key={e.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={!!sel[e.id]} onChange={() => setSel(s => ({ ...s, [e.id]: !s[e.id] }))}
                    className="w-3.5 h-3.5 rounded" style={{ accentColor: GOLD_500 }} />
                  <span className="font-medium text-slate-700">{e.code}</span>
                  <span className="text-xs text-slate-500">{e.description}</span>
                  <span className="text-xs text-slate-400 ml-auto">{e.serial}</span>
                </label>
              ))}
              {disponibili.length === 0 && (
                <p className="px-3 py-3 text-sm text-slate-400">
                  {isAffido ? "Nessuna dotazione libera a magazzino." : "Nessuna dotazione risulta in carico."}
                </p>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">{chosen.length} selezionate</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Note</p>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder={isAffido ? "es. consegnate con custodia" : "es. carrello con ruota danneggiata"}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <button disabled={!target || chosen.length === 0}
            onClick={() => onConfirm({ type: mode, date, assignType, target, items: chosen, note })}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}>
            {isAffido ? "Affida e genera verbale" : "Registra riconsegna e genera verbale"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DotazioniView({ equipment, setEquipment, records, setRecords, vehicleList }) {
  const [tab, setTab] = useState("inventario");
  const [assign, setAssign] = useState(null);   // { mode, preset }
  const [showRecord, setShowRecord] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const crud = useCrudModals(setEquipment, "Dotazioni di bordo", e => `${e.code} — ${e.description}`);
  const eur = (n) => `€ ${fmtNumber(n || 0, 2)}`;

  const inCarico = equipment.filter(e => e.assignedTo);
  const libere = equipment.filter(e => !e.assignedTo);
  const valoreTot = equipment.reduce((t, e) => t + (e.value || 0), 0);

  const conferma = (payload) => {
    const now = { id: `er${Date.now()}`, ...payload, signed: false };
    setRecords(prev => [now, ...prev]);
    setEquipment(prev => prev.map(e => {
      if (!payload.items.includes(e.id)) return e;
      return payload.type === "affidamento"
        ? { ...e, assignType: payload.assignType, assignedTo: payload.target, assignedOn: payload.date }
        : { ...e, assignType: null, assignedTo: null, assignedOn: null };
    }));
    setAssign(null);
    setShowRecord(now);
  };

  const exportInv = equipment.map(e => ({
    "Codice": e.code, "Descrizione": e.description, "Categoria": EQUIPMENT_CATEGORIES[e.category]?.label,
    "Matricola": e.serial, "Valore": e.value, "Stato": e.condition,
    "In carico a": e.assignedTo || "magazzino", "Tipo": e.assignType || "", "Dal": e.assignedOn || "",
  }));
  const exportRec = records.map(r => ({
    "Data": r.date, "Tipo": r.type, "Affidatario": r.target,
    "Tipo affidatario": r.assignType === "vehicle" ? "Veicolo" : "Dipendente",
    "N° dotazioni": r.items.length, "Firmato": r.signed ? "SI" : "NO", "Note": r.note || "",
  }));

  return (
    <div>
      <SectionTitle
        title="Dotazioni di Bordo"
        sub="Attrezzature e dispositivi a magazzino, affidati ai veicoli o ai dipendenti con verbale sottoscritto"
        action={
          <div className="flex gap-2">
            <ExportButton rows={tab === "verbali" ? exportRec : exportInv}
              filename={tab === "verbali" ? "verbali_dotazioni" : "inventario_dotazioni"}
              sheetName={tab === "verbali" ? "Verbali" : "Inventario"} />
            <button onClick={() => setAssign({ mode: "riconsegna" })}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
              style={{ borderColor: NAVY_700, color: NAVY_700 }}>
              <ArrowDownToLine size={14} /> Riconsegna
            </button>
            <NewRecordButton label="Affida dotazioni" onClick={() => setAssign({ mode: "affidamento" })} />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <KPI icon={Package} label="Dotazioni a catalogo" value={equipment.length} />
        <KPI icon={Truck} label="In carico" value={inCarico.length}
          sub={`${equipment.filter(e => e.assignType === "vehicle").length} su veicoli · ${equipment.filter(e => e.assignType === "driver").length} a dipendenti`}
          accent="#12798F" />
        <KPI icon={Wrench} label="Disponibili a magazzino" value={libere.length} accent="#2E7D5B" />
        <KPI icon={Coins} label="Valore complessivo" value={eur(valoreTot)} accent="#B07A12" />
      </div>

      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "inventario", label: `Inventario (${equipment.length})` },
          { id: "verbali", label: `Verbali (${records.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
        {tab === "inventario" && (
          <button onClick={() => setShowNew(true)}
            className="ml-auto self-center text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:bg-slate-50"
            style={{ borderColor: "#cbd5e1", color: "#475569" }}>
            <Plus size={12} className="inline mr-1" />Nuova dotazione
          </button>
        )}
      </div>

      {tab === "inventario" ? (
        <Card>
          <DataTable columns={[
            { key: "code", label: "Codice", render: e => (
              <>{e.code}<span className="block text-xs text-slate-400 font-normal font-mono">{e.serial || "—"}</span></>
            )},
            { key: "description", label: "Dotazione" },
            { key: "category", label: "Categoria", accessor: e => EQUIPMENT_CATEGORIES[e.category]?.label,
              filterType: "select", options: Object.values(EQUIPMENT_CATEGORIES).map(c => c.label),
              render: e => {
                const c = EQUIPMENT_CATEGORIES[e.category] || {};
                return <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                  style={{ color: c.color, backgroundColor: `${c.color}18` }}>{c.label}</span>;
              }},
            { key: "assignedTo", label: "In carico a", accessor: e => e.assignedTo || "",
              render: e => e.assignedTo
                ? (<>{e.assignedTo}<span className="block text-xs text-slate-400 font-normal">
                    {e.assignType === "vehicle" ? "veicolo" : "dipendente"} · dal {e.assignedOn}</span></>)
                : <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                    style={{ color: "#2E7D5B", backgroundColor: "#E7F5EE" }}>a magazzino</span> },
            { key: "value", label: "Valore", accessor: e => e.value, render: e => eur(e.value) },
            { key: "condition", label: "Stato", filterType: "select", options: ["buono", "usurato", "da sostituire"] },
            { key: "_actions", label: "", sortable: false, filterable: false, render: e => (
              <RowActions entity={{ type: "dotazione", id: e.id, label: `${e.code} — ${e.description}` }}
                onEdit={() => crud.requestEdit(e)} onDelete={() => crud.requestDelete(e)} />
            )},
          ]} data={equipment} emptyLabel="Nessuna dotazione a catalogo." />
        </Card>
      ) : (
        <Card>
          <DataTable columns={[
            { key: "date", label: "Data" },
            { key: "type", label: "Tipo", filterType: "select", options: ["affidamento", "riconsegna"],
              render: r => (
                <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                  style={r.type === "affidamento" ? { color: "#12798F", backgroundColor: "#E3F2F6" } : { color: "#2E7D5B", backgroundColor: "#E7F5EE" }}>
                  {r.type}
                </span>
              )},
            { key: "target", label: "Affidatario", render: r => (
              <>{r.target}<span className="block text-xs text-slate-400 font-normal">{r.assignType === "vehicle" ? "veicolo" : "dipendente"}</span></>
            )},
            { key: "items", label: "Dotazioni", accessor: r => r.items.length },
            { key: "signed", label: "Firmato", accessor: r => r.signed ? "SI" : "NO",
              render: r => r.signed
                ? <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: "#2E7D5B", backgroundColor: "#E7F5EE" }}>firmato</span>
                : <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: "#B07A12", backgroundColor: "#FBF1DC" }}>da firmare</span> },
            { key: "_actions", label: "", sortable: false, filterable: false, render: r => (
              <div className="flex items-center gap-1">
                <button onClick={() => setShowRecord(r)}
                  className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition hover:bg-slate-50"
                  style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                  <Printer size={12} /> Verbale
                </button>
                <RowActions entity={{ type: "verbale_dotazioni", id: r.id, label: `Verbale ${r.target}` }} />
              </div>
            )},
          ]} data={records} emptyLabel="Nessun verbale registrato." />
        </Card>
      )}

      {assign && (
        <AssignEquipmentModal equipment={equipment} vehicleList={vehicleList} mode={assign.mode}
          preset={assign.preset} onClose={() => setAssign(null)} onConfirm={conferma} />
      )}
      {showRecord && (
        <EquipmentRecordModal record={showRecord} equipment={equipment} onClose={() => setShowRecord(null)} />
      )}
      {showNew && (
        <SimpleFormModal title="Nuova dotazione" fields={EQUIPMENT_FIELDS} submitLabel="Aggiungi a magazzino"
          onClose={() => setShowNew(false)}
          onSave={f => { setEquipment(p => [{ id: `eq${Date.now()}`,
            code: f.code || `DOT-${String(p.length + 1).padStart(4, "0")}`, ...f,
            value: parseFloat(f.value) || 0, assignType: null, assignedTo: null, assignedOn: null }, ...p]); setShowNew(false); }} />
      )}
      {crud.editing && (
        <SimpleFormModal title={`Modifica ${crud.editing.code}`} fields={EQUIPMENT_FIELDS} submitLabel="Salva modifiche"
          initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={f => crud.confirmEdit({ ...f, value: parseFloat(f.value) || 0 })} />
      )}
      {crud.deleting && (
        <PinConfirmModal itemLabel={`la dotazione ${crud.deleting.code} — ${crud.deleting.description}`}
          moduleLabel="Dotazioni di bordo" onClose={crud.cancelDelete} onConfirm={crud.confirmDelete} />
      )}
    </div>
  );
}

const EQUIPMENT_FIELDS = [
  { key: "code", label: "Codice", placeholder: "assegnato automaticamente se vuoto" },
  { key: "serial", label: "Matricola / seriale" },
  { key: "description", label: "Descrizione", required: true, span: 2 },
  { key: "category", label: "Categoria", type: "select", required: true,
    options: Object.entries(EQUIPMENT_CATEGORIES).map(([value, c]) => ({ value, label: c.label })) },
  { key: "value", label: "Valore (€)", type: "number" },
  { key: "purchase", label: "Data acquisto", type: "date" },
  { key: "condition", label: "Stato", type: "select", default: "buono", options: ["buono", "usurato", "da sostituire"] },
];

// Avviso riusabile: elenca le dotazioni a bordo prima di muovere o restituire
// un veicolo, con scorciatoia al verbale di riconsegna.
function EquipmentOnBoardWarning({ equipment, plates, onDischarge, compact }) {
  const trovate = plates.flatMap(p => equipmentOnVehicle(equipment, p).map(e => ({ ...e, plate: p })));
  if (trovate.length === 0) return null;
  const valore = trovate.reduce((t, e) => t + (e.value || 0), 0);
  return (
    <div className="flex gap-2.5 rounded-lg p-4 text-sm" style={{ backgroundColor: "#FBF1DC" }}>
      <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" style={{ color: "#B07A12" }} />
      <div style={{ color: "#7A5C0E" }} className="flex-1">
        <p className="font-semibold mb-1">
          Dotazioni a bordo da scaricare — {trovate.length} pezzi per € {fmtNumber(valore, 2)}
        </p>
        <ul className="text-xs space-y-0.5">
          {trovate.map(e => (
            <li key={e.id}><strong>{e.plate}</strong>: {e.code} {e.description}{e.serial ? ` (${e.serial})` : ""}</li>
          ))}
        </ul>
        <p className="text-xs mt-1.5">
          Prima di procedere, redigere il verbale di riconsegna: è la situazione in cui le attrezzature
          restano a bordo e si perdono nel passaggio.
        </p>
        {onDischarge && (
          <button onClick={onDischarge}
            className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition"
            style={{ backgroundColor: "#B07A12" }}>
            Genera verbale di riconsegna
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRIVACY, COOKIE E NOTE LEGALI
// ---------------------------------------------------------------------------
// Qui confluiscono tutti i riferimenti societari del titolare della piattaforma.
// Il consenso ai cookie è granulare e i cookie tecnici non sono disattivabili
// perché senza di essi la sessione non si regge: presentarli come opzionali
// sarebbe scorretto verso l'utente e non conforme.
const COOKIE_CATEGORIES = [
  { key: "tecnici", label: "Cookie tecnici e di sessione", required: true,
    describe: "Necessari per l'autenticazione, il mantenimento della sessione e la sicurezza. Senza questi la piattaforma non funziona.",
    detail: "Durata: sessione o fino a 12 mesi per il token di accesso." },
  { key: "preferenze", label: "Cookie di preferenza", required: false,
    describe: "Memorizzano scelte come il modulo aperto, i filtri applicati e la società con cui si opera.",
    detail: "Durata: fino a 6 mesi." },
  { key: "statistiche", label: "Cookie statistici", required: false,
    describe: "Misurano in forma aggregata l'utilizzo dei moduli per orientare gli sviluppi successivi.",
    detail: "Durata: fino a 12 mesi. Dati aggregati e non riconducibili al singolo utente." },
  { key: "marketing", label: "Cookie di marketing", required: false,
    describe: "Non utilizzati dalla piattaforma. La voce resta esposta per trasparenza.",
    detail: "Nessun cookie di questa categoria è installato." },
];

function CookieBanner({ onSave, onClose }) {
  const [detail, setDetail] = useState(false);
  const [prefs, setPrefs] = useState({ tecnici: true, preferenze: true, statistiche: false, marketing: false });

  return (
    // Il riquadro si ferma a destra della barra di navigazione: occupando tutta
    // la larghezza copriva le ultime voci del menu, che restavano non cliccabili
    // finché il consenso non veniva espresso.
    <div className="fixed right-0 bottom-0 left-0 lg:left-64 z-50 p-4 flex justify-center pointer-events-none">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto">
        <div className="px-6 py-4" style={{ background: BRAND_GRADIENT }}>
          <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>INFORMATIVA COOKIE</p>
          <h3 className="text-base font-bold text-white">Questa piattaforma utilizza cookie</h3>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600">
            Utilizziamo cookie tecnici, indispensabili al funzionamento della piattaforma, e — previo consenso —
            cookie di preferenza e statistici. Puoi accettare tutto, rifiutare i non necessari o scegliere
            categoria per categoria. Le impostazioni restano modificabili in qualsiasi momento dalla sezione
            Privacy &amp; Cookie.
          </p>

          {detail && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {COOKIE_CATEGORIES.map(c => (
                <label key={c.key} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer">
                  <input type="checkbox" checked={c.required ? true : prefs[c.key]} disabled={c.required}
                    onChange={() => setPrefs(p => ({ ...p, [c.key]: !p[c.key] }))}
                    className="w-4 h-4 rounded mt-0.5" style={{ accentColor: GOLD_500 }} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {c.label}{c.required && <span className="text-xs text-slate-400 font-normal"> — sempre attivi</span>}
                    </p>
                    <p className="text-xs text-slate-500">{c.describe}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => onSave({ tecnici: true, preferenze: true, statistiche: true, marketing: false })}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition"
              style={{ background: ACCENT_GRADIENT }}>
              Accetta tutti
            </button>
            <button onClick={() => onSave({ tecnici: true, preferenze: false, statistiche: false, marketing: false })}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
              style={{ borderColor: NAVY_700, color: NAVY_700 }}>
              Rifiuta i non necessari
            </button>
            {detail
              ? <button onClick={() => onSave(prefs)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
                  style={{ borderColor: NAVY_700, color: NAVY_700 }}>Salva le mie scelte</button>
              : <button onClick={() => setDetail(true)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800">
                  Personalizza
                </button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceView({ consent, setConsent }) {
  const [tab, setTab] = useState("privacy");
  const [prefs, setPrefs] = useState(consent || { tecnici: true, preferenze: true, statistiche: false, marketing: false });
  const [saved, setSaved] = useState(false);

  const Section = ({ title, children }) => (
    <div className="mb-5">
      <h3 className="text-sm font-bold mb-1.5" style={{ color: NAVY_700 }}>{title}</h3>
      <div className="text-sm text-slate-600 space-y-2 leading-relaxed">{children}</div>
    </div>
  );

  return (
    <div>
      <SectionTitle
        title="Privacy & Cookie"
        sub="Informativa sul trattamento dei dati, gestione dei cookie e note legali della piattaforma"
      />

      {/* Riferimenti societari del titolare: è qui che devono comparire */}
      <Card className="p-5 mb-5">
        <div className="flex items-start gap-4">
          <BrandMark size={44} />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GOLD_500 }}>
              Titolare della piattaforma e del trattamento
            </p>
            <p className="text-lg font-bold" style={{ color: NAVY_700 }}>{PLATFORM_OWNER.name}</p>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm max-w-2xl">
              <dt className="text-slate-400">Sede legale</dt>
              <dd className="text-slate-700">{ownerAddressLine()}</dd>
              <dt className="text-slate-400">Partita IVA e codice fiscale</dt>
              <dd className="text-slate-700 font-medium">{PLATFORM_OWNER.vat}</dd>
              <dt className="text-slate-400">PEC</dt>
              <dd className="text-slate-700">{PLATFORM_OWNER.pec}</dd>
              <dt className="text-slate-400">Contatto privacy</dt>
              <dd className="text-slate-700">{PLATFORM_OWNER.privacyEmail}</dd>
              <dt className="text-slate-400">Prodotto</dt>
              <dd className="text-slate-700">{PLATFORM_OWNER.product}</dd>
            </dl>
          </div>
        </div>
      </Card>

      <div className="flex border-b border-slate-200 mb-5">
        {[{ id: "privacy", label: "Informativa privacy" },
          { id: "cookie", label: "Cookie e consensi" },
          { id: "legale", label: "Note legali" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
            style={tab === t.id ? { borderColor: GOLD_500, color: NAVY_700 } : { borderColor: "transparent", color: "#94a3b8" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "privacy" && (
        <Card className="p-6">
          <p className="text-xs text-slate-400 mb-4">
            Informativa resa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR).
          </p>

          <Section title="1. Titolare del trattamento">
            <p>
              {PLATFORM_OWNER.name}, con sede legale in {ownerAddressLine()}, P.IVA {PLATFORM_OWNER.vat},
              nella sua qualità di titolare del trattamento. Per ogni questione relativa ai dati personali è
              possibile scrivere a {PLATFORM_OWNER.privacyEmail} oppure a mezzo PEC a {PLATFORM_OWNER.pec}.
            </p>
          </Section>

          <Section title="2. Ruoli nel trattamento">
            <p>
              Per i dati inseriti dalle aziende clienti nella gestione della propria flotta, {PLATFORM_OWNER.name}{" "}
              opera in qualità di <strong>responsabile del trattamento</strong> ai sensi dell'art. 28 GDPR, sulla
              base di apposito accordo con l'azienda titolare. Per i dati relativi agli account, alla fatturazione
              del servizio e all'assistenza, {PLATFORM_OWNER.name} agisce come <strong>titolare autonomo</strong>.
            </p>
          </Section>

          <Section title="3. Categorie di dati trattati">
            <p>
              Dati identificativi e di contatto degli utenti (nome utente, nominativo, indirizzo email, ruolo,
              società di appartenenza); dati di utilizzo della piattaforma (registro delle operazioni, accessi,
              eliminazioni); dati relativi ai conducenti e ai mezzi conferiti dall'azienda cliente, tra cui
              estremi della patente, assegnazioni, rifornimenti, sinistri e verbali.
            </p>
            <p>
              I dati di geolocalizzazione e telematici, ove conferiti, sono trattati esclusivamente per finalità
              gestionali della flotta e nel rispetto della normativa in materia di controllo a distanza dei
              lavoratori, che resta onere dell'azienda cliente presidiare.
            </p>
          </Section>

          <Section title="4. Finalità e basi giuridiche">
            <p>
              Erogazione del servizio ed esecuzione del contratto (art. 6.1.b); adempimento di obblighi di legge,
              fra cui quelli fiscali e in materia di autotrasporto (art. 6.1.c); legittimo interesse alla sicurezza
              della piattaforma, alla prevenzione degli abusi e al miglioramento del servizio (art. 6.1.f);
              consenso, limitatamente ai cookie non necessari (art. 6.1.a).
            </p>
          </Section>

          <Section title="5. Conservazione">
            <p>
              I dati sono conservati per la durata del rapporto contrattuale e, successivamente, per il tempo
              richiesto dagli obblighi di legge: dieci anni per la documentazione contabile e fiscale, termini
              specifici per la documentazione di flotta. I registri di sicurezza e il registro delle eliminazioni
              sono conservati per ventiquattro mesi. Al termine i dati sono cancellati o resi anonimi.
            </p>
          </Section>

          <Section title="6. Destinatari e trasferimenti">
            <p>
              I dati possono essere comunicati a fornitori di servizi tecnici (hosting, posta elettronica,
              assistenza), nominati responsabili ai sensi dell'art. 28 GDPR, e alle autorità competenti quando
              previsto dalla legge. L'infrastruttura è collocata nell'Unione Europea. Eventuali trasferimenti
              extra-UE avvengono solo verso Paesi con decisione di adeguatezza o mediante clausole contrattuali
              tipo, con le misure supplementari del caso.
            </p>
          </Section>

          <Section title="7. Diritti dell'interessato">
            <p>
              L'interessato può esercitare i diritti di accesso, rettifica, cancellazione, limitazione,
              opposizione e portabilità (artt. 15-22 GDPR), nonché revocare in ogni momento il consenso prestato,
              senza pregiudizio della liceità del trattamento precedente. Le richieste vanno indirizzate a
              {" "}{PLATFORM_OWNER.privacyEmail}. È inoltre riconosciuto il diritto di proporre reclamo al Garante
              per la protezione dei dati personali.
            </p>
          </Section>

          <Section title="8. Sicurezza">
            <p>
              Il servizio adotta misure tecniche e organizzative adeguate: cifratura dei dati in transito e a
              riposo, autenticazione degli utenti, profilazione dei permessi per modulo, tracciamento delle
              operazioni di eliminazione e backup periodici con verifica del ripristino.
            </p>
          </Section>
        </Card>
      )}

      {tab === "cookie" && (
        <>
          <Card className="p-6 mb-4">
            <Section title="Che cosa sono e come li usiamo">
              <p>
                I cookie sono piccoli file salvati sul dispositivo. La piattaforma utilizza cookie tecnici,
                necessari all'autenticazione e alla sicurezza, e — solo con il tuo consenso — cookie di preferenza
                e statistici. Non utilizziamo cookie di profilazione pubblicitaria né condividiamo dati con
                circuiti di advertising.
              </p>
              <p>
                Puoi modificare le tue scelte in qualsiasi momento da questa pagina. La revoca del consenso non
                pregiudica la liceità del trattamento effettuato in precedenza. I cookie tecnici non sono
                disattivabili: senza di essi la sessione di lavoro non può essere mantenuta.
              </p>
            </Section>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-bold mb-3" style={{ color: NAVY_700 }}>Le tue preferenze</p>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 mb-4">
              {COOKIE_CATEGORIES.map(c => (
                <div key={c.key} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{c.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.describe}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.detail}</p>
                  </div>
                  <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                    <input type="checkbox" checked={c.required ? true : !!prefs[c.key]} disabled={c.required}
                      onChange={() => { setPrefs(p => ({ ...p, [c.key]: !p[c.key] })); setSaved(false); }}
                      className="w-4 h-4 rounded" style={{ accentColor: GOLD_500 }} />
                    <span className="text-xs font-semibold" style={{ color: c.required ? "#94a3b8" : NAVY_700 }}>
                      {c.required ? "sempre attivi" : (prefs[c.key] ? "attivi" : "disattivati")}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setConsent({ ...prefs, tecnici: true }); setSaved(true); }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition"
                style={{ backgroundColor: NAVY_700 }}>
                Salva preferenze
              </button>
              <button onClick={() => { const all = { tecnici: true, preferenze: true, statistiche: true, marketing: false }; setPrefs(all); setConsent(all); setSaved(true); }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
                style={{ borderColor: NAVY_700, color: NAVY_700 }}>
                Accetta tutti
              </button>
              <button onClick={() => { const min = { tecnici: true, preferenze: false, statistiche: false, marketing: false }; setPrefs(min); setConsent(min); setSaved(true); }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
                style={{ borderColor: "#cbd5e1", color: "#475569" }}>
                Rifiuta i non necessari
              </button>
              {saved && (
                <span className="text-xs font-semibold flex items-center gap-1 ml-2" style={{ color: "#2E7D5B" }}>
                  <CheckCircle2 size={14} /> Preferenze salvate
                </span>
              )}
            </div>
          </Card>
        </>
      )}

      {tab === "legale" && (
        <Card className="p-6">
          <Section title="Proprietà della piattaforma">
            <p>
              {PLATFORM_OWNER.product} è un prodotto di proprietà esclusiva di {PLATFORM_OWNER.name},
              con sede legale in {ownerAddressLine()}, P.IVA {PLATFORM_OWNER.vat}.
            </p>
          </Section>

          <Section title="Proprietà intellettuale">
            <p>
              Il software, il modello dati, i flussi di lavoro, l'interfaccia, la documentazione, il marchio
              Matherion e il relativo logo sono di titolarità di {PLATFORM_OWNER.name} e sono protetti dalla
              normativa sul diritto d'autore e sui segni distintivi. Ne sono vietate la riproduzione, la
              modifica, la decompilazione e la distribuzione non autorizzate.
            </p>
            <p>
              I dati inseriti dall'azienda cliente restano di titolarità della stessa, che può ottenerne
              l'esportazione in formato leggibile in qualsiasi momento e alla cessazione del rapporto.
            </p>
          </Section>

          <Section title="Licenza d'uso">
            <p>
              L'accesso alla piattaforma è concesso in licenza d'uso non esclusiva e non trasferibile, per la
              durata e nei limiti previsti dal contratto di servizio. Le credenziali sono personali e non
              cedibili; l'azienda cliente è responsabile della corretta assegnazione dei permessi ai propri utenti.
            </p>
          </Section>

          <Section title="Limitazioni di responsabilità">
            <p>
              Gli automatismi di calcolo — fra cui capacità finanziaria, rimborso accise, ammortamenti e costi di
              fermo — sono strumenti di supporto alla gestione. Parametri, aliquote e soglie sono configurabili e
              vanno verificati sulla normativa vigente prima di ogni adempimento verso terzi o verso le autorità.
              I documenti generati dalla piattaforma, inclusi i contratti e i verbali, costituiscono modelli da
              sottoporre a verifica professionale prima della sottoscrizione.
            </p>
          </Section>

          <Section title="Legge applicabile e foro">
            <p>
              Il rapporto è regolato dalla legge italiana. Per le controversie è competente il foro di
              {" "}{PLATFORM_OWNER.city}, salvo diversa previsione inderogabile di legge.
            </p>
          </Section>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CALENDARIO CONDIVISO
// ---------------------------------------------------------------------------
// Raccoglie le attività dei reparti e vi affianca, in sola lettura, gli impegni
// che la piattaforma già conosce: interventi programmati e scadenze. Ricopiarli
// a mano nel calendario significherebbe averli in due posti e disallineati al
// primo aggiornamento.
const CALENDAR_TYPES = {
  appuntamento:  { label: "Appuntamento",   color: "#1B6DB0" },
  attivita:      { label: "Attività",       color: "#12798F" },
  riunione:      { label: "Riunione",       color: "#8B5CF6" },
  ferie:         { label: "Ferie / permesso", color: "#2E7D5B" },
  comunicazione: { label: "Comunicazione",  color: "#B07A12" },
  manutenzione:  { label: "Manutenzione",   color: "#B4302E", auto: true },
  scadenza:      { label: "Scadenza",       color: "#E8A33D", auto: true },
};

const initialCalendarEvents = [
  { id: "cal1", type: "riunione", title: "Riunione mensile flotta", start: "2026-08-24", end: "2026-08-24",
    time: "09:30", department: "fleet_manager", owner: "Mario Rossi",
    participants: ["operativo", "amministrazione"], place: "Sede Livorno — sala riunioni",
    note: "Analisi costi fermo tecnico e piano rinnovi Q4." },
  { id: "cal2", type: "appuntamento", title: "Sopralluogo officina mobile", start: "2026-08-25", end: "2026-08-25",
    time: "14:00", department: "operativo", owner: "Andrea Ferri", participants: [],
    place: "Deposito Livorno", note: "Verifica attrezzature e scorte a bordo." },
  { id: "cal3", type: "ferie", title: "Ferie — M. Bianchi", start: "2026-08-24", end: "2026-08-31",
    time: "", department: "operativo", owner: "M. Bianchi", participants: [],
    place: "", note: "Sostituzione sulle consegne affidata a L. Rossi." },
  { id: "cal4", type: "attivita", title: "Chiusura fatturazione subnoleggi", start: "2026-08-28", end: "2026-08-28",
    time: "", department: "amministrazione", owner: "Giulia Conti", participants: [],
    place: "", note: "Emissione proforma e invio ai locatari." },
  { id: "cal5", type: "comunicazione", title: "Invio circolare nuove procedure dotazioni", start: "2026-08-26",
    end: "2026-08-26", time: "", department: "ufficio_flotta", owner: "Ufficio Flotta",
    participants: ["dotazioni", "operativo"], place: "", note: "Verbali di affidamento obbligatori dal 01/09." },
  { id: "cal6", type: "attivita", title: "Riassortimento ricambi sotto scorta", start: "2026-09-01", end: "2026-09-01",
    time: "", department: "dotazioni", owner: "Ufficio Dotazioni", participants: [],
    place: "", note: "Batteria 12V 95Ah e filtri sotto la soglia minima." },
];

const MONTH_NAMES = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const DAY_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Griglia di sei settimane che parte dal lunedì: copre qualunque mese
function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;      // lunedì = 0
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date: d, key: iso(d), inMonth: d.getMonth() === month, today: iso(d) === TODAY };
  });
}

function CalendarView({ events, setEvents, maintenanceList, deadlineList }) {
  const base = new Date(TODAY);
  const [cursor, setCursor] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const [filters, setFilters] = useState(Object.fromEntries(Object.keys(CALENDAR_TYPES).map(k => [k, true])));
  const [dept, setDept] = useState("tutti");
  const [open, setOpen] = useState(null);
  const [showForm, setShowForm] = useState(null);   // data preselezionata
  const crud = useCrudModals(setEvents, "Calendario", e => `${e.title} (${e.start})`);

  // Impegni derivati: non modificabili qui, si aggiornano dal modulo di origine
  const derived = [
    ...maintenanceList.filter(m => m.scheduled).map(m => ({
      id: `auto-m-${m.id}`, type: "manutenzione", auto: true,
      title: `${m.vehicle} — ${m.type}`, start: m.scheduled, end: m.scheduled, time: "",
      department: "officina", owner: m.workshop, participants: [], place: m.workshop,
      note: `Intervento ${m.status.replace("_", " ")}${m.quoteNumber ? ` · preventivo ${m.quoteNumber}` : ""}`,
    })),
    ...deadlineList.filter(d => d.dueDate).map(d => ({
      id: `auto-d-${d.id}`, type: "scadenza", auto: true,
      title: `${d.vehicle} — ${d.type}`, start: d.dueDate, end: d.dueDate, time: "",
      department: "ufficio_flotta", owner: "Ufficio Flotta", participants: [], place: "",
      note: d.notes || "Scadenza da presidiare.",
    })),
  ];

  const all = [...events, ...derived]
    .filter(e => filters[e.type])
    .filter(e => dept === "tutti" || e.department === dept || (e.participants || []).includes(dept));

  const eventsOn = (key) => all.filter(e => key >= e.start && key <= (e.end || e.start));

  const grid = monthGrid(cursor.y, cursor.m);
  const move = (delta) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const prossimi = all
    .filter(e => (e.end || e.start) >= TODAY)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 8);

  const deptOptions = [...new Set([...departments.map(d => d.key), "officina"])];
  const deptLabel = (k) => departments.find(d => d.key === k)?.label || (k === "officina" ? "Officina" : k);

  const exportRows = all.map(e => ({
    "Dal": e.start, "Al": e.end || e.start, "Ora": e.time || "",
    "Tipo": CALENDAR_TYPES[e.type]?.label, "Titolo": e.title,
    "Reparto": deptLabel(e.department), "Referente": e.owner,
    "Coinvolti": (e.participants || []).map(deptLabel).join(", "),
    "Luogo": e.place || "", "Note": e.note || "", "Origine": e.auto ? "automatica" : "manuale",
  }));

  return (
    <div>
      <SectionTitle
        title="Calendario Condiviso"
        sub="Appuntamenti, attività di reparto, riunioni, ferie e comunicazioni — con gli impegni già noti alla piattaforma"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="calendario_condiviso" sheetName="Calendario" />
            <NewRecordButton label="Nuovo impegno" onClick={() => setShowForm(TODAY)} />
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => move(-1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
              <ChevronDown size={16} className="rotate-90 text-slate-500" />
            </button>
            <span className="text-sm font-bold px-2 min-w-[150px] text-center" style={{ color: NAVY_700 }}>
              {MONTH_NAMES[cursor.m]} {cursor.y}
            </span>
            <button onClick={() => move(1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
              <ChevronDown size={16} className="-rotate-90 text-slate-500" />
            </button>
            <button onClick={() => setCursor({ y: base.getFullYear(), m: base.getMonth() })}
              className="ml-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition hover:bg-slate-50"
              style={{ borderColor: NAVY_700, color: NAVY_700 }}>Oggi</button>
          </div>

          <select value={dept} onChange={e => setDept(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white">
            <option value="tutti">Tutti i reparti</option>
            {deptOptions.map(k => <option key={k} value={k}>{deptLabel(k)}</option>)}
          </select>

          <div className="flex flex-wrap gap-1.5 ml-auto">
            {Object.entries(CALENDAR_TYPES).map(([k, t]) => (
              <button key={k} onClick={() => setFilters(f => ({ ...f, [k]: !f[k] }))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition"
                style={filters[k]
                  ? { color: t.color, backgroundColor: `${t.color}18`, borderColor: `${t.color}44` }
                  : { color: "#cbd5e1", borderColor: "#e2e8f0" }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: filters[k] ? t.color : "#e2e8f0" }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="col-span-3 p-4">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-xs font-semibold text-slate-400 uppercase text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map(cell => {
              const ev = eventsOn(cell.key);
              return (
                <div key={cell.key} onClick={() => setShowForm(cell.key)}
                  className="min-h-[92px] rounded-lg border p-1.5 cursor-pointer transition hover:border-slate-300"
                  style={{
                    borderColor: cell.today ? GOLD_500 : "#e2e8f0",
                    backgroundColor: cell.inMonth ? "#fff" : "#F8FAFC",
                    boxShadow: cell.today ? `inset 0 0 0 1px ${GOLD_500}` : "none",
                  }}>
                  <p className="text-xs font-semibold mb-1"
                    style={{ color: cell.today ? GOLD_DARK : cell.inMonth ? NAVY_700 : "#cbd5e1" }}>
                    {cell.date.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {ev.slice(0, 3).map(e => {
                      const t = CALENDAR_TYPES[e.type];
                      return (
                        <button key={e.id} onClick={(x) => { x.stopPropagation(); setOpen(e); }}
                          className="w-full text-left text-xs rounded px-1 py-0.5 truncate transition hover:opacity-80"
                          style={{ backgroundColor: `${t.color}18`, color: t.color }}
                          title={e.title}>
                          {e.time ? `${e.time} ` : ""}{e.title}
                        </button>
                      );
                    })}
                    {ev.length > 3 && <p className="text-xs text-slate-400 px-1">+{ev.length - 3} altri</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>Prossimi impegni</p>
          <div className="space-y-2.5">
            {prossimi.map(e => {
              const t = CALENDAR_TYPES[e.type];
              return (
                <button key={e.id} onClick={() => setOpen(e)}
                  className="w-full text-left border-l-2 pl-2.5 py-0.5 transition hover:bg-slate-50"
                  style={{ borderColor: t.color }}>
                  <p className="text-xs text-slate-400">
                    {e.start}{e.end && e.end !== e.start ? ` → ${e.end}` : ""}{e.time ? ` · ${e.time}` : ""}
                  </p>
                  <p className="text-sm font-medium text-slate-700 leading-tight">{e.title}</p>
                  <p className="text-xs" style={{ color: t.color }}>
                    {t.label}{e.owner ? ` · ${e.owner}` : ""}
                  </p>
                </button>
              );
            })}
            {prossimi.length === 0 && <p className="text-sm text-slate-400">Nessun impegno in programma.</p>}
          </div>
        </Card>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: NAVY_700 }}>
              <div>
                <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>
                  {CALENDAR_TYPES[open.type]?.label.toUpperCase()}
                </p>
                <h3 className="text-base font-bold text-white">{open.title}</h3>
              </div>
              <button onClick={() => setOpen(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3">
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-400">Quando</dt>
                <dd className="text-slate-700 font-medium">
                  {open.start}{open.end && open.end !== open.start ? ` → ${open.end}` : ""}{open.time ? ` · ${open.time}` : ""}
                </dd>
                <dt className="text-slate-400">Reparto</dt>
                <dd className="text-slate-700">{deptLabel(open.department)}</dd>
                <dt className="text-slate-400">Referente</dt>
                <dd className="text-slate-700">{open.owner || "—"}</dd>
                <dt className="text-slate-400">Reparti coinvolti</dt>
                <dd className="text-slate-700">{(open.participants || []).map(deptLabel).join(", ") || "—"}</dd>
                <dt className="text-slate-400">Luogo</dt>
                <dd className="text-slate-700">{open.place || "—"}</dd>
              </dl>
              {open.note && (
                <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "#F5F6F8" }}>
                  <p className="text-xs text-slate-400 mb-1">Note</p>
                  <p className="text-slate-700">{open.note}</p>
                </div>
              )}
              {open.auto ? (
                <p className="text-xs text-slate-400">
                  Impegno derivato automaticamente dal modulo di origine: si aggiorna da lì, non è modificabile qui.
                </p>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { crud.requestEdit(open); setOpen(null); }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-slate-50"
                    style={{ borderColor: NAVY_700, color: NAVY_700 }}>Modifica</button>
                  <button onClick={() => { crud.requestDelete(open); setOpen(null); }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition hover:bg-red-50"
                    style={{ borderColor: "#B4302E", color: "#B4302E" }}>Elimina</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <SimpleFormModal
          title="Nuovo impegno in calendario" submitLabel="Aggiungi al calendario"
          fields={CALENDAR_FIELDS} initialValues={{ start: showForm, end: showForm }}
          onClose={() => setShowForm(null)}
          onSave={(f) => {
            setEvents(prev => [{ id: `cal${Date.now()}`, ...f,
              end: f.end || f.start, participants: f.participants ? [f.participants] : [] }, ...prev]);
            setShowForm(null);
          }} />
      )}
      {crud.editing && (
        <SimpleFormModal title={`Modifica — ${crud.editing.title}`} fields={CALENDAR_FIELDS}
          submitLabel="Salva modifiche" initialValues={crud.editing} onClose={crud.cancelEdit}
          onSave={(f) => crud.confirmEdit({ ...f, end: f.end || f.start })} />
      )}
      {crud.deleting && (
        <PinConfirmModal itemLabel={`l'impegno «${crud.deleting.title}» del ${crud.deleting.start}`}
          moduleLabel="Calendario" onClose={crud.cancelDelete} onConfirm={crud.confirmDelete} />
      )}
    </div>
  );
}

const CALENDAR_FIELDS = [
  { key: "title", label: "Titolo", required: true, span: 2 },
  { key: "type", label: "Tipo", type: "select", required: true,
    options: Object.entries(CALENDAR_TYPES).filter(([, t]) => !t.auto)
      .map(([value, t]) => ({ value, label: t.label })) },
  { key: "department", label: "Reparto", type: "select", required: true,
    options: departments.map(d => ({ value: d.key, label: d.label })) },
  { key: "start", label: "Dal", type: "date", required: true },
  { key: "end", label: "Al (vuoto = stesso giorno)", type: "date" },
  { key: "time", label: "Ora" },
  { key: "owner", label: "Referente" },
  { key: "participants", label: "Reparto coinvolto", type: "select",
    options: departments.map(d => ({ value: d.key, label: d.label })) },
  { key: "place", label: "Luogo" },
  { key: "note", label: "Note", span: 2 },
];

// ---------------------------------------------------------------------------
// IMPORTAZIONE MASSIVA DOCUMENTI
// ---------------------------------------------------------------------------
// L'abbinamento avviene leggendo il nome del file: si cerca la targa (o il
// telaio, o la targa interna) e una parola chiave che identifichi il tipo di
// documento. Nessun abbinamento incerto viene applicato in automatico: le
// righe non riconosciute restano da completare a mano, perché un documento
// allegato al veicolo sbagliato è peggio di un documento non allegato.
const DOC_KEYWORDS = [
  { type: "Carta di circolazione", words: ["cartacircolazione", "cartadicircolazione", "libretto", "circolazione", "dua"] },
  { type: "Polizza assicurativa", words: ["polizza", "assicurazione", "rca", "assicurativa"] },
  { type: "Certificato di proprietà", words: ["certificatoproprieta", "cdp", "proprieta"] },
  { type: "Contratto di noleggio", words: ["contrattonoleggio", "noleggio"] },
  { type: "Contratto di leasing", words: ["leasing"] },
  { type: "Fattura", words: ["fattura", "ft", "invoice"] },
  { type: "Preventivo officina", words: ["preventivo", "prv"] },
  { type: "Scheda di intervento", words: ["schedaintervento", "intervento", "rapportino"] },
  { type: "Rapporto officina", words: ["rapportoofficina", "officina"] },
  { type: "CID / Constatazione amichevole", words: ["cid", "constatazione"] },
  { type: "Perizia", words: ["perizia", "perito"] },
  { type: "Verbale", words: ["verbale", "multa", "sanzione"] },
  { type: "Fotografia", words: ["foto", "img", "photo"] },
];

const normalizza = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function riconosciDocumento(fileName, vehicleList) {
  const grezzo = String(fileName || "");
  const piatto = normalizza(grezzo);

  // Veicolo: prima per targa esatta, poi per telaio, poi per targa interna
  let veicolo = vehicleList.find(v => v.plate && piatto.includes(normalizza(v.plate)))
    || vehicleList.find(v => v.vin && piatto.includes(normalizza(v.vin)))
    || vehicleList.find(v => v.internalPlate && piatto.includes(normalizza(v.internalPlate)))
    || null;

  // Se nel nome c'è qualcosa che somiglia a una targa ma non è in anagrafica,
  // va segnalato: è un caso diverso dal non aver trovato nulla.
  const forse = grezzo.toUpperCase().match(/[A-Z]{2}\s?\d{3}\s?[A-Z]{2}/);
  const targaIgnota = !veicolo && forse ? forse[0].replace(/\s/g, "") : null;

  const tipo = DOC_KEYWORDS.find(k => k.words.some(w => piatto.includes(w)))?.type || null;

  return { vehicle: veicolo, docType: tipo, targaIgnota };
}

function ImportDocumentiView({ vehicleList }) {
  const { files: allFiles, addFiles } = useAttachments();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [esito, setEsito] = useState(null);

  const analizza = (fileList) => {
    const nuovi = Array.from(fileList || []).map((file, i) => {
      const r = riconosciDocumento(file.name, vehicleList);
      return {
        key: `${Date.now()}-${i}`, file, name: file.name, size: file.size,
        vehicleId: r.vehicle?.id || "", docType: r.docType || "",
        targaIgnota: r.targaIgnota, autoVehicle: !!r.vehicle, autoType: !!r.docType,
      };
    });
    setRows(prev => [...prev, ...nuovi]);
    setEsito(null);
  };

  const pronte = rows.filter(r => r.vehicleId && r.docType);
  const incomplete = rows.filter(r => !r.vehicleId || !r.docType);

  const importa = async () => {
    setBusy(true);
    try {
      for (const r of pronte) {
        await addFiles("veicolo", r.vehicleId, [r.file], r.docType);
      }
      setEsito({
        importati: pronte.map(r => ({
          name: r.name, plate: vehicleList.find(v => v.id === r.vehicleId)?.plate, docType: r.docType,
        })),
        scartati: incomplete.map(r => ({
          name: r.name,
          motivo: !r.vehicleId && !r.docType ? "veicolo e tipo non riconosciuti"
            : !r.vehicleId ? (r.targaIgnota ? `targa ${r.targaIgnota} non presente in anagrafica` : "veicolo non riconosciuto")
            : "tipo di documento non riconosciuto",
        })),
      });
      setRows(incomplete);
    } finally { setBusy(false); }
  };

  // Copertura documentale: quali veicoli hanno i documenti obbligatori
  const copertura = vehicleList.map(v => {
    const suoi = allFiles.filter(f => f.entityType === "veicolo" && f.entityId === v.id);
    const mancanti = REQUIRED_VEHICLE_DOCS.filter(t => !suoi.some(f => f.docType === t));
    return { vehicle: v, presenti: suoi.length, mancanti };
  });
  const scoperti = copertura.filter(c => c.mancanti.length > 0);

  return (
    <div>
      <SectionTitle
        title="Importazione Documenti"
        sub="Caricamento massivo con abbinamento automatico al veicolo e al tipo di documento, letto dal nome del file"
      />

      <Card className="p-5 mb-5">
        <FileDropArea multiple disabled={busy} onFiles={analizza}
          hint="Trascina qui i documenti da importare, oppure clicca per selezionarli" />
        <div className="flex gap-2.5 rounded-lg p-3 text-xs mt-3" style={{ backgroundColor: "#F1F2F4", color: "#64748b" }}>
          <FileText size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5" style={{ color: NAVY_700 }}>Come nominare i file per l'abbinamento automatico</p>
            <p>
              Inserire nel nome la targa e una parola che identifichi il documento, in qualsiasi ordine e
              separatore: <span className="font-mono">FR001AB_carta_circolazione.pdf</span>,
              {" "}<span className="font-mono">polizza-FR010BA.pdf</span>,
              {" "}<span className="font-mono">FR002AB libretto.jpg</span>.
              In alternativa al numero di targa funzionano anche il telaio e la targa interna.
            </p>
          </div>
        </div>
      </Card>

      {rows.length > 0 && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>
              {rows.length} file da importare — {pronte.length} abbinati, {incomplete.length} da completare
            </p>
            <button onClick={() => setRows([])} className="text-xs text-slate-400 hover:text-slate-600">Svuota elenco</button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
            {rows.map((r, i) => (
              <div key={r.key} className="grid grid-cols-12 gap-2 items-center border-b border-slate-100 pb-2">
                <div className="col-span-5 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(r.size)}
                    {r.targaIgnota && <span style={{ color: "#B4302E" }}> · targa {r.targaIgnota} non in anagrafica</span>}
                  </p>
                </div>
                <div className="col-span-3">
                  <select value={r.vehicleId}
                    onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, vehicleId: e.target.value, autoVehicle: false } : x))}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                    style={{ borderColor: r.vehicleId ? "#cbd5e1" : "#B4302E" }}>
                    <option value="">Veicolo…</option>
                    {[...vehicleList].sort((a, b) => a.plate.localeCompare(b.plate)).map(v => (
                      <option key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <select value={r.docType}
                    onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, docType: e.target.value, autoType: false } : x))}
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                    style={{ borderColor: r.docType ? "#cbd5e1" : "#B4302E" }}>
                    <option value="">Tipo documento…</option>
                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-1 flex justify-end">
                  {r.vehicleId && r.docType ? (
                    <span title={r.autoVehicle && r.autoType ? "Abbinato automaticamente" : "Completato a mano"}>
                      <CheckCircle2 size={15} style={{ color: r.autoVehicle && r.autoType ? "#2E7D5B" : "#B07A12" }} />
                    </span>
                  ) : (
                    <AlertTriangle size={15} style={{ color: "#B4302E" }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <button onClick={importa} disabled={busy || pronte.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition"
            style={{ backgroundColor: NAVY_700 }}>
            <ArrowDownToLine size={15} /> {busy ? "Importazione in corso…" : `Importa ${pronte.length} documenti`}
          </button>
          {incomplete.length > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              I {incomplete.length} file non abbinati restano in elenco: completa veicolo e tipo per importarli.
            </p>
          )}
        </Card>
      )}

      {esito && (
        <Card className="p-5 mb-5">
          <p className="text-sm font-semibold mb-3" style={{ color: NAVY_700 }}>Esito dell'importazione</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#2E7D5B" }}>
                Inseriti ({esito.importati.length})
              </p>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {esito.importati.map((r, i) => (
                  <p key={i} className="text-xs text-slate-600">
                    <strong>{r.plate}</strong> · {r.docType} <span className="text-slate-400">— {r.name}</span>
                  </p>
                ))}
                {esito.importati.length === 0 && <p className="text-xs text-slate-400">Nessun file importato.</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#B4302E" }}>
                Non importati ({esito.scartati.length})
              </p>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {esito.scartati.map((r, i) => (
                  <p key={i} className="text-xs text-slate-600">{r.name} <span style={{ color: "#B4302E" }}>— {r.motivo}</span></p>
                ))}
                {esito.scartati.length === 0 && <p className="text-xs text-slate-400">Tutti i file sono stati importati.</p>}
              </div>
            </div>
          </div>
        </Card>
      )}

      <DocumentCoverage copertura={copertura} scoperti={scoperti} />
    </div>
  );
}

// Riepilogo della copertura documentale, usato sia qui sia in dashboard
function DocumentCoverage({ copertura, scoperti, compact, onNavigate }) {
  const totale = copertura.length;
  const completi = totale - scoperti.length;
  const perc = totale ? Math.round((completi / totale) * 100) : 0;

  const perTipo = REQUIRED_VEHICLE_DOCS.map(t => ({
    type: t,
    mancanti: copertura.filter(c => c.mancanti.includes(t)),
  }));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Documenti obbligatori mancanti</p>
          <p className="text-xs text-slate-400">
            {completi} veicoli su {totale} in regola ({perc}%)
          </p>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="text-xs font-semibold flex items-center gap-1"
            style={{ color: GOLD_DARK }}>
            Importa documenti <ChevronRight size={13} />
          </button>
        )}
      </div>

      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${perc}%`, backgroundColor: perc === 100 ? "#2E7D5B" : perc >= 60 ? "#B07A12" : "#B4302E" }} />
      </div>

      {scoperti.length === 0 ? (
        <p className="text-sm flex items-center gap-1.5" style={{ color: "#2E7D5B" }}>
          <CheckCircle2 size={15} /> Tutti i veicoli hanno i documenti obbligatori.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {perTipo.map(t => (
              <div key={t.type} className="rounded-lg p-3"
                style={{ backgroundColor: t.mancanti.length ? "#FBEAEA" : "#E7F5EE" }}>
                <p className="text-xs font-semibold" style={{ color: t.mancanti.length ? "#B4302E" : "#2E7D5B" }}>
                  {t.type}
                </p>
                <p className="text-lg font-bold" style={{ color: t.mancanti.length ? "#B4302E" : "#2E7D5B" }}>
                  {t.mancanti.length} mancanti
                </p>
              </div>
            ))}
          </div>

          <div className={`space-y-1.5 ${compact ? "max-h-40" : "max-h-64"} overflow-y-auto`}>
            {scoperti.map(c => (
              <div key={c.vehicle.id} className="flex items-center gap-2 text-sm border-b border-slate-100 pb-1.5 last:border-0">
                <AlertTriangle size={13} className="flex-shrink-0" style={{ color: "#B4302E" }} />
                <span className="font-semibold text-slate-700">{c.vehicle.plate}</span>
                <span className="text-xs text-slate-400 truncate">{c.vehicle.make} {c.vehicle.model}</span>
                <span className="ml-auto text-xs font-medium text-right" style={{ color: "#B4302E" }}>
                  manca {c.mancanti.join(" e ")}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CONFORMITÀ DOCUMENTALE
// ---------------------------------------------------------------------------
// Dashboard dei documenti obbligatori mancanti, record per record e sezione per
// sezione. Il valore non sta nell'elenco di ciò che c'è, ma nell'evidenza di
// ciò che manca: è l'unico modo per accorgersene prima di un controllo.
function ConformitaDocumentaleView({ requirements, setRequirements, vehicleList, contractList,
                                     claimList, partnerList, onNotify }) {
  const { files, setOpenFor } = useAttachments();
  const [section, setSection] = useState("veicolo");
  const [soloIncompleti, setSoloIncompleti] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [notified, setNotified] = useState(null);

  // Record di ciascuna sezione, normalizzati a { id, label, sub }
  const recordsOf = (entity) => {
    if (entity === "veicolo") return vehicleList.map(v => ({
      id: v.id, label: v.plate, sub: `${v.make || ""} ${v.model || ""}`.trim(), owner: v.costCenter }));
    if (entity === "contratto") return contractList.filter(c => c.status !== "chiuso").map(c => ({
      id: c.id, label: `${c.vehicle} — ${c.supplier}`, sub: `${c.type} · scad. ${c.end || "—"}`, owner: c.supplier }));
    if (entity === "sinistro") return claimList.map(c => ({
      id: c.id, label: `${c.vehicle} — ${c.date}`, sub: `danno € ${fmtNumber(c.damage || 0, 2)}`, owner: c.driver }));
    if (entity === "partner") return partnerList.map(p => ({
      id: p.id, label: p.name, sub: p.type, owner: p.contactName }));
    return [];
  };

  const analisi = (entity) => {
    const req = requirements[entity] || [];
    return recordsOf(entity).map(r => {
      const suoi = files.filter(f => f.entityType === entity && f.entityId === r.id);
      const presenti = req.filter(t => suoi.some(f => f.docType === t));
      const mancanti = req.filter(t => !suoi.some(f => f.docType === t));
      return { ...r, entity, req, presenti, mancanti, altri: suoi.length,
        completezza: req.length ? Math.round((presenti.length / req.length) * 100) : 100 };
    });
  };

  const perSezione = Object.fromEntries(DOC_SECTIONS.map(s => [s.entity, analisi(s.entity)]));
  const righe = perSezione[section].filter(r => !soloIncompleti || r.mancanti.length > 0);

  const totaliMancanti = DOC_SECTIONS.reduce((t, s) =>
    t + perSezione[s.entity].reduce((a, r) => a + r.mancanti.length, 0), 0);
  const recordScoperti = DOC_SECTIONS.reduce((t, s) =>
    t + perSezione[s.entity].filter(r => r.mancanti.length > 0).length, 0);
  const recordTotali = DOC_SECTIONS.reduce((t, s) => t + perSezione[s.entity].length, 0);
  const conformita = recordTotali ? Math.round(((recordTotali - recordScoperti) / recordTotali) * 100) : 100;

  const carica = (r, docType) => setOpenFor({
    type: r.entity, id: r.id, label: r.label, presetDocType: docType,
  });

  // Comunicazione delle mancanze: elenco puntuale, non un generico sollecito
  const comunica = () => {
    const blocchi = DOC_SECTIONS.map(sec => {
      const scoperti = perSezione[sec.entity].filter(r => r.mancanti.length > 0);
      if (!scoperti.length) return null;
      const righeSec = scoperti.map(r =>
        `  • ${r.label}${r.sub ? ` (${r.sub})` : ""}: mancano ${r.mancanti.join(", ")}`).join("\n");
      return `${sec.label.toUpperCase()} — ${scoperti.length} posizioni incomplete\n${righeSec}`;
    }).filter(Boolean).join("\n\n");

    const body = `Buongiorno,
si segnalano le posizioni prive dei documenti obbligatori previsti, con richiesta di integrazione.

${blocchi || "Nessuna posizione risulta incompleta."}

RIEPILOGO
  Documenti mancanti complessivi: ${totaliMancanti}
  Posizioni incomplete: ${recordScoperti} su ${recordTotali}
  Grado di conformità: ${conformita}%

I documenti possono essere caricati direttamente dalla piattaforma, nella scheda del record interessato.

Cordiali saluti
Ufficio Flotta — Matherion Fleet OS`;

    onNotify({
      subject: `Documenti obbligatori mancanti — ${totaliMancanti} da integrare al ${TODAY}`,
      to: "ufficioflotta@demotrasporti.example; amministrazione@demotrasporti.example",
      body,
    });
    setNotified({ n: totaliMancanti, at: new Date().toLocaleTimeString("it-IT").slice(0, 5) });
  };

  const exportRows = DOC_SECTIONS.flatMap(sec =>
    perSezione[sec.entity].map(r => ({
      "Sezione": sec.label, "Record": r.label, "Dettaglio": r.sub,
      "Documenti richiesti": r.req.join(", "),
      "Presenti": r.presenti.join(", "), "Mancanti": r.mancanti.join(", "),
      "Completezza %": r.completezza, "Conforme": r.mancanti.length === 0 ? "SI" : "NO",
    })));

  return (
    <div>
      <SectionTitle
        title="Conformità Documentale"
        sub="Documenti obbligatori per sezione: che cosa manca, record per record"
        action={
          <div className="flex gap-2">
            <ExportButton rows={exportRows} filename="conformita_documentale" sheetName="Conformità" />
            <button onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50"
              style={{ borderColor: NAVY_700, color: NAVY_700 }}>
              <ListChecks size={14} /> Requisiti
            </button>
            <button onClick={comunica} disabled={totaliMancanti === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition"
              style={{ background: ACCENT_GRADIENT }}>
              <Send size={14} /> Comunica mancanze
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <KPI icon={ShieldCheck} label="Grado di conformità" value={`${conformita}%`}
          sub={`${recordTotali - recordScoperti} posizioni complete su ${recordTotali}`}
          accent={conformita === 100 ? "#2E7D5B" : conformita >= 70 ? "#B07A12" : "#B4302E"} />
        <KPI icon={AlertTriangle} label="Documenti mancanti" value={totaliMancanti}
          accent={totaliMancanti ? "#B4302E" : "#2E7D5B"} />
        <KPI icon={FileText} label="Posizioni incomplete" value={recordScoperti} accent="#B07A12" />
        <KPI icon={Paperclip} label="Documenti caricati" value={files.length} accent="#12798F" />
      </div>

      {notified && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#E7F5EE", color: "#2E7D5B" }}>
          <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs">
            Comunicazione inviata alle {notified.at} con l'elenco puntuale dei {notified.n} documenti mancanti —
            la trovi in Posta Elettronica fra i messaggi inviati.
          </p>
        </div>
      )}

      <div className="flex border-b border-slate-200 mb-4">
        {DOC_SECTIONS.map(sec => {
          const scoperti = perSezione[sec.entity].filter(r => r.mancanti.length > 0).length;
          return (
            <button key={sec.entity} onClick={() => setSection(sec.entity)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition flex items-center gap-2"
              style={section === sec.entity
                ? { borderColor: GOLD_500, color: NAVY_700 }
                : { borderColor: "transparent", color: "#94a3b8" }}>
              {sec.label}
              {scoperti > 0 && (
                <span className="text-xs font-bold rounded-full px-1.5 py-0.5 text-white"
                  style={{ backgroundColor: "#B4302E" }}>{scoperti}</span>
              )}
            </button>
          );
        })}
        <label className="ml-auto flex items-center gap-2 text-xs text-slate-500 cursor-pointer self-center">
          <input type="checkbox" checked={soloIncompleti} onChange={() => setSoloIncompleti(v => !v)}
            className="w-3.5 h-3.5 rounded" style={{ accentColor: GOLD_500 }} />
          Mostra solo le posizioni incomplete
        </label>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="border-b border-slate-200 bg-slate-50/60">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Record</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Documenti obbligatori</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Completezza</th>
            </tr>
          </thead>
          <tbody>
            {righe.map(r => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold" style={{ color: NAVY_700 }}>{r.label}</p>
                  <p className="text-xs text-slate-400">{r.sub}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {r.req.length === 0 && <span className="text-xs text-slate-400">nessun requisito impostato</span>}
                    {r.presenti.map(t => (
                      <span key={t} className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"
                        style={{ color: "#2E7D5B", backgroundColor: "#E7F5EE" }}>
                        <CheckCircle2 size={11} /> {t}
                      </span>
                    ))}
                    {r.mancanti.map(t => (
                      <button key={t} onClick={() => carica(r, t)}
                        title={`Carica ${t} per ${r.label}`}
                        className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap transition hover:opacity-80"
                        style={{ color: "#B4302E", backgroundColor: "#FBEAEA" }}>
                        <Upload size={11} /> {t}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right align-top whitespace-nowrap">
                  <span className="text-sm font-bold"
                    style={{ color: r.completezza === 100 ? "#2E7D5B" : r.completezza >= 50 ? "#B07A12" : "#B4302E" }}>
                    {r.completezza}%
                  </span>
                  <p className="text-xs text-slate-400">{r.presenti.length}/{r.req.length} documenti</p>
                </td>
              </tr>
            ))}
            {righe.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-sm" style={{ color: "#2E7D5B" }}>
                <CheckCircle2 size={20} className="inline mr-2" />
                Tutte le posizioni di questa sezione sono complete.
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-slate-400 mt-3">
        I documenti mancanti sono cliccabili: si apre il caricamento con il tipo già selezionato, così il file
        non finisce catalogato come «Altro» restando comunque conteggiato fra le mancanze.
      </p>

      {showConfig && (
        <RequisitiDocumentaliModal requirements={requirements} setRequirements={setRequirements}
          onClose={() => setShowConfig(false)} />
      )}
    </div>
  );
}

function RequisitiDocumentaliModal({ requirements, setRequirements, onClose }) {
  const [draft, setDraft] = useState(requirements);
  const toggle = (entity, t) => setDraft(d => {
    const cur = d[entity] || [];
    return { ...d, [entity]: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] };
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>REQUISITI DOCUMENTALI</p>
            <h3 className="text-lg font-bold text-white">Documenti obbligatori per sezione</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <p className="text-sm text-slate-500">
            Seleziona quali documenti sono obbligatori per ciascuna sezione. La dashboard di conformità si
            aggiorna immediatamente e segnala le posizioni che ne risultano prive.
          </p>
          {DOC_SECTIONS.map(sec => (
            <div key={sec.entity}>
              <p className="text-sm font-bold mb-2" style={{ color: NAVY_700 }}>
                {sec.label}
                <span className="text-xs font-normal text-slate-400 ml-2">
                  {(draft[sec.entity] || []).length} obbligatori
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DOCUMENT_TYPES.filter(t => t !== "Altro").map(t => {
                  const on = (draft[sec.entity] || []).includes(t);
                  return (
                    <button key={t} onClick={() => toggle(sec.entity, t)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full border transition"
                      style={on
                        ? { color: "#fff", backgroundColor: NAVY_700, borderColor: NAVY_700 }
                        : { color: "#94a3b8", borderColor: "#e2e8f0" }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
          <button onClick={() => { setRequirements(draft); onClose(); }}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white"
            style={{ backgroundColor: NAVY_700 }}>Salva requisiti</button>
          <button onClick={() => setDraft(DEFAULT_DOC_REQUIREMENTS)}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 text-slate-600 hover:bg-slate-50">
            Ripristina predefiniti
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RINOTIFICA VERBALI
// ---------------------------------------------------------------------------
// Quando il verbale arriva al proprietario ma alla data dell'infrazione il mezzo
// era in uso ad altri, il verbale va rinotificato al soggetto che ne aveva la
// disponibilità. Ai fini della decurtazione dei punti il Codice della Strada
// impone inoltre di comunicare i dati del conducente entro 60 giorni dalla
// notifica: oltre quel termine scatta una sanzione autonoma a carico
// dell'impresa, ed è la scadenza che sfugge più spesso.
const DRIVER_DATA_DEADLINE_DAYS = 60;

/**
 * Chi aveva la disponibilità del mezzo alla data indicata.
 * L'ordine di ricerca riflette la gerarchia dei titoli: un subnoleggio attivo
 * prevale, perché trasferisce l'uso a un soggetto terzo; in sua assenza il mezzo
 * è in uso alla società che lo detiene.
 */
function responsibleAt(plate, date, { subRentalList = [], vehicleList = [], handovers = [] }) {
  const sub = subRentalList.find(sr =>
    sr.vehicle === plate && sr.start <= date && (!sr.end || sr.end >= date));
  if (sub) {
    return { kind: "esterno", company: sub.using, source: "subnoleggio",
      detail: `Subnoleggio in essere dal ${sub.start}${sub.end ? ` al ${sub.end}` : ""}` };
  }

  const hv = handovers.find(h => h.vehicle === plate && h.status === "accettata"
    && h.start <= date && (!h.end || h.end >= date));
  if (hv) {
    return { kind: "esterno", company: hv.to, source: "presa in carico",
      detail: `Presa in carico accettata il ${hv.respondedAt || hv.sentAt}` };
  }

  const v = vehicleList.find(x => x.plate === plate);
  return { kind: "interno", company: v?.company || null, source: "flotta propria",
    detail: v?.costCenter ? `Centro di costo ${v.costCenter}` : "Assegnazione interna" };
}

/** Stato della rinotifica e del termine per la comunicazione dei dati conducente */
function fineNotificationStatus(fine, ctx) {
  const resp = responsibleAt(fine.vehicle, fine.date, ctx);
  const giaFatta = !!fine.rinotifica?.date;
  const scadenza = fine.notificationDate
    ? addDays(fine.notificationDate, DRIVER_DATA_DEADLINE_DAYS) : null;
  const giorniResidui = scadenza ? daysBetween(TODAY, scadenza) : null;

  return {
    resp,
    daRinotificare: resp.kind === "esterno" && !giaFatta,
    giaFatta,
    scadenza,
    giorniResidui,
    scaduto: giorniResidui !== null && giorniResidui < 0,
    urgente: giorniResidui !== null && giorniResidui >= 0 && giorniResidui <= 15,
    // Anche a mezzo proprio i dati del conducente vanno comunicati: senza
    // nominativo la sanzione per omessa comunicazione resta all'impresa.
    datiConducenteMancanti: !fine.driver && !giaFatta,
  };
}

function RinotificaModal({ fine, ctx, onClose, onConfirm, onSendMail }) {
  const st = fineNotificationStatus(fine, ctx);
  const [to, setTo] = useState(st.resp.company || "");
  const [method, setMethod] = useState("PEC");
  const [ref, setRef] = useState("");
  const [driverName, setDriverName] = useState(fine.driver || "");
  const [recharge, setRecharge] = useState(String(fine.amount || ""));
  const [adminFee, setAdminFee] = useState("15");
  const [note, setNote] = useState("");

  const destinataria = LIVE.companies.find(c => c.id === to);
  const eur = (n) => `€ ${fmtNumber(n || 0, 2)}`;
  const totale = (parseFloat(recharge) || 0) + (parseFloat(adminFee) || 0);

  const lettera = (() => {
    const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<title>Rinotifica verbale ${esc(fine.fineNumber || fine.id)}</title>
<style>
  @page { size: A4; margin: 25mm 20mm; }
  body { font-family: Calibri, "Segoe UI", sans-serif; font-size: 11pt; color: #222; line-height: 1.55; }
  h1 { font-size: 14pt; color: #12596B; margin: 0 0 4pt; }
  .meta { font-size: 10pt; color: #555; margin-bottom: 18pt; }
  .dest { margin: 18pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 10pt; }
  td { border: 1px solid #d5d9df; padding: 5pt 7pt; }
  td:first-child { width: 40%; background: #F4F7F9; font-weight: 600; color: #12596B; }
  .line { border-bottom: 1px solid #666; height: 26pt; margin-top: 26pt; width: 60%; }
  .small { font-size: 9.5pt; color: #555; }
</style></head><body>

<h1>COMUNICAZIONE DI RINOTIFICA VERBALE</h1>
<div class="meta">Trasmessa a mezzo ${esc(method)}${ref ? ` — ${esc(ref)}` : ""} in data ${esc(TODAY)}</div>

<div class="dest">
  <strong>Spett.le</strong><br/>
  ${esc(destinataria?.name || "____________________")}<br/>
  ${esc(destinataria?.legalAddress || "____________________")}<br/>
  ${destinataria?.vat ? `P.IVA ${esc(destinataria.vat)}<br/>` : ""}
  ${destinataria?.pec ? `PEC: ${esc(destinataria.pec)}` : ""}
</div>

<p>
  Con la presente si comunica che è pervenuto a questa società, in qualità di intestataria del veicolo di
  seguito indicato, il verbale di accertamento di violazione al Codice della Strada meglio specificato in
  tabella.
</p>
<p>
  Alla data della violazione il veicolo risultava nella <strong>disponibilità di codesta spettabile società</strong>
  in forza di ${esc(st.resp.source)} (${esc(st.resp.detail)}). Il verbale viene pertanto rinotificato ai sensi
  della normativa vigente per gli adempimenti di competenza.
</p>

<table>
  <tr><td>Numero verbale</td><td>${esc(fine.fineNumber || "—")}</td></tr>
  <tr><td>Ente accertatore</td><td>${esc(fine.authority)}</td></tr>
  <tr><td>Veicolo</td><td>${esc(fine.vehicle)}</td></tr>
  <tr><td>Data della violazione</td><td>${esc(fine.date)}</td></tr>
  <tr><td>Data di notifica all'intestataria</td><td>${esc(fine.notificationDate || "—")}</td></tr>
  <tr><td>Violazione contestata</td><td>${esc(fine.offence || "—")}</td></tr>
  <tr><td>Importo del verbale</td><td>${esc(eur(fine.amount))}${fine.reducedAmount ? ` (ridotto ${esc(eur(fine.reducedAmount))})` : ""}</td></tr>
  <tr><td>Punti patente</td><td>${esc(fine.points || 0)}</td></tr>
  <tr><td>Termine per la comunicazione dei dati del conducente</td><td>${esc(st.scadenza || "—")}</td></tr>
</table>

<p><strong>Adempimenti richiesti</strong></p>
<ol class="small">
  <li>Comunicare all'ente accertatore i dati del conducente al momento della violazione, entro il termine
      sopra indicato. La mancata comunicazione comporta l'applicazione di una autonoma sanzione a carico
      dell'impresa.</li>
  <li>Provvedere al pagamento del verbale nei termini, ovvero comunicare l'intenzione di proporre ricorso.</li>
  <li>Trasmettere a questa società copia della comunicazione effettuata e della quietanza di pagamento.</li>
</ol>

${driverName ? `<p class="small">Per quanto a nostra conoscenza il veicolo risultava affidato a
<strong>${esc(driverName)}</strong>; il dato è fornito a titolo collaborativo e resta onere di codesta società
la comunicazione formale all'ente.</p>` : ""}

<p><strong>Riaddebito</strong></p>
<table>
  <tr><td>Importo del verbale</td><td>${esc(eur(parseFloat(recharge) || 0))}</td></tr>
  <tr><td>Spese amministrative di gestione pratica</td><td>${esc(eur(parseFloat(adminFee) || 0))}</td></tr>
  <tr><td><strong>Totale a carico</strong></td><td><strong>${esc(eur(totale))}</strong></td></tr>
</table>

${note ? `<p class="small"><strong>Note:</strong> ${esc(note)}</p>` : ""}

<p class="small">Si allega copia del verbale come pervenuto.</p>

<div class="line"></div>
<p class="small">Il Responsabile della Flotta</p>

</body></html>`;
  })();

  const stampa = () => {
    const f = document.createElement("iframe");
    f.style.position = "fixed"; f.style.right = "-10000px";
    document.body.appendChild(f);
    const d = f.contentWindow.document; d.open(); d.write(lettera); d.close();
    const go = () => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => document.body.removeChild(f), 800); };
    f.onload = go; if (d.readyState === "complete") go();
  };

  const scarica = () => {
    const blob = new Blob([lettera], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rinotifica_${fine.vehicle}_${fine.fineNumber || fine.id}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const conferma = () => {
    onConfirm(fine, {
      date: TODAY, to, method, ref, driverName,
      rechargeAmount: parseFloat(recharge) || 0,
      adminFee: parseFloat(adminFee) || 0,
      note,
    });
    if (onSendMail && destinataria?.pec) {
      onSendMail({
        to: destinataria.pec,
        subject: `Rinotifica verbale ${fine.fineNumber || ""} — veicolo ${fine.vehicle} del ${fine.date}`,
        body: `Spett.le ${destinataria.name},\n\n`
          + `si rinotifica il verbale ${fine.fineNumber || ""} elevato da ${fine.authority} in data ${fine.date} `
          + `a carico del veicolo ${fine.vehicle}, che alla data della violazione risultava nella Vostra `
          + `disponibilità (${st.resp.source}).\n\n`
          + `Violazione: ${fine.offence || "—"}\n`
          + `Importo: ${eur(fine.amount)}${fine.reducedAmount ? ` — ridotto ${eur(fine.reducedAmount)}` : ""}\n`
          + `Punti patente: ${fine.points || 0}\n`
          + `Termine per la comunicazione dei dati del conducente: ${st.scadenza || "—"}\n\n`
          + `Riaddebito: ${eur(parseFloat(recharge) || 0)} oltre ${eur(parseFloat(adminFee) || 0)} di spese `
          + `amministrative, per un totale di ${eur(totale)}.\n\n`
          + `Si richiede riscontro con copia della comunicazione dei dati del conducente all'ente accertatore.\n\n`
          + `Cordiali saluti\nUfficio Flotta`,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: NAVY_700 }}>
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: GOLD_300 }}>RINOTIFICA VERBALE</p>
            <h3 className="text-lg font-bold text-white">
              {fine.vehicle} · {fine.fineNumber || "senza numero"} · {fine.authority}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "#E3F2F6" }}>
            <p className="text-xs mb-1" style={{ color: GOLD_DARK }}>DISPONIBILITÀ ALLA DATA DELLA VIOLAZIONE</p>
            <p className="font-semibold" style={{ color: NAVY_700 }}>
              {companyName(st.resp.company) || "—"}
              <span className="text-xs font-normal text-slate-500"> · {st.resp.source}</span>
            </p>
            <p className="text-xs text-slate-500">{st.resp.detail}</p>
          </div>

          {st.scadenza && (
            <div className="flex gap-2.5 rounded-lg p-3 text-xs"
              style={st.scaduto
                ? { backgroundColor: "#FBEAEA", color: "#8F2624" }
                : st.urgente ? { backgroundColor: "#FBF1DC", color: "#7A5C0E" } : { backgroundColor: "#F1F2F4", color: "#475569" }}>
              <Clock size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                Termine per la comunicazione dei dati del conducente: <strong>{st.scadenza}</strong>
                {st.scaduto
                  ? ` — scaduto da ${Math.abs(st.giorniResidui)} giorni`
                  : ` — mancano ${st.giorniResidui} giorni`}
                . Oltre il termine è prevista una sanzione autonoma a carico dell'impresa.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Società destinataria *</p>
              <select value={to} onChange={e => setTo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Seleziona...</option>
                {LIVE.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mezzo di trasmissione</p>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {["PEC", "Raccomandata A/R", "Email", "Consegna a mano"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Protocollo / riferimento invio</p>
              <input value={ref} onChange={e => setRef(e.target.value)} placeholder="es. PEC prot. 2026/1188"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Conducente noto (facoltativo)</p>
              <input value={driverName} onChange={e => setDriverName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Importo da riaddebitare (€)</p>
              <input type="number" step="0.01" value={recharge} onChange={e => setRecharge(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Spese amministrative (€)</p>
              <input type="number" step="0.01" value={adminFee} onChange={e => setAdminFee(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">Note</p>
              <input value={note} onChange={e => setNote(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg p-3 text-sm" style={{ backgroundColor: "#F5F6F8" }}>
            <span className="text-slate-500">Totale a carico della destinataria</span>
            <strong style={{ color: NAVY_700 }}>{eur(totale)}</strong>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>
              Anteprima della comunicazione
            </p>
            <iframe title="Comunicazione" srcDoc={lettera}
              className="w-full h-72 border border-slate-200 rounded-lg bg-white" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
          <button onClick={conferma} disabled={!to}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: NAVY_700 }}>
            <Send size={15} /> Registra rinotifica
          </button>
          <button onClick={stampa}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-slate-50"
            style={{ borderColor: NAVY_700, color: NAVY_700 }}>
            <Printer size={15} /> Stampa
          </button>
          <button onClick={scarica}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-slate-50"
            style={{ borderColor: NAVY_700, color: NAVY_700 }}>
            <Download size={15} /> Scarica
          </button>
          <p className="text-xs text-slate-400 ml-auto">
            Alla conferma la comunicazione viene inviata anche via PEC dalla piattaforma.
          </p>
        </div>
      </div>
    </div>
  );
}

// Indicatore di salvataggio: discreto ma sempre visibile
function SaveIndicator() {
  const { lastSaved, failed, backend, reason, copie } = useSaveState();
  if (backend === "memory") {
    return (
      <p className="text-xs flex items-center gap-1" style={{ color: "#FBD5D3" }}>
        <AlertTriangle size={11} /> Dati non salvati su questo browser
      </p>
    );
  }
  if (failed) {
    return (
      <p className="text-xs flex items-start gap-1" style={{ color: "#FBD5D3" }} title={reason || ""}>
        <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
        <span>Salvataggio non riuscito{reason ? ` — ${reason}` : ""}</span>
      </p>
    );
  }
  return (
    <p className="text-xs flex items-center gap-1" style={{ color: "rgba(166,222,235,.5)" }}
      title={copie ? `Copia scritta su ${copie} archivi indipendenti` : ""}>
      <CheckCircle2 size={11} />
      {lastSaved
        ? `Dati salvati alle ${lastSaved}${copie > 1 ? ` · ${copie} copie` : ""}`
        : "Salvataggio automatico attivo"}
    </p>
  );
}

// ---------------------------------------------------------------------------
// ACCESSO ALLA PIATTAFORMA
// ---------------------------------------------------------------------------
// L'autenticazione qui è locale: le credenziali sono conservate nell'archivio
// del browser. È adeguata all'uso su postazione singola, NON a un servizio
// esposto in rete, dove servono un server e password cifrate. Il riquadro in
// fondo alla schermata lo dichiara apertamente, per non indurre a un uso
// improprio.
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const entra = async (event) => {
    event?.preventDefault();
    if (busy || !username || !password) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "same-origin", body: JSON.stringify({ username, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Accesso non riuscito");
      setPassword(""); onLogin(body.user);
    } catch (e) { setError(e.message || "Server non raggiungibile"); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BRAND_GRADIENT, fontFamily: FONT }}>
    <form onSubmit={entra} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-5">
      <div className="flex items-center gap-3"><BrandMark size={46}/><div><h1 className="text-2xl font-bold" style={{color:NAVY_700}}>Matherion</h1><p className="text-slate-500">Fleet OS · Accesso riservato</p></div></div>
      <label className="block text-sm">Nome utente<input required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} className="block w-full border rounded-xl px-4 py-3 mt-2" /></label>
      <label className="block text-sm">Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="block w-full border rounded-xl px-4 py-3 mt-2" /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl py-3 text-white font-semibold disabled:opacity-50" style={{background:NAVY_700}}>{busy ? "Accesso in corso…" : "Accedi"}</button>
      <p className="text-xs text-slate-500">Per attivare o recuperare un’utenza contatta l’amministratore.</p>
    </form>
  </div>;
}

// ---------------------------------------------------------------------------
// INVIO POSTA — apertura del client di posta con messaggio già composto
// ---------------------------------------------------------------------------
// Da una pagina che gira in locale non è possibile spedire direttamente: serve
// un server SMTP. Le due strade praticabili senza installare nulla sono aprire
// il client di posta predefinito con il messaggio già pronto, oppure scaricare
// il messaggio in formato .eml e trascinarlo in Outlook.
function apriClientPosta({ to, subject, body }) {
  const url = `mailto:${encodeURIComponent(to || "")}`
    + `?subject=${encodeURIComponent(subject || "")}`
    + `&body=${encodeURIComponent(body || "")}`;
  window.location.href = url;
}

function scaricaEml({ from, to, subject, body }) {
  const data = new Date().toUTCString();
  const eml = [
    `From: ${from || "ufficioflotta@demotrasporti.example"}`,
    `To: ${to || ""}`,
    `Subject: ${subject || ""}`,
    `Date: ${data}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body || "",
  ].join("\r\n");

  const blob = new Blob([eml], { type: "message/rfc822" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(subject || "messaggio").replace(/[^\w\s-]/g, "").slice(0, 60)}.eml`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------------------------------------------------------------------------
// DATI & BACKUP
// ---------------------------------------------------------------------------
// I dati vivono nell'archivio locale del dispositivo. È comodo ma fragile:
// svuotare la cache del browser, cambiare postazione o un guasto li porta via.
// Il backup su file è la contromisura, e salvarlo nella cartella OneDrive
// sincronizzata è il modo più semplice per averne copia fuori dal dispositivo.
const BACKUP_KEYS = [
  "vehicles", "contracts", "deadlines", "maintenance", "claims", "fines",
  "partners", "companies", "subRentals", "fuelTransactions", "vehicleEvents",
  "tanks", "tankRefills", "vehicleRefuels", "subRentalInvoices", "supplierInvoices",
  "budgets", "parts", "stockMoves", "transferBatches", "calendarEvents", "downtimeEvents",
  "fuelCards", "fuelCardTx", "tollDevices", "tollTx", "equipment", "equipmentRecords",
  "handovers", "chatThreads", "chatMessages", "mailAccounts", "mails",
  "docRequirements", "cookieConsent", "attachments", "tires",
];

const BACKUP_FORMAT = 1;

// ---------------------------------------------------------------------------
// AVVIO OPERATIVO — rimozione dei dati dimostrativi
// ---------------------------------------------------------------------------
// I dati precaricati servono solo alla dimostrazione. Questa funzione li toglie
// in un colpo solo, conservando le utenze (altrimenti nessuno potrebbe più
// accedere) e una sola scheda societaria da intestare al cliente.
const DEMO_KEEP_KEYS = ["users", "companies", "cookieConsent", "docRequirements"];

async function purgeDemoData(currentCompanyId) {
  const svuotate = [];
  for (const k of BACKUP_KEYS) {
    if (DEMO_KEEP_KEYS.includes(k)) continue;
    await dataStore.set(k, []);
    svuotate.push(k);
  }

  // Le utenze restano, ma vengono riportate tutte sulla società superstite.
  const utenti = await dataStore.get("users");
  const aziende = await dataStore.get("companies");
  const elenco = Array.isArray(aziende) ? aziende : [];
  const mia = elenco.find(c => c.id === currentCompanyId) || elenco[0] || null;
  const idMia = mia?.id || "azienda1";

  await dataStore.set("companies", [{
    id: idMia,
    name: "La mia azienda",
    role: "Utilizzatrice / Gestore",
    city: "",
    platformEnabled: true,
    demo: false,
    legalAddress: "",
    vat: "",
    reaNumber: "",
    legalRep: "",
    pec: "",
    isTransportOperator: false,
    alboNumber: null,
    declaredCapacity: 0,
    capacityType: null,
    capacityDate: null,
    capacityExpiry: null,
  }]);

  if (Array.isArray(utenti)) {
    await dataStore.set("users", utenti.map(u => ({ ...u, company: idMia })));
  }

  return { svuotate: svuotate.length, azienda: idMia };
}

async function buildSnapshot() {
  const dati = {};
  for (const k of BACKUP_KEYS) {
    const v = await dataStore.get(k);
    if (v !== null && v !== undefined) dati[k] = v;
  }
  return {
    formato: BACKUP_FORMAT,
    prodotto: "Matherion Fleet OS",
    generatoIl: new Date().toISOString(),
    archivio: dataStore.backend,
    chiavi: Object.keys(dati).length,
    dati,
  };
}

async function restoreSnapshot(snapshot) {
  if (!snapshot || snapshot.prodotto !== "Matherion Fleet OS") {
    throw new Error("Il file non è un backup di Matherion Fleet OS.");
  }
  if (snapshot.formato > BACKUP_FORMAT) {
    throw new Error("Il backup proviene da una versione più recente della piattaforma.");
  }
  const chiavi = Object.keys(snapshot.dati || {});
  const validKeys = chiavi.filter(k => BACKUP_KEYS.includes(k) && k !== "users");
  if (chiavi.some(k => !BACKUP_KEYS.includes(k) && k !== "users")) throw new Error("Il backup contiene archivi non riconosciuti");
  for (const k of validKeys) {
    await dataStore.get(k); // Acquisisce la revisione corrente anche per i moduli non aperti.
    const result = await dataStore.set(k, snapshot.dati[k]);
    if (!result.ok) throw new Error(`Ripristino interrotto su ${k}: ${result.reason}. Gli archivi precedenti possono essere già stati aggiornati.`);
  }
  return validKeys.length;
}

// Misura ogni archivio e ne verifica la scrivibilità: senza questo, davanti a
// un errore di spazio non si saprebbe quale sezione lo provoca.
async function diagnosticaArchivi() {
  const righe = [];
  for (const k of BACKUP_KEYS) {
    const v = await dataStore.get(k);
    let peso = 0, elementi = 0;
    if (v !== null && v !== undefined) {
      try { peso = JSON.stringify(v).length; } catch { peso = -1; }
      elementi = Array.isArray(v) ? v.length : 1;
    }
    righe.push({ chiave: k, peso, elementi, presente: v !== null && v !== undefined });
  }
  // Prova di scrittura su una chiave dedicata, per non toccare i dati reali
  const prova = await dataStore.set("__diagnostica__", { t: Date.now(), riempimento: "x".repeat(2000) });
  await dataStore.remove("__diagnostica__");
  const archivi = dataStore.statoArchivi ? await dataStore.statoArchivi() : [];
  return {
    righe: righe.sort((a, b) => b.peso - a.peso),
    totale: righe.reduce((t, r) => t + Math.max(0, r.peso), 0),
    scrivibile: prova.ok,
    motivo: prova.reason || null,
    via: prova.via || null,
    copie: prova.copie || 0,
    archivi,
  };
}

function DatiBackupView({ currentCompany }) {
  const { lastSaved, failed, backend } = useSaveState();
  const [busy, setBusy] = useState(false);
  const [esito, setEsito] = useState(null);
  const [anteprima, setAnteprima] = useState(null);
  const [diagnosi, setDiagnosi] = useState(null);

  const esporta = async () => {
    setBusy(true);
    try {
      const snap = await buildSnapshot();
      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `matherion-fleet-backup_${localISODate()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setEsito({ tipo: "ok", testo: `Backup esportato: ${snap.chiavi} archivi, ${(blob.size / 1024).toFixed(0)} KB.` });
    } catch (error) { setEsito({tipo:"ko",testo:`Backup non esportato: ${error.message}`}); }
    finally { setBusy(false); }
  };

  const leggiFile = (files) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const snap = JSON.parse(e.target.result);
        const righe = Object.entries(snap.dati || {})
          .map(([k, v]) => ({ chiave: k, elementi: Array.isArray(v) ? v.length : 1 }))
          .sort((a, b) => b.elementi - a.elementi);
        setAnteprima({ snap, righe, nome: file.name });
        setEsito(null);
      } catch {
        setEsito({ tipo: "ko", testo: "File non leggibile: deve essere un backup JSON della piattaforma." });
      }
    };
    reader.readAsText(file);
  };

  const ripristina = async () => {
    setBusy(true);
    try {
      const n = await restoreSnapshot(anteprima.snap);
      setEsito({ tipo: "ok", testo: `Ripristinati ${n} archivi. Ricarica la pagina per vedere i dati.` });
      setAnteprima(null);
    } catch (e) {
      setEsito({ tipo: "ko", testo: e.message });
    }
    setBusy(false);
  };


  return (
    <div>
      <SectionTitle
        title="Dati & Backup"
        sub="Esportazione, ripristino e verifica dei dati del gestionale"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-5">
        <KPI icon={ShieldCheck} label="Archivio in uso"
          value={backend === "remote" ? "Database" : backend === "window" ? "Persistente" : backend === "local" ? "Browser" : "Solo memoria"}
          sub={backend === "remote" ? "dati sul database condiviso, accessibili da ogni postazione"
             : backend === "memory" ? "i dati non sopravvivono alla chiusura" : "i dati restano fra un accesso e l'altro"}
          accent={backend === "memory" ? "#B4302E" : "#2E7D5B"} />
        <KPI icon={Clock} label="Ultimo salvataggio" value={lastSaved || "—"}
          sub={failed ? "ultimo tentativo non riuscito" : "automatico a ogni modifica"}
          accent={failed ? "#B4302E" : "#12798F"} />
        <KPI icon={Download} label="Archivi gestiti" value={BACKUP_KEYS.length} accent="#B07A12" />
      </div>

      {backend === "memory" && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5" style={{ backgroundColor: "#FBEAEA", color: "#8F2624" }}>
          <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Salvataggio locale non disponibile</p>
            <p className="text-xs">
              Questo browser non consente di conservare i dati (navigazione privata o restrizioni del contesto).
              Esporta un backup prima di chiudere: alla riapertura potrai ripristinarlo.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card className="p-5">
          <p className="text-sm font-semibold mb-1" style={{ color: NAVY_700 }}>Esporta backup</p>
          <p className="text-xs text-slate-500 mb-3">
            Un file JSON con i dati applicativi e gli allegati locali. Utenze, credenziali e sessioni sono escluse: per recuperare l’intera installazione serve anche il backup del database.
          </p>
          <button onClick={esporta} disabled={busy}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50"
            style={{ background: ACCENT_GRADIENT }}>
            <Download size={14} /> {busy ? "Esportazione..." : "Esporta tutti i dati"}
          </button>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold mb-1" style={{ color: NAVY_700 }}>Ripristina da backup</p>
          <p className="text-xs text-slate-500 mb-3">
            Il contenuto del file sostituisce gli archivi correnti. Viene mostrata un'anteprima prima di procedere.
          </p>
          <FileDropArea accept=".json" onFiles={leggiFile} disabled={busy}
            hint="Trascina qui il file di backup, o fai clic per sceglierlo" />
        </Card>
      </div>

      {anteprima && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Anteprima — {anteprima.nome}</p>
              <p className="text-xs text-slate-400">
                Generato il {String(anteprima.snap.generatoIl || "").slice(0, 16).replace("T", " ")} ·
                {" "}{anteprima.righe.length} archivi
              </p>
            </div>
            <button onClick={() => setAnteprima(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {anteprima.righe.map(r => (
              <span key={r.chiave} className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{ color: NAVY_700, backgroundColor: "#E3F2F6" }}>
                {r.chiave}: {r.elementi}
              </span>
            ))}
          </div>
          <div className="flex gap-2.5 rounded-lg p-3 text-xs mb-3" style={{ backgroundColor: "#FBF1DC", color: "#7A5C0E" }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            Il ripristino sovrascrive i dati presenti. Se quelli attuali servono ancora, esportali prima.
          </div>
          <button onClick={ripristina} disabled={busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: NAVY_700 }}>
            <ArrowDownToLine size={15} /> Ripristina questi dati
          </button>
        </Card>
      )}

      {esito && (
        <div className="flex gap-2.5 rounded-lg p-4 text-sm mb-5"
          style={esito.tipo === "ok"
            ? { backgroundColor: "#E7F5EE", color: "#2E7D5B" }
            : { backgroundColor: "#FBEAEA", color: "#8F2624" }}>
          {esito.tipo === "ok" ? <CheckCircle2 size={17} className="flex-shrink-0 mt-0.5" />
                               : <AlertTriangle size={17} className="flex-shrink-0 mt-0.5" />}
          <p className="text-xs">{esito.testo}</p>
        </div>
      )}

      <Card className="p-5 mb-5">
        <p className="text-sm font-semibold mb-1" style={{ color: NAVY_700 }}>OneDrive del cliente</p>
        <p className="text-sm text-slate-500">Non configurato. Il collegamento documentale verrà attivato con l’account del cliente. Durante il collaudo usa l’esportazione manuale del backup.</p>
      </Card>

      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Diagnostica dell'archivio</p>
          <button onClick={async () => { setBusy(true); setDiagnosi(await diagnosticaArchivi()); setBusy(false); }}
            disabled={busy}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition hover:bg-slate-50 disabled:opacity-50"
            style={{ borderColor: NAVY_700, color: NAVY_700 }}>
            <Search size={14} /> {busy ? "Analisi..." : "Analizza"}
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Misura lo spazio occupato da ciascuna sezione e verifica se la scrittura è possibile.
          Da usare quando compare un errore di salvataggio.
        </p>

        {diagnosi && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Spazio occupato</p>
                <p className="text-lg font-bold" style={{ color: NAVY_700 }}>
                  {(diagnosi.totale / 1024).toFixed(0)} KB
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Sezioni presenti</p>
                <p className="text-lg font-bold" style={{ color: NAVY_700 }}>
                  {diagnosi.righe.filter(r => r.presente).length} / {diagnosi.righe.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Scrittura</p>
                <p className="text-lg font-bold" style={{ color: diagnosi.scrivibile ? "#2E7D5B" : "#B4302E" }}>
                  {diagnosi.scrivibile ? "riuscita" : "non riuscita"}
                </p>
              </div>
            </div>

            {!diagnosi.scrivibile && (
              <div className="flex gap-2.5 rounded-lg p-3 text-xs mb-3" style={{ backgroundColor: "#FBEAEA", color: "#8F2624" }}>
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Impossibile scrivere: {diagnosi.motivo}</p>
                  <p className="mt-1">
                    Conserva una copia dei dati e verifica la connessione al server prima di ripetere l’operazione. L’archivio non viene svuotato automaticamente.
                  </p>
                </div>
              </div>
            )}

            {diagnosi.archivi?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: GOLD_500 }}>
                  Copie indipendenti dei dati
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {diagnosi.archivi.map(a => {
                    const nomi = { window: "Archivio persistente", idb: "Database del browser", local: "Memoria del browser", memory: "Solo sessione" };
                    const ok = a.scrivibile && a.chiavi > 0;
                    return (
                      <div key={a.backend} className="rounded-lg p-2.5 border"
                        style={{ borderColor: ok ? "#B7E0CE" : "#F0C9C8", backgroundColor: ok ? "#E7F5EE" : "#FBEAEA" }}>
                        <p className="text-xs font-semibold" style={{ color: ok ? "#2E7D5B" : "#8F2624" }}>
                          {nomi[a.backend] || a.backend}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: ok ? "#2E7D5B" : "#8F2624" }}>
                          {a.chiavi} sezioni · {a.scrivibile ? "scrivibile" : "non scrivibile"}
                        </p>
                        {a.ultimo > 0 && (
                          <p className="text-xs text-slate-400">
                            agg. {new Date(a.ultimo).toLocaleTimeString("it-IT").slice(0, 5)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Ogni salvataggio viene scritto su tutti gli archivi disponibili. In lettura viene presa la
                  copia più recente e le altre vengono riallineate: se un archivio viene svuotato, i dati si
                  recuperano dagli altri.
                </p>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {diagnosi.righe.filter(r => r.presente).map(r => (
                <div key={r.chiave} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="text-slate-600">{r.chiave}</span>
                  <span className="text-slate-400">
                    {r.elementi} element{r.elementi === 1 ? "o" : "i"} ·
                    <strong className="text-slate-600 ml-1">{(r.peso / 1024).toFixed(1)} KB</strong>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>


    </div>
  );
}

// ---------------------------------------------------------------------------
// CONFINE DI ERRORE PER MODULO
// ---------------------------------------------------------------------------
// Senza questo confine, un difetto in una sola schermata lascia la piattaforma
// completamente bianca e l'operatore non sa nemmeno dove sia il problema.
// Qui l'errore resta circoscritto al modulo: il menu continua a funzionare, i
// dati restano salvati e il messaggio dice cosa è successo e cosa fare.
class ModuleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { errore: null };
  }
  static getDerivedStateFromError(errore) { return { errore }; }
  componentDidUpdate(prev) {
    if (prev.moduleId !== this.props.moduleId && this.state.errore) this.setState({ errore: null });
  }
  render() {
    if (!this.state.errore) return this.props.children;
    return (
      <div className="rounded-xl p-6 border" style={{ borderColor: "#F0C9C8", backgroundColor: "#FBEAEA" }}>
        <p className="text-base font-bold mb-1" style={{ color: "#8F2624" }}>
          La sezione «{this.props.moduleLabel}» non si è aperta
        </p>
        <p className="text-sm mb-3" style={{ color: "#8F2624" }}>
          Gli altri moduli restano utilizzabili e nessun dato è andato perduto. Scegli un'altra voce dal menu
          per continuare a lavorare; se l'errore si ripete, segnalalo riportando il testo qui sotto.
        </p>
        <pre className="text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap"
          style={{ backgroundColor: "#fff", color: "#8F2624" }}>
          {String(this.state.errore?.message || this.state.errore)}
        </pre>
        <button onClick={() => this.setState({ errore: null })}
          className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: "#B4302E" }}>
          Riprova ad aprire la sezione
        </button>
      </div>
    );
  }
}

// ---------------------------------------------------------------------------
// APP SHELL
// ---------------------------------------------------------------------------
function FleetPlatformInner({ authenticatedUser, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const vp = useViewport();
  const [menuAperto, setMenuAperto] = useState(false);

  const [saveState, setSaveState] = useState({ saving: false, lastSaved: null, failed: false });

  // Segnala l'esito dell'ultimo salvataggio: l'utente deve poter vedere se i
  // dati sono stati conservati, non presumerlo.
  const noteSave = useCallback((ok, reason, key, extra) => {
    setSaveState(prev => ok
      ? { saving: false, lastSaved: new Date().toLocaleTimeString("it-IT").slice(0, 5),
          failed: false, reason: null, copie: extra?.copie ?? prev.copie, via: extra?.via ?? prev.via }
      : { ...prev, saving: false, failed: true, reason: reason || null, failedKey: key || null });
  }, []);

  useEffect(() => {
    const receive = event => noteSave(...event.detail);
    window.addEventListener("fleet-save-result", receive);
    return () => window.removeEventListener("fleet-save-result", receive);
  }, [noteSave]);

  // Avviso alla chiusura se restano scritture non completate: chiudere in quel
  // momento significherebbe perdere l'ultima modifica.
  useEffect(() => {
    const guardia = (e) => {
      if (writeQueue.length > 0 || queueRunning) {
        e.preventDefault();
        e.returnValue = "Ci sono modifiche non ancora salvate.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", guardia);
    return () => window.removeEventListener("beforeunload", guardia);
  }, []);

  const [vehicleList, setVehicleList] = usePersistentState("vehicles", seedVehicles, noteSave);
  const [contractList, setContractList] = usePersistentState("contracts", seedContracts, noteSave);
  const [deadlineList, setDeadlineList] = usePersistentState("deadlines", seedDeadlines, noteSave);
  const [maintenanceList, setMaintenanceList] = usePersistentState("maintenance", seedMaintenance, noteSave);
  const [claimList, setClaimList] = usePersistentState("claims", seedClaims, noteSave);
  const [fineList, setFineList] = usePersistentState("fines", seedFines, noteSave);
  const [partnerList, setPartnerList] = usePersistentState("partners", initialPartners, noteSave);
  const [companyList, setCompanyList] = usePersistentState("companies", seedCompanies, noteSave);
  const [subRentalList, setSubRentalList] = usePersistentState("subRentals", seedSubRentals, noteSave);
  const [fuelList, setFuelList] = usePersistentState("fuelTransactions", seedFuelTransactions, noteSave);
  const [eventList, setEventList] = usePersistentState("vehicleEvents", () => seedVehicleEvents(seedVehicles, seedContracts), noteSave);
  const [partList, setPartList] = usePersistentState("parts", initialParts, noteSave);
  const [stockMoves, setStockMoves] = usePersistentState("stockMoves", initialStockMoves, noteSave);
  const [transferBatches, setTransferBatches] = usePersistentState("transferBatches", initialTransferBatches, noteSave);
  const [fuelCards, setFuelCards] = usePersistentState("fuelCards", initialFuelCards, noteSave);
  const [fuelCardTx, setFuelCardTx] = usePersistentState("fuelCardTx", initialFuelTx, noteSave);
  const [tollDevices, setTollDevices] = usePersistentState("tollDevices", initialTollDevices, noteSave);
  const [tollTx, setTollTx] = usePersistentState("tollTx", initialTollTx, noteSave);
  const [equipment, setEquipment] = usePersistentState("equipment", initialEquipment, noteSave);
  const [equipmentRecords, setEquipmentRecords] = usePersistentState("equipmentRecords", initialEquipmentRecords, noteSave);
  const [users, setUsers] = usePersistentState("users", initialUsers, noteSave);
  const [cookieConsent, setCookieConsent] = usePersistentState("cookieConsent", null, noteSave);   // null = consenso non ancora espresso
  const [calendarEvents, setCalendarEvents] = usePersistentState("calendarEvents", initialCalendarEvents, noteSave);
  const [docRequirements, setDocRequirements] = usePersistentState("docRequirements", DEFAULT_DOC_REQUIREMENTS, noteSave);
  const [currentUserId, setCurrentUserId] = useState(authenticatedUser.id);   // null = nessuna sessione aperta

  const utenteLibero = useMemo(() => {
    if (!ACCESSO_LIBERO) return null;
    const attivi = users.filter(u => u.active !== false);
    return attivi.find(u => u.role === RUOLO_ACCESSO_LIBERO) || attivi[0] || users[0] || null;
  }, [users]);

  // Ad accesso libero non c'è una sessione da aprire: si entra con il profilo
  // predefinito, restando però liberi di cambiare utente da Utenti & Permessi.
  const activeUser = authenticatedUser;


  const esci = () => {
    if (ACCESSO_LIBERO) return;   // non c'è una sessione da chiudere
    onLogout();
    setCurrentUserId(null);
    setActive("dashboard");
    setPopupDismissed(false);
  };
  const canView = (id) => !!activeUser && !!id && (activeUser.role === "super_admin" || ["view", "edit"].includes(activeUser.permissions?.[id]));
  const canEdit = (id) => !!activeUser && !!id && (activeUser.role === "super_admin" || activeUser.permissions?.[id] === "edit");
  const navCatalog = NAV.concat([{ id: "utenti", label: "Utenti & Permessi", icon: Users }]);
  const navItem = (id) => navCatalog.find(n => n.id === id);
  const visibleNav = navCatalog.filter(n => canView(n.id));

  // Un gruppo si apre se contiene il modulo attivo; per il resto è l'utente a
  // decidere, e la scelta resta stabile mentre naviga fra i suoi moduli.
  const groupOf = (id) => NAV_STRUCTURE.find(n => n.children?.includes(id))?.group || null;
  const [openGroups, setOpenGroups] = useState(() => {
    const g = NAV_STRUCTURE.find(n => n.children?.includes("dashboard"))?.group;
    return g ? { [g]: true } : {};
  });
  const toggleGroup = (g) => setOpenGroups(o => ({ ...o, [g]: !o[g] }));

  const badgeOf = (id) => {
    if (id === "prese") return pendingIncoming.length;
    if (id === "email") return mails.filter(m => m.folder === "in" && !m.read).length;
    return 0;
  };

  // Rete Matherion: società con cui si opera, scambi, chat e posta
  const [currentCompany, setCurrentCompany] = useState(authenticatedUser.company);
  const [handovers, setHandovers] = usePersistentState("handovers", initialHandovers, noteSave);
  const [threads, setThreads] = usePersistentState("chatThreads", initialThreads, noteSave);
  const [messages, setMessages] = usePersistentState("chatMessages", initialMessages, noteSave);
  const [mailAccounts, setMailAccounts] = usePersistentState("mailAccounts", initialMailAccounts, noteSave);
  const [mails, setMails] = usePersistentState("mails", initialMails, noteSave);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [showHandoverForm, setShowHandoverForm] = useState(false);

  // Riallinea il registro dei dati vivi prima che i moduli figli vengano
  // renderizzati: menu a tendina, cataloghi di esportazione e generatori di
  // contratto leggono da qui e devono vedere i record effettivi, non i dati
  // di esempio caricati all'avvio.
  LIVE.companies = companyList;
  LIVE.vehicles = vehicleList;
  LIVE.contracts = contractList;
  LIVE.maintenance = maintenanceList;
  LIVE.claims = claimList;
  LIVE.fines = fineList;
  LIVE.deadlines = deadlineList.map(d => ({ ...d, days: Math.ceil((Date.parse(`${d.due}T00:00:00+01:00`) - Date.parse(`${localISODate()}T00:00:00+01:00`)) / 86400000) }));
  LIVE.subRentals = subRentalList;
  LIVE.fuelTransactions = fuelList;
  // Un'impronta degli archivi che incidono sui calcoli economici: cambia solo
  // quando cambiano davvero i dati, così la cache del TCO non si azzera a ogni
  // render ma si aggiorna appena si inserisce o si modifica un record.
  LIVE.rev = useMemo(() => ({}), [vehicleList, contractList, maintenanceList, claimList, fineList, fuelList, subRentalList]);

  const currentUser = { name: activeUser?.fullName || "—", role: ROLE_PRESETS[activeUser?.role]?.label || "—", company: currentCompany };

  const pendingIncoming = handovers.filter(h => h.to === currentCompany && h.status === "inviata");

  // Notifica in chat: la controparte deve vedere il movimento anche senza
  // aprire il modulo scambi
  const notifyInChat = (withCompany, subject, text) => {
    let thread = threads.find(t => t.participants.includes(currentCompany) && t.participants.includes(withCompany));
    let threadId = thread?.id;
    if (!thread) {
      threadId = `th${Date.now()}`;
      setThreads(prev => [...prev, { id: threadId, participants: [currentCompany, withCompany], subject }]);
    }
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    setMessages(prev => [...prev, {
      id: `m${Date.now()}`, thread: threadId, from: currentCompany,
      author: currentUser.name, at: now, text,
    }]);
  };

  // Accettazione: il veicolo entra nella flotta del locatario. Se il mezzo non
  // è ancora censito da questa parte, l'anagrafica viene creata dai dati
  // trasmessi dal locatore — è il vantaggio dello scambio in rete.
  const acceptHandover = (hv, note) => {
    setHandovers(prev => prev.map(h => h.id === hv.id
      ? { ...h, status: "accettata", respondedAt: TODAY, responseNote: note || "Presa in carico confermata." } : h));

    setVehicleList(prev => {
      const exists = prev.find(v => v.plate === hv.vehicle);
      if (exists) {
        return prev.map(v => v.plate === hv.vehicle
          ? { ...v, company: hv.to, ownerCompany: hv.from, availability: "subnoleggio" } : v);
      }
      return [{
        id: `v${Date.now()}`, plate: hv.vehicle, vin: hv.vin || "",
        make: hv.make || "—", model: hv.model || "—",
        company: hv.to, ownerCompany: hv.from, availability: "subnoleggio",
        status: "disponibile", km: 0, driver: "—", costCenter: "—",
        maxLadenMass: hv.maxLadenMass || 0, euroClass: "—", rentalSupplier: companyName(hv.from),
      }, ...prev];
    });

    setSubRentalList(prev => [{
      id: `sr${Date.now()}`, vehicle: hv.vehicle, granting: hv.from, using: hv.to,
      start: hv.start, end: hv.end, fee: hv.fee, vehicleCost: 0, status: "attivo",
      deductibleRCA: hv.deductibleRCA, damagePenalty: hv.damagePenalty,
      theftMode: hv.theftMode, theftValue: hv.theftValue,
    }, ...prev]);

    setEventList(prev => [...prev,
      makeEvent(hv.vehicle, hv.start, "trasferimento",
        `Presa in carico da ${companyName(hv.to)}`,
        `Veicolo ricevuto in disponibilità da ${companyName(hv.from)} · canone ${fmtEuro(hv.fee)}/mese${note ? ` · ${note}` : ""}`),
      makeEvent(hv.vehicle, hv.start, "contratto_aperto",
        `Subnoleggio attivato — ${companyName(hv.from)}`,
        `Dal ${hv.start} al ${hv.end || "—"} · franchigia RCA ${fmtEuro(hv.deductibleRCA)}`),
    ]);

    notifyInChat(hv.from, `Presa in carico ${hv.vehicle}`,
      `Abbiamo accettato la presa in carico di ${hv.vehicle} con decorrenza ${hv.start}.${note ? ` ${note}` : ""}`);
  };

  const rejectHandover = (hv, note) => {
    setHandovers(prev => prev.map(h => h.id === hv.id
      ? { ...h, status: "rifiutata", respondedAt: TODAY, responseNote: note } : h));
    notifyInChat(hv.from, `Presa in carico ${hv.vehicle}`,
      `Non possiamo accettare la presa in carico di ${hv.vehicle}. Motivo: ${note}`);
  };

  const cancelHandover = (hv) => {
    setHandovers(prev => prev.map(h => h.id === hv.id ? { ...h, status: "annullata", respondedAt: TODAY } : h));
  };

  const createHandover = (f) => {
    const v = vehicleList.find(x => x.plate === f.vehicle);
    setHandovers(prev => [{
      id: `hv${Date.now()}`, vehicle: f.vehicle, from: currentCompany, to: f.to,
      start: f.start, end: f.end || null, fee: parseFloat(f.fee) || 0,
      deductibleRCA: parseFloat(f.deductibleRCA) || 0,
      damagePenalty: parseFloat(f.damagePenalty) || 0,
      theftMode: f.theftMode || "percentuale", theftValue: parseFloat(f.theftValue) || 0,
      status: "inviata", sentAt: TODAY, note: f.note || "", contractRef: f.contractRef || null,
      vin: v?.vin, make: v?.make, model: v?.model, maxLadenMass: v?.maxLadenMass,
    }, ...prev]);
    notifyInChat(f.to, `Presa in carico ${f.vehicle}`,
      `Vi abbiamo inviato la richiesta di presa in carico di ${f.vehicle} con decorrenza ${f.start}, canone ${fmtEuro(parseFloat(f.fee) || 0)}/mese.`);
    setShowHandoverForm(false);
  };

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [transferVehicle, setTransferVehicle] = useState(null);
  const { logDeletion } = useAuditLog();

  // Store centrale usato dal modulo di importazione per scrivere sui dati reali
  const store = {
    flotta: { list: vehicleList, setList: setVehicleList },
    contratti: { list: contractList, setList: setContractList },
    scadenze: { list: deadlineList, setList: setDeadlineList },
    manutenzione: { list: maintenanceList, setList: setMaintenanceList },
    sinistri: { list: claimList, setList: setClaimList },
    verbali: { list: fineList, setList: setFineList },
    partner: { list: partnerList, setList: setPartnerList },
    rifornimenti: { list: fuelList, setList: setFuelList },
  };

  const updateVehicle = (id, patch) => setVehicleList(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v));
  const deleteVehicle = (id, label, user) => {
    setVehicleList(prev => prev.filter(v => v.id !== id));
    logDeletion({ module: "Anagrafica Flotta", record: label, user });
    setSelectedVehicle(null);
  };

  // Esecuzione effettiva del trasferimento infragruppo: aggiorna l'anagrafica,
  // gestisce il contratto in essere e registra provenienza e sostituzione
  // nello storico immutabile del mezzo.
  const executeTransfer = ({ vehicle, toCompany, toCostCenter, date, contractAction, activeContract, newContract }) => {
    const fromCompany = vehicle.company;
    const fromCostCenter = vehicle.costCenter;

    setVehicleList(prev => prev.map(v => v.id === vehicle.id
      ? { ...v, company: toCompany, costCenter: toCostCenter } : v));

    const evs = [
      makeEvent(vehicle.plate, date, "trasferimento",
        `Trasferito da ${companyName(fromCompany)} a ${companyName(toCompany)}`,
        `Provenienza: ${companyName(fromCompany)} · centro di costo ${fromCostCenter} → ${toCostCenter}. VIN ${vehicle.vin} e targa invariati.`),
      makeEvent(vehicle.plate, date, "assegnazione",
        `Assegnato a ${companyName(toCompany)}`, `Centro di costo ${toCostCenter}`),
    ];

    if (contractAction === "sostituisci") {
      if (activeContract) {
        setContractList(prev => prev.map(c => c.id === activeContract.id
          ? { ...c, status: "chiuso", end: date } : c));
        evs.push(makeEvent(vehicle.plate, date, "contratto_chiuso",
          `Contratto ${activeContract.type} chiuso — ${activeContract.supplier}`,
          `Chiuso in occasione del trasferimento a ${companyName(toCompany)}. Canone precedente € ${activeContract.fee}/mese.`));
      }
      const created = {
        id: `c${Date.now()}`, vehicle: vehicle.plate, type: newContract.type,
        supplier: newContract.supplier, fee: parseFloat(newContract.fee) || 0,
        start: date, end: newContract.end, status: "attivo",
      };
      setContractList(prev => [created, ...prev]);
      evs.push(makeEvent(vehicle.plate, date, "contratto_aperto",
        `Contratto ${created.type} attivato — ${created.supplier}`,
        `Sostituisce il precedente${activeContract ? ` (${activeContract.supplier})` : ""} in capo a ${companyName(toCompany)}. € ${created.fee}/mese, scadenza ${created.end}.`));
    } else if (activeContract) {
      evs.push(makeEvent(vehicle.plate, date, "contratto_aperto",
        `Contratto ${activeContract.type} mantenuto — ${activeContract.supplier}`,
        `Società utilizzatrice aggiornata a ${companyName(toCompany)}; condizioni invariate (€ ${activeContract.fee}/mese, scadenza ${activeContract.end}).`));
    }

    setEventList(prev => [...prev, ...evs]);
  };

  // Creazione anagrafica veicolo richiamabile da qualunque modulo tramite il
  // menu targhe: rifiuta targhe o telai già presenti per non creare duplicati.
  const createVehicle = (f) => {
    const plate = (f.plate || "").trim().toUpperCase();
    const vin = (f.vin || "").trim().toUpperCase();
    if (!plate || vehicleList.some(v => v.plate.toUpperCase() === plate || (vin && v.vin?.toUpperCase() === vin))) return null;
    const created = {
      id: `v${Date.now()}`, ...f, plate, vin,
      km: parseInt(f.km) || 0, status: f.status || "disponibile",
      driver: f.driver || "—", rentalSupplier: f.rentalSupplier || null,
      maxLadenMass: parseFloat(f.maxLadenMass) || 0,
    };
    setVehicleList(prev => [created, ...prev]);
    setEventList(prev => [...prev, makeEvent(created.plate, TODAY, "immatricolazione",
      "Anagrafica creata", `${created.make} ${created.model} — telaio ${created.vin}`)]);
    return created;
  };

  const currentDrawerVehicle = selectedVehicle ? (vehicleList.find(v => v.id === selectedVehicle.id) || selectedVehicle) : null;

  const view = useMemo(() => {
    // Un cambio di utente può togliere l'accesso al modulo aperto: in quel caso
    // non si mostra una schermata vuota, si comunica il motivo.
    if (!canView(active)) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Lock size={32} className="text-slate-300 mb-3" />
          <p className="text-sm font-semibold" style={{ color: NAVY_700 }}>Modulo non accessibile</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            L'utenza {activeUser?.fullName} non ha i permessi per «{moduleLabel(active)}».
            Rivolgersi a un amministratore per richiedere l'abilitazione.
          </p>
        </div>
      );
    }
    switch (active) {
      case "utenti": return <UtentiView users={users} setUsers={setUsers}
        currentUserId={currentUserId} setCurrentUserId={setCurrentUserId} />;
      case "dashboard": return <DashboardView onNavigate={setActive} companyList={companyList} vehicleList={vehicleList} />;
      case "flotta": return <FlottaView list={vehicleList} setList={setVehicleList} onSelect={setSelectedVehicle} />;
      case "societa": return <SocietaView companyList={companyList} vehicleList={vehicleList} />;
      case "capacita": return <CapacitaFinanziariaView companyList={companyList} setCompanyList={setCompanyList} vehicleList={vehicleList} />;
      case "partner": return <ClientiFornitoriView list={partnerList} setList={setPartnerList} />;
      case "prese": return <PreseInCaricoView handovers={handovers} currentCompany={currentCompany}
        vehicleList={vehicleList} onAccept={acceptHandover} onReject={rejectHandover}
        onCancel={cancelHandover} onNew={() => setShowHandoverForm(true)} />;
      case "chat": return <ChatView threads={threads} setThreads={setThreads} messages={messages}
        setMessages={setMessages} currentCompany={currentCompany} currentUser={currentUser} />;
      case "email": return <EmailView accounts={mailAccounts} setAccounts={setMailAccounts}
        mails={mails} setMails={setMails} currentUser={currentUser} />;
      case "trasferimenti": return <TrasferimentiView vehicleList={vehicleList} onTransfer={setTransferVehicle} />;
      case "trasferimenti_massivi": return <TrasferimentiMassiviView
        equipment={equipment}
        vehicleList={vehicleList} setVehicleList={setVehicleList}
        batches={transferBatches} setBatches={setTransferBatches} setEventList={setEventList}
        onSendMail={(mail) => setMails(prev => [{
          id: `ml${Date.now()}`, account: mailAccounts[0]?.id, folder: "out",
          from: mailAccounts[0]?.address || "ufficioflotta@demotrasporti.example", to: mail.to,
          subject: mail.subject, at: new Date().toISOString().slice(0, 19).replace("T", " "),
          body: mail.body, read: true,
        }, ...prev])} />;
      case "contratti": return <ContrattiView list={contractList} setList={setContractList} />;
      case "subnoleggio": return <SubnoleggioView list={subRentalList} setList={setSubRentalList} vehicleList={vehicleList} />;
      case "rinnovi": return <RinnoviView list={subRentalList} setList={setSubRentalList} vehicleList={vehicleList} />;
      case "fatturazione": return <FatturazioneView partnerList={partnerList} claimList={claimList}
        subRentalList={subRentalList} contractList={contractList} />;
      case "scadenze": return <ScadenzeView list={deadlineList} setList={setDeadlineList} />;
      case "manutenzione": return <ManutenzioneView list={maintenanceList} setList={setMaintenanceList} stockMoves={stockMoves} partList={partList} />;
      case "pneumatici": return <PneumaticiView />;
      case "magazzino": return <MagazzinoView parts={partList} setParts={setPartList}
        moves={stockMoves} setMoves={setStockMoves} vehicleList={vehicleList} maintenanceList={maintenanceList}
        equipment={equipment} />;
      case "cisterne": return <CisterneView />;
      case "carburante": return <CarburanteView cards={fuelCards} setCards={setFuelCards}
        tx={fuelCardTx} setTx={setFuelCardTx} vehicleList={vehicleList} />;
      case "pedaggi": return <PedaggiView devices={tollDevices} setDevices={setTollDevices}
        tx={tollTx} setTx={setTollTx} vehicleList={vehicleList} />;
      case "dotazioni": return <DotazioniView equipment={equipment} setEquipment={setEquipment}
        records={equipmentRecords} setRecords={setEquipmentRecords} vehicleList={vehicleList} />;
      case "rifornimenti": return <RifornimentiView list={fuelList} setList={setFuelList} vehicleList={vehicleList} />;
      case "sinistri": return <SinistriView list={claimList} setList={setClaimList} />;
      case "verbali": return <VerbaliView list={fineList} setList={setFineList}
        subRentalList={subRentalList} vehicleList={vehicleList} handovers={handovers}
        onSendMail={(mail) => setMails(prev => [{
          id: `ml${Date.now()}`, account: mailAccounts[0]?.id, folder: "out",
          from: mailAccounts[0]?.address || "ufficioflotta@demotrasporti.example", to: mail.to,
          subject: mail.subject, at: new Date().toISOString().slice(0, 19).replace("T", " "),
          body: mail.body, read: true,
        }, ...prev])} />;
      case "costi": return <CostiView />;
      case "analisi": return <AnalisiEconomicaView vehicleList={vehicleList} contractList={contractList} subRentalList={subRentalList} />;
      case "budget": return <BudgetView />;
      case "accise": return <AcciseView vehicleList={vehicleList} />;
      case "importazione": return <ImportazioneView store={store} />;
      case "importdocs": return <ImportDocumentiView vehicleList={vehicleList} />;
      case "esportazioni": return <EsportazioniView />;
      case "backup": return <DatiBackupView currentCompany={currentCompany} />;
      case "compliance": return <ComplianceView consent={cookieConsent} setConsent={setCookieConsent} />;
      case "conformita_doc": return <ConformitaDocumentaleView
        requirements={docRequirements} setRequirements={setDocRequirements}
        vehicleList={vehicleList} contractList={contractList} claimList={claimList} partnerList={partnerList}
        onNotify={(mail) => setMails(prev => [{
          id: `ml${Date.now()}`, account: mailAccounts[0]?.id, folder: "out",
          from: mailAccounts[0]?.address || "ufficioflotta@demotrasporti.example", to: mail.to,
          subject: mail.subject, at: new Date().toISOString().slice(0, 19).replace("T", " "),
          body: mail.body, read: true,
        }, ...prev])} />;
      case "calendario": return <CalendarView events={calendarEvents} setEvents={setCalendarEvents}
        maintenanceList={maintenanceList} deadlineList={deadlineList} />;
      case "audit": return <RegistroEliminazioniView />;
      default: return null;
    }
  }, [active, users, currentUserId, vehicleList, contractList, deadlineList, maintenanceList, claimList, fineList, partnerList, companyList, subRentalList, fuelList, eventList, currentCompany, handovers, threads, messages, mailAccounts, mails, partList, stockMoves, transferBatches, fuelCards, fuelCardTx, tollDevices, tollTx, equipment, equipmentRecords, cookieConsent, calendarEvents, docRequirements]);

  // Nessuna sessione aperta: si mostra l'accesso, non l'applicazione.
  // Ad accesso libero activeUser è sempre valorizzato e questo ramo non scatta.
  if (!activeUser) {
    return (
      <LoginScreen users={users} saveBackend={dataStore.backend}
        onLogin={(u) => { setCurrentUserId(u.id); setCurrentCompany(u.company); }}
 />
    );
  }

  return (
    <SaveStateContext.Provider value={{ ...saveState, backend: dataStore.backend }}>
    <PermissionsContext.Provider value={{ user: activeUser, currentModule: active, canView, canEdit }}>
    <AttachmentsProvider>
    <VehicleRegistryContext.Provider value={{ vehicleList, createVehicle }}>
    <div className="flex h-screen w-full" style={{ fontFamily: FONT, backgroundColor: SURFACE }}>
      {/* SIDEBAR */}
      {/* Velo che chiude il menu toccando fuori */}
      {vp.mobile && menuAperto && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMenuAperto(false)} />
      )}

      <aside
        className={vp.mobile
          ? `fixed inset-y-0 left-0 w-72 z-50 flex flex-col transition-transform duration-200 ${menuAperto ? "translate-x-0" : "-translate-x-full"}`
          : "w-64 flex-shrink-0 flex flex-col"}
        style={{ background: BRAND_GRADIENT }}>
        <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,.09)" }}>
          <div className="flex items-center gap-2.5 mb-1.5">
            <BrandMark size={38} />
            <div>
              <p className="text-white font-bold text-lg leading-none tracking-tight">Matherion</p>
              <p className="text-xs leading-tight mt-1" style={{ color: GOLD_300 }}>Fleet OS</p>
            </div>
          </div>
          <p className="text-xs italic mb-4 leading-snug" style={{ color: "rgba(166,222,235,.5)" }}>
            Muoviamo idee, guidiamo soluzioni
          </p>
          <div className="rounded-lg px-2.5 py-2 mb-3 flex items-center gap-2"
            style={{ backgroundColor: "rgba(255,255,255,.10)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: ACCENT_GRADIENT, color: "#fff" }}>
              {(activeUser.fullName || "?").split(" ").map(x => x[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{activeUser.fullName}</p>
              <p className="text-xs truncate" style={{ color: "rgba(166,222,235,.7)" }}>
                {ROLE_PRESETS[activeUser.role]?.label}
              </p>
            </div>
            {!ACCESSO_LIBERO && (
              <button onClick={esci} title="Esci dalla sessione"
                className="p-1.5 rounded-md flex-shrink-0 transition hover:bg-white/10"
                style={{ color: "rgba(166,222,235,.8)" }}>
                <Lock size={14} />
              </button>
            )}
          </div>
          <p className="text-xs mb-1" style={{ color: "rgba(166,222,235,.6)" }}>Operi come</p>
          <select value={currentCompany} onChange={e => { setCurrentCompany(e.target.value); setPopupDismissed(false); }}
            className="w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold border-0 cursor-pointer"
            style={{ backgroundColor: "rgba(255,255,255,.10)", color: "#fff" }}>
            {LIVE.companies.filter(c => c.platformEnabled && c.id === activeUser.company).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_STRUCTURE.map(node => {
            // --- voce singola ---
            if (node.item) {
              const item = navItem(node.item);
              if (!item || !canView(item.id)) return null;
              const Icon = item.icon;
              const isActive = active === item.id;
              const badge = badgeOf(item.id);
              return (
                <button key={item.id} onClick={() => { setActive(item.id); setMenuAperto(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left hover:bg-white/5"
                  style={isActive
                    ? { background: "rgba(255,255,255,.13)", color: "#fff", boxShadow: `inset 3px 0 0 ${GOLD_500}` }
                    : { color: "rgba(226,240,244,.68)" }}>
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {badge > 0 && (
                    <span className="ml-auto text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: item.id === "prese" ? "#B4302E" : GOLD_500 }}>{badge}</span>
                  )}
                </button>
              );
            }

            // --- gruppo ---
            const children = node.children.map(navItem).filter(c => c && canView(c.id));
            if (children.length === 0) return null;          // gruppo senza moduli concessi
            const GroupIcon = node.icon;
            const contieneAttivo = children.some(c => c.id === active);
            const aperto = openGroups[node.group] || contieneAttivo;
            const badgeGruppo = children.reduce((t, c) => t + badgeOf(c.id), 0);

            return (
              <div key={node.group}>
                <button onClick={() => toggleGroup(node.group)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left hover:bg-white/5"
                  style={contieneAttivo && !aperto
                    ? { background: "rgba(255,255,255,.08)", color: "#fff" }
                    : { color: "rgba(226,240,244,.68)" }}>
                  <GroupIcon size={16} className="flex-shrink-0" />
                  <span className="truncate">{node.label}</span>
                  {badgeGruppo > 0 && !aperto && (
                    <span className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: "#B4302E" }}>{badgeGruppo}</span>
                  )}
                  <ChevronDown size={14}
                    className={`ml-auto flex-shrink-0 transition-transform ${aperto ? "" : "-rotate-90"}`}
                    style={{ opacity: .55 }} />
                </button>

                {aperto && (
                  <div className="ml-4 pl-3 mt-0.5 mb-1 space-y-0.5"
                    style={{ borderLeft: "1px solid rgba(255,255,255,.12)" }}>
                    {children.map(c => {
                      const isActive = active === c.id;
                      const badge = badgeOf(c.id);
                      return (
                        <button key={c.id} onClick={() => { setActive(c.id); setMenuAperto(false); }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition text-left hover:bg-white/5"
                          style={isActive
                            ? { background: "rgba(255,255,255,.13)", color: "#fff", boxShadow: `inset 2px 0 0 ${GOLD_500}` }
                            : { color: "rgba(226,240,244,.6)" }}>
                          <span className="truncate">{c.label}</span>
                          {badge > 0 && (
                            <span className="ml-auto text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: c.id === "prese" ? "#B4302E" : GOLD_500, fontSize: "9px" }}>{badge}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {/* Piè di pagina: solo il marchio. I riferimenti societari del titolare
            sono raccolti nella sezione Privacy & Cookie. */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,.09)" }}>
          <div className="flex items-center gap-2">
            <BrandMark size={18} />
            <span className="text-xs font-semibold" style={{ color: "rgba(226,240,244,.85)" }}>Matherion</span>
          </div>
          <SaveIndicator />
          <div className="flex items-center gap-2 mt-1.5">
            <button onClick={() => setActive("compliance")}
              className="text-xs hover:underline transition"
              style={{ color: "rgba(166,222,235,.5)" }}>
              Privacy · Cookie
            </button>
            {!ACCESSO_LIBERO && (
              <>
                <span style={{ color: "rgba(166,222,235,.3)" }}>·</span>
                <button onClick={esci}
                  className="text-xs font-semibold hover:underline transition flex items-center gap-1"
                  style={{ color: "rgba(166,222,235,.75)" }}>
                  <Lock size={11} /> Esci
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* CONTENUTO */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Barra superiore: solo su telefono, per aprire il menu e sapere dove si è */}
        {vp.mobile && (
          <header className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: BRAND_GRADIENT }}>
            <button onClick={() => setMenuAperto(true)} aria-label="Apri il menu"
              className="p-1.5 -ml-1.5 rounded-lg transition active:bg-white/10">
              <ListChecks size={22} style={{ color: "#fff" }} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-none" style={{ color: "rgba(166,222,235,.7)" }}>Matherion Fleet OS</p>
              <p className="text-sm font-bold text-white truncate leading-tight mt-0.5">
                {navItem(active)?.label || "Dashboard"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: ACCENT_GRADIENT, color: "#fff" }} title={activeUser.fullName}>
              {(activeUser.fullName || "?").split(" ").map(x => x[0]).slice(0, 2).join("")}
            </div>
          </header>
        )}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-5 md:px-8 md:py-9">
          <ModuleErrorBoundary moduleId={active} moduleLabel={navItem(active)?.label || active}>
            {view}
          </ModuleErrorBoundary>
        </div>
      </main>

        {/* Navigazione inferiore: le destinazioni più frequenti a portata di pollice */}
        {vp.mobile && (
          <nav className="flex items-stretch flex-shrink-0 border-t"
            style={{ backgroundColor: "#fff", borderColor: "#e2e8f0", paddingBottom: "env(safe-area-inset-bottom)" }}>
            {MOBILE_TABS.filter(t => t.id === "__menu__" || canView(t.id)).map(t => {
              const Icon = t.icon;
              const attivo = t.id === "__menu__" ? menuAperto : active === t.id;
              const badge = t.id === "__menu__"
                ? pendingIncoming.length + mails.filter(m => m.folder === "in" && !m.read).length
                : 0;
              return (
                <button key={t.id}
                  onClick={() => t.id === "__menu__" ? setMenuAperto(true) : setActive(t.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition relative"
                  style={{ color: attivo ? NAVY_700 : "#94a3b8" }}>
                  <Icon size={20} />
                  <span className="text-xs font-medium">{t.label}</span>
                  {attivo && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ background: ACCENT_GRADIENT }} />
                  )}
                  {badge > 0 && (
                    <span className="absolute top-1 right-1/4 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-white"
                      style={{ backgroundColor: "#B4302E", fontSize: "9px" }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      {currentDrawerVehicle && (
        <VehicleDrawer
          vehicle={currentDrawerVehicle}
          onClose={() => setSelectedVehicle(null)}
          onTransfer={(v) => { setTransferVehicle(v); }}
          events={eventList.filter(e => e.plate === currentDrawerVehicle.plate)
            .sort((a, b) => a.date.localeCompare(b.date))}
          onSave={(patch) => updateVehicle(currentDrawerVehicle.id, patch)}
          onDelete={(user) => deleteVehicle(currentDrawerVehicle.id, currentDrawerVehicle.plate, user)}
        />
      )}
      {transferVehicle && (
        <TransferModal
          vehicle={transferVehicle}
          contractList={contractList}
          equipment={equipment}
          onExecute={executeTransfer}
          onClose={() => { setTransferVehicle(null); setSelectedVehicle(null); }} />
      )}
      </div>
    </div>
      <AttachmentsModal />

      {!cookieConsent && (
        <CookieBanner onSave={(p) => setCookieConsent(p)} onClose={() => setCookieConsent({ tecnici: true })} />
      )}

      {cookieConsent && pendingIncoming.length > 0 && !popupDismissed && active !== "prese" && (
        <PendingHandoversPopup
          items={pendingIncoming}
          onOpen={() => { setActive("prese"); setPopupDismissed(true); }}
          onClose={() => setPopupDismissed(true)} />
      )}

      {showHandoverForm && (
        <SimpleFormModal
          title="Nuova richiesta di presa in carico" submitLabel="Invia richiesta"
          fields={[
            { key: "vehicle", label: "Veicolo", required: true, type: "vehicle" },
            { key: "to", label: "Azienda destinataria", type: "select", required: true,
              options: LIVE.companies.filter(c => c.id !== currentCompany && c.platformEnabled)
                .map(c => ({ value: c.id, label: c.name })) },
            { key: "start", label: "Decorrenza", type: "date", required: true },
            { key: "end", label: "Scadenza", type: "date" },
            { key: "fee", label: "Canone mensile (€)", type: "number", required: true },
            { key: "deductibleRCA", label: "Franchigia RCA (€)", type: "number" },
            { key: "damagePenalty", label: "Penale danni (€)", type: "number" },
            { key: "theftMode", label: "Furto — modalità", type: "select",
              options: [{ value: "percentuale", label: "% sul valore" }, { value: "importo", label: "Importo fisso" }] },
            { key: "theftValue", label: "Furto — valore", type: "number" },
            { key: "contractRef", label: "Riferimento contratto" },
            { key: "note", label: "Nota per il destinatario", span: 2 },
          ]}
          onClose={() => setShowHandoverForm(false)}
          onSave={createHandover}
        />
      )}
    </VehicleRegistryContext.Provider>
    </AttachmentsProvider>
    </PermissionsContext.Provider>
    </SaveStateContext.Provider>
  );
}

async function fleetApi(path, options = {}) {
  const response = await fetch(path, { credentials: "same-origin", ...options,
    headers: { "Content-Type": "application/json", ...options.headers } });
  if (response.status === 401) window.dispatchEvent(new Event("fleet-session-expired"));
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Richiesta fallita (${response.status})`);
  return body;
}
const makeServerStore = actorId => {
const storeVersions = new Map();
return {
  get: key => fleetApi(`/api/store/${encodeURIComponent(key)}`, {headers:{"X-Fleet-User":actorId}}).then(r => { storeVersions.set(key, r.version || 0); return r.data; }),
  set: (key, data) => fleetApi(`/api/store/${encodeURIComponent(key)}`, { method: "PUT", headers:{"X-Fleet-Version":String(storeVersions.get(key) || 0),"X-Fleet-User":actorId}, body: JSON.stringify({data}) }).then(r => { storeVersions.set(key,r.version || 0); return r; }),
  remove: key => fleetApi(`/api/store/${encodeURIComponent(key)}`, { method: "DELETE", headers:{"X-Fleet-Version":String(storeVersions.get(key) || 0),"X-Fleet-User":actorId} }).then(r => {storeVersions.set(key,r.version || 0);return r;}),
};
};
export default function FleetPlatform() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mountKey, setMountKey] = useState(0);
  useEffect(() => {
    let alive = true;
    fleetApi("/api/auth/session").then(r => { if (alive) setUser(r.user); }).catch(() => {}).finally(() => { if (alive) setChecking(false); });
    const expired = () => { setUser(null); setMountKey(k => k + 1); };
    window.addEventListener("fleet-session-expired", expired);
    return () => { alive = false; window.removeEventListener("fleet-session-expired", expired); };
  }, []);
  const logout = async () => {
    try { await fleetApi("/api/auth/logout", {method:"POST"}); }
    finally { Object.keys(LIVE).forEach(k => { if(Array.isArray(LIVE[k])) LIVE[k] = []; }); setUser(null); setMountKey(k => k + 1); }
  };
  const authenticatedStore = useMemo(() => user ? makeServerStore(user.id) : null, [user?.id, mountKey]);
  if (checking) return <p role="status" className="p-8">Verifica della sessione…</p>;
  if (!user) return <LoginScreen onLogin={u => { setMountKey(k => k + 1); setUser(u); }} />;
  window.__MATHERION_STORE__ = authenticatedStore;
  return <AuditLogProvider key={mountKey}><FleetPlatformInner authenticatedUser={user} onLogout={logout} /></AuditLogProvider>;
}