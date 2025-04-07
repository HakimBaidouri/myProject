import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routes';  // Importer ton fichier de routes
import { MetreComponent } from './metre/metre.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    MetreComponent,
    HomeComponent  // Déclarer les composants ici
  ],
  imports: [
    BrowserModule,
    AppRoutingModule  // Ajouter le module de routage ici
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
