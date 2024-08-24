declare global {
    interface Window {
        solana?: {
            isPhantom?: boolean; // Add properties as needed for the wallet you're using
            publicKey?: PublicKey;
            signTransaction?: (transaction: web3.Transaction) => Promise<web3.Transaction>;
            signAllTransactions?: (transactions: web3.Transaction[]) => Promise<web3.Transaction[]>;
            connect?: () => Promise<{ publicKey: PublicKey }>;
            disconnect?: () => Promise<void>;
        };
    }
}
