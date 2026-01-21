import React from 'react';
import { Lead } from '../types';
import { MailIcon, PhoneIcon, GlobeIcon, LinkIcon } from './Icons';

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  return (
    <div className="bg-gray-850 border border-gray-700 rounded-xl p-5 hover:border-indigo-500 transition-colors duration-200 group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-50 text-xs font-mono uppercase tracking-wider text-gray-500 group-hover:text-indigo-400">
        {lead.sourceType}
      </div>
      
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
            {lead.name}
          </h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {lead.description}
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {lead.email ? (
          <div className="flex items-center text-sm text-emerald-400 bg-emerald-900/20 px-2 py-1.5 rounded-md w-fit">
            <MailIcon className="w-4 h-4 mr-2" />
            <span className="font-mono">{lead.email}</span>
          </div>
        ) : (
           <div className="flex items-center text-sm text-gray-600 px-2 py-1">
            <MailIcon className="w-4 h-4 mr-2" />
            <span className="italic">Email not found</span>
          </div>
        )}

        {lead.phone && (
          <div className="flex items-center text-sm text-gray-300">
            <PhoneIcon className="w-4 h-4 mr-2 text-indigo-500" />
            {lead.phone}
          </div>
        )}

        {lead.website && (
          <a 
            href={lead.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-sm text-blue-400 hover:text-blue-300 w-fit hover:underline"
          >
            <GlobeIcon className="w-4 h-4 mr-2" />
            Visit Website
          </a>
        )}

        {lead.address && (
          <div className="text-xs text-gray-500 mt-2 pl-6 border-l border-gray-700">
            {lead.address}
          </div>
        )}
      </div>

      {lead.sourceUrl && (
        <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
          <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center text-xs text-gray-500 hover:text-white transition-colors">
            <span className="mr-1">Source</span>
            <LinkIcon className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
