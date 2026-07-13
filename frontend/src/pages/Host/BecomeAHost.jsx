import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const steps = [
  {
    number: "1",
    title: "Tell us about your place",
    desc: "Share some basic info, such as where it is and how many guests can stay.",
    img: "https://a0.muscache.com/4ea/air/v2/pictures/e7b0b4a5-c69f-4f0e-80f4-b4b4a2a6cf94.jpg",
  },
  {
    number: "2",
    title: "Make it stand out",
    desc: "Add 5 or more photos plus a title and description – we'll help you out.",
    img: "https://a0.muscache.com/4ea/air/v2/pictures/48f3a95d-bdf5-4690-9bc5-bd38f0e23a13.jpg",
  },
  {
    number: "3",
    title: "Finish up and publish",
    desc: "Choose a starting price, verify a few details, then publish your listing.",
    img: "https://a0.muscache.com/4ea/air/v2/pictures/8e88ead3-7e01-4c87-b0a0-75e0c52e4e79.jpg",
  },
];

const SKIP_AUTH_FOR_DEV = true;

export default function BecomeAHost() {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();

  const [checkingHost, setCheckingHost] = useState(true);
  const [hasListedBefore, setHasListedBefore] = useState(false);

  useEffect(() => {
    async function checkHostStatus() {
      if (!isLoaded) return;

      if (!SKIP_AUTH_FOR_DEV && !isSignedIn) {
        setCheckingHost(false);
        return;
      }

      if (!user?.id) {
        setCheckingHost(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/host/status`, {
          params: {
            clerk_id: user.id,
          },
        });

        if (res.data.success && res.data.isHost) {
          setHasListedBefore(true);

          navigate("/host", {
            replace: true,
          });

          return;
        }

        setHasListedBefore(false);

        localStorage.removeItem("hasListedProperty");
        setHasListedBefore(false);
      } catch (err) {
        console.error("Failed to check host status:", err);

        const localStatus =
          localStorage.getItem("hasListedProperty") === "true";

        setHasListedBefore(localStatus);
      } finally {
        setCheckingHost(false);
      }
    }

    checkHostStatus();
  }, [isLoaded, isSignedIn, user?.id, navigate]);

  const handleGetStarted = () => {
    if (hasListedBefore) {
      navigate("/host");
    } else {
      navigate("/host/add-property");
    }
  };

  if (!SKIP_AUTH_FOR_DEV && !isLoaded) return null;

  if (checkingHost) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Checking host status...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-white">
      <div className="flex flex-1 items-center justify-center px-8 py-16">
        <div className="flex w-full max-w-4xl items-center gap-20">
          <div className="flex-1">
            <h1 className="mb-3 text-4xl font-bold leading-tight text-gray-900">
              It's easy to get
              <br />
              started on Stay Finder
            </h1>

            <p className="text-sm text-gray-500">
              Not listing a home?{" "}
              <span className="cursor-pointer underline">
                Host an experience or service
              </span>
            </p>
          </div>

          <div className="flex-1 space-y-6">
            {steps.map((s, i) => (
              <div key={s.number} className="flex items-center gap-6">
                <div className="flex-1 border-b border-gray-100 pb-6">
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 text-lg font-semibold text-gray-400">
                      {s.number}
                    </span>

                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {s.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </div>

                <img
                  src={s.img}
                  alt=""
                  className="h-16 w-16 flex-shrink-0 object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />

                <span className="hidden h-16 w-16 flex-shrink-0 items-center justify-center text-3xl">
                  {["🛏️", "🏠", "🚪"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-200 px-8 py-4">
        {!SKIP_AUTH_FOR_DEV && !isSignedIn ? (
          <SignInButton mode="modal">
            <button className="rounded-lg bg-[#FF385C] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#E31C5F]">
              Get started
            </button>
          </SignInButton>
        ) : (
          <button
            onClick={handleGetStarted}
            className="rounded-lg bg-[#FF385C] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#E31C5F]"
          >
            Get started
          </button>
        )}
      </div>
    </div>
  );
}
