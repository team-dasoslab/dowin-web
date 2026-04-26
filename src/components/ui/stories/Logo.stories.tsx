import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo } from "../Logo";

const meta: Meta<typeof Logo> = {
  title: "UI/Logo",
  component: Logo,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {
    size: 64,
    className: "text-primary",
  },
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <Logo size={48} className="text-primary" />
      <Logo size={48} className="text-rose-500" />
      <Logo size={48} className="text-emerald-500" />
      <Logo size={48} className="text-amber-500" />
      <Logo size={48} className="text-slate-900" />
    </div>
  ),
};
