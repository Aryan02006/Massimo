import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DEFAULT_SETTINGS, RestaurantSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("Massimo");
    const settingsDoc = await db.collection("settings").findOne({ key: "general_settings" });

    if (!settingsDoc) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    const settings: RestaurantSettings = {
      restaurantName: settingsDoc.restaurantName ?? DEFAULT_SETTINGS.restaurantName,
      logoUrl: settingsDoc.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
      tagline: settingsDoc.tagline ?? DEFAULT_SETTINGS.tagline,
      phone: settingsDoc.phone ?? DEFAULT_SETTINGS.phone,
      email: settingsDoc.email ?? DEFAULT_SETTINGS.email,
      address: settingsDoc.address ?? DEFAULT_SETTINGS.address,
      openingHours: settingsDoc.openingHours ?? DEFAULT_SETTINGS.openingHours,
      deliveryFee: Number(settingsDoc.deliveryFee ?? DEFAULT_SETTINGS.deliveryFee),
      freeDeliveryThreshold: Number(
        settingsDoc.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold
      ),
      minOrderValue: Number(settingsDoc.minOrderValue ?? DEFAULT_SETTINGS.minOrderValue),
      currencySymbol: settingsDoc.currencySymbol ?? DEFAULT_SETTINGS.currencySymbol,
      announcementText: settingsDoc.announcementText ?? DEFAULT_SETTINGS.announcementText,
      showAnnouncement: settingsDoc.showAnnouncement ?? DEFAULT_SETTINGS.showAnnouncement,
      isAcceptingOrders: settingsDoc.isAcceptingOrders ?? DEFAULT_SETTINGS.isAcceptingOrders,
      socials: {
        instagram: settingsDoc.socials?.instagram ?? DEFAULT_SETTINGS.socials.instagram,
        facebook: settingsDoc.socials?.facebook ?? DEFAULT_SETTINGS.socials.facebook,
        twitter: settingsDoc.socials?.twitter ?? DEFAULT_SETTINGS.socials.twitter,
        whatsapp: settingsDoc.socials?.whatsapp ?? DEFAULT_SETTINGS.socials.whatsapp,
      },
      updatedAt: settingsDoc.updatedAt,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Public settings GET error:", error);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
    });
  }
}
