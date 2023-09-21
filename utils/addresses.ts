interface IfcOneNetworkAddresses {
  BCT: string;
  NCT: string;
  mcUSD?: string;
  cUSD?: string;
  CELO?: string;
  WETH?: string;
  USDC?: string;
  WMATIC?: string;
}
interface IfcAddresses {
  celo: IfcOneNetworkAddresses;
  alfajores: IfcOneNetworkAddresses;
  polygon: IfcOneNetworkAddresses;
  mumbai: IfcOneNetworkAddresses;
}

const addresses: IfcAddresses = {
  celo: {
    BCT: "0x0CcB0071e8B8B716A2a5998aB4d97b83790873Fe",
    NCT: "0x02De4766C272abc10Bc88c220D214A26960a7e92",
    mcUSD: "0xE273Ad7ee11dCfAA87383aD5977EE1504aC07568",
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    CELO: "0x471EcE3750Da237f93B8E339c536989b8978a438",
    WETH: "0x122013fd7dF1C6F636a5bb8f03108E876548b455",
    USDC: "0xef4229c8c3250C675F21BCefa42f58EfbfF6002a",
  },
  alfajores: {
    BCT: "0x4c5f90C50Ca9F849bb75D93a393A4e1B6E68Accb",
    NCT: "0xfb60a08855389F3c0A66b29aB9eFa911ed5cbCB5",
    cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    CELO: "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9",
  },
  polygon: {
    BCT: "0x2F800Db0fdb5223b3C3f354886d907A671414A7F",
    NCT: "0xD838290e877E0188a4A44700463419ED96c16107",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  },
  mumbai: {
    BCT: "0xf2438A14f668b1bbA53408346288f3d7C71c10a1",
    NCT: "0x7beCBA11618Ca63Ead5605DE235f6dD3b25c530E",
    USDC: "0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747",
    WETH: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
    WMATIC: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  },
};

export const poolAddresses: IfcNetworkPoolAddresses = {
  celo: {
    BCT: "0x0CcB0071e8B8B716A2a5998aB4d97b83790873Fe",
    NCT: "0x02De4766C272abc10Bc88c220D214A26960a7e92",
  },
  alfajores: {
    BCT: "0x4c5f90C50Ca9F849bb75D93a393A4e1B6E68Accb",
    NCT: "0xfb60a08855389F3c0A66b29aB9eFa911ed5cbCB5",
  },
  polygon: {
    BCT: "0x2F800Db0fdb5223b3C3f354886d907A671414A7F",
    NCT: "0xD838290e877E0188a4A44700463419ED96c16107",
  },
  mumbai: {
    BCT: "0xf2438A14f668b1bbA53408346288f3d7C71c10a1",
    NCT: "0x7beCBA11618Ca63Ead5605DE235f6dD3b25c530E",
  },
};

export const routerAddresses = {
  celo: "0x7D28570135A2B1930F331c507F65039D4937f66c", // ubeswap
  alfajores: "0x7D28570135A2B1930F331c507F65039D4937f66c", // ubeswap
  polygon: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // sushiswap
  mumbai: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // sushiswap
};

export default addresses;
