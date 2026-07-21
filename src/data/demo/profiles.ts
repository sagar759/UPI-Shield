import { ProfileId } from "../../lib/contracts/primitives";

export interface DemoUserProfile {
  profileId: ProfileId;
  displayName: string;
  maskedVpa: string;
  phoneMasked: string;
  accountPseudonym: string;
  accountAgeDays: number;
  isMerchant: boolean;
  isVerified: boolean;
  joinedAt: string;
}

export const DEMO_PRIMARY_PROFILE: DemoUserProfile = {
  profileId: "user_aarav_001" as ProfileId,
  displayName: "Aarav Sharma",
  maskedVpa: "aarav****@upi",
  phoneMasked: "+91 98*** ***00",
  accountPseudonym: "pseudo_user_aarav_001",
  accountAgeDays: 730,
  isMerchant: false,
  isVerified: true,
  joinedAt: "2024-07-21T00:00:00.000Z",
};

export const DEMO_COUNTERPARTY_PROFILES: Record<string, DemoUserProfile> = {
  landlord: {
    profileId: "user_landlord_001" as ProfileId,
    displayName: "Ramesh Verma (Landlord)",
    maskedVpa: "ramesh****@upi",
    phoneMasked: "+91 97*** ***11",
    accountPseudonym: "pseudo_user_landlord_001",
    accountAgeDays: 1200,
    isMerchant: false,
    isVerified: true,
    joinedAt: "2023-04-01T00:00:00.000Z",
  },
  investmentScam: {
    profileId: "user_mule_invest_001" as ProfileId,
    displayName: "Global Crypto Invest Ltd (Synthetic)",
    maskedVpa: "TEST_VPA_INVEST_001@example.invalid",
    phoneMasked: "+91 90*** ***99",
    accountPseudonym: "pseudo_user_mule_invest_001",
    accountAgeDays: 2,
    isMerchant: false,
    isVerified: false,
    joinedAt: "2026-07-19T00:00:00.000Z",
  },
  refundScam: {
    profileId: "user_mule_refund_001" as ProfileId,
    displayName: "Quick Pay Refund Desk (Synthetic)",
    maskedVpa: "TEST_VPA_REFUND_001@example.invalid",
    phoneMasked: "+91 91*** ***88",
    accountPseudonym: "pseudo_user_mule_refund_001",
    accountAgeDays: 5,
    isMerchant: false,
    isVerified: false,
    joinedAt: "2026-07-16T00:00:00.000Z",
  },
  digitalArrest: {
    profileId: "user_mule_police_001" as ProfileId,
    displayName: "Cyber Security Clearance Desk (Synthetic)",
    maskedVpa: "TEST_VPA_POLICE_001@example.invalid",
    phoneMasked: "+91 92*** ***77",
    accountPseudonym: "pseudo_user_mule_police_001",
    accountAgeDays: 1,
    isMerchant: false,
    isVerified: false,
    joinedAt: "2026-07-20T00:00:00.000Z",
  },
  muleRapid: {
    profileId: "user_mule_rapid_001" as ProfileId,
    displayName: "Transit Holding Account (Synthetic)",
    maskedVpa: "TEST_VPA_MULE_001@example.invalid",
    phoneMasked: "+91 93*** ***66",
    accountPseudonym: "pseudo_user_mule_rapid_001",
    accountAgeDays: 3,
    isMerchant: false,
    isVerified: false,
    joinedAt: "2026-07-18T00:00:00.000Z",
  },
  merchantKirana: {
    profileId: "user_merchant_kirana_001" as ProfileId,
    displayName: "Gupta Super Mart",
    maskedVpa: "guptamart@upi",
    phoneMasked: "+91 94*** ***55",
    accountPseudonym: "pseudo_user_merchant_kirana_001",
    accountAgeDays: 1800,
    isMerchant: true,
    isVerified: true,
    joinedAt: "2021-08-15T00:00:00.000Z",
  },
  hospitalCity: {
    profileId: "user_hospital_city_001" as ProfileId,
    displayName: "City Life Care Hospital",
    maskedVpa: "cityhospital@upi",
    phoneMasked: "+91 95*** ***44",
    accountPseudonym: "pseudo_user_hospital_city_001",
    accountAgeDays: 2500,
    isMerchant: true,
    isVerified: true,
    joinedAt: "2019-11-10T00:00:00.000Z",
  },
  friendRohit: {
    profileId: "user_friend_rohit_001" as ProfileId,
    displayName: "Rohit Kumar",
    maskedVpa: "rohit****@upi",
    phoneMasked: "+91 96*** ***33",
    accountPseudonym: "pseudo_user_friend_rohit_001",
    accountAgeDays: 900,
    isMerchant: false,
    isVerified: true,
    joinedAt: "2024-02-01T00:00:00.000Z",
  },
  merchantTickets: {
    profileId: "user_merchant_tickets_001" as ProfileId,
    displayName: "FestPass India Tickets",
    maskedVpa: "festpass@upi",
    phoneMasked: "+91 99*** ***22",
    accountPseudonym: "pseudo_user_merchant_tickets_001",
    accountAgeDays: 1500,
    isMerchant: true,
    isVerified: true,
    joinedAt: "2022-05-20T00:00:00.000Z",
  },
};

export const ALL_DEMO_PROFILES: DemoUserProfile[] = [
  DEMO_PRIMARY_PROFILE,
  ...Object.values(DEMO_COUNTERPARTY_PROFILES),
];
