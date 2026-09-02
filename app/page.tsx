import Slider from "@/components/Slider";
import Offers from "@/components/Offers";
import Featured from "@/components/Featured";

export default function Home() {
  return (
    <main>
      <Slider />
      <Featured />
      <Offers />
    </main>
  );
}