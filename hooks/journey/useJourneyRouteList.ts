// hooks/routes/useRouteList.ts
import { useEffect, useState } from 'react';
import { listRoutes, type RouteSummary } from '../../utils/api/journeyRoutes';

export default function useRouteList() {
  const [data, setData] = useState<RouteSummary[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listRoutes()
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((e) => mounted && setError(e as Error))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error } as const;
}
