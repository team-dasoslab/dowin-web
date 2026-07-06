import { Textarea } from "@/components/ui/Textarea";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here.",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Description",
    placeholder: "Enter a detailed description...",
  },
};

export const Disabled: Story = {
  args: {
    label: "Notes",
    placeholder: "This field is disabled",
    disabled: true,
  },
};
