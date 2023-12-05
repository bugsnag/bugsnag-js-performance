# `@bugsnag/angular-performance`

> An angular integration for BugSnag performance

This integration instruments the Angular router to provide full page load and route change performance metrics.

## Usage

```
import BugsnagPerformance from '@bugsnag/browser-performance';
import { AngularRoutingProvider, bugsnagBootstrapper } from '@bugsnag/angular-performance';

BugsnagPerformance.start({
  apiKey,
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
```
