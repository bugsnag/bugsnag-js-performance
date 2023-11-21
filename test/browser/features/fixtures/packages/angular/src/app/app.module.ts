import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import BugsnagPerformance from '@bugsnag/browser-performance';
import { AngularRoutingProvider, bugsnagBootstrapper } from '@bugsnag/angular-performance';

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')!
const endpoint = parameters.get('endpoint')!

BugsnagPerformance.start({
  apiKey,
  endpoint,
  // @ts-expect-error undocumented config for testing purposes
  maximumBatchSize: 14,
  batchInactivityTimeoutMs: 5000,
  autoInstrumentNetworkRequests: false,
  autoInstrumentRouteChanges: true,
  routingProvider: new AngularRoutingProvider(),
})

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    bugsnagBootstrapper,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
