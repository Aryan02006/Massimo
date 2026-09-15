export interface RestaurantSettings {
  _id?: string;
  restaurantName: string;
  logoUrl: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minOrderValue: number;
  currencySymbol: string;
  announcementText: string;
  showAnnouncement: boolean;
  isAcceptingOrders: boolean;
  socials: {
    instagram: string;
    facebook: string;
    twitter: string;
    whatsapp: string;
  };
  updatedAt?: string | Date;
}

export const DEFAULT_SETTINGS: RestaurantSettings = {
  restaurantName: "MASSIMO",
  logoUrl: "/massimo-logo.svg",
  tagline: "Authentic Italian Cuisine & Gourmet Delicacies",
  phone: "+91 98765 43210",
  email: "hello@massimofood.com",
  address: "123 Gourmet Boulevard, Food District",
  openingHours: "11:00 AM - 11:00 PM (Mon - Sun)",
  deliveryFee: 0,
  freeDeliveryThreshold: 499,
  minOrderValue: 149,
  currencySymbol: "₹",
  announcementText: "Free delivery for all orders above ₹499. Order & Enjoy the Offers!",
  showAnnouncement: true,
  isAcceptingOrders: true,
  socials: {
    instagram: "https://instagram.com/massimofood",
    facebook: "https://facebook.com/massimofood",
    twitter: "https://twitter.com/massimofood",
    whatsapp: "+919876543210",
  },
};
