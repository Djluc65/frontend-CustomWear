import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaRegCommentDots } from 'react-icons/fa';
import './FeedbackFloatingButton.css';

const FeedbackFloatingButton = () => {
  const location = useLocation();
  const path = location.pathname || '/';

  if (path.startsWith('/admin')) return null;
  if (path.startsWith('/avis-suggestions')) return null;

  return (
    <Link to="/avis-suggestions" className="feedback-fab" aria-label="Avis & Suggestions">
      <FaRegCommentDots />
      Avis
    </Link>
  );
};

export default FeedbackFloatingButton;

