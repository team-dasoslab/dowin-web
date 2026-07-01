import { Button } from "@/components/ui/Button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Default Button",
    variant: "default",
    size: "sm",
    className: "border border-border",
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
    size: "primary",
    children: "Primary Action",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    size: "sm",
    children: "Outline Action",
  },
};

export const AsChildLink: Story = {
  args: {
    asChild: true,
    variant: "primary",
    size: "primary",
    children: <a href="#">Go to Dashboard</a>,
  },
};

export const Loading: Story = {
  args: {
    variant: "primary",
    size: "primary",
    disabled: true,
    children: (
      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    ),
  },
};

export const IconButton: Story = {
  args: {
    variant: "outline",
    size: "icon",
    children: <span className="text-[16px] leading-none">+</span>,
    className: "border border-border text-text-muted transition-colors rounded-2xl",
  },
};
