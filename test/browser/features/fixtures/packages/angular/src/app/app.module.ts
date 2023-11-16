import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { APP_BASE_HREF } from '@angular/common';
import BugsnagPerformance from '@bugsnag/browser-performance';
import { AngularRoutingProvider, bugsnagBootstrapper } from '@bugsnag/angular-performance';
import { Router } from '@angular/router';


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

console.log(bugsnagBootstrapper)
console.log(APP_INITIALIZER, bugsnagBootstrapper.provide)

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
    {
      provide: APP_INITIALIZER,
      // useFactory: (router: Router) => {
      //     console.log('special APP_INITIALIZER', router)
      //     return () => { };
      // },
      useFactory: bugsnagBootstrapper.useFactory,
      multi: true,
      deps: [Router]
    }
    // {provide: APP_BASE_HREF, useValue: '/angular/dist'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
