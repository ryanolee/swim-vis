# Swim Vis
A interactive visulisation tool for the [SWIM protocol](https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf) the backbone of [Consul](https://developer.hashicorp.com/consul) and many other distributed systems.

![Swim Vis](docs/img/network.gif)

## Features
This tool aims to visulise the original SWIM Protocol as closely as possible to the original paper and does not include later improvements made to the protocol in such as the ones made in [surf](https://github.com/hashicorp/serf).

## How to use
Visit (the simulator)[ryanolee.github.io/swim-vis/] and click the "Open Panel" button to get started. For more information on how to use the simulator please see the [usage guide](docs/instructions.md).

## Development
To get started with development you will need to install the following dependencies:
- [Node.js](https://nodejs.org/en/download/) (v22)

Run the following command to install the dependencies and start the development server:
```bash
npm install
npm dev
```

Any help to improve the simulator of expand it to include other elements of the Extended Swim Protocol (Including SURF) is welcome. Please feel free to open an issue or a pull request with any suggestions or improvements.