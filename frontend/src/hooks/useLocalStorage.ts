import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer la sauvegarde et le chargement des données dans le local storage
 * @param key - Clé pour stocker les données dans le local storage
 * @param initialValue - Valeur initiale si aucune donnée n'est trouvée dans le local storage
 * @returns [storedValue, setValue] - Valeur stockée et fonction pour la mettre à jour
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // État pour stocker notre valeur
  // Passe la fonction initiale à useState pour que la logique ne s'exécute qu'une seule fois
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Récupérer la valeur du local storage par la clé
      const item = window.localStorage.getItem(key);
      // Analyser le JSON stocké ou retourner initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Si une erreur se produit, retourner initialValue
      console.error(`Erreur lors de la récupération de la clé "${key}" du local storage:`, error);
      return initialValue;
    }
  });

  // Retourner une fonction enveloppée qui met à jour l'état et le local storage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permettre à la valeur d'être une fonction pour que nous ayons la même API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Sauvegarder l'état
      setStoredValue(valueToStore);
      // Sauvegarder dans le local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de la clé "${key}" dans le local storage:`, error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage; 