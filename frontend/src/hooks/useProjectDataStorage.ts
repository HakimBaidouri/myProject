import { useState, useEffect, useCallback } from 'react';

/**
 * Fonction utilitaire pour garantir que toutes les valeurs numériques
 * dans les données du projet sont correctement typées comme nombres
 */
export function ensureNumericValues(projectData: any) {
  if (!projectData || !projectData.chapters || !Array.isArray(projectData.chapters)) {
    console.warn("Structure de données invalide pour la conversion des types");
    return projectData;
  }
  
  try {
    // Parcourir tous les chapitres
    projectData.chapters.forEach((chapter: any) => {
      if (chapter.lines && Array.isArray(chapter.lines)) {
        chapter.lines.forEach((line: any) => {
          if (line.mainTableLine) {
            const mtl = line.mainTableLine;
            
            // Convertir les valeurs numériques explicitement
            if (mtl.quantity !== undefined) {
              mtl.quantity = Number(mtl.quantity);
            }
            
            if (mtl.unitPrice !== undefined) {
              mtl.unitPrice = Number(mtl.unitPrice);
            }
            
            // Recalculer le prix total pour être sûr
            mtl.totalPrice = mtl.quantity * mtl.unitPrice;
            
            // Log de débogage pour les valeurs critiques
            if (mtl.title === "Cloison intérieure") {
              console.log(`CONVERSION - Cloison intérieure: PU=${mtl.unitPrice} (${typeof mtl.unitPrice}), Qté=${mtl.quantity} (${typeof mtl.quantity}), Total=${mtl.totalPrice}`);
            }
          }
        });
      }
    });
    
    return projectData;
  } catch (error) {
    console.error("Erreur lors de la conversion des types numériques:", error);
    return projectData;
  }
}

/**
 * Hook pour le stockage et la récupération des données du projet
 * avec garantie de typage correct des valeurs numériques
 */
export function useProjectDataStorage() {
  // Fonctions du hook originel
  // ...
} 