// Broad sector for every stock in STOCK_LIST, for allocation charts. Groups
// are deliberately coarse (roughly NSE's macro-sectors), so a conglomerate is
// filed under the business it's best known for.

export const SECTORS = [
  "Banks",
  "Financial Services",
  "IT",
  "Pharma & Healthcare",
  "Auto",
  "FMCG",
  "Consumer & Retail",
  "Consumer Durables",
  "Oil & Gas",
  "Power",
  "Metals & Mining",
  "Cement & Materials",
  "Chemicals",
  "Capital Goods",
  "Infra & Realty",
  "Transport & Logistics",
  "Telecom & Media",
] as const;

export type Sector = (typeof SECTORS)[number];

const BY_SECTOR: Record<Sector, string[]> = {
  Banks: [
    "AUBANK", "AXISBANK", "BANDHANBNK", "BANKBARODA", "BANKINDIA", "CANBK", "CUB", "DCBBANK", "FEDERALBNK", "HDFCBANK",
    "ICICIBANK", "IDFCFIRSTB", "INDIANB", "INDUSINDBK", "IOB", "KARURVYSYA", "KOTAKBANK", "MAHABANK", "PNB", "RBLBANK",
    "SBIN", "SOUTHBANK", "UCOBANK", "UNIONBANK", "YESBANK",
  ],
  "Financial Services": [
    "ANGELONE", "BAJAJFINSV", "BAJAJHLDNG", "BAJFINANCE", "BSE", "CAMS", "CDSL", "CHOLAFIN", "HDFCAMC", "HDFCLIFE",
    "ICICIGI", "ICICIPRULI", "IEX", "IIFL", "IRFC", "LICHSGFIN", "LTF", "M&MFIN", "MANAPPURAM", "MCX", "MUTHOOTFIN",
    "PAYTM", "PFC", "PNBHOUSING", "POLICYBZR", "RECLTD", "SBICARD", "SBILIFE", "SHRIRAMFIN",
  ],
  IT: [
    "COFORGE", "CYIENT", "HCLTECH", "INFY", "KPITTECH", "LTTS", "MPHASIS", "NEWGEN", "OFSS", "PERSISTENT", "TATAELXSI",
    "TCS", "TECHM", "WIPRO", "ZENSARTECH",
  ],
  "Pharma & Healthcare": [
    "ABBOTINDIA", "ALKEM", "APOLLOHOSP", "AUROPHARMA", "BIOCON", "CIPLA", "DIVISLAB", "DRREDDY", "FORTIS", "GLAND",
    "GLENMARK", "GRANULES", "IPCALAB", "JBCHEPHARM", "LALPATHLAB", "LAURUSLABS", "LUPIN", "MAXHEALTH", "METROPOLIS",
    "NATCOPHARM", "SUNPHARMA", "SYNGENE", "TORNTPHARM", "ZYDUSLIFE",
  ],
  Auto: [
    "APOLLOTYRE", "ASHOKLEY", "BALKRISIND", "BHARATFORG", "BOSCHLTD", "CEATLTD", "EICHERMOT", "ESCORTS", "EXIDEIND",
    "HEROMOTOCO", "M&M", "MARUTI", "MOTHERSON", "MRF", "TVSMOTOR",
  ],
  FMCG: [
    "BALRAMCHIN", "BRITANNIA", "COLPAL", "DABUR", "EIDPARRY", "EMAMILTD", "GILLETTE", "GODREJCP", "HINDUNILVR", "ITC",
    "MARICO", "NESTLEIND", "PGHH", "TATACONSUM", "UBL", "VBL",
  ],
  "Consumer & Retail": [
    "ABFRL", "BATAINDIA", "DMART", "IRCTC", "NYKAA", "PAGEIND", "RAYMOND", "RELAXO", "SHOPERSTOP", "TITAN", "TRENT",
    "TRIDENT", "VMART",
  ],
  "Consumer Durables": ["AMBER", "BLUESTARCO", "CROMPTON", "DIXON", "HAVELLS", "VOLTAS", "WHIRLPOOL"],
  "Oil & Gas": ["ATGL", "BPCL", "GAIL", "HINDPETRO", "IGL", "IOC", "MGL", "OIL", "ONGC", "PETRONET", "RELIANCE"],
  Power: [
    "ADANIGREEN", "ADANIPOWER", "CESC", "JSWENERGY", "NHPC", "NTPC", "POWERGRID", "SJVN", "SUZLON", "TATAPOWER", "TORNTPOWER",
  ],
  "Metals & Mining": [
    "APLAPOLLO", "COALINDIA", "HINDALCO", "HINDCOPPER", "JINDALSTEL", "JSWSTEEL", "MOIL", "NATIONALUM", "NMDC",
    "RATNAMANI", "SAIL", "TATASTEEL", "VEDL", "WELCORP",
  ],
  "Cement & Materials": [
    "ACC", "AMBUJACEM", "ASIANPAINT", "ASTRAL", "BERGEPAINT", "CENTURYPLY", "DALBHARAT", "GRASIM", "JKCEMENT",
    "KANSAINER", "PIDILITIND", "RAMCOCEM", "SHREECEM", "SUPREMEIND", "ULTRACEMCO",
  ],
  Chemicals: [
    "AARTIIND", "CHAMBLFERT", "CLEAN", "COROMANDEL", "DEEPAKNTR", "FLUOROCHEM", "GNFC", "GODREJIND", "NAVINFLUOR", "PIIND",
    "SRF", "TATACHEM", "UPL",
  ],
  "Capital Goods": [
    "3MINDIA", "ABB", "BDL", "BEL", "BHEL", "CGPOWER", "COCHINSHIP", "CUMMINSIND", "FINCABLES", "HAL", "HONAUT", "KAYNES",
    "KEC", "KEI", "MAZDOCK", "POLYCAB", "SIEMENS", "THERMAX",
  ],
  "Infra & Realty": [
    "ADANIENT", "BRIGADE", "DLF", "GODREJPROP", "IRB", "IRCON", "LODHA", "LT", "NBCC", "NCC", "OBEROIRLTY", "PHOENIXLTD",
    "PRESTIGE", "RVNL", "SOBHA",
  ],
  "Transport & Logistics": ["ADANIPORTS", "BLUEDART", "CONCOR", "DELHIVERY", "INDIGO", "TCI", "VRLLOG"],
  "Telecom & Media": [
    "BHARTIARTL", "HFCL", "IDEA", "INDUSTOWER", "NAZARA", "PVRINOX", "SAREGAMA", "SUNTV", "TATACOMM", "ZEEL",
  ],
};

export const SECTOR_BY_SYMBOL: Record<string, Sector> = Object.fromEntries(
  (Object.entries(BY_SECTOR) as [Sector, string[]][]).flatMap(([sector, names]) => names.map((n) => [`${n}.NS`, sector]))
);

export function sectorOf(symbol: string): Sector | "Other" {
  return SECTOR_BY_SYMBOL[symbol] ?? "Other";
}
