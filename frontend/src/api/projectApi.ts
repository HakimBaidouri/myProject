import { ProjectFull } from '../types/projectTypes';

export async function fetchFullProject(projectId: number): Promise<ProjectFull> {
  const res = await fetch(`http://localhost:8080/myProject/api/projects/${projectId}/full`);
  if (!res.ok) {
    throw new Error("Erreur de chargement du projet");
  }
  return await res.json();
}
