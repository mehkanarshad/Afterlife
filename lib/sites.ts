export type SiteCategory =
  | "Web hosting"
  | "Search"
  | "Social"
  | "Music"
  | "News"
  | "Blogging"
  | "Video"
  | "Browser"
  | "Messaging"
  | "File sharing"
  | "Directory"
  | "Discovery";

export interface DeadSite {
  /** Display name, e.g. "GeoCities". */
  name: string;
  /** Domain passed to the resurrect API, e.g. "geocities.com". */
  domain: string;
  /** Approximate year the site effectively died. */
  diedYear: number;
  category: SiteCategory;
}

// Death years are approximate: the year the service shut down, was sold off,
// or stopped being what it was.
export const DEAD_SITES: readonly DeadSite[] = [
  { name: "GeoCities", domain: "geocities.com", diedYear: 2009, category: "Web hosting" },
  { name: "AltaVista", domain: "altavista.com", diedYear: 2013, category: "Search" },
  { name: "MySpace", domain: "myspace.com", diedYear: 2008, category: "Social" },
  { name: "Friendster", domain: "friendster.com", diedYear: 2015, category: "Social" },
  { name: "Napster", domain: "napster.com", diedYear: 2001, category: "Music" },
  { name: "Digg", domain: "digg.com", diedYear: 2012, category: "News" },
  { name: "Xanga", domain: "xanga.com", diedYear: 2013, category: "Blogging" },
  { name: "Vine", domain: "vine.co", diedYear: 2017, category: "Video" },
  { name: "Netscape", domain: "netscape.com", diedYear: 2008, category: "Browser" },
  { name: "Ask Jeeves", domain: "askjeeves.com", diedYear: 2006, category: "Search" },
  { name: "Orkut", domain: "orkut.com", diedYear: 2014, category: "Social" },
  { name: "Google+", domain: "plus.google.com", diedYear: 2019, category: "Social" },
  { name: "Posterous", domain: "posterous.com", diedYear: 2013, category: "Blogging" },
  { name: "StumbleUpon", domain: "stumbleupon.com", diedYear: 2018, category: "Discovery" },
  { name: "Bebo", domain: "bebo.com", diedYear: 2013, category: "Social" },
  { name: "Winamp", domain: "winamp.com", diedYear: 2013, category: "Music" },
  { name: "Megaupload", domain: "megaupload.com", diedYear: 2012, category: "File sharing" },
  { name: "Metacafe", domain: "metacafe.com", diedYear: 2021, category: "Video" },
  { name: "AIM", domain: "aim.com", diedYear: 2017, category: "Messaging" },
  { name: "Yahoo Directory", domain: "dir.yahoo.com", diedYear: 2014, category: "Directory" },
];
