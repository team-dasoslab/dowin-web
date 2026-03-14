import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../Badge";

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
    className: "px-2 py-0.5 rounded border border-border text-xs font-bold bg-white text-text-primary",
  },
};

export const Success: Story = {
  args: {
    children: "Success",
    className: "px-2 py-0.5 rounded border border-green-200 text-xs font-bold bg-green-50 text-green-700",
  },
};

export const Primary: Story = {
  args: {
    children: "Member",
    className: "px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20",
  },
};
