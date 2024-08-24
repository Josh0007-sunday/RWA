"use client";
import Image from "next/image";
import WalletConnectionProvider from "./adapter/page";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import InitializeRwa from "./initialize/page";

export default function Home() {
  return (
   <div>
    <WalletConnectionProvider>
      <WalletMultiButton />
      <InitializeRwa />
    </WalletConnectionProvider>
   </div>
  );
}
