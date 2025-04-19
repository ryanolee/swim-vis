
const PING_INTERVAL_TICKS = 100;
const PING_TIMEOUT_TICKS = 1000;

export class SwimNode {
    protected knownNodeIds: number[] = [];

    protected nextIntervalTicks: number = PING_INTERVAL_TICKS;
    protected pingTimeoutTicks: number = PING_TIMEOUT_TICKS;


    constructor (
        public readonly id: number,
        public readonly label: string,
    ){}


    public tick() {
        this.nextIntervalTicks--;
    }

    
}