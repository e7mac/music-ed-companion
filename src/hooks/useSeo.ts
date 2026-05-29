import { useEffect } from 'react';

const SITE = 'Music Ed';
const HOME_TITLE = 'Music Ed — Examples from Classic Music-Theory & Orchestration Textbooks';

function setAttr(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Keeps the document title and canonical/OG URLs in sync with the selected book,
 * so each ?book= URL is indexed with its own title. Googlebot renders JS, so it
 * picks these up. The bare homepage (no ?book param) keeps the generic title and
 * canonicalizes to the root.
 */
export function useSeo(bookTitle: string) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasBookParam = params.has('book');

    const origin = window.location.origin;
    const path = window.location.pathname;
    const url = hasBookParam
      ? `${origin}${path}?book=${encodeURIComponent(bookTitle)}`
      : `${origin}${path}`;
    const title = hasBookParam ? `${bookTitle} — ${SITE}` : HOME_TITLE;

    document.title = title;
    setAttr('link[rel="canonical"]', 'href', url);
    setAttr('meta[property="og:url"]', 'content', url);
    setAttr('meta[property="og:title"]', 'content', title);
    setAttr('meta[name="twitter:title"]', 'content', title);
  }, [bookTitle]);
}
