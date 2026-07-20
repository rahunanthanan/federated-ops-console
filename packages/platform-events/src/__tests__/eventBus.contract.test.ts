import { createEventBus } from '../index';

describe('platform-events contract', () => {
  it('delivers only subscribed event types with narrowed payload typing', () => {
    const bus = createEventBus();
    const received: string[] = [];

    bus.subscribe('region.changed', (event) => {
      // TS narrows event.payload.region to RegionCode here - compile-time proof of the contract.
      received.push(event.payload.region);
    });

    bus.publish({ type: 'region.changed', payload: { region: 'MY' } });
    bus.publish({ type: 'request.created', payload: { requestId: 'req-1' } });

    expect(received).toEqual(['MY']);
  });

  it('allows unsubscribing without affecting other listeners', () => {
    const bus = createEventBus();
    const calls: number[] = [];
    const unsubscribe = bus.subscribe('request.created', () => calls.push(1));
    bus.subscribe('request.created', () => calls.push(2));

    unsubscribe();
    bus.publish({ type: 'request.created', payload: { requestId: 'req-2' } });

    expect(calls).toEqual([2]);
  });
});
