import { useEffect, useState } from 'react';
import { fetchFullProject } from '../api/projectApi';
import { ProjectFull } from '../types/projectTypes';

export function useProjectLoader(projectId: number) {
  const [data, setData] = useState<ProjectFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFullProject(projectId)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [projectId]);

  return { data, loading };
}
