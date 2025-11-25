import { getEventByIdAction } from "@/actions/events";
import { OverlayScreen } from "@/components/events/overlay-display";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OverlayDisplay({ params }: Props) {
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
  } = event;

  return (
    <OverlayScreen
      amountToRaise={amountToRaise}
      amountRaised={amountRaised}
      eventName={eventName}
      eventId={eventId}
      eventCode={eventCode}
      hostName={hostName}
      eventSlug={eventSlug}
    />
  );
}
