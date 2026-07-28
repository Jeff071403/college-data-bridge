export const DEPARTMENT_CATEGORIES = {
  'Aided': [
    'Botany (Aided)',
    'Chemistry (Aided)',
    'Commerce (Aided)',
    'Economics (Aided)',
    'English (Aided)',
    'History (Aided)',
    'Languages (Aided)',
    'Mathematics (Aided)',
    'Philosophy (Aided)',
    'Physical Education (Aided)',
    'Physics (Aided)',
    'Political Science (Aided)',
    'Public Administration (Aided)',
    'Social Work (Aided)',
    'Statistics (Aided)',
    'Tamil (Aided)',
    'Zoology (Aided)'
  ],
  'Self-Financed (SFS)': [
    'Business Administration (BBA) (SFS)',
    'Chemistry (SFS)',
    'Commerce (SFS)',
    'Communication (SFS)',
    'Computer Application (BCA) (SFS)',
    'Computer Science (SFS)',
    'Data Science (SFS)',
    'English (SFS)',
    'Geography (SFS)',
    'Journalism (SFS)',
    'Languages (SFS)',
    'Mathematics (SFS)',
    'MCA (SFS)',
    'Microbiology (SFS)',
    'Physics (SFS)',
    'Psychology (SFS)',
    'Social Work (SFS)',
    'Tamil (SFS)',
    'Tourism Studies (SFS)',
    'Visual Communication (SFS)'
  ],
  'Administrative Units': [
    'Administration',
    'Controller of Examinations',
    'IQAC',
    'Library',
    'Placement Cell',
    'Principal Office',
    'Research Centre'
  ]
};

export const ALL_DEPARTMENTS = [
  ...DEPARTMENT_CATEGORIES['Aided'],
  ...DEPARTMENT_CATEGORIES['Self-Financed (SFS)'],
  ...DEPARTMENT_CATEGORIES['Administrative Units']
];

/**
 * Extracts category and clean department name from a stored department string.
 * Example: "Computer Science (SFS)" -> { category: "Self-Financed (SFS)", dept: "Computer Science" }
 */
export const getCategoryAndDept = (storedDept) => {
  if (!storedDept) return { category: '', dept: '' };

  for (const [category, depts] of Object.entries(DEPARTMENT_CATEGORIES)) {
    if (depts.includes(storedDept)) {
      // Clean name removes the suffix
      let cleanName = storedDept;
      if (storedDept.endsWith(' (Aided)')) {
        cleanName = storedDept.slice(0, -8);
      } else if (storedDept.endsWith(' (SFS)')) {
        cleanName = storedDept.slice(0, -6);
      }
      return { category, dept: cleanName };
    }
  }

  // Fallback for custom or old seeded values
  if (storedDept.toLowerCase().includes('aided')) {
    return { category: 'Aided', dept: storedDept };
  } else if (storedDept.toLowerCase().includes('sfs') || storedDept.toLowerCase().includes('self-financed')) {
    return { category: 'Self-Financed (SFS)', dept: storedDept };
  } else if (['iqac', 'principal office', 'library', 'placement', 'administration', 'controller'].some(k => storedDept.toLowerCase().includes(k))) {
    return { category: 'Administrative Units', dept: storedDept };
  }

  return { category: '', dept: storedDept };
};

/**
 * Re-serializes category and clean name to stored value.
 */
export const getStoredDepartment = (category, cleanDept) => {
  if (!category || !cleanDept) return '';
  
  if (category === 'Aided') {
    return `${cleanDept} (Aided)`;
  }
  if (category === 'Self-Financed (SFS)') {
    return `${cleanDept} (SFS)`;
  }
  return cleanDept; // Administrative Units keep their plain name
};
