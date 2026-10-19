import { useEffect } from 'react';
import { DATA_CHANGED_EVENT } from '../api/dataEvents';

export function useRefreshOnMutation(refresh: () => void | Promise<unknown>): void {
  useEffect(() => {
    const handleDataChanged = () => {
      void refresh();
    };
    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged);
  }, [refresh]);
}
