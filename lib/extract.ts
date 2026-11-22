import * as cheerio from "cheerio";

const MIN_PARAGRAPH_LENGTH = 20;

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function extractContent(html: string): {
  title: string;
  headings: string[];
  paragraphs: string[];
  images: string[];
} {
  const $ = cheerio.load(html);

  // Drop non-readable content so it never leaks into extracted text.
  $("script, style, noscript").remove();

  const title = clean($("title").first().text()) || clean($("h1").first().text());

  const headings = $("h1, h2, h3")
    .map((_, el) => clean($(el).text()))
    .get()
    .filter((text) => text.length > 0);

  const paragraphs = $("p")
    .map((_, el) => clean($(el).text()))
    .get()
    .filter((text) => text.length > MIN_PARAGRAPH_LENGTH);

  const images = $("img")
    .map((_, el) => ($(el).attr("src") ?? "").trim())
    .get()
    .filter((src) => src.startsWith("http"));

  return { title, headings, paragraphs, images };
}
