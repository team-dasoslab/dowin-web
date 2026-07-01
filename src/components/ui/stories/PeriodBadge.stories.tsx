import { PeriodBadge } from "@/components/ui/PeriodBadge";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof PeriodBadge> = {
  title: "UI/PeriodBadge",
  component: PeriodBadge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PeriodBadge>;

export const DefaultSmall: Story = {
  args: {
    label: "2026.07.01 - 2026.07.07",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    label: "2026 Q3",
    size: "md",
  },
};
