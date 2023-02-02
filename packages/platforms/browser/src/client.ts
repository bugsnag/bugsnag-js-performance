import * as Core from "@bugsnag/js-performance-core"
// import { Time } from "@bugsnag/js-performance-core/lib/time"
import { browserDelivery } from "./delivery"

const BugsnagPerformance = Core.createClient({
  clock: () => performance.now(),
  // delivery: browserDelivery,
  // platformExtensions: (factory) => ({
  //   exampleNewSpan: (name: string, startTime?: Time) => factory.newSpan({ name, startTime })
  // }),
  // configuration: {
  //   endpoint: {
  //     validator: () => null
  //   }
  // }
})

export default BugsnagPerformance
//                     ^?
