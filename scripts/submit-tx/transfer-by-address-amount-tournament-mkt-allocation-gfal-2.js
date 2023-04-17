// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");

const GFALTokenArtifact = require('../../artifacts/contracts/_mock/GFALToken.sol/GFALToken.json')
// Constants
const TRANSFERS_PAYLOAD = {
  address: [
    "0x4c24a2fe991edbfe05fa14f89344f816fa6eb84b",
    "0xd4b4082fb9171e47f8c5132dffb6917e35c36eea",
    "0xeb774905ed7f39e00e3487f97e3573ceaaacba49",
    "0x82a14bcc47b7408018023d124a795c87333ef009",
    "0xfbd028b037e8a011c273622e6b5b97581fa2b466",
    "0x33b3eef6b31c5873088b7f6d1c4bdc0964a1ab08",
    "0xd627d47064f2243e430f7d064f986eebff6f95a8",
    "0x5483a7d9237ebed60114d25784c374e3d260f1d1",
    "0x2548d378c50a00df1e68219692590fa34cb90ccf",
    "0x21c768b9276b03c4b175ce2d078dca151a77d904",
    "0xfd9e558f5efe3d6e85483e2a29f619b52133767c",
    "0x27734b2a75f9c9f2dab1fd047a9c613936db3400",
    "0xcf4410a8adff4de08f3e0937a037c94618ee7722",
    "0xdf9030787d12dbcf111d019e7475582a4a4a3d05",
    "0x2c1bb7fa5f48491303734ad2c7c24953af73fafc",
    "0x1c6c313a0d0b6d93aea5ba59786ac8713ded8efd",
    "0xa8952b3fc412c0a53135c0dc37033f6baadda38b",
    "0xb896daf6bcf6ee65238d63e7bae3b2bf35e6b06b",
    "0x587e11077dca9cd06eee462be8fc110a09f10383",
    "0xb49ab6a230bd44bba783cd66fd873b36c17a2e05",
    "0x9ad1d8907b0b98eaca82a3cce1b52960b94f855c",
    "0x15bfab9f5ac3bfed04bed004a5b6cbded1d891bd",
    "0x1107f06258d2fcb7a3f6beec7ccae30b2260d31f",
    "0xbcc9a8c0fdccf105b301d17c6173b0d6ae5c1520",
    "0xcb11ce4e63d4226b1a14b43c3a0b7e80849114a7",
    "0x8051d1b783d1cd4331af79ed01db6862b6ffe49c",
    "0xc92e1f2818a6094da33b2f0ba33fe2e79ba4d62a",
    "0xedcb7171a9bffd3ff0aa4b801e7981a24924a5a2",
    "0xc1c8d30bf31bfe76408423929f641dd9f97da7da",
    "0xf73bd79e1054e27d3b58c19742427369ba079a98",
    "0x399f678f3057c6195ed4f4518ec1ca4512170914",
    "0x04d85ec5de801fdf49a01cb9ac32c5679eb75213",
    "0x71a129dbc4596e329d48fc8e5f4d326045445770",
    "0x5088467c95ced61c41c91bea68ccfc1e691aac14",
    "0xf1f6a0b2a1d3455721bf05326ae43615ea970a36",
    "0x5134aa3d8fdebd24c5b3495adb31d4dda190f2ac",
    "0x951d6c3e4516f66d95d3c28a1e7f05aff0e5be59",
    "0x5ab6b7d7d81779a2b5013863c3c83c88d2cd089c",
    "0x075bb28dcf059bee8df283a1112f04804ae731d6",
    "0xe55f75dd1695458c0ed2c61ac0e6c025e99d87ef",
    "0x01bc9d928c49db6c685d016ba4bfc1f3410e4c4b",
    "0x26ef4913eea19b400633ebcaf5431d7b4760bbaa",
    "0x222fda85e07ef5b5c8234d731fdcc9ffde1aa42d",
    "0xa9d83bdc281994b95edfc48f3ed8271e4227017c",
    "0x57d41390d0721d1dca8e07ab3df2c372f7c8ccd5",
    "0x383ef0a735c8c4a2b6af93654a5b14b1739d41fb",
    "0xfcdf74436e47ee69b4429ac7d573d4f275397c81",
    "0xeae8eab6518cd91ff0c0aab9efa4711f97329e40",
    "0x125955f90e9fc81edc423c84c929ab46c1230d67",
    "0xc58678c0ab961fddbf4ac02b6e3bbfb26e7e7d9e",
    "0xf7fbf90feb92e6265a316cd346de84e076eae292",
    "0x92d51d69d1e95372c7d077567d430f4386e9325f",
    "0x057ae1748d2504ba1ce5268830eb60ead8fd247d",
    "0xc191ac58466566874fe3965e42c85fa69092c374",
    "0x4d561a036bc4bd7df892fa04b9c93f90f7f5523e",
    "0x6653c9d4797a100fc51bffc19f4d15d7f43e1ea7",
    "0x9fe62d01a5f2855287c79e522047f6f316674dbc",
    "0xe17aac7d0756070a331d27416008c7c54a77a0d5",
    "0xf41608d4ad7d4a394d29c9819927e09cb27b6890",
    "0xe5d092cb8712ee38a46913373052fa13ba566925",
    "0xf0e978f70bb34d64fc2bddfce5bd56bef8edfff8",
    "0x39432e721d25f91342ac0194cd5c4e6eb679877c",
    "0x2cc19871e7e77e4df63f3ac7ef8356a6b70aef81",
    "0x8bb6c989183c98987409f9c15d93166b026495c7",
    "0xaca0a334514d488a6ea4b4d4bfc283a8eb76883f",
    "0x3827a252c90068e470cfd6e84f3232b090200a80",
    "0x1ab32eaac0f3ff582f2e57da0979410749f7ea07",
    "0xf7294dca8b14a4467c928867d9f7cdbe375b9d88",
    "0x41e273b033ab419547b92d02e41c2ef9989cb124",
    "0x76764d37611c6cccfc25c00121a04496d1e31fe6",
    "0xa9e4b3255667457428de6ffcbec926cf7aadb30b",
    "0xa22cc4f941aa0bee5e27d19944cb82453be34111",
    "0xa595143d968871af36f63ee5dfb81587dfacf234",
    "0x835848d95f167a7f83a3eefcd8fe942d5698f855",
    "0x7a68f99543abbef555069f4e95b9c43a5552d677",
    "0x30f4c87f8a08ce60ed8284a9f5ccc2a8f7c5d8ab",
    "0xeeb7fb2aa2f1a1fd8b04bbf87a06522406868ecc",
    "0x0948394f9e41821a4ac35fcb8a852cb542f64507",
    "0x5ecf254d7fdf6b641f9ee35353c521aaab3f90e7",
    "0xe4feaef5d712ddd6e2f996a86690525254a485fd",
    "0x095aa69e38bb9297a7f729e237ed6c3b642f1bba",
    "0x0bdaa5edacc5da720bc15cc6093a041d7225193f",
    "0x420cc93ed792a08f90d9cf6fd6c4fccc465f0863",
    "0x62b14484627f955f0cebbf3fea4e7a276284f251",
    "0xfe23a116ee56f6c0dfbcc0cb1304af725b54c230",
    "0x70d97b373a73c6d5ef9df468e0df761252026e32",
    "0x3a61f794265a45e7a3f12b3457c30dd773cb0843",
    "0xb306c3de122f47306b0d1c4d07d403a05b08aa31",
    "0x81aa6e7f5c3fe4b8e3d99231890ecdf7ca2e3b5e",
    "0xf0976e438c6a002b9f7dc34428f50f63c14b7f26",
    "0xf0f3ae50a093aea7139b00d283add1049582d3a8",
  ],
  amount: [
    ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(830)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
ethers.utils.parseEther(String(630)),
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN_MAINNET

async function main() {
  // Create a new provider
  let provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER_MAIN);

  // Create a new instance of the contract using the provider
  const gfalToken = new ethers.Contract(GFAL_TOKEN, GFALTokenArtifact.abi, provider);

  // Validate correct length of arrays
  if (TRANSFERS_PAYLOAD.address.length !== TRANSFERS_PAYLOAD.amount.length) {
    throw Error('Array lengths mismatch')
  }

  // Sender from private key
  const signer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY)
  const nonce = await provider.getTransactionCount(signer.address);
  const balanceBeforeTransfer = await gfalToken.balanceOf(signer.address);
  
  console.log(
    "-Sender G4AL balance Before:",
    ethers.utils.formatEther(balanceBeforeTransfer.toString())
  );

  // Executing transactions and saving results
  let results = []
  for (let i = 0; i < TRANSFERS_PAYLOAD.address.length; i++) {
    const gasPrice = await provider.getGasPrice();
    const gasLimit = await gfalToken.estimateGas.transfer(TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i], {from: signer.address});

    // Construct the transaction
    const tx = {
      from: signer.address, // specify the sender
      to: gfalToken.address,
      gasLimit,
      gasPrice,
      nonce: nonce + i,
      data: gfalToken.interface.encodeFunctionData('transfer', [TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i]]),
    };
    const signedTx = await signer.signTransaction(tx);
    const transactionResponse = await provider.sendTransaction(signedTx);
    // results.push(transactionResponse)
    console.log(`Transferred to:${TRANSFERS_PAYLOAD.address[i]}`);
    console.log(`Amount:${TRANSFERS_PAYLOAD.amount[i]}`);
  }

//   console.log(
//     `TransferByAddressAmountMarketplace script executed:`,
//     results
//   )

  const balanceAfterTransfer = await gfalToken.balanceOf(signer.address);

  console.log(
    `\n- Sender balance After: 
    ${ethers.utils.formatEther(balanceAfterTransfer.toString())} G4AL`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
