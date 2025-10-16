import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navLinkClass = (path: string) => `
    px-3 py-2 rounded-md text-sm font-medium transition-colors
    ${isActive(path) 
      ? 'bg-blue-500 text-white' 
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }
  `;
  
  return (
    <nav className="flex space-x-2">
      <Link to="/" className={navLinkClass('/')}>
        🎨 Tokens
      </Link>
      <Link to="/status" className={navLinkClass('/status')}>
        📊 Server Status
      </Link>
    </nav>
  );
};