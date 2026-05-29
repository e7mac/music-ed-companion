import { useEffect } from 'react';

const SITE = 'Music Ed';
const SITE_ORIGIN = 'https://textbook.realmusictheory.com';
const HOME_TITLE = 'Music Ed — Examples from Classic Music-Theory & Orchestration Textbooks';

function setAttr(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Keeps the document title and canonical/OG URLs in sync with the selected book,
 * so each ?book= URL is indexed with its own title. URLs are anchored to the
 * canonical domain (SITE_ORIGIN) rather than the serving host, so any mirror
 * (e.g. the GitHub Pages copy) consolidates to the production domain.
 * The bare homepage (no ?book param) keeps the generic title and canonicalizes
 * to the root.
 */
export function useSeo(bookTitle: string) {
  useEffect(() => {
    const hasBookParam = new URLSearchParams(window.location.search).has('book');

    const url = hasBookParam
      ? `${SITE_ORIGIN}/?book=${encodeURIComponent(bookTitle)}`
      : `${SITE_ORIGIN}/`;
    const title = hasBookParam ? `${bookTitle} — ${SITE}` : HOME_TITLE;

    document.title = title;
    setAttr('link[rel="canonical"]', 'href', url);
    setAttr('meta[property="og:url"]', 'content', url);
    setAttr('meta[property="og:title"]', 'content', title);
    setAttr('meta[name="twitter:title"]', 'content', title);
  }, [bookTitle]);
}
