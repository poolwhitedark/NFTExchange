var HDWalletProvider = require("truffle-hdwallet-provider");


module.exports = {
  networks: {
    // rinkeby: {
      // provider: () => new HDWalletProvider("", `https://rinkeby.infura.io/v3/{token}`),
      // network_id: 4,       // Ropsten's id
      // gas: 5500000,        // Ropsten has a lower block limit than mainnet
      // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      // timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      // networkCheckTimeout: 1000000000,
      // skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    // },
    bsctestnet: {
      provider: function() {
        return new HDWalletProvider(
            "df1f5000e2846127ed28feabe5facc053bc40917c8cf06c24b21d3b62d5edd01",
            "https://data-seed-prebsc-1-s2.binance.org:8545/")
      },
      network_id: 0x61,
      // confirmations: 10,
      // timeoutBlocks: 200,
      gas: 10000000,//8000000
      skipDryRun: true
    },
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1000,
        },
      },
    },
  },
};
