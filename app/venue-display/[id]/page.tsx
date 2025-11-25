import { getEventByIdAction } from "@/actions/events";
import { ScreenDisplay } from "@/components/events/screen-display";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VenueDisplay({ params }: Props) {
  const { id } = await params;

  const { data: event } = await getEventByIdAction(id);

  const {
    id: eventId,
    eventName,
    amountToRaise,
    amountRaised,
    hostName,
    eventCode,
    eventSlug,
    tipUsageDisclosure,
  } = event;

  return (
    <ScreenDisplay
      amountToRaise={amountToRaise}
      amountRaised={amountRaised}
      eventName={eventName}
      eventId={eventId}
      eventCode={eventCode}
      hostName={hostName}
      eventSlug={eventSlug}
      tipUsageDisclosure={tipUsageDisclosure}
    />
  );
}
