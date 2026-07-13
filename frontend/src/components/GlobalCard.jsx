import React, { useEffect, useState } from "react";
import { Heart, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { checkWishlist, toggleWishlist } from "../api/wishlist";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function normalizeImagePath(img) {
  if (typeof img === "object" && img !== null) {
    img = img.url || img.image_path || "";
  }
  if (typeof img !== "string") return "";
  let path = img.trim().replace(/^["'[\]]+|["'[\]]+$/g, '');
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/storage/")) {
    return `${API_BASE}${path}`;
  }
  if (path.startsWith("storage/")) {
    return `${API_BASE}/${path}`;
  }
  return `${API_BASE}/storage/${path}`;
}

function getSafeImageArray(item) {
  let extractedImages = [];
  let rawImage = item?.image || item?.images || item?.image_url || item?.imageSrc;

  if (!rawImage) return ["/placeholder.jpg"];

  if (Array.isArray(rawImage)) {
    extractedImages = rawImage;
  } else if (typeof rawImage === "string") {
    try {
      const parsed = JSON.parse(rawImage);
      extractedImages = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      extractedImages = [rawImage];
    }
  }

  const cleanImages = extractedImages.map(normalizeImagePath).filter(Boolean);
  return cleanImages.length > 0 ? cleanImages : ["/placeholder.jpg"];
}

export default function GlobalCard({
  item,
  routePrefix = "property",
  showRating = true,
  showWishlist = true,
  showBadge = true,
}) {
  const { user } = useUser();

  const [imageIndex, setImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(Boolean(item?.wishlisted));
  const [imageErrors, setImageErrors] = useState(new Set());

  const images = getSafeImageArray(item);
  const currentImage = images[imageIndex] || "/placeholder.jpg";
  const hasMultipleImages = images.length > 1;
  const isHelpCenter = routePrefix.includes("help");

  const categoryName =
    item?.category?.name || item?.category_name || item?.category || "";

  useEffect(() => {
    setImageIndex(0);
    setImageErrors(new Set());
  }, [item?.id]);

  useEffect(() => {
    let mounted = true;

    async function loadWishlistStatus() {
      if (!showWishlist || !user?.id || !item?.id) {
        setIsWishlisted(Boolean(item?.wishlisted));
        return;
      }

      try {
        const status = await checkWishlist(user.id, item.id);
        if (mounted) setIsWishlisted(status);
      } catch {
        if (mounted) setIsWishlisted(Boolean(item?.wishlisted));
      }
    }

    loadWishlistStatus();

    const syncWishlist = () => loadWishlistStatus();
    window.addEventListener("wishlistUpdated", syncWishlist);

    return () => {
      mounted = false;
      window.removeEventListener("wishlistUpdated", syncWishlist);
    };
  }, [user?.id, item?.id, item?.wishlisted, showWishlist]);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.id) return;

    try {
      const result = await toggleWishlist(user.id, item.id);
      setIsWishlisted(Boolean(result?.wishlisted));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    }
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const safePrice =
    item?.price ?? item?.price_per_night ?? item?.base_price ?? 0;

  const numericPrice = Number(safePrice);

  const displayPrice =
    typeof safePrice === "string" &&
    (safePrice.includes("₹") || safePrice.includes("$"))
      ? safePrice
      : `₹${
          Number.isNaN(numericPrice)
            ? safePrice
            : numericPrice.toLocaleString("en-IN")
        }`;

  return (
    <Link
      to={item?.url || `/${routePrefix}/${item?.id}`}
      className="group block w-full cursor-pointer"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        {!imageErrors.has(currentImage) ? (
          <img
            src={currentImage}
            alt={item?.title || "Item"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              setImageErrors((prev) => new Set(prev).add(currentImage));
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm text-gray-500">
            Image Unavailable
          </div>
        )}

        {showBadge && !isHelpCenter && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-[#222222] shadow-sm">
            Guest favourite
          </span>
        )}

       {showWishlist && !isHelpCenter && (
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="absolute right-3 top-3 z-10 drop-shadow-md transition hover:scale-110"
          >
            <Heart
              size={24}
              strokeWidth={1.5}
              fill={isWishlisted ? "#FF385C" : "rgba(0,0,0,0.3)"}
              color={isWishlisted ? "#FF385C" : "white"}
            />
          </button>
        )}

        {hasMultipleImages && (
          <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition hover:scale-105 hover:bg-white"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition hover:scale-105 hover:bg-white"
            >
              <ChevronRight size={16} />
            </button>

            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-[6px] w-[6px] rounded-full transition-all ${
                    idx === imageIndex ? "bg-white" : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col">
        <h3 className="truncate text-[15px] font-semibold text-[#222222]">
          {item?.title || "Untitled"}
        </h3>

        {categoryName && !isHelpCenter && (
          <span className="mt-0.5 truncate text-[14px] text-[#717171]">
            {categoryName}
          </span>
        )}

        {!isHelpCenter && (
          <div className="mt-0.5 flex items-center text-[15px] text-[#717171]">
            <span className="text-[#222222]">{displayPrice}</span>
            <span className="ml-1">for 1 night</span>

            {showRating && item?.rating && (
              <>
                <span className="mx-1.5">·</span>
                <span className="flex items-center gap-1 text-[#222222]">
                  <Star size={12} className="fill-current text-[#222222]" />
                  {item.rating}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
