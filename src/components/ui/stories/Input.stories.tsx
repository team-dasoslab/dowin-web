import { Input } from "@/components/ui/Input";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
    className:
      "w-full px-4 py-3 bg-sub-background border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors placeholder:text-text-muted/40",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "••••••••",
    className:
      "w-full px-4 py-3 bg-sub-background border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors placeholder:text-text-muted/40",
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="space-y-3">
      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">
        Email Address
      </label>
      <Input {...args} />
    </div>
  ),
  args: {
    type: "email",
    placeholder: "name@example.com",
    className:
      "w-full px-4 py-3 bg-sub-background border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors placeholder:text-text-muted/40",
  },
};
