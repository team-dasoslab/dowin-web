import { Button } from "@/components/ui/Button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Add20Regular, Flash20Regular } from "@fluentui/react-icons";
import { Link } from "@/i18n/routing";

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
    className: "px-4 py-2 border border-border text-sm",
  },
};

export const Primary: Story = {
  args: {
    children: (
      <div className="flex items-center gap-2">
        <Flash20Regular className="w-4 h-4 fill-current" />
        <span>Primary Action</span>
      </div>
    ),
    className:
      "btn-linear-primary flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold",
  },
};

export const AsChildLink: Story = {
  args: {
    asChild: true,
    children: <Link href="#">Go to Dashboard</Link>,
    className:
      "btn-linear-primary flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold",
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    ),
    className:
      "bg-primary/50 text-white px-5 py-3 flex items-center justify-center",
  },
};

export const IconButton: Story = {
  args: {
    children: <Add20Regular className="w-4 h-4" />,
    className:
      "w-8 h-8 border border-border flex items-center justify-center text-text-muted hover:border-border-hover transition-colors",
  },
};
