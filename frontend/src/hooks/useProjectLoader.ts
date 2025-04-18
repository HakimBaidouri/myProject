import { useEffect, useState } from 'react';
import { fetchFullProject } from '../api/projectApi';
import { ProjectFull } from '../types/projectTypes';

export function useProjectLoader(projectId: number) {
  const [data, setData] = useState<ProjectFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFullProject(projectId)
      .then((res: ProjectFull) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Erreur de chargement du projet:', err);
        setError('Erreur de chargement du projet');
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  return { data, loading, error };
}
