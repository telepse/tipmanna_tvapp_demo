"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Third-party imports
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronRight,
  Loader2,
  LoaderCircle,
  MapPin,
  Search,
  Users,
} from "lucide-react";

import { formatDate, formatTime, truncateText } from "@/lib/utils";
import { JoinEventFormData, joinEventSchema } from "@/schemas";
import { searchEventsByCodeAction } from "@/actions/events";
import { Event } from "@/types/event.types";
import { Paragraph } from "@/components/common/paragraph";
import { EventStatus } from "@/components/event-status";

export const JoinEventClient = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [overlayEventId, setOverlayEventId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  // Form setup
  const form = useForm<JoinEventFormData>({
    resolver: zodResolver(joinEventSchema),
    defaultValues: { eventCode: code ?? "" },
  });

  const eventCode = form.watch("eventCode");

  // Reset events if input is cleared
  useEffect(() => {
    if (eventCode.trim() === "") {
      setEvents([]);
      setCurrent(0);
    }
  }, [eventCode]);

  // Auto-run search if ?code= is present
  useEffect(() => {
    if (code && code.trim() !== "") {
      form.setValue("eventCode", code);
      onSubmit({ eventCode: code });
    }
  }, [code, form]);

  // Main submit handler (keyword search)
  const onSubmit = async (values: JoinEventFormData) => {
    setLoading(true);

    const res = await searchEventsByCodeAction(values.eventCode.toUpperCase());

    if (res.success) {
      const mapped = res.data.map((event: Event) => ({
        id: event.id,
        eventName: event.eventName,
        organizationName: event.organizationName,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venueLocation: event.venueLocation,
        numOfTips: event.numOfTips,
      }));

      setEvents(mapped);
    } else {
      setEvents([]);
    }

    setLoading(false);
  };

  const handleEnterEvent = (id: string) => {
    setLoadingEventId(id);
    router.push(`/venue-display/${id}`);
  };

  const handleOverlayDisplay = (id: string) => {
    setOverlayEventId(id);
    router.push(`/overlay-display/${id}`);
  };

  const next = () => {
    if (events.length <= 1) return;
    setCurrent(i => (i === events.length - 1 ? 0 : i + 1));
  };

  const visible = events.length > 0 ? [events[current]] : [];

  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center bg-cover bg-fixed bg-center bg-no-repeat"
      style={{ backgroundImage: `url(/bg_pattern.webp)` }}
    >
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center space-y-6 rounded bg-[#f7c87c]/10 p-6 backdrop-blur-md">
        <h2 className="montserrat text-2xl font-semibold sm:text-5xl">
          Join Event
        </h2>

        <Paragraph
          align="center"
          size="sm"
          color="muted"
        >
          Search for your event.
        </Paragraph>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
          >
            <FormField
              control={form.control}
              name="eventCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Enter keyword..."
                        autoComplete="off"
                        className="bg-white"
                        {...field}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        className="size-12 border-gray-300"
                        disabled={loading}
                      >
                        {loading ? (
                          <LoaderCircle className="size-6 animate-spin" />
                        ) : (
                          <Search className="text-muted-foreground size-6" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* Results */}
        <div className="flex w-full flex-row items-center gap-4">
          <div className="flex-1">
            {visible.map((event: Event) => {
              return (
                <div
                  key={event.id}
                  className="relative rounded border bg-white p-4 shadow-sm"
                >
                  <div className="absolute top-2 right-2">
                    <EventStatus
                      eventDate={event.eventDate}
                      startTime={event.startTime}
                      endTime={event.endTime}
                    />
                  </div>

                  <Paragraph
                    size="sm"
                    weight="bold"
                  >
                    {truncateText(event.eventName)}
                  </Paragraph>

                  <Paragraph
                    size="xs"
                    color="muted"
                    className="-mt-2"
                  >
                    Organised by {event.organizationName}
                  </Paragraph>

                  <Paragraph
                    size="xs"
                    color="muted"
                    className="mt-2 flex gap-1"
                  >
                    <Calendar /> {formatDate(event.eventDate)} ·{" "}
                    {formatTime(event.startTime)}
                  </Paragraph>

                  <Paragraph
                    size="xs"
                    color="muted"
                    className="flex gap-1"
                  >
                    <MapPin /> {event.venueLocation}
                  </Paragraph>

                  <Paragraph
                    size="xs"
                    color="muted"
                    className="flex gap-1"
                  >
                    <Users /> {event.numOfTips || 0} Tips
                  </Paragraph>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleEnterEvent(event.id)}
                    >
                      {loadingEventId === event.id ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        "Load full display"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOverlayDisplay(event.id)}
                    >
                      {overlayEventId === event.id ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" /> Loading...
                        </div>
                      ) : (
                        "Load venue display"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {events.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="border-muted-foreground"
              onClick={next}
              disabled={loading}
            >
              <ChevronRight className="size-6" />
            </Button>
          )}
        </div>

        {/* Join button (when no results) */}
        {events.length === 0 && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => onSubmit({ eventCode })}
            disabled={loading || eventCode.trim() === ""}
          >
            Search
          </Button>
        )}
      </div>
    </section>
  );
};
