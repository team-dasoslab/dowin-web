import { useTranslations } from "next-intl";

export function useSeatChangeActions(
  billingResponse: { status: number; data: unknown } | null | undefined,
  workspaceId: string | undefined,
  updateSeats: (params: {
    workspaceId: string;
    data: { seatCount: number };
  }) => void,
) {
  const t = useTranslations("ProfileBilling");

  const handleSeatChangeClick = () => {
    if (!billingResponse || billingResponse.status !== 200) return;
    const currentBilling = billingResponse.data as { usedSeatCount?: number | null; purchasedSeatCount?: number | null };
    const currentUsedSeats = currentBilling.usedSeatCount ?? 1;
    const initialSeats = currentBilling.purchasedSeatCount ?? currentUsedSeats;

    const input = window.prompt(
      t("seatChangeDialogDesc", {
        currentLimit: initialSeats,
        currentUsed: currentUsedSeats,
      }),
      initialSeats.toString(),
    );
    if (input === null) return;

    const count = parseInt(input.trim(), 10);
    if (isNaN(count)) {
      alert(t("seatChangeMinError"));
      return;
    }

    if (count < currentUsedSeats) {
      alert(
        t("seatChangeErrorLowerThanCurrent", {
          current: currentUsedSeats,
          requested: count,
          removeCount: currentUsedSeats - count,
        }),
      );
      return;
    }

    if (count > 999) {
      alert(t("seatChangeMaxError"));
      return;
    }

    updateSeats({ workspaceId: workspaceId ?? "", data: { seatCount: count } });
  };

  return { handleSeatChangeClick };
}
