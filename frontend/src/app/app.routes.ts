import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MetreComponent } from './metre/metre.component';  // Importer le composant Metre
import { HomeComponent } from './home/home.component'; 

export const routes: Routes = [
  { path: 'metre', component: MetreComponent },
  { path: 'home', component: HomeComponent },   // Définir la route '/metre'
  { path: '', redirectTo: '', pathMatch: 'full' }  // Rediriger par défaut vers /metre
];

export const AppRoutingModule = RouterModule.forRoot(routes);
