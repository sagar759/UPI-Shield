import { ProfileId } from "../../lib/contracts/primitives";
import { DEMO_COUNTERPARTY_PROFILES } from "./profiles";

export interface DemoContact {
  contactId: string;
  profileId: ProfileId;
  displayName: string;
  vpa: string;
  phoneMasked: string;
  category: "landlord" | "friend" | "merchant" | "medical" | "other";
  isVerifiedMerchant: boolean;
  trustScore: number;
  relationshipAgeDays: number;
}

export const DEMO_CONTACTS: DemoContact[] = [
  {
    contactId: "contact_landlord_001",
    profileId: DEMO_COUNTERPARTY_PROFILES.landlord.profileId,
    displayName: "Ramesh Verma (Landlord)",
    vpa: "ramesh.verma@okaxis",
    phoneMasked: "+91 97*** ***11",
    category: "landlord",
    isVerifiedMerchant: false,
    trustScore: 0.95,
    relationshipAgeDays: 450,
  },
  {
    contactId: "contact_friend_rohit_001",
    profileId: DEMO_COUNTERPARTY_PROFILES.friendRohit.profileId,
    displayName: "Rohit Kumar (College Friend)",
    vpa: "rohit.kumar@okicici",
    phoneMasked: "+91 96*** ***33",
    category: "friend",
    isVerifiedMerchant: false,
    trustScore: 0.90,
    relationshipAgeDays: 600,
  },
  {
    contactId: "contact_merchant_kirana_001",
    profileId: DEMO_COUNTERPARTY_PROFILES.merchantKirana.profileId,
    displayName: "Gupta Super Mart",
    vpa: "guptamart@upi",
    phoneMasked: "+91 94*** ***55",
    category: "merchant",
    isVerifiedMerchant: true,
    trustScore: 0.99,
    relationshipAgeDays: 300,
  },
  {
    contactId: "contact_hospital_city_001",
    profileId: DEMO_COUNTERPARTY_PROFILES.hospitalCity.profileId,
    displayName: "City Life Care Hospital",
    vpa: "cityhospital@upi",
    phoneMasked: "+91 95*** ***44",
    category: "medical",
    isVerifiedMerchant: true,
    trustScore: 0.99,
    relationshipAgeDays: 180,
  },
];
