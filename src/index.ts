import * as anchor from "@project-serum/anchor"
import idl from "./idl.json"

async function main() {}

async function airdrop(
  connection: anchor.web3.Connection,
  payer: anchor.web3.Keypair
) {}

async function createCounter(
  wallet: anchor.Wallet,
  counter: anchor.web3.Keypair,
  program: anchor.Program
) {}

async function incrementCounter(
  wallet: anchor.Wallet,
  counter: anchor.web3.Keypair,
  program: anchor.Program
) {}

main()
  .then(() => {
    console.log("Finished successfully")
  })
  .catch((error) => {
    console.error(error)
  })
