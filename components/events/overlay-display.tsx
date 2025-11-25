"use client";

import { useEffect, useState } from "react";
import { Title } from "@/components/common/title";
import { Paragraph } from "@/components/common/paragraph";
import { ArrowLeft, Gem } from "lucide-react";
import Image from "next/image";
import { pusherClient } from "@/lib/pusher";
import { triggerConfetti } from "@/lib/triggerConfetti";
import QRCode from "react-qr-code";
import Link from "next/link";
import { truncateText } from "@/lib/utils";

type Props = {
  amountToRaise: number;
  amountRaised: number;
  eventName: string;
  eventId: string;
  eventCode: string;
  hostName: string;
  eventSlug: string;
};

type NewTipEvent = {
  selectedTips: string[];
};

export const OverlayScreen = ({
  amountToRaise,
  amountRaised,
  eventName,
  eventId,
  eventCode,
  eventSlug,
}: Props) => {
  const progress = Math.min((amountRaised / amountToRaise) * 100, 100);

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
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-transparent">
      {/* Wake Lock Status Indicator */}
      <div className="absolute top-4 right-4 z-50">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs`}
        ></div>
      </div>

      <div className="relative z-20 flex h-screen w-screen flex-col items-center justify-end gap-8 overflow-hidden bg-cover bg-center bg-no-repeat p-6">
        <Link
          href="/"
          className="absolute top-4 left-4 flex cursor-pointer items-center gap-2 rounded-full"
        >
          <ArrowLeft className="size-6" />
        </Link>

        <QRCode
          size={150}
          bgColor="white"
          fgColor="black"
          value={scanLink}
        />

        <Title
          size="lg"
          color="white"
        >
          &pound;{amountRaised.toLocaleString()}
        </Title>

        <div
          className={`-mt-30 -mb-8 w-60 rounded bg-black px-2 py-1 text-center text-white ${eventName.length > 20 && "marquee"}`}
        >
          {/* {truncateText(eventName, 20)} */} <span>{eventName}</span>
        </div>

        <div className="-mt-16 flex w-full max-w-5xl items-center gap-2">
          {/* Progress Bar */}
          <div className="flex-1">
            <div className="w-fit rounded-md bg-black p-0.5">
              <Paragraph
                weight="bold"
                size="xl"
                color="white"
              >
                &pound;{amountRaised}
              </Paragraph>
            </div>
            <div className="relative z-50 h-3 overflow-hidden rounded bg-black sm:h-6">
              <div
                className={`absolute top-0 left-0 h-full bg-linear-to-r from-[#f57d11] to-[#f7c87c] transition-all duration-500 ${
                  animateTip ? "animate-glow" : ""
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Target Icon */}
          <div className="mt-4">
            <div className="-ml-20 w-fit rounded-md bg-black p-0.5">
              <Paragraph
                weight="bold"
                size="xl"
                color="white"
              >
                &pound;{amountToRaise}
              </Paragraph>
            </div>
            <Gem className="-mt-6 -ml-2 size-6 fill-[#f57d11] text-[#f57d11] sm:size-14" />
          </div>
        </div>

        <Paragraph
          weight="bold"
          className="-mt-12"
        >
          tipmanna.live
        </Paragraph>

        <button
          id="funnel-btn"
          className="absolute bottom-4 left-4 size-40"
        >
          <Image
            src="/funnel.png"
            alt="Funnel"
            width={100}
            height={100}
            className="flex size-20 items-center justify-center rounded-full bg-black object-contain"
          />
        </button>
      </div>
    </div>
  );
};
