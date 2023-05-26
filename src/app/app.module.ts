import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { VotesTableComponent } from './votes-table/votes-table.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MaterialExampleModule } from './material.module';
import { inject } from '@vercel/analytics';
 
inject();
@NgModule({
  declarations: [
    AppComponent,
    VotesTableComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatNativeDateModule,
    MaterialExampleModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
