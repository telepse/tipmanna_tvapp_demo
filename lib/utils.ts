import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Local imports
import { Event } from "@/types/event.types";
import { WholeWord } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTipperUsername(email: string) {
  return email.split("@")[0];
}

export function formatDate(isoString: string): string {
  if (!isoString) return "";

  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date passed to formatDate:", isoString);
    return "";
  }

  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    date
  );
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

/**
 * Format time with AM/PM suffix.
 * @example "09:30" -> "09:30 AM"
 * @example "15:45" -> "03:45 PM"
 */
export function formatTime(time: string): string {
  if (!time) return "";

  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) return time;

  const suffix = hour >= 12 ? "PM" : "AM";
  if (hour === 0)
    hour = 12; // 00:00 -> 12 AM
  else if (hour > 12) hour -= 12; // 13:00 -> 1 PM

  return `${hour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);

// ------- Get event duration -------- //
export const getEventDuration = (
  startTime: string,
  endTime: string
): string => {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  let durationMinutes = endTotalMinutes - startTotalMinutes;

  // Handle overnight events (if end time is earlier than start time)
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60; // Add 24 hours
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  // Format the duration display in a more readable way
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}min`;
  } else {
    return "0 hours";
  }
};

// ------- Get event status -------- //
export const getEventStatus = (
  eventDate: string,
  startTime: string,
  endTime: string
): "Completed" | "Ongoing" | "Not started" => {
  if (!startTime || !endTime) {
    return "Not started"; // default if times are missing
  }

  const now = new Date();
  const eventDateTime = new Date(eventDate);

  // Combine event date with start and end times
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startDateTime = new Date(eventDateTime);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(eventDateTime);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  // Handle overnight events (if end time is earlier than start time, assume it ends next day)
  if (endDateTime < startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  if (now > endDateTime) {
    return "Completed";
  } else if (now >= startDateTime && now <= endDateTime) {
    return "Ongoing";
  } else if (now < startDateTime) {
    // Check if event is within the next 24 hours for "Not started", otherwise "Pending"
    const timeUntilStart = startDateTime.getTime() - now.getTime();
    const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);

    if (hoursUntilStart <= 24) {
      return "Completed";
    } else {
      return "Not started";
    }
  }

  return "Not started";
};

// ------- Get status color -------- //
export type EventStatus = "Completed" | "Ongoing" | "Not started";

export const getStatusColor = (status: EventStatus | string) => {
  switch (status) {
    case "Completed":
      return "text-white bg-black px-2 py-1 rounded-md text-sm w-fit";
    case "Ongoing":
      return "text-black bg-moonstone-blue px-2 py-1 rounded-md text-sm w-fit";
    case "Not started":
      return "text-black bg-gray px-2 py-1 rounded-md text-sm w-fit";
    default:
      return "text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-sm w-fit";
  }
};

// ------- Truncate text -------- //
export function truncateText(text: string, limit = 20) {
  if (typeof text !== "string") return "";
  return text.length > limit ? text.slice(0, limit) + "..." : text;
}

// ------- to sentence case -------- //
export function toSentenceCase(str: string) {
  return str
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ------- Format UTC time -------- //
export function formatUtcTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

// ------- Get event stats -------- //
export const getEventStats = (events: Event[]) => {
  const now = new Date();

  const stats = events.reduce(
    (acc, event) => {
      const eventDateTime = new Date(event.eventDate);

      // Parse start & end times
      const [startHours, startMinutes] = event.startTime.split(":").map(Number);
      const [endHours, endMinutes] = event.endTime.split(":").map(Number);

      const startDateTime = new Date(eventDateTime);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const endDateTime = new Date(eventDateTime);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      // Handle overnight events
      if (endDateTime < startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      // Count active and completed events
      if (now >= startDateTime && now <= endDateTime) {
        acc.activeEvents++;
      } else if (now > endDateTime) {
        acc.completedEvents++;
      }

      // Total raised amount
      acc.totalAmountRaised += event.amountRaised || 0;

      // Pending events (approved === false)
      if (event.approved === false) {
        acc.pendingEvents++;
      }

      // Total number of tips
      acc.numOfTips += event.numOfTips || 0;

      // Count total events created
      acc.totalEventsCreated++;

      return acc;
    },
    {
      totalEventsCreated: 0,
      activeEvents: 0,
      completedEvents: 0,
      pendingEvents: 0,
      totalAmountRaised: 0,
      numOfTips: 0,
    }
  );

  return {
    totalEventsCreated: stats.totalEventsCreated,
    activeEvents: stats.activeEvents,
    completedEvents: stats.completedEvents,
    pendingEvents: stats.pendingEvents,
    totalAmountRaised: stats.totalAmountRaised,
    numOfTips: stats.numOfTips,
  };
};
