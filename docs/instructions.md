> N.b Swim vis is intended for use on a desktop browser. Usage on other devices may result in a degraded experience
> 
# Swim Vis Usage Guide
This guide should cover general usage for interacting with Swim Vis and making the most of the tool as a learning resource

## Getting started
To get started Click the "Open Panel" button at the top left hand corner of the website. This should open the settings tray where you can configure the network.

## Adding a node
> [!NOTE]
> Pressing this button very quickly on some disseminations methods can cause the simulator to hang due to O(n!) complexity of disseminating through multicast given each joined peer needs to ping all other nodes in the cluster

Click on the "add node" button to add a new node to the network. Doing so will reset the positions of all other nodes.

Once a node has been added it will attempt to join the network using the selected "dissemination" method. 

Nodes can be:
 - **Toggled to be faulty**: This will stop the node from sending or receiving messages simulating a node failure. 
 - **Removed**: This will remove the node from the network. (Node will still be visible but not active)
  
## Network partitioning
> [!NOTE]
>  It should be noted that *all* nodes are draggable and can be moved about the network graph by clicking and dragging them. about
To add a network partition you can press the "add partition" button.

This will create a node at the middle of the graph drag the start and the end of the partition to the area that you want to partition.

Clicking the "inactive" button next to the partition will activate it and draw a line between the "start" and "end" nodes.
![Network Partition](img/NetworkPartition.png)

All network requests crossing the line will be marked as "lost". Network request that are lost are drawn on the graph but are not received by the targeted node

## Action Type Filters
Action types filters can but used to only show certain types of requests on the graph. If no filters are selected all requests will be shown.

This can be useful for seeing certain types of traffic. A useful case for this is `ping_req` where network the `ping` and `ack` requests relating to a ping_req are also shown.

## Ping approach
The ping approach controls how each node decides which note to ping next each ping interval.
The available options are:
 * **All**: All nodes in the network will ping every other node in the network. This can be very slow for large networks.
 * **Random**: Each node will select a random known peer to ping.
 * **Round Robin**: Each node will create an ordered list of all known peers. Randomise the list and then ping each node in the list in order until either the list is exhausted or a new peer is discovered. At which point the process will start again.

## Dissemination Approaches
The way network is shared throughout the network. The available options are:
 * **Multicast**: Each node will send a message to all other nodes in the network for `join`, `leave` and `death` events.
 * **Gossip**: Each node will piggyback traffic on `ping`, `ack` and `ping_req` messages. In the event of the failure detector triggering a node will be marked as failed.
 * **Gossip with Suspicion**: Each node will piggyback traffic on `ping`, `ack` and `ping_req` messages. If a node is suspected to be faulty it will be marked as such and given a chance to refute the suspicion. If the node is not able to refute the suspicion in a given period of time it will be marked as failed.

## Overlay Mode
The overlay mode changes how selected nodes show information. Nodes can be selected by clicking on them.

The available options are:
 * **None**: No special information is shown when a node is selected.
 * **Who Knows Who**: When a node is selected it will show all the nodes and actions that contain gossip relating to it.In this state node colors mean the following:
   * **Green**: The node is known to the selected node.
   * **Orange**: The node is suspicious to the selected node.
   * **Grey**: The node is not aware of the selected node.
  For actions:
    * **Green**: The action contains gossip declaring the node as alive.
    * **Orange**: The action contains gossip declaring the node as suspicious.
    * **Red**: The action contains gossip declaring the node as dead.
    * **Grey**: The action contains no gossip relating to the node.
 * **Who I Know**: When a node is selected with this overlay all nodes known to the selected nodes are shown in green. The rest will be shown in grey.

## Other options
There are some additional options relating to the overall simulation at the bottom of the settings tray. These include:
* **enable physics**: Disable physics (can allow for more network traffic)
* **Simulation Speed**: Simulation speed which controls how fast the simulation runs from 0.1 times speed  to 10 times speed.
* **Random Packet Loss**: Randomly drops packets in the network emulating UDP packet loss. This is a random number between 0 and 1. The higher the number the more packets will be dropped.

## Placement Strategy
The placement strategy controls how nodes are placed in the network. The available options are:
* **None**: Nodes are placed by themselves.
* **Grid**: Nodes are placed in a grid.
* **Circle**: Nodes are placed in a circle. With a smaller circle of left / ejected nodes.
