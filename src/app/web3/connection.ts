
"use client";

import { Program, AnchorProvider, web3, Wallet } from '@project-serum/anchor';
import { Connection, PublicKey, Commitment, Transaction, Keypair } from '@solana/web3.js';
import idl from './idl.json';
import { useWallet } from '@solana/wallet-adapter-react';

const programID = new PublicKey('FaGCgqLZMjVhyzLLMGsUGJus6XBM53KYVvx2R4pGaxhC');
const network = 'https://api.devnet.solana.com';
const opts: { preflightCommitment: Commitment } = { preflightCommitment: 'processed' };

export const getProvider = () => {
    if (typeof window === 'undefined' || !window.solana) {
        return null;
    }
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, window.solana as Wallet, opts);
    return provider;
};

// export const getProvider = () => {
//     const wallet = useWallet();
//     const connection = new Connection(network, opts.preflightCommitment);

//     if (!wallet || !wallet.publicKey || !wallet.signTransaction) {
//         throw new Error("Wallet not connected or missing required methods.");
//     }

//     // Check if `signAllTransactions` exists and assign it properly
//     const signAllTransactions = wallet.signAllTransactions
//         ? wallet.signAllTransactions
//         : async (txs: Transaction[]) => {
//               throw new Error("signAllTransactions method not available");
//           };

//     // Cast wallet to the Anchor Wallet type, with a fallback for signAllTransactions
//     const anchorWallet: Wallet = {
//         publicKey: wallet.publicKey,
//         signTransaction: wallet.signTransaction,
//         signAllTransactions: signAllTransactions,
//         payer: new Keypair
//     };

//     const provider = new AnchorProvider(
//         connection,
//         anchorWallet,
//         { preflightCommitment: opts.preflightCommitment }
//     );

//     return provider;
// };



export const getProgram = () => {
    const provider = getProvider();
    if (!provider) return null;
    const program = new Program(idl as any, programID, provider);
    return program;
};