import React from 'react';
import { Helmet } from 'react-helmet-async';
import type { JsonLdObject } from '../utils/jsonLd';

type Props = {
  data: JsonLdObject | JsonLdObject[];
};

/** Renders one or more Schema.org JSON-LD blocks in document head */
const JsonLd: React.FC<Props> = ({ data }) => {
  const blocks = Array.isArray(data) ? data : [data];
  if (!blocks.length) return null;

  return (
    <Helmet>
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default JsonLd;
