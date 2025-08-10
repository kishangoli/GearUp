import React from "react";
import { useProductSearch, ProductCard } from "@shopify/shop-minis-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';ç
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

type Prompt = { label: string; query: string };

interface RecommendationsPageProps {
  onBack: () => void;
  plan: { prompts: Prompt[] } | null;
  loading?: boolean;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  onBack,
  plan,
  loading,
}) => {
  return (
    <>
      <style>{`
        html {
          background-color: #284B63 !important;
          min-height: 100%;
          overscroll-behavior: none;
        }
        
        body {
          overflow-x: hidden;
          max-width: 100vw;
          background-color: #284B63 !important;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
          position: fixed;
          width: 100%;
        }
        
        #root {
          background-color: #284B63;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: none;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animated-bg {
          background: linear-gradient(-45deg, #242331, #284B63, #242331, #284B63);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        
        /* Custom Swiper Styles */
        .swiper {
          width: 100%;
          padding-top: 20px;
          padding-bottom: 20px;
        }
        
        .swiper-slide {
          background-position: center;
          background-size: cover;
          width: 280px;
          height: 320px;
        }
        
        .swiper-slide-active {
          transform: scale(1.05);
        }
        
        /* Custom pagination dots */
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 0.7;
        }
        
        .swiper-pagination-bullet-active {
          background: rgba(255, 255, 255, 0.9);
          opacity: 1;
        }
        
        /* Custom navigation arrows */
        .swiper-button-next,
        .swiper-button-prev {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin-top: -20px;
        }
        
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          color: rgba(255, 255, 255, 1);
          background: rgba(255, 255, 255, 0.2);
        }
        
        .swiper-button-next::after,
        .swiper-button-prev::after {
          font-size: 16px;
          font-weight: bold;
        }
      `}</style>
      <div className="min-h-screen animated-bg">
        <div className="pt-12 px-4 pb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-white/80 hover:text-white transition-colors"
        >
          <span className="text-lg mr-1">←</span>
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Your Recommendations</h1>
        <div className="w-10" />
      </div>

        <div className="px-4 pb-10 space-y-6">
          {loading && <SkeletonSection />}

          {!loading && plan && plan.prompts.length === 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-white/80">
              No prompts yet. Try adjusting your answers.
            </div>
          )}

          {!loading &&
            plan?.prompts.map((p, idx) => <PromptRow prompt={p} key={`${p.label}-${idx}`} />)}
        </div>
      </div>
    </>
  );
};

/* ---------- Row: search + render ---------- */

const PromptRow: React.FC<{ prompt: Prompt }> = ({ prompt }) => {
  // Minis docs commonly use `first` for page size; some builds also accept `limit`.
  // We'll send `first` and adapt to the shape we get back.
  const raw: any = useProductSearch({ query: prompt.query, first: 6 });

  React.useEffect(() => {
    // Open Safari Web Inspector (Develop ▸ Simulator ▸ Shop) to see this.
    // eslint-disable-next-line no-console
    console.log("[useProductSearch]", { label: prompt.label, query: prompt.query, raw });
  }, [prompt.label, prompt.query, raw]);

  const isLoading =
    typeof raw?.isLoading === "boolean" ? raw.isLoading :
    typeof raw?.loading === "boolean" ? raw.loading :
    false;

  const error = raw?.error ?? null;

  // Support multiple possible result shapes without guessing SDK internals
  const results: any[] =
    Array.isArray(raw?.data) ? raw.data :
    Array.isArray(raw?.results) ? raw.results :
    Array.isArray(raw?.items) ? raw.items :
    Array.isArray(raw?.products) ? raw.products :
    Array.isArray(raw?.nodes) ? raw.nodes :
    Array.isArray(raw?.edges) ? raw.edges.map((e: any) => e?.node ?? e) :
    [];

  return (
    <section className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">{prompt.label}</h2>
      <p className="text-xs text-gray-500 mb-4">
        {/* Query: <span className="font-mono">{prompt.query}</span> */}
      </p>

      {isLoading && <SkeletonGrid />}

      {!isLoading && error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
          Couldn’t load products for this prompt. Try again.
        </div>
      )}

      {!isLoading && !error && (
        <Swiper
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          spaceBetween={30}
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={true}
          modules={[EffectCoverflow, Pagination, Navigation]}
          className="product-swiper"
        >
          {results.map((prod: any, i: number) => (
            <SwiperSlide key={prod?.id ?? prod?.productId ?? prod?.handle ?? i}>
              <div className="p-2">
                <ProductCard product={prod} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div className="col-span-2 text-sm text-gray-500 border border-gray-200 rounded-xl p-4">
          No results matched this query.
        </div>
      )}
    </section>
  );
};

/* ---------- Skeletons ---------- */

const SkeletonSection = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
    <div className="animate-pulse h-5 w-40 bg-white/20 rounded mb-4" />
    <SkeletonGrid />
  </div>
);

const SkeletonGrid = () => (
  <Swiper
    effect={'coverflow'}
    grabCursor={true}
    centeredSlides={true}
    slidesPerView={'auto'}
    spaceBetween={30}
    coverflowEffect={{
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    }}
    modules={[EffectCoverflow]}
    className="product-swiper"
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <SwiperSlide key={i}>
        <div className="w-[280px] h-[320px] rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 animate-pulse" />
      </SwiperSlide>
    ))}
  </Swiper>
);
