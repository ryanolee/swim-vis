

type SwimActionTypes = {
    type: "ping",
    from: number,
    to: number,
} | {
    type: "ack",
    from: number,
    to: number,
} 

class SwimNetworkAction<T extends SwimActionTypes> {
    constructor(
        public type: T["type"],
        public payload: Omit<T, "type">,
        public lifeTime: number = 0,
    ){}

    public tick() {
        this.lifeTime--;
    }
}