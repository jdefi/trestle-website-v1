import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ?? "",
});

export const chain = polygon;

export const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google", "telegram", "x", "wallet"],
    },
  }),
];
