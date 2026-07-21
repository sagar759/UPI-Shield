import { ReceiverFeatures } from "../../types/receiver";
import { ProfileId, TransactionId, RupeeAmount, IsoTimestamp } from "../../lib/contracts/primitives";
import { DEMO_PRIMARY_PROFILE, DEMO_COUNTERPARTY_PROFILES } from "./profiles";

export interface DemoActivityRecord {
  transactionId: TransactionId;
  senderId: ProfileId;
  receiverId: ProfileId;
  amount: RupeeAmount;
  currency: "INR";
  timestamp: IsoTimestamp;
  status: "SUCCESS" | "FAILED" | "PENDING";
  note?: string;
}

export const DEMO_RECENT_ACTIVITY: DemoActivityRecord[] = [
  {
    transactionId: "txn_hist_rent_june" as TransactionId,
    senderId: DEMO_PRIMARY_PROFILE.profileId,
    receiverId: DEMO_COUNTERPARTY_PROFILES.landlord.profileId,
    amount: 18000 as RupeeAmount,
    currency: "INR",
    timestamp: "2026-06-01T09:30:00.000Z" as IsoTimestamp,
    status: "SUCCESS",
    note: "June Rent",
  },
  {
    transactionId: "txn_hist_rent_may" as TransactionId,
    senderId: DEMO_PRIMARY_PROFILE.profileId,
    receiverId: DEMO_COUNTERPARTY_PROFILES.landlord.profileId,
    amount: 18000 as RupeeAmount,
    currency: "INR",
    timestamp: "2026-05-01T10:15:00.000Z" as IsoTimestamp,
    status: "SUCCESS",
    note: "May Rent",
  },
  {
    transactionId: "txn_hist_kirana_001" as TransactionId,
    senderId: DEMO_PRIMARY_PROFILE.profileId,
    receiverId: DEMO_COUNTERPARTY_PROFILES.merchantKirana.profileId,
    amount: 650 as RupeeAmount,
    currency: "INR",
    timestamp: "2026-07-18T18:45:00.000Z" as IsoTimestamp,
    status: "SUCCESS",
    note: "Groceries",
  },
  {
    transactionId: "txn_hist_hospital_001" as TransactionId,
    senderId: DEMO_PRIMARY_PROFILE.profileId,
    receiverId: DEMO_COUNTERPARTY_PROFILES.hospitalCity.profileId,
    amount: 2500 as RupeeAmount,
    currency: "INR",
    timestamp: "2026-04-12T14:20:00.000Z" as IsoTimestamp,
    status: "SUCCESS",
    note: "OPD Consultation",
  },
];

export const DEMO_RECEIVER_SNAPSHOTS: Record<string, ReceiverFeatures> = {
  // Benign landlord: normal holding, 0 pass-through burst
  landlord: {
    uniqueSenders30m: 1,
    uniqueReceivers30m: 1,
    incomingValue30m: 18000,
    outgoingValue30m: 0,
    passThroughRatio30m: 0,
    passThroughRatio24h: 0.05,
    medianHoldingTimeSeconds: 86400,
    burstRatio: 0.1,
    accountAgeDays: 1200,
  },
  // Investment Scam Mule: brand new account, high fan-in, immediate 0.95 pass through
  investmentScam: {
    uniqueSenders30m: 28,
    uniqueReceivers30m: 25,
    incomingValue30m: 140000,
    outgoingValue30m: 133000,
    passThroughRatio30m: 0.95,
    passThroughRatio24h: 0.98,
    medianHoldingTimeSeconds: 45,
    burstRatio: 7.2,
    accountAgeDays: 2,
  },
  // Refund Scam Mule: high pass through, new account
  refundScam: {
    uniqueSenders30m: 18,
    uniqueReceivers30m: 15,
    incomingValue30m: 45000,
    outgoingValue30m: 43500,
    passThroughRatio30m: 0.967,
    passThroughRatio24h: 0.97,
    medianHoldingTimeSeconds: 60,
    burstRatio: 6.0,
    accountAgeDays: 5,
  },
  // Digital Arrest Cyber Crime Threat Mule: rapid drain, short holding
  digitalArrest: {
    uniqueSenders30m: 35,
    uniqueReceivers30m: 30,
    incomingValue30m: 350000,
    outgoingValue30m: 343000,
    passThroughRatio30m: 0.98,
    passThroughRatio24h: 0.99,
    medianHoldingTimeSeconds: 30,
    burstRatio: 9.5,
    accountAgeDays: 1,
  },
  // Rapid Money Mule Receiver
  muleRapid: {
    uniqueSenders30m: 45,
    uniqueReceivers30m: 40,
    incomingValue30m: 500000,
    outgoingValue30m: 495000,
    passThroughRatio30m: 0.99,
    passThroughRatio24h: 0.995,
    medianHoldingTimeSeconds: 20,
    burstRatio: 12.0,
    accountAgeDays: 3,
  },
  // High fan-in Legitimate Festival Ticket Merchant (high unique senders but low pass-through)
  merchantTickets: {
    uniqueSenders30m: 150,
    uniqueReceivers30m: 2,
    incomingValue30m: 450000,
    outgoingValue30m: 22500,
    passThroughRatio30m: 0.05,
    passThroughRatio24h: 0.08,
    medianHoldingTimeSeconds: 259200,
    burstRatio: 1.2,
    accountAgeDays: 1500,
  },
  // Kirana Merchant: low pass through, normal account
  merchantKirana: {
    uniqueSenders30m: 12,
    uniqueReceivers30m: 3,
    incomingValue30m: 8500,
    outgoingValue30m: 1200,
    passThroughRatio30m: 0.14,
    passThroughRatio24h: 0.15,
    medianHoldingTimeSeconds: 172800,
    burstRatio: 0.5,
    accountAgeDays: 1800,
  },
  // Hospital Merchant
  hospitalCity: {
    uniqueSenders30m: 8,
    uniqueReceivers30m: 4,
    incomingValue30m: 125000,
    outgoingValue30m: 15000,
    passThroughRatio30m: 0.12,
    passThroughRatio24h: 0.10,
    medianHoldingTimeSeconds: 432000,
    burstRatio: 0.8,
    accountAgeDays: 2500,
  },
  // Friend Rohit
  friendRohit: {
    uniqueSenders30m: 2,
    uniqueReceivers30m: 2,
    incomingValue30m: 4000,
    outgoingValue30m: 1000,
    passThroughRatio30m: 0.25,
    passThroughRatio24h: 0.20,
    medianHoldingTimeSeconds: 86400,
    burstRatio: 0.3,
    accountAgeDays: 900,
  },
};
