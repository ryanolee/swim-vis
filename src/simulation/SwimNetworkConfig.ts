import { SwimNodeAction } from "./SwimNetworkActions";

class SwimNetworkConfig {
    public eventTypeFilter: Set<SwimNodeAction["type"]> = new Set<SwimNodeAction["type"]>([])

    constructor(
        protected onEventTypeFilterChange: (eventTypeFilter: Set<SwimNodeAction["type"]>) => void,
    ) {
    }

    protected addToEventTypeFilter(eventType: SwimNodeAction["type"]): void {
        this.eventTypeFilter.add(eventType);
        this.onEventTypeFilterChange(this.eventTypeFilter);
    }

    protected removeFromEventTypeFilter(eventType: SwimNodeAction["type"]): void {
        this.eventTypeFilter.delete(eventType);
        this.onEventTypeFilterChange(this.eventTypeFilter);
    }

    protected clearEventTypeFilter(): void {
        this.eventTypeFilter.clear();
        this.onEventTypeFilterChange(this.eventTypeFilter);
    }    
}