export interface TracePayload {
    headers: { [header: string]: string }
    /**
     * the body to send to the server, either as a string or an object that can be converted to JSON
     */
    body: string | object
}

export type DeliveryResult =
    { success: true } |
    {
        success: false,
        retry: boolean,
        tracePayload: TracePayload
    }

export type Delivery = (tracePayload: TracePayload) => Promise<DeliveryResult>
