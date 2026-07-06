import { Badge } from "@/components/ui/Badge";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "80%",
    variant: "default",
  },
};

export const Success: Story = {
  args: {
    children: "Success",
    variant: "success",
  },
};

export const Primary: Story = {
  args: {
    children: "Member",
    variant: "primary",
  },
};
