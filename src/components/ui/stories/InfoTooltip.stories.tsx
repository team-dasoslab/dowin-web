import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof InfoTooltip> = {
  title: "UI/InfoTooltip",
  component: InfoTooltip,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof InfoTooltip>;

export const Default: Story = {
  args: {
    content: "This is a helpful tooltip that appears when you click the icon.",
  },
};

export const WithLabel: Story = {
  args: {
    label: <span className="text-sm font-bold text-text-primary">More Info</span>,
    content: "This opens as an inline block pushing the content below it.",
  },
};
