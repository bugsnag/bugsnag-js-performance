/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// taken from OpenTelemetry's TraceIdRatioBasedSampler:
// https://github.com/open-telemetry/opentelemetry-js/blob/ca700c4eef64c14bb5fef2be6f08ace7973a8881/packages/opentelemetry-sdk-trace-base/src/sampler/TraceIdRatioBasedSampler.ts#L47-L55
// with some small modifications to match our naming conventions
function traceIdToSamplingRate (traceId: string): number {
  let samplingRate = 0

  for (let i = 0; i < traceId.length / 8; i++) {
    const position = i * 8
    const segment = Number.parseInt(
      traceId.slice(position, position + 8),
      16
    )

    samplingRate = (samplingRate ^ segment) >>> 0
  }

  return samplingRate
}

export default traceIdToSamplingRate
