import React, { useState, useEffect, useRef} from "react";
import { Link } from "react-router-dom";
import { fetchAllTopics } from "../../api/helpCenter";

const TABS = ["Guest", "Home host", "Experience host", "Service host", "Travel admin"];
const FALLBACK_TOPICS = {
  "Your reservations as a guest": [
    { id: 1, title: "Cancellations", url: "/help/topic/1367" },
    { id: 2, title: "Checking in", url: "/help/topic/1368" },
    { id: 3, title: "Checking out", url: "/help/topic/checking-out" }
  ],
  "Payments and pricing": [
    { id: 4, title: "Paying for a reservation", url: "/help/topic/paying" },
    { id: 5, title: "Pricing and fees", url: "/help/topic/pricing" },
    { id: 6, title: "Taxes for guests", url: "/help/topic/taxes" }
  ]
};

export default function AllTopics() {
  const [activeTab, setActiveTab] = useState("Guest");
  const [topicsData, setTopicsData] = useState({});
  const [loading, setLoading] = useState(true);

  const [cache, setCache] = useState({});
  const [error, setError] = useState(null);

  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef([]);

  const groupTopicsBySection = (topicsArray, currentTab) => {
    if (!Array.isArray(topicsArray)) return topicsArray;

    return topicsArray.reduce((acc, topic) => {
      const category = (topic.tab_category || "").toLowerCase();
      const matchesTab = (topic.tab_category || "").toLowerCase() === (currentTab || "").toLowerCase();
      const isUniversal = category === "universal";
      if (!matchesTab && !isUniversal) return acc;
      if (topic.parent_id !== null && topic.parent_id !== undefined) return acc;
      const heading = topic.section_heading || "General Topics";
      if (!acc[heading]) {
        acc[heading] = [];
      }
      acc[heading].push(topic);
      return acc;
    }, {});
  };

  useEffect(() => {
    let isMounted = true;

    if (cache[activeTab]) {
      setTopicsData(cache[activeTab]);
      setLoading(false);
      setError(null); 
      return;
    }

    async function load() { 
      setLoading(true);
      setError(null); 
      
      try {
        const data = await fetchAllTopics(activeTab);
        
       if (isMounted) { 
          const rawData = data?.data ? data.data : data; 
          const formattedData = Array.isArray(rawData) 
            ? groupTopicsBySection(rawData, activeTab) 
            : rawData;

          setCache(prev => ({ ...prev, [activeTab]: formattedData }));
          setTopicsData(formattedData);
        }
      } catch (e) {
        if (isMounted) { 
          setError(e?.message || "Failed to load topics");
          setTopicsData(FALLBACK_TOPICS);

        }
      } finally {
        if (isMounted) setLoading(false); 
      }
    }
    load();
    return () => { isMounted = false; };
  }, [activeTab]);

  useEffect(() => {
    const measureTab = () => {
      setTimeout(() => {
        const idx = TABS.indexOf(activeTab);
        const node = tabsRef.current[idx];

        if (node) {
          setSliderStyle({
            left: node.offsetLeft,
            width: node.offsetWidth,
          });
        }
      }, 50); 
    };

    measureTab();
    window.addEventListener("resize", measureTab);
    return () => {
      window.removeEventListener("resize", measureTab);
    };
  }, [activeTab, topicsData, loading]);

  return (
    <div className="max-w-6xl mx-auto px-8 sm:px-8 md:px-15 lg:px-6 py-9 text-[#222222] min-h-[75vh]">

      <nav className="flex items-center gap-2 text-[14px] text-[#717171] mb-4 select-none">
        <Link 
          to="/help" 
          className="hover:underline hover:text-[#717171] transition cursor-pointer"
        >
          Home
        </Link>
        <span className="text-[14px] font-bold">›</span>
        <span className="text-gray-800 font-medium">
          All topics
        </span>
      </nav>
      
      <h1 className="text-[30px] sm:text-[38px] font-medium tracking-tight mb-2">All topics</h1>
      <p className="text-[18px] text-[#717171] mb-8">Browse our full library of help topics.</p>

      {/* THE 5 Category TABS */}
      <div className="overflow-x-auto scrollbar-hide mb-10 select-none">
        <div className="relative flex gap-8 border-b border-gray-200 w-max min-w-full">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              ref={el => (tabsRef.current[idx] = el)}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[16px] font-medium transition-colors duration-300 cursor-pointer ${
                activeTab === tab ? "text-[#222222]" : "text-[#717171] hover:text-[#222222]"
              }`}
            >
              {tab}
            </button>
          ))}
          {sliderStyle.width > 0 && (
            <div
              className="absolute -bottom-[1px] h-[2px] bg-[#222222] transition-all duration-300 ease-out z-10 pointer-events-none"
              style={{
                left: `${sliderStyle.left}px`,
                width: `${sliderStyle.width}px`,
              }}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          We couldn't load the latest topics from our server right now, so we are showing offline backup guides.
        </div>
      )}

      {/* THE MAPPED DIRECTORY COLUMNS */}
      <div className="w-full transition-all duration-300">
        {loading ? (
          /* THE SKELETON LOADER GRID (Dynamically holds space open!) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 w-full">
            {[1, 2, 3, 4, 5, 6].map((colIndex) => (
              <div key={colIndex} className="flex flex-col">
                
                {/* Fake Section Heading */}
                <div className="h-[22px] bg-gray-200 rounded-md w-1/2 mb-4 animate-pulse"></div>
                
                {/* Fake Topic Links */}
                <ul className="flex flex-col gap-3.5">
                  {[1, 2, 3, 4].map((linkIndex) => (
                    <li key={linkIndex}>
                      <div 
                        className="h-[18px] bg-gray-100 rounded-md animate-pulse"
                        style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }} // Randomizes width between 40% and 80% for realism
                      ></div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          
          /* THE REAL DATA GRID */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 w-full">
            {Object.entries(topicsData)
              .sort(([_, linksA], [__, linksB]) => {
                const isUniversalA = (Array.isArray(linksA) ? linksA : []).some(
                  t => (t.tab_category || "").toLowerCase() === "universal"
                );
                const isUniversalB = (Array.isArray(linksB) ? linksB : []).some(
                  t => (t.tab_category || "").toLowerCase() === "universal"
                );
                
                if (!isUniversalA && isUniversalB) return -1; 
                if (isUniversalA && !isUniversalB) return 1;  
                return 0; 
              })
              .map(([sectionHeading, linksArray]) => (
              <div key={sectionHeading} className="flex flex-col">
                
                <h3 className="text-[18px] font-medium text-[#222222] mb-4">
                  {sectionHeading}
                </h3>
                
                <ul className="flex flex-col gap-3.5">
                  {(Array.isArray(linksArray) ? linksArray : []).map(linkItem => {
                    const destinationUrl = linkItem.url ? linkItem.url : `/help/topic/${linkItem.id}`;
                    return (
                      <li key={linkItem.id}>
                        <Link 
                          to={destinationUrl} 
                          className="text-[15px] text-gray-700 underline underline-offset-1 hover:text-[#222222] hover:decoration-[#484848] transition block w-fit cursor-pointer"
                        >
                          {linkItem.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}