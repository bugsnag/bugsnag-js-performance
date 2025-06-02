import PrioritizedSet from './prioritized-set'

// base class for classes that can be used with SpanControlProvider, where S represents
// the type of span control that the query will retrieve. Using an abstract class
// allows providers to verify query types at runtime using instanceof checks.
export abstract class SpanQuery<S> {
  // phantom type property forces the TS compiler to preserve the generic type S.
  readonly _typescriptCompilerHack!: S
}

// provider interface that can retrieve a span control for a given SpanQuery.
// Span controls are specialised objects that allow for the manipulation of spans without directly
// referencing the Span object, allowing for specialized operations to be performed on spans.
export interface SpanControlProvider<S> {
  getSpanControls: <Q extends SpanQuery<S>>(query: Q) => S | null
}

export class CompositeSpanControlProvider implements SpanControlProvider<any> {
  private providers = new PrioritizedSet<SpanControlProvider<any>>()

  addProvider (provider: SpanControlProvider<any>, priority: number): void {
    this.providers.add(provider, priority)
  }

  getSpanControls<S> (query: SpanQuery<S>): S | null {
    for (const provider of this.providers) {
      const spanControl = provider.getSpanControls(query)
      if (spanControl) {
        return spanControl
      }
    }
    return null
  }
}
