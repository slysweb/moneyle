import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ALLDLE_VERIFY_BY_PATH,
  ALLDLE_VERIFY_NAME,
  canonicalUrl,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from "./pageMeta";

function setMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(attr: "name" | "property", key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useAlldleVerify(pathname: string) {
  const content = ALLDLE_VERIFY_BY_PATH[pathname];
  useEffect(() => {
    if (!content) return;
    const selector = `meta[name="${ALLDLE_VERIFY_NAME}"]`;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", ALLDLE_VERIFY_NAME);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
    return () => document.head.querySelector(selector)?.remove();
  }, [content]);
}

export function usePageMeta(title: string, description: string, image?: string) {
  const { pathname } = useLocation();

  useEffect(() => {
    const url = canonicalUrl(pathname);
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("property", "og:image:width", String(OG_IMAGE_WIDTH));
      setMeta("property", "og:image:height", String(OG_IMAGE_HEIGHT));
      setMeta("property", "og:image:alt", title);
      setMeta("name", "twitter:card", "summary_large_image");
      setMeta("name", "twitter:image", image);
      setMeta("name", "twitter:image:alt", title);
    } else {
      removeMeta("property", "og:image");
      removeMeta("property", "og:image:width");
      removeMeta("property", "og:image:height");
      removeMeta("property", "og:image:alt");
      removeMeta("name", "twitter:image");
      removeMeta("name", "twitter:image:alt");
      setMeta("name", "twitter:card", "summary");
    }
    setCanonical(url);
  }, [title, description, image, pathname]);
}
