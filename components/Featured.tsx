"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import "swiper/css";

import { addToCart } from "@/components/cart";

type ProductOption = {
  title: string;
  additionalPrice: number;
};

type Product = {
  _id?: string;
  id: number;
  title: string;
  desc?: string;
  img?: string;
  price: number;
  options?: ProductOption[];
};

const Featured = () => {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        if (data.success) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (item: Product) => {
    try {
      const response = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!data.success || !data.authenticated) {
        router.push("/login");
        return;
      }

      addToCart({
        id: `featured-${item.id}`,
        title: item.title,
        price: item.price,
        img: item.img,
      });
    } catch (error) {
      console.error("Authentication check failed:", error);
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center p-10">
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden p-10">
      <Swiper
        modules={[Autoplay]}
        loop={true}
        speed={1200}
        autoplay={{
          delay: 2800,
          disableOnInteraction: false,
        }}
        spaceBetween={25}
        breakpoints={{
          0: {
            slidesPerView: 1,
          },
          640: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
        className="w-full"
      >
        {products.map((item) => (
          <SwiperSlide key={item._id ?? item.id}>
            <div className="flex h-[60vh] w-full flex-col items-center justify-around p-4 transition-all duration-300 hover:bg-fuchsia-50 xl:h-[90vh]">
              {item.img && (
                <div className="relative h-[20rem] w-full flex-1">
                  <Image
                    src={item.img}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <h1 className="text-xl font-bold uppercase xl:text-2xl 2xl:text-3xl">
                  {item.title}
                </h1>

                <p className="p-4 2xl:p-8">{item.desc}</p>

                <span className="text-xl font-bold">₹{item.price}</span>

                <button
                  className="cursor-pointer rounded-md bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
                  onClick={() => handleAddToCart(item)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Featured;
