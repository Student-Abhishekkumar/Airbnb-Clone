import React, { useState, useEffect, useRef} from "react";
import { Search } from "lucide-react";
import { useNavigate,  Link} from "react-router-dom";
import {SignedIn, SignedOut,SignInButton,SignOutButton,useUser,} from "@clerk/clerk-react";
import GlobalCard from "../../components/GlobalCard"; 
import { fetchTopArticles, fetchGuides ,fetchExploreMore } from "../../api/helpCenter";

// THE STATIC FALLBACK (Sits safely in the background)
const FALLBACK_ARTICLES = [
  { id: 1, title: "Cancel your home reservation as a guest", summary: "You can cancel or make changes to your home reservation in your trips.", url: "/help/cancellations" },
  { id: 2, title: "Change the date or time of your service or experience", summary: "When you book a service or experience, you can update the date or time depending on...", url: "#" },
  { id: 3, title: "If your host cancels your home reservation", summary: "If your reservation is cancelled by your host, you'll get a full refund or we'll help you reboot...", url: "#" },
  { id: 4, title: "Payment methods accepted", summary: "We support different payment methods depending on the country your payment...", url: "#" },
  { id: 5, title: "Add or remove a payment method", summary: "Find out how to manage your payment methods.", url: "#" },
  { id: 6, title: "When you'll pay for your reservation", summary: "Timing differs by the type of booking you're making, how you're paying and location...", url: "#" },
];

const FALLBACK_EXPLORE = [
    { id: 101, title: "Our community policies", summary: "How we build a foundation of trust.", image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=600&auto=format&fit=crop", url: "/help/article/101" },
    { id: 102, title: "Safety tips and guidelines", summary: "Resources to help travellers stay safe.", image: "https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?q=80&w=600&auto=format&fit=crop", url: "/help/article/102" }
  ];

export default function HelpCenterLanding() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isSignedIn, user } = useUser();
  const firstName = isSignedIn && user?.firstName ? user.firstName : "";
  const staticTabs = ["Guest", "Home host", "Experience host", "Service host", "Travel admin"];
  const [activeTab, setActiveTab] = useState("Guest");
  const navigate = useNavigate();

  // DYNAMIC CMS STATES
  const [guides, setGuides] = useState([]);
  const [topArticles, setTopArticles] = useState(FALLBACK_ARTICLES);
  const [exploreItems, setExploreItems] = useState(FALLBACK_EXPLORE);

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [guidesError, setGuidesError] = useState(null);

  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef([]);

  const getSectionTitle = (tab) => {
    switch (tab) {
      case "Guest": return "Guides for getting started"; 
      case "Home host": return "Guides for getting started";
      case "Experience host": return "Guides for Experience Hosts"; 
      case "Service host": return "Guides for Service Hosts"; 
      case "Travel admin": return "Guides for travel admins"; 
      default: return `Guides for ${tab}`;
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      navigate(`/help/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // THE API LISTENER
  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoadingGuides(true);
      setGuidesError(null);

      try {
        const guidesData = await fetchGuides({ category: activeTab });
        if (isMounted) {
          const actualArray = guidesData?.data ? guidesData.data : guidesData;
          const safeArray = Array.isArray(actualArray) ? actualArray : [];
          setGuides(safeArray);
          
        }
      } catch (e) {
        if (isMounted) {
          setGuides([]);
          setGuidesError("Displaying fallback guides.");
        }
      } finally {
        if (isMounted) setLoadingGuides(false);
      }
 
      try {
        const liveData = await fetchTopArticles({ category: activeTab });
        if (isMounted) {
          const actualArray = liveData?.data ? liveData.data : liveData;
          const safeArray = Array.isArray(actualArray) ? actualArray : [];
          
          if (safeArray.length > 0) {
            setTopArticles(safeArray);
            setIsLiveMode(true);
          } else {
            setTopArticles(FALLBACK_ARTICLES);
            setIsLiveMode(false);
          }
        }
      } catch (e) {
        if (isMounted) {
          console.log("⚡ Notice: Laravel API not detected. Rendering static UI fallback.");
          setTopArticles(FALLBACK_ARTICLES);
          setIsLiveMode(false);
        }
      }

      try {
        const exploreData = await fetchExploreMore();
        if (isMounted) {
          const actualArray = exploreData?.data ? exploreData.data : exploreData;
          const safeArray = Array.isArray(actualArray) ? actualArray : [];
          
          if (safeArray.length > 0) {
            setExploreItems(safeArray);
          } else {
            setExploreItems(FALLBACK_EXPLORE);
          }
        }
      } catch (e) {
        if (isMounted) setExploreItems(FALLBACK_EXPLORE);
      }
    }

    load();

    return () => { isMounted = false; };
  }, [activeTab]); 

  useEffect(() => {
    const measureTab = () => {
      const idx = staticTabs.indexOf(activeTab);
      const node = tabsRef.current[idx];

      if (node) {
        setSliderStyle({
          left: node.offsetLeft,
          width: node.offsetWidth,
        });
      }
    };

    measureTab();
    window.addEventListener("resize", measureTab);
    return () => window.removeEventListener("resize", measureTab);
  }, [activeTab, guides]);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-2 md:px-10 lg:px-20 text-[#222222]">
      
      {/* 1. HERO GREETING */}
      <div className="flex flex-col items-center justify-center pb-14 pt-0">
        <h1 className="text-[28px] sm:text-[38px] md:text-[42px] font-medium text-gray-900 tracking-tight mb-8 text-center">
          Hi {firstName}, how can we help?
        </h1>
        <div className="w-full max-w-[340px]">
          <form 
            onSubmit={handleSearch} className="relative flex w-full items-center justify-between rounded-full border border-gray-300 bg-white py-2 pl-6 pr-3 shadow-md hover:shadow-lg transition-shadow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search how-tos and more"
              className="w-full bg-transparent text-[16px] text-gray-900 outline-none placeholder:text-gray-600"
            />
            <button 
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF385C] text-white hover:bg-[#e22b4c] transition shrink-0 cursor-pointer">
              <Search size={16} strokeWidth={3} />
            </button>
          </form>
        </div>
      </div>

      {/* TAB BAR WITH GLIDER */}
      <div className="mb-10 overflow-x-auto scrollbar-hide select-none">
        <div className="relative flex gap-8 border-b border-gray-200 w-max min-w-full">
          {staticTabs.map((tab, idx) => (
          <button
            key={tab}
            ref={el => { if (el) tabsRef.current[idx] = el; }}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[16px] font-medium transition-colors duration-300 cursor-pointer ${
                activeTab === tab ? "text-[#222222]": "text-[#717171] hover:text-[#222222]"
              }`}
            >
              {tab}
            </button>
          ))}
          {sliderStyle.width > 0 && (
            <div
              className="absolute -bottom-[2px] h-[2px] bg-[#222222] transition-all duration-300 ease-out z-10 pointer-events-none"
              style={{
                left: `${sliderStyle.left}px`,
                width: `${sliderStyle.width}px`,
              }}
            />
          )}
        </div>
      </div>

      {/* CLERK ANONYMOUS GUEST LOGIN BANNER */}      
      <SignedOut>
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl border border-gray-200 bg-white p-6 py-3.5 shadow-sm">
          <div className="mb-5 md:mb-0">
            <h2 className="text-[22px] font-medium text-gray-800">We’re here for you</h2>
            <p className="mt-0.5 text-[16px] text-[#717171]">
              Log in to get help with your reservations, account, and more.
            </p>
          </div>
          <SignInButton mode="modal">
            <button className="w-full md:w-auto rounded-lg bg-[#E31C5F] px-8 py-2.5 text-[15px] font-semibold text-white hover:bg-[#D70466] transition active:scale-95 cursor-pointer">
            Log in or sign up
            </button>
          </SignInButton>
        </div>
      </SignedOut>
     
      {/* DYNAMIC GUIDES */}
      <div className="mb-20 mt-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[22px] md:text-[26px] font-medium tracking-tight text-[#222222]">
            {getSectionTitle(activeTab)}
          </h2>
        
          <Link 
            to={`/help/all-topics`} 
            className="text-[15px] font-medium text-gray-[800] hover: flex items-center gap-1"
          >
            Browse all topics <span className="text-[26px] items-center leading-none">›</span>
          </Link>
        </div>
      
        {loadingGuides ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex flex-col gap-3">
                <div className="aspect-[4/3] w-full rounded-2xl bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : guidesError ? (
          <div className="py-12 text-center text-red-500 border border-dashed border-red-200 rounded-2xl bg-red-50">
            {guidesError}
          </div>
        ) : guides.length === 0 ? (
          <div className="py-12 text-center text-gray-500 border border-dashed border-gray-300 rounded-2xl">
            No guides uploaded for "{activeTab}" yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 cursor-pointer">
            {guides.map((guide) => (
              <GlobalCard
                key={guide.id}
                item={guide}
                routePrefix="help/article"
                showRating={false}
                showWishlist={false}   
                showBadge={false}
              />
            ))}
          </div>
        )}
      </div>

      {topArticles.length > 0 && (
        <section className="mb-20 mt-10">
          <h2 className="text-[22px] md:text-[26px] font-medium tracking-tight text-[#222222] mb-6">
            Top articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
            {topArticles.map((article, index) => (
              <div key={article.id || index} className="border-b border-gray-200 pb-6 flex flex-col justify-start">
                <Link 
                  to={article.url || `/help/article/${article.id}`} 
                >
                  <p className="text-[18px] font-medium text-[#222222] underline decoration-1 underline-offset-[3px] hover:text-black leading-snug">
                  {article.title}</p>
                  <p className="text-[18px] text-[#717171] mt-1.5 leading-relaxed line-clamp-2">
                  {article.summary}</p>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. DYNAMIC EXPLORE MORE */}
      <section className="mb-12">
        <h2 className="text-[22px] md:text-[26px] font-medium tracking-tight text-[#222222] mb-6">
          Explore more
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* CMS DRIVEN CARDS (Left Side) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {exploreItems.map((item, idx) => (
              <Link 
                key={item.id || idx} 
                to={`/help/article/${item.id}`} 
                className="rounded-2xl overflow-hidden flex flex-col h-[260px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition group bg-[#f7f7f7]"
              >
                {/* Image Container (Light Gray) - Use transparent PNGs in your CMS for best results! */}
                <div className="flex-1 w-full overflow-hidden relative flex">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  />
                </div>
                {/* Text Container (Solid Black) */}
                <div className="bg-[#222222] text-white p-5 min-h-[90px] flex flex-col justify-center">
                  <h4 className="text-[20px] font-medium">{item.title}</h4>
                  <p className="text-[16px] text-gray-300 mt-0.5">{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* STATIC CONTACT BOX (Right Side) */}
          <div className="lg:col-span-1 flex flex-col h-full pt-1">
            <h3 className="text-[25px] font-medium text-[#222222]">Need to get in touch?</h3>
            <p className="text-[20px] text-[#222222] mt-2 leading-relaxed">
              We’ll start with some questions and get you to the right place.
            </p>
            <div className="mt-4">
              <Link 
                  to="/pages/User/Messages" 
                  className="w-full py-3.5 px-6 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-[#222222] text-[15px] font-semibold rounded-xl transition cursor-pointer text-center block"
                >
                  Contact us
                </Link>
              <p className="text-[20px] text-[#222222] mt-4">
                You can also <span className="underline font-medium cursor-pointer">give us feedback</span>.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}