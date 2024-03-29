import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { VotesTableComponent } from './votes-table/votes-table.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MaterialExampleModule } from './material.module';
import { inject } from '@vercel/analytics';
import { PoolsMenuComponent } from './pools-menu/pools-menu.component';
import { VoteItemComponent } from './votes-table/vote-item/vote-item.component';
 
inject();
@NgModule({
  declarations: [
    AppComponent,
    PoolsMenuComponent,
    VotesTableComponent,
    VoteItemComponent
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
