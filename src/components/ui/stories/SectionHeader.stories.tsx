import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof SectionHeader> = {
  title: "UI/SectionHeader",
  component: SectionHeader,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Default: Story = {
  args: {
    title: "My Dashboard",
  },
};

export const WithBadgeAndAction: Story = {
  args: {
    title: "Team Overview",
    badge: <Badge variant="primary">New</Badge>,
    rightElement: <Button variant="outline" size="sm">Settings</Button>,
  },
};
