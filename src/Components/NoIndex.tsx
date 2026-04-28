import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Drop into any aggregator/scraped-content page.
 * Tells Google + AdSense reviewers: "this page does NOT contain original
 * content, please don't index it." Required for AdSense compliance on any
 * page that displays third-party article bodies.
 */
const NoIndex: React.FC<{ canonical?: string }> = ({ canonical }) => (
  <Helmet>
    <meta name="robots" content="noindex, follow" />
    <meta name="googlebot" content="noindex, follow" />
    {canonical ? <link rel="canonical" href={canonical} /> : null}
  </Helmet>
);

export default NoIndex;
