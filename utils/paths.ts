interface IfcPoolAddresses {
  BCT: string;
  NCT: string;
}
interface IfcTokenAddresses {
  mcUSD?: string[];
  cUSD?: string[];
  CELO?: string[];
  WETH?: string[];
  USDC?: string[];
  WMATIC?: string[];
}
interface IfcNetworkTokenAddresses {
  celo: IfcTokenAddresses;
  alfajores: IfcTokenAddresses;
  polygon: IfcTokenAddresses;
  mumbai: IfcTokenAddresses;
}
interface IfcNetworkPoolAddresses {
  celo: IfcPoolAddresses;
  alfajores: IfcPoolAddresses;
  polygon: IfcPoolAddresses;
  mumbai: IfcPoolAddresses;
}

const paths: IfcNetworkTokenAddresses = {
  celo: {
    mcUSD: ["0x918146359264c492bd6934071c6bd31c854edbc3"],
    cUSD: [
      "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      "0x918146359264c492bd6934071c6bd31c854edbc3",
    ],
    CELO: [
      "0x471EcE3750Da237f93B8E339c536989b8978a438",
      "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      "0x918146359264c492bd6934071c6bd31c854edbc3",
    ],
    WETH: [
      "0x122013fd7dF1C6F636a5bb8f03108E876548b455",
      "0x918146359264c492bd6934071c6bd31c854edbc3",
    ],
    USDC: [
      "0xef4229c8c3250C675F21BCefa42f58EfbfF6002a",
      "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      "0x918146359264c492bd6934071c6bd31c854edbc3",
    ],
  },
  alfajores: {
    mcUSD: ["0x71DB38719f9113A36e14F409bAD4F07B58b4730b"],
    cUSD: [
      "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      "0x71DB38719f9113A36e14F409bAD4F07B58b4730b",
    ],
    CELO: [
      "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9",
      "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      "0x71DB38719f9113A36e14F409bAD4F07B58b4730b",
    ],
  },
  polygon: {
    USDC: ["0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"],
    WETH: [
      "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    ],
    WMATIC: [
      "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    ],
  },
  mumbai: {
    USDC: ["0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747"],
    WETH: [
      "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
      "0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747",
    ],
    WMATIC: [
      "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
      "0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747",
    ],
  },
};

export default paths;
