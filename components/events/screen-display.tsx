"use client";

import { useEffect, useRef, useState } from "react";
import { Title } from "@/components/common/title";
import { Paragraph } from "@/components/common/paragraph";
import { ArrowLeft, Gem, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import { triggerConfetti } from "@/lib/triggerConfetti";
import QRCode from "react-qr-code";
import Link from "next/link";
import { toSentenceCase } from "@/lib/utils";
import { TipUsageDisclosure } from "@/types/tipusagedisclosure.types";

type Props = {
  amountToRaise: number;
  amountRaised: number;
  eventName: string;
  eventId: string;
  eventCode: string;
  hostName: string;
  eventSlug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tipUsageDisclosure: any;
};

type NewTipEvent = {
  selectedTips: string[];
};

export const ScreenDisplay = ({
  amountToRaise,
  amountRaised,
  eventName,
  eventId,
  eventCode,
  eventSlug,
  tipUsageDisclosure,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isWakeLockSupported, setIsWakeLockSupported] = useState(true);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const progress = Math.min((amountRaised / amountToRaise) * 100, 100);

  // Enhanced Wake Lock detection
  const checkWakeLockSupport = () => {
    const isSupported = "wakeLock" in navigator;
    setIsWakeLockSupported(isSupported);

    // Additional check for Puffin and other browsers
    const userAgent = navigator.userAgent.toLowerCase();
    const isPuffin = userAgent.includes("puffin");

    if (isPuffin) {
      console.log(
        "Puffin browser detected - Wake Lock may have limited support"
      );
    }

    return isSupported;
  };

  const openLightbox = async () => {
    setIsOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("lightbox", "open");
    window.history.pushState({}, "", url.toString());

    // Activate multiple prevention methods
    await activateWakeLock();
    startActivitySimulation();
  };

  const closeLightbox = () => {
    setIsOpen(false);
    releaseWakeLock();
    stopActivitySimulation();
    router.replace(window.location.pathname);
  };

  const activateWakeLock = async () => {
    try {
      if (!checkWakeLockSupport()) {
        console.warn("Wake Lock API not supported in this browser");
        return;
      }

      // Additional check for Puffin browser compatibility
      const userAgent = navigator.userAgent.toLowerCase();
      const isPuffin = userAgent.includes("puffin");

      if (isPuffin) {
        console.log("Using enhanced Wake Lock for Puffin browser");
      }

      const wakeLock = await navigator.wakeLock.request("screen");
      wakeLockRef.current = wakeLock;
      setWakeLock(wakeLock);
      setWakeLockActive(true);

      // Enhanced event listeners for better compatibility
      wakeLock.addEventListener("release", () => {
        console.log("Wake Lock was released");
        setWakeLock(null);
        setWakeLockActive(false);
        wakeLockRef.current = null;
      });

      console.log("Wake Lock is active");
    } catch (err) {
      console.error("Failed to activate Wake Lock:", err);
      setIsWakeLockSupported(false);
      setWakeLockActive(false);

      // Fallback: Try alternative methods
      startActivitySimulation();
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current
        .release()
        .then(() => {
          setWakeLock(null);
          setWakeLockActive(false);
          wakeLockRef.current = null;
          console.log("Wake Lock released");
        })
        .catch(err => {
          console.error("Error releasing Wake Lock:", err);
        });
    }
  };

  // Alternative method: Simulate user activity for browsers without Wake Lock support
  const startActivitySimulation = () => {
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
    }

    // Simulate user activity every 10 seconds to prevent screen timeout
    activityIntervalRef.current = setInterval(() => {
      if (isOpen) {
        // Create a tiny, invisible event to simulate activity
        const event = new Event("visibilitychange");
        document.dispatchEvent(event);

        // Trigger a resize event (commonly used to prevent timeout)
        window.dispatchEvent(new Event("resize"));

        console.log("Activity simulation triggered");
      }
    }, 10000); // Every 10 seconds
  };

  const stopActivitySimulation = () => {
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }
  };

  const maxChars = 20;

  // Build the string
  let text = "";
  const displayedWelfare = [];
  for (let i = 0; i < tipUsageDisclosure.length; i++) {
    const usageType = toSentenceCase(tipUsageDisclosure[i].usageType);
    const nextText = text ? `${text}, ${usageType}` : usageType;
    if (nextText.length > maxChars) {
      // Stop and add ellipsis
      text += "_";
      break;
    }
    text = nextText;
    displayedWelfare.push(tipUsageDisclosure[i]);
  }

  // Enhanced video setup with multiple formats for better compatibility
  const setupVideo = () => {
    // Clean up existing video
    if (videoRef.current) {
      videoRef.current.pause();
      if (videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
    }

    const video = document.createElement("video");

    // Try multiple video sources for better browser compatibility
    const videoSources = ["/silent-video.mp4"];

    video.src = videoSources[0]; // Start with MP4
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("webkit-playsinline", "true"); // iOS compatibility
    video.setAttribute("playsinline", "true");

    // Make video completely invisible but functional
    video.style.position = "fixed";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = "2px";
    video.style.height = "2px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    video.style.zIndex = "-9999";

    // Handle video errors by trying next format
    video.onerror = () => {
      console.log("Video format not supported, trying fallback...");
      if (videoSources.length > 1) {
        video.src = videoSources[1];
      }
    };

    video.play().catch(err => {
      console.log("Video play failed, using alternative methods:", err);
    });

    videoRef.current = video;
    document.body.appendChild(video);
  };

  // Setup video and check support when component mounts
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkWakeLockSupport();
    setupVideo();

    return () => {
      // Cleanup video
      if (videoRef.current) {
        videoRef.current.pause();
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.removeChild(videoRef.current);
        }
      }
      // Cleanup wake lock
      releaseWakeLock();
      // Cleanup activity simulation
      stopActivitySimulation();
    };
  }, []);

  // Enhanced visibility change handler with retry logic
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && !wakeLockActive) {
        console.log("Page became visible, attempting to reacquire Wake Lock");
        // Wait a moment before retrying to ensure page is fully visible
        setTimeout(async () => {
          try {
            await activateWakeLock();
          } catch (err) {
            console.error(
              "Failed to reacquire Wake Lock on visibility change:",
              err
            );
          }
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [wakeLockActive]);

  // Reinitialize when lightbox opens
  useEffect(() => {
    setupVideo();
    // Retry wake lock if not active
    if (!wakeLockActive) {
      setTimeout(activateWakeLock, 500);
    }
  }, [wakeLockActive]);

  // If user hits browser back with search param, close the lightbox
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        setIsOpen(false);
        releaseWakeLock();
        stopActivitySimulation();
        router.replace(window.location.pathname);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, router]);

  useEffect(() => {
    const channel = pusherClient.subscribe(`event-${eventId}`);

    const handleNewTip = (data: NewTipEvent) => {
      console.log("New tip received via websocket");
      const funnelElement = document.getElementById("funnel-btn");
      triggerConfetti({ element: funnelElement, tips: data.selectedTips });
    };

    channel.bind("tip-animation", handleNewTip);

    return () => {
      channel.unbind("tip-animation", handleNewTip);
      pusherClient.unsubscribe(`event-${eventId}`);
    };
  }, [eventId]);

  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpinning(prev => !prev);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const [animateTip, setAnimateTip] = useState(false);

  // Trigger animation when amountRaised changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimateTip(true);
    const timer = setTimeout(() => {
      setAnimateTip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [amountRaised]);

  const scanLink = `${process.env.FRONTEND_URL}/join-host/${eventSlug}?eventCode=${eventCode}`;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center">
      {/* Wake Lock Status Indicator */}
      <div className="absolute top-4 right-4 z-50">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs`}
        ></div>
        {!isWakeLockSupported && (
          <div className="mt-1 rounded bg-orange-500 px-2 py-1 text-xs text-white">
            Using fallback methods
          </div>
        )}
      </div>

      <div className="relative z-20 flex h-screen w-screen flex-col items-center justify-center gap-8 overflow-hidden bg-[#4E2703] bg-cover bg-center bg-no-repeat p-6">
        <svg
          width="1554"
          height="971"
          viewBox="0 0 1554 971"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`pointer-events-none fixed inset-0 z-50 h-screen w-screen origin-center object-cover ${isSpinning ? "animate-spin-pause" : ""}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <g opacity="0.05">
            <path
              d="M438.248 -18.3994H301.852L633.417 449.563L662.249 431.82L438.248 -18.3994Z"
              fill="#fff"
            />
            <path
              d="M682.213 -17.2905H574.648L712.154 427.385L748.748 419.622L682.213 -17.2905Z"
              fill="#fff"
            />
            <path
              d="M900.668 -16.1815H801.974L796.43 431.82L827.479 441.801L900.668 -16.1815Z"
              fill="#fff"
            />
            <path
              d="M1145.74 -17.2905H1027.08L875.16 432.929L901.774 449.563L1145.74 -17.2905Z"
              fill="#fff"
            />
            <path
              d="M1470.65 -16.1815H1300.98L933.934 485.048L951.676 503.9L1470.65 -16.1815Z"
              fill="#fff"
            />
            <path
              d="M1603.72 253.285L991.601 564.89L962.77 549.365L1603.72 92.4922V253.285Z"
              fill="#fff"
            />
            <path
              d="M1604.83 534.949L1041.5 620.336L1022.65 597.049L1604.83 410.751V534.949Z"
              fill="#fff"
            />
            <path
              d="M1604.83 672.455L1042.61 660.257V699.069L1604.83 786.673V672.455Z"
              fill="#fff"
            />
            <path
              d="M533.616 550.474L522.527 591.504L3.55469 420.731V284.335L533.616 550.474Z"
              fill="#fff"
            />
            <path
              d="M4.66016 682.435H508.108V643.623L4.66016 560.454V682.435Z"
              fill="#fff"
            />
            <path
              d="M437.141 817.723C283.741 860.971 -3.76415 940.591 -10.8612 944.139L-53 821.05L428.269 761.168L437.141 817.723Z"
              fill="#fff"
            />
            <path
              d="M1013.78 762.277L1605.94 929.723V1048.38L1001.58 808.852L1013.78 762.277Z"
              fill="#fff"
            />
            <path
              d="M549.138 499.464L-6.42854 85.8387L-50.7852 -29.4885L-27.4979 -78.2808L88.9382 -29.4885L575.752 466.197L549.138 499.464Z"
              fill="#fff"
            />
          </g>
        </svg>

        {/* Event stars */}
        <Star className="absolute top-10 left-24 z-10 size-4 animate-bounce bg-linear-to-r from-[#F57D11] to-[#B55805] bg-clip-text fill-[#f7c87c] text-transparent sm:size-8 lg:top-40 lg:left-48" />
        <Star className="absolute top-42 right-20 z-10 size-4 animate-bounce bg-linear-to-r from-[#F57D11] to-[#B55805] bg-clip-text fill-[#f7c87c] text-transparent sm:right-40 sm:size-8 lg:top-56 lg:right-80" />
        <Star className="absolute top-40 right-12 z-10 size-4 animate-bounce bg-linear-to-r from-[#F57D11] to-[#B55805] bg-clip-text fill-[#f7c87c] text-transparent sm:size-8 lg:top-52 lg:right-24" />
        <Star className="absolute top-0 right-18 z-10 size-4 animate-bounce bg-linear-to-r from-[#F57D11] to-[#B55805] bg-clip-text fill-[#f7c87c] text-transparent sm:right-36 sm:size-8 lg:right-72" />
        <Star className="absolute top-48 left-22 z-10 size-4 animate-bounce bg-linear-to-r from-[#F57D11] to-[#B55805] bg-clip-text fill-[#f7c87c] text-transparent sm:left-44 sm:size-8 lg:top-48 lg:left-88" />
        <Star className="absolute top-80 left-7 z-10 size-4 animate-bounce bg-linear-to-r from-[#F57D11] to-[#B55805] bg-clip-text fill-[#f7c87c] text-transparent sm:top-96 sm:size-8 lg:top-80 lg:left-14" />

        <Link
          href="/"
          className="absolute top-4 left-4 flex cursor-pointer items-center gap-2 rounded-full"
        >
          <ArrowLeft className="size-6 text-white" />
        </Link>

        <h2 className="text-center text-4xl font-semibold text-white">
          Together you&apos;ve sent
        </h2>

        <Title
          size="lg"
          color="white"
          className="-mt-6"
        >
          &pound;{amountRaised.toLocaleString()}
        </Title>

        <div >
          <Paragraph
            weight="bold"
            color="white"
          >
            For{" "}
            {tipUsageDisclosure.map((item: TipUsageDisclosure, index: number) => (
              <span key={item.id}>
                {toSentenceCase(item.usageType)}{" "}
                {index < tipUsageDisclosure.length - 1 ? ", " : ""}
              </span>
            ))}
          </Paragraph>
        </div>

        <div className="flex w-full max-w-xl items-center gap-2">
          {/* Progress Bar */}
          <div className="flex-1">
            <div className="relative z-50 h-3 overflow-hidden rounded bg-black sm:h-10">
              <div
                className={`absolute top-0 left-0 h-full bg-linear-to-r from-[#f57d11] to-[#f7c87c] transition-all duration-500 ${
                  animateTip ? "animate-glow" : ""
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <Paragraph
              weight="bold"
              color="white"
            >
              &pound;{amountRaised}
            </Paragraph>
          </div>

          {/* Target Icon */}
          <div className="">
            <Gem className="size-6 fill-[#f57d11] text-[#f57d11] sm:size-10" />
            <Paragraph
              weight="bold"
              color="white"
            >
              &pound;{amountToRaise}
            </Paragraph>
          </div>
        </div>
        <Paragraph
          weight="bold"
          color="white"
          className="-mt-16"
        >
          tipmanna.live
        </Paragraph>

        <div className="mt-10 flex flex-col items-center justify-center gap-1">
          <QRCode
            size={100}
            bgColor="white"
            fgColor="black"
            value={scanLink}
          />

          <div className="-mb-4 rounded border border-[#667185] bg-[#212121] px-2 py-1 text-center text-white">
            {eventName}
          </div>
        </div>

        <button
          id="funnel-btn"
          className="absolute bottom-4 left-4 size-40"
        >
          <Image
            src="/funnel.png"
            alt="Funnel"
            width={100}
            height={100}
            className="size-20 object-contain"
          />
        </button>
      </div>
    </div>
  );
};
