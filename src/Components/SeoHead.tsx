import React from 'react';
import { Helmet } from 'react-helmet-async';
import type { SeoMeta } from '../utils/seoMetadata';

type Props = {
  meta: SeoMeta;
};

/** Renders title, description, canonical, OG/Twitter from buildSeoMeta() */
const SeoHead: React.FC<Props> = ({ meta }) => (
  <Helmet>
    <title>{meta.title}</title>
    <meta name="description" content={meta.description} />
    <meta name="robots" content={meta.robots} />
    {meta.keywords && <meta name="keywords" content={meta.keywords} />}
    <link rel="canonical" href={meta.canonical} />
    <link rel="alternate" hrefLang="en" href={meta.canonical} />
    <link rel="alternate" hrefLang="x-default" href={meta.canonical} />

    <meta property="og:type" content={meta.og.type} />
    <meta property="og:site_name" content={meta.og.site_name} />
    <meta property="og:title" content={meta.og.title} />
    <meta property="og:description" content={meta.og.description} />
    <meta property="og:url" content={meta.og.url} />
    <meta property="og:image" content={meta.og.image} />
    {meta.og.article_published_time && (
      <meta property="article:published_time" content={meta.og.article_published_time} />
    )}
    {meta.og.article_modified_time && (
      <meta property="article:modified_time" content={meta.og.article_modified_time} />
    )}

    <meta name="twitter:card" content={meta.twitter.card} />
    <meta name="twitter:site" content={meta.twitter.site} />
    <meta name="twitter:title" content={meta.twitter.title} />
    <meta name="twitter:description" content={meta.twitter.description} />
    <meta name="twitter:image" content={meta.twitter.image} />
  </Helmet>
);

export default SeoHead;
