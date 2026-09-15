import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyAdminAuth } from "@/lib/adminAuth";
import { DEFAULT_SETTINGS, RestaurantSettings } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return (
        error ||
        NextResponse.json(
          { success: false, message: "Unauthorized admin access" },
          { status: 401 }
        )
      );
    }

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
    console.error("Admin settings GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { admin, error } = await verifyAdminAuth(request);
    if (!admin || error) {
      return (
        error ||
        NextResponse.json(
          { success: false, message: "Unauthorized admin access" },
          { status: 401 }
        )
      );
    }

    const body = await request.json();
    const {
      restaurantName,
      logoUrl,
      tagline,
      phone,
      email,
      address,
      openingHours,
      deliveryFee,
      freeDeliveryThreshold,
      minOrderValue,
      currencySymbol,
      announcementText,
      showAnnouncement,
      isAcceptingOrders,
      socials,
    } = body;

    const sanitizedSettings = {
      key: "general_settings",
      restaurantName: String(restaurantName || DEFAULT_SETTINGS.restaurantName).trim(),
      logoUrl: String(logoUrl || DEFAULT_SETTINGS.logoUrl).trim(),
      tagline: String(tagline ?? DEFAULT_SETTINGS.tagline).trim(),
      phone: String(phone ?? DEFAULT_SETTINGS.phone).trim(),
      email: String(email ?? DEFAULT_SETTINGS.email).trim(),
      address: String(address ?? DEFAULT_SETTINGS.address).trim(),
      openingHours: String(openingHours ?? DEFAULT_SETTINGS.openingHours).trim(),
      deliveryFee: Math.max(0, Number(deliveryFee ?? 0)),
      freeDeliveryThreshold: Math.max(0, Number(freeDeliveryThreshold ?? 499)),
      minOrderValue: Math.max(0, Number(minOrderValue ?? 0)),
      currencySymbol: String(currencySymbol || "₹").trim(),
      announcementText: String(announcementText ?? DEFAULT_SETTINGS.announcementText).trim(),
      showAnnouncement: Boolean(showAnnouncement),
      isAcceptingOrders: Boolean(isAcceptingOrders),
      socials: {
        instagram: String(socials?.instagram || "").trim(),
        facebook: String(socials?.facebook || "").trim(),
        twitter: String(socials?.twitter || "").trim(),
        whatsapp: String(socials?.whatsapp || "").trim(),
      },
      updatedAt: new Date(),
      updatedBy: admin.username,
    };

    const client = await clientPromise;
    const db = client.db("Massimo");

    await db.collection("settings").updateOne(
      { key: "general_settings" },
      { $set: sanitizedSettings },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: sanitizedSettings,
    });
  } catch (error) {
    console.error("Admin settings PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings" },
      { status: 500 }
    );
  }
}
