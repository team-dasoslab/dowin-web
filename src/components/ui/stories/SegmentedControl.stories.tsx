import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof SegmentedControl> = {
  title: "UI/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  argTypes: {
    onChange: { action: "onChange" },
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

const commonOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const Default: Story = {
  args: {
    options: commonOptions,
    value: "weekly",
  },
};

export const Small: Story = {
  args: {
    options: commonOptions,
    value: "daily",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    options: commonOptions,
    value: "monthly",
    size: "lg",
  },
};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
      { value: "enterprise", label: "Enterprise", disabled: true },
    ],
    value: "pro",
  },
};

export const DisabledControl: Story = {
  args: {
    options: commonOptions,
    value: "weekly",
    disabled: true,
  },
};
