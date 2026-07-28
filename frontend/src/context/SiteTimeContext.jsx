import React, { createContext, useContext, useState, useEffect } from 'react';

const SiteTimeContext = createContext(null);

export const SiteTimeProvider = ({ children }) => {
  const [isCustom, setIsCustom] = useState(() => {
    return localStorage.getItem('site_time_is_custom') === 'true';
  });

  const [siteTime, setSiteTime] = useState(() => {
    if (localStorage.getItem('site_time_is_custom') === 'true') {
      const savedTime = localStorage.getItem('site_time_custom_val');
      return savedTime ? new Date(savedTime) : new Date();
    }
    return new Date();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSiteTime((prevTime) => {
        if (isCustom) {
          // Ticking custom clock: increment by 1 second
          const nextTime = new Date(prevTime.getTime() + 1000);
          localStorage.setItem('site_time_custom_val', nextTime.toISOString());
          return nextTime;
        } else {
          return new Date();
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCustom]);

  const setCustomTime = (dateTimeStr) => {
    const dateObj = new Date(dateTimeStr);
    if (!isNaN(dateObj.getTime())) {
      setIsCustom(true);
      setSiteTime(dateObj);
      localStorage.setItem('site_time_is_custom', 'true');
      localStorage.setItem('site_time_custom_val', dateObj.toISOString());
    }
  };

  const resetToLive = () => {
    setIsCustom(false);
    setSiteTime(new Date());
    localStorage.removeItem('site_time_is_custom');
    localStorage.removeItem('site_time_custom_val');
  };

  const getFormattedSiteDateTime = () => {
    // Returns YYYY-MM-DDTHH:mm formatted for datetime-local inputs
    const tzoffset = siteTime.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(siteTime.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  return (
    <SiteTimeContext.Provider value={{
      siteTime,
      isCustom,
      setCustomTime,
      resetToLive,
      getFormattedSiteDateTime
    }}>
      {children}
    </SiteTimeContext.Provider>
  );
};

export const useSiteTime = () => useContext(SiteTimeContext);
