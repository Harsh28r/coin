import React from 'react';
import { Link } from 'react-router-dom';
import type { InternalLink } from '../utils/internalLinks';

type Props = {
  links: InternalLink[];
  title?: string;
};

const InternalLinksBlock: React.FC<Props> = ({ links, title = 'Related coverage' }) => {
  if (!links.length) return null;
  return (
    <nav className="cc-related" aria-label={title}>
      <h2 className="cc-related__title">{title}</h2>
      <ul className="cc-related__list">
        {links.map((l) => (
          <li key={`${l.kind}-${l.href}`}>
            <Link to={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default InternalLinksBlock;
