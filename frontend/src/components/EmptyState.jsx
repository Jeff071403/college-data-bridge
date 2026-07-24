import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * EmptyState — Self-documenting empty state with floating illustration.
 * Never just says "No data" — always explains why & what to do.
 *
 * @param {string}   illustration - "folder" | "file" | "user" | "log" | "search" | "notification"
 * @param {string}   title        - Short title
 * @param {string}   description  - Why it's empty + what action creates data here
 * @param {string}   action       - CTA button label (optional)
 * @param {function} onAction     - CTA callback (optional)
 */

const ILLUSTRATIONS = {
  folder: (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      <rect x="10" y="30" width="100" height="62" rx="12" fill="rgba(79,70,229,0.08)" stroke="rgba(79,70,229,0.2)" strokeWidth="2"/>
      <path d="M10 44V38C10 33.6 13.6 30 18 30H40L50 40H102C106.4 40 110 43.6 110 48V92C110 96.4 106.4 100 102 100H18C13.6 100 10 96.4 10 92V44Z" fill="rgba(79,70,229,0.06)"/>
      <rect x="20" y="50" width="30" height="26" rx="6" fill="rgba(79,70,229,0.15)"/>
      <rect x="58" y="50" width="30" height="26" rx="6" fill="rgba(124,58,237,0.12)"/>
      <circle cx="60" cy="20" r="14" fill="rgba(79,70,229,0.08)" stroke="rgba(79,70,229,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
      <path d="M60 14V20M60 20V26M60 20H54M60 20H66" stroke="rgba(79,70,229,0.5)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  file: (
    <svg width="100" height="110" viewBox="0 0 100 110" fill="none">
      <rect x="15" y="10" width="70" height="90" rx="12" fill="rgba(79,70,229,0.06)" stroke="rgba(79,70,229,0.18)" strokeWidth="2"/>
      <path d="M55 10L85 38" stroke="rgba(79,70,229,0.18)" strokeWidth="2"/>
      <rect x="55" y="10" width="30" height="28" rx="0 12 0 0" fill="rgba(79,70,229,0.1)"/>
      <rect x="28" y="50" width="44" height="4" rx="2" fill="rgba(79,70,229,0.2)"/>
      <rect x="28" y="62" width="36" height="4" rx="2" fill="rgba(79,70,229,0.12)"/>
      <rect x="28" y="74" width="28" height="4" rx="2" fill="rgba(79,70,229,0.08)"/>
    </svg>
  ),
  user: (
    <svg width="110" height="100" viewBox="0 0 110 100" fill="none">
      <circle cx="55" cy="32" r="24" fill="rgba(79,70,229,0.08)" stroke="rgba(79,70,229,0.2)" strokeWidth="2"/>
      <circle cx="55" cy="32" r="14" fill="rgba(79,70,229,0.15)"/>
      <path d="M15 88C15 70 33 56 55 56C77 56 95 70 95 88" stroke="rgba(79,70,229,0.2)" strokeWidth="2" fill="rgba(79,70,229,0.05)" strokeLinecap="round"/>
      <rect x="40" y="25" width="30" height="14" rx="4" fill="rgba(124,58,237,0.15)"/>
    </svg>
  ),
  search: (
    <svg width="110" height="100" viewBox="0 0 110 100" fill="none">
      <circle cx="46" cy="44" r="30" fill="rgba(79,70,229,0.06)" stroke="rgba(79,70,229,0.18)" strokeWidth="2.5"/>
      <circle cx="46" cy="44" r="18" fill="rgba(79,70,229,0.08)"/>
      <path d="M68 66L90 88" stroke="rgba(79,70,229,0.3)" strokeWidth="6" strokeLinecap="round"/>
      <path d="M36 44H56M46 34V54" stroke="rgba(79,70,229,0.4)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  notification: (
    <svg width="100" height="110" viewBox="0 0 100 110" fill="none">
      <path d="M50 10C35 10 24 22 24 38V62L14 72H86L76 62V38C76 22 65 10 50 10Z" fill="rgba(79,70,229,0.08)" stroke="rgba(79,70,229,0.2)" strokeWidth="2"/>
      <rect x="38" y="72" width="24" height="10" rx="5" fill="rgba(79,70,229,0.15)"/>
      <circle cx="50" cy="6" r="5" fill="rgba(244,63,94,0.3)" stroke="rgba(244,63,94,0.4)" strokeWidth="1.5"/>
    </svg>
  ),
  log: (
    <svg width="110" height="100" viewBox="0 0 110 100" fill="none">
      <rect x="18" y="15" width="74" height="70" rx="12" fill="rgba(79,70,229,0.06)" stroke="rgba(79,70,229,0.18)" strokeWidth="2"/>
      <rect x="30" y="30" width="50" height="5" rx="2.5" fill="rgba(79,70,229,0.2)"/>
      <rect x="30" y="43" width="38" height="5" rx="2.5" fill="rgba(79,70,229,0.12)"/>
      <rect x="30" y="56" width="44" height="5" rx="2.5" fill="rgba(79,70,229,0.08)"/>
      <circle cx="82" cy="22" r="14" fill="rgba(244,63,94,0.1)" stroke="rgba(244,63,94,0.25)" strokeWidth="2"/>
      <path d="M82 16V23L87 26" stroke="rgba(244,63,94,0.6)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

const EmptyState = ({
  illustration = 'folder',
  title = 'Nothing here yet',
  description = 'Data will appear here once it is created.',
  action,
  onAction,
  sx = {},
}) => (
  <Box sx={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', py: 6, px: 3,
    animation: 'fadeSlideUp 0.4s var(--ease-spring) both',
    ...sx,
  }}>
    <Box className="animate-float" sx={{ mb: 3, lineHeight: 0 }}>
      {ILLUSTRATIONS[illustration] || ILLUSTRATIONS.folder}
    </Box>

    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', fontSize: '1rem' }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.7, mb: action ? 3 : 0, fontSize: '0.85rem' }}>
      {description}
    </Typography>

    {action && onAction && (
      <Button
        variant="contained"
        onClick={onAction}
        sx={{ borderRadius: '12px', fontWeight: 700 }}
      >
        {action}
      </Button>
    )}
  </Box>
);

export default EmptyState;
