import React from 'react';
import { Link } from 'react-router-dom';
import type { DeskAuthor } from '../config/authors';
import { authorPath } from '../config/authors';
import './DeskAuthorCard.css';

type Props = {
  author: DeskAuthor;
  /** Optional line under the byline, e.g. "Updated 27 Jul 2026" */
  updatedLabel?: string;
  compact?: boolean;
};

const DeskAuthorCard: React.FC<Props> = ({ author, updatedLabel, compact }) => {
  return (
    <aside className={`cc-author${compact ? ' cc-author--compact' : ''}`} aria-label={`About ${author.name}`}>
      <div className="cc-author__avatar" style={{ background: author.accent }} aria-hidden>
        {author.initials}
      </div>
      <div className="cc-author__body">
        <Link to={authorPath(author.slug)} className="cc-author__name">
          {author.name}
        </Link>
        <div className="cc-author__role">
          {author.role} · {author.desk}
          {updatedLabel ? <span className="cc-author__updated"> · {updatedLabel}</span> : null}
        </div>
        {!compact ? <p className="cc-author__bio">{author.bio}</p> : null}
        {!compact && author.focus?.length ? (
          <ul className="cc-author__focus">
            {author.focus.slice(0, 4).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
};

export default DeskAuthorCard;
