// hooks/routes/useRouteDetail.ts
import { useEffect, useState } from 'react';
import { getRouteDetail, type RouteDetail, type RouteId } from '../../utils/api/journeyRoutes';

export default function useRouteDetail(id: RouteId | undefined) {
  const [data, setData] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setError(new Error('invalid route id'));
      setLoading(false);
      return;
    }
    setLoading(true);
    getRouteDetail(id)
      .then((res) => mounted && setData(res))
      .catch((e) => mounted && setError(e as Error))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  return { data, loading, error } as const;
}
