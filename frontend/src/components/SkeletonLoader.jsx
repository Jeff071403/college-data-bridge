import React from 'react';
import { Box, useTheme } from '@mui/material';

/**
 * SkeletonLoader — Shimmer skeleton components matched to real content shapes.
 * Use these while data is loading — never generic spinners.
 */

const Skeleton = ({ width = '100%', height = 16, radius = 8, sx = {} }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box
      className={isDark ? 'skeleton-dark' : 'skeleton'}
      sx={{ width, height, borderRadius: `${radius}px`, flexShrink: 0, ...sx }}
    />
  );
};

/* Single stat card skeleton */
const StatCardSkeleton = () => (
  <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Skeleton width={80} height={12} />
      <Skeleton width={36} height={36} radius={10} />
    </Box>
    <Skeleton width={60} height={28} radius={6} sx={{ mb: 1 }} />
    <Skeleton width={100} height={10} />
  </Box>
);

/* Table row skeleton */
const TableRowSkeleton = ({ cols = 4 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const widths = [180, 80, 110, 80];
  return (
    <Box
      component="tr"
      sx={{
        display: 'table-row',
        '& td': { py: 1.5, px: 2, borderBottom: `1px solid ${isDark ? '#2D3148' : '#E8ECF0'}` }
      }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Box component="td" key={i}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            {i === 0 && <Skeleton width={28} height={28} radius={8} />}
            <Skeleton width={widths[i] || 80} height={12} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

/* Card grid skeleton (folders, suggested items) */
const CardGridSkeleton = ({ count = 4 }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 2 }}>
    {Array.from({ length: count }).map((_, i) => (
      <Box key={i} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Skeleton width={52} height={52} radius={12} sx={{ mx: 'auto', mb: 1.5 }} />
        <Skeleton width="70%" height={12} sx={{ mx: 'auto', mb: 0.8 }} />
        <Skeleton width="50%" height={10} sx={{ mx: 'auto' }} />
      </Box>
    ))}
  </Box>
);

/* Full dashboard skeleton */
const DashboardSkeleton = () => (
  <Box sx={{ p: 3 }}>
    {/* Suggested row */}
    <Skeleton width={100} height={14} sx={{ mb: 1.5 }} />
    <Box sx={{ display: 'flex', gap: 2, mb: 3.5, overflow: 'hidden' }}>
      {[130, 130, 130].map((w, i) => (
        <Box key={i} sx={{ width: w, p: 1.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', flexShrink: 0, bgcolor: 'background.paper' }}>
          <Skeleton width={40} height={40} radius={10} sx={{ mb: 1 }} />
          <Skeleton width="80%" height={10} sx={{ mb: 0.6 }} />
          <Skeleton width="50%" height={8} />
        </Box>
      ))}
    </Box>
    {/* Folders */}
    <Skeleton width={80} height={14} sx={{ mb: 1.5 }} />
    <CardGridSkeleton count={4} />
    {/* Table */}
    <Skeleton width={100} height={14} sx={{ mt: 3.5, mb: 1.5 }} />
    <Box sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <Box component="tbody">
          {Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)}
        </Box>
      </Box>
    </Box>
  </Box>
);

/* Storage widget skeleton */
const StorageSkeleton = () => (
  <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <Skeleton width={160} height={160} radius={80} />
    </Box>
    {[100, 80, 90, 70, 85].map((w, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
        <Skeleton width={32} height={32} radius={8} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width={`${w}%`} height={10} sx={{ mb: 0.5 }} />
          <Skeleton width="60%" height={6} />
        </Box>
      </Box>
    ))}
  </Box>
);

export { Skeleton, StatCardSkeleton, TableRowSkeleton, CardGridSkeleton, DashboardSkeleton, StorageSkeleton };
export default Skeleton;
