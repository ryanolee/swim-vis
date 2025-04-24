
/**
 * Expectation for something to happen after a certain period of time on the network.
 */
export class SwimNetworkExpectation{
    constructor (
        public expectationType: "receive_ack" | "receive_ack_or_death" | "clear_suspicion" = "receive_ack",
        public from: number,
        public expectationBrokenTime: number = 0,
    ){}

    public isBroken(currentTick: number): boolean {
        return this.expectationBrokenTime <= currentTick;
    }
}